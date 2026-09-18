package com.baseapp.android.auth

import java.net.URI
import java.net.URLDecoder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

/**
 * Auth client for deployed flavors, mirroring web/core's BuiltinAuthClient
 * (and the iOS twin): talks to the kernel's own auth__request__api function —
 * email one-time codes, email + password, Google OAuth via the browser, and
 * anonymous guests. Plain OkHttp so the app's only large dependency stays
 * Apollo.
 */
class BuiltinAuthClient(
    private val authUrl: String,
    private val redirectUrl: String,
    private val sessionStorage: SessionStorage,
    private val httpClient: OkHttpClient = OkHttpClient(),
) : AuthClient {

    private val json = Json { ignoreUnknownKeys = true }

    /** Set while a sign-in yielded an MFA challenge; verifyMfaCode consumes it. */
    private var pendingMfaChallenge: String? = null

    /** A reset flow's new password, applied once its MFA challenge is answered. */
    private var pendingPasswordReset: String? = null

    /**
     * Shared with the GraphQL client so every request goes out with a fresh
     * (refreshed-if-needed) access token.
     */
    val sessionRefresher = BuiltinSessionRefresher(
        authUrl = authUrl,
        sessionStorage = sessionStorage,
        httpClient = httpClient,
    )

    override suspend fun restoreSession(): AuthSession? = sessionRefresher.validSession()

    override suspend fun signInLocal(): AuthSession {
        throw AuthClientException("Local sign-in is not available in builtin auth mode.")
    }

    override suspend fun sendEmailCode(email: String) {
        val trimmedEmail = validatedEmail(email)
        performRequest(
            url = "${authBase()}/otp",
            body = json.encodeToString(EmailRequest(email = trimmedEmail)),
        )
    }

    override suspend fun verifyEmailCode(email: String, code: String): AuthSession {
        val trimmedEmail = email.trim()
        val trimmedCode = code.trim()
        if (trimmedCode.isEmpty()) {
            throw AuthClientException("Enter the 6-digit code from your email.")
        }

        val body = performRequest(
            url = "${authBase()}/verify",
            body = json.encodeToString(
                VerifyRequest(email = trimmedEmail, code = trimmedCode, type = "email")
            ),
        )
        interceptMfaChallenge(body)
        return persistTokenPayloadSession(decodeTokenPayload(body), fallbackEmail = trimmedEmail)
    }

    private fun persistTokenPayloadSession(
        payload: TokenResponsePayload,
        fallbackEmail: String?,
    ): AuthSession {
        val session = AuthSession(
            accessToken = payload.accessToken
                ?: throw AuthClientException("Authentication response could not be parsed."),
            refreshToken = payload.refreshToken,
            expiresAtEpochMs = payload.expiresIn?.let { System.currentTimeMillis() + it * 1000L },
            email = payload.email ?: fallbackEmail,
        )
        sessionStorage.persistSession(session)
        return session
    }

    override suspend fun signInWithPassword(email: String, password: String): AuthSession {
        val trimmedEmail = validatedEmail(email)
        if (password.isEmpty()) {
            throw AuthClientException("Enter your password.")
        }

        val body = performRequest(
            url = "${authBase()}/token",
            body = json.encodeToString(
                PasswordGrantRequest(grantType = "password", email = trimmedEmail, password = password)
            ),
        )
        interceptMfaChallenge(body)
        return persistTokenPayloadSession(decodeTokenPayload(body), fallbackEmail = trimmedEmail)
    }

    override suspend fun signUpWithPassword(email: String, password: String): AuthSession? {
        val trimmedEmail = validatedEmail(email)
        if (password.length < 8) {
            throw AuthClientException("Choose a password of at least 8 characters.")
        }

        val body = performRequest(
            url = "${authBase()}/signup",
            body = json.encodeToString(SignUpRequest(email = trimmedEmail, password = password)),
        )
        // An existing identity with MFA enabled is challenged even on signup.
        interceptMfaChallenge(body)
        // Environments requiring email confirmation return no session; only a
        // session-bearing response signs the user in.
        val payload = try {
            json.decodeFromString<TokenResponsePayload>(body)
        } catch (_: Exception) {
            return null
        }
        if (payload.accessToken.isNullOrEmpty()) {
            return null
        }
        return persistTokenPayloadSession(payload, fallbackEmail = trimmedEmail)
    }

    override suspend fun requestPasswordReset(email: String) {
        val trimmedEmail = validatedEmail(email)
        performRequest(
            url = "${authBase()}/recover",
            body = json.encodeToString(EmailRequest(email = trimmedEmail)),
        )
    }

    override suspend fun completePasswordReset(
        email: String,
        code: String,
        newPassword: String,
    ): AuthSession {
        val trimmedEmail = email.trim()
        val trimmedCode = code.trim()
        if (trimmedCode.isEmpty()) {
            throw AuthClientException("Enter the reset code from your email.")
        }
        if (newPassword.length < 8) {
            throw AuthClientException("Choose a password of at least 8 characters.")
        }

        // Verifying the recovery code yields a full session, which also
        // authorizes the password update below. With MFA enabled the verify
        // yields a challenge instead: hold the new password and apply it right
        // after verifyMfaCode succeeds (mirrors web/core's BuiltinAuthClient).
        val body = performRequest(
            url = "${authBase()}/verify",
            body = json.encodeToString(
                VerifyRequest(email = trimmedEmail, code = trimmedCode, type = "recovery")
            ),
        )
        decodeMfaChallenge(body)?.let { challenge ->
            pendingMfaChallenge = challenge
            pendingPasswordReset = newPassword
            throw MfaRequiredException()
        }
        val session = persistTokenPayloadSession(decodeTokenPayload(body), fallbackEmail = trimmedEmail)

        performRequest(
            url = "${authBase()}/password",
            body = json.encodeToString(UpdatePasswordRequest(password = newPassword)),
            bearerToken = session.accessToken,
        )
        return session
    }

    override suspend fun signInAnonymously(): AuthSession {
        val body = performRequest(url = "${authBase()}/anonymous", body = "{}")
        return persistTokenPayloadSession(decodeTokenPayload(body), fallbackEmail = null)
    }

    override fun oauthAuthorizeUrl(provider: AuthMethod): String? {
        // Every registered redirect-flow provider exposes a /start route on
        // the auth API; Apple has no native sheet on Android, so it rides
        // the same browser round-trip as every other provider.
        if (!provider.isOAuthProvider) {
            return null
        }
        val providerPath = provider.key
        val encodedRedirect = java.net.URLEncoder.encode(redirectUrl, Charsets.UTF_8.name())
        return "${authBase()}/$providerPath/start?redirect_to=$encodedRedirect"
    }

    override suspend fun handleIncomingUrl(url: String): AuthSession? {
        if (!isExpectedAuthRedirect(url)) {
            return null
        }
        // With MFA enabled the callback fragment carries a challenge instead
        // of tokens; the caller checks hasPendingMfaChallenge when no session
        // came.
        val components = runCatching { URI(url) }.getOrNull()
        val challenge = components?.rawFragment?.let { queryValueMap(it)["mfa_challenge"] }
        if (!challenge.isNullOrEmpty()) {
            pendingMfaChallenge = challenge
            return null
        }
        val session = parseSession(url) ?: return null
        sessionStorage.persistSession(session)
        return session
    }

    override suspend fun fetchRuntimeAuthMethods(): List<AuthMethod>? =
        withContext(Dispatchers.IO) {
            // Fail-safe: the sign-in surface already rendered its build-time
            // methods; a missing or malformed runtime config must never blank it.
            try {
                val request = Request.Builder().url("${authBase()}/config").get().build()
                httpClient.newCall(request).execute().use { response ->
                    if (response.code != 200) {
                        return@withContext null
                    }
                    val payload = json.decodeFromString<RuntimeConfigPayload>(
                        response.body?.string() ?: "",
                    )
                    val methods = payload.methods
                        ?.mapNotNull { AuthMethod.fromKey(it) }
                        ?.distinct()
                    if (methods.isNullOrEmpty()) null else methods
                }
            } catch (_: Exception) {
                null
            }
        }

    // --- Two-factor authentication ---

    override val hasPendingMfaChallenge: Boolean get() = pendingMfaChallenge != null

    override suspend fun verifyMfaCode(code: String): AuthSession {
        val challengeToken = pendingMfaChallenge
            ?: throw AuthClientException("No sign-in is awaiting a code. Start over from the sign-in screen.")
        val trimmedCode = code.trim()
        if (trimmedCode.isEmpty()) {
            throw AuthClientException("Enter the code from your authenticator app.")
        }
        val body = performRequest(
            url = "${authBase()}/mfa/verify",
            body = json.encodeToString(
                MfaVerifyRequest(challengeToken = challengeToken, code = trimmedCode)
            ),
        )
        val session = persistTokenPayloadSession(decodeTokenPayload(body), fallbackEmail = null)
        pendingMfaChallenge = null
        pendingPasswordReset?.let { newPassword ->
            pendingPasswordReset = null
            performRequest(
                url = "${authBase()}/password",
                body = json.encodeToString(UpdatePasswordRequest(password = newPassword)),
                bearerToken = session.accessToken,
            )
        }
        return session
    }

    override suspend fun enrollMfa(): MfaEnrollment {
        val body = performRequest(
            url = "${authBase()}/mfa/enroll",
            body = "{}",
            bearerToken = requireAccessToken(),
        )
        val payload = try {
            json.decodeFromString<MfaEnrollmentPayload>(body)
        } catch (_: Exception) {
            throw AuthClientException("Authentication response could not be parsed.")
        }
        return MfaEnrollment(secret = payload.secret, otpauthUri = payload.otpauthUri)
    }

    override suspend fun confirmMfa(code: String): List<String> {
        val body = performRequest(
            url = "${authBase()}/mfa/confirm",
            body = json.encodeToString(MfaCodeRequest(code = code)),
            bearerToken = requireAccessToken(),
        )
        val payload = try {
            json.decodeFromString<MfaRecoveryCodesPayload>(body)
        } catch (_: Exception) {
            throw AuthClientException("Authentication response could not be parsed.")
        }
        return payload.recoveryCodes
    }

    override suspend fun disableMfa(code: String) {
        performRequest(
            url = "${authBase()}/mfa/disable",
            body = json.encodeToString(MfaCodeRequest(code = code)),
            bearerToken = requireAccessToken(),
        )
    }

    override suspend fun fetchMfaEnabled(): Boolean =
        withContext(Dispatchers.IO) {
            // Fail-safe like fetchRuntimeAuthMethods: the Settings surface
            // must render even when the status endpoint is unreachable.
            try {
                val token = sessionRefresher.validSession()?.accessToken
                    ?: return@withContext false
                val request = Request.Builder()
                    .url("${authBase()}/mfa/status")
                    .header("Authorization", "Bearer $token")
                    .get()
                    .build()
                httpClient.newCall(request).execute().use { response ->
                    if (response.code != 200) {
                        return@withContext false
                    }
                    json.decodeFromString<MfaStatusPayload>(
                        response.body?.string() ?: "",
                    ).enabled == true
                }
            } catch (_: Exception) {
                false
            }
        }

    private suspend fun requireAccessToken(): String =
        sessionRefresher.validSession()?.accessToken
            ?: throw AuthClientException("You must be signed in to manage two-factor authentication.")

    /** Holds the challenge and throws when the response is an MFA challenge. */
    private fun interceptMfaChallenge(body: String) {
        decodeMfaChallenge(body)?.let { challenge ->
            pendingMfaChallenge = challenge
            throw MfaRequiredException()
        }
    }

    private fun decodeMfaChallenge(body: String): String? {
        val payload = try {
            json.decodeFromString<MfaChallengePayload>(body)
        } catch (_: Exception) {
            return null
        }
        if (payload.mfaRequired != true || payload.challengeToken.isNullOrEmpty()) {
            return null
        }
        return payload.challengeToken
    }

    override suspend fun signOut() {
        val refreshToken = sessionStorage.loadSession()?.refreshToken
        if (refreshToken != null) {
            // Best effort: local sign-out proceeds even if revocation fails.
            runCatching {
                performRequest(
                    url = "${authBase()}/signout",
                    body = json.encodeToString(SignOutRequest(refreshToken = refreshToken)),
                )
            }
        }
        sessionStorage.clearSession()
    }

    // --- URL callback parsing ---

    private fun isExpectedAuthRedirect(url: String): Boolean {
        val incoming = runCatching { URI(url) }.getOrNull() ?: return false
        val expected = runCatching { URI(redirectUrl) }.getOrNull() ?: return false
        if (incoming.scheme != expected.scheme) {
            return false
        }
        // For custom schemes ("baseapp-dev://auth/callback") the "auth" part
        // is the authority/host and "/callback" is the path.
        if (expected.authority != null && incoming.authority != expected.authority) {
            return false
        }
        return incoming.path == expected.path
    }

    /** Auth callbacks carry the session in the URL fragment. */
    private fun parseSession(url: String): AuthSession? {
        val components = runCatching { URI(url) }.getOrNull() ?: return null
        val fragmentValues = queryValueMap(components.rawFragment)
        val queryValues = queryValueMap(components.rawQuery)
        val accessToken = fragmentValues["access_token"] ?: queryValues["access_token"]
        if (accessToken.isNullOrEmpty()) {
            return null
        }

        val expiresAtEpochMs = (fragmentValues["expires_in"] ?: queryValues["expires_in"])
            ?.toLongOrNull()
            ?.let { System.currentTimeMillis() + it * 1000L }

        return AuthSession(
            accessToken = accessToken,
            refreshToken = fragmentValues["refresh_token"] ?: queryValues["refresh_token"],
            expiresAtEpochMs = expiresAtEpochMs,
            email = queryValues["email"] ?: fragmentValues["email"],
        )
    }

    private fun queryValueMap(raw: String?): Map<String, String> {
        if (raw.isNullOrEmpty()) {
            return emptyMap()
        }
        return raw.split("&").mapNotNull { pair ->
            val pieces = pair.split("=", limit = 2)
            if (pieces.size != 2) {
                return@mapNotNull null
            }
            val value = runCatching {
                URLDecoder.decode(pieces[1], Charsets.UTF_8.name())
            }.getOrDefault("")
            pieces[0] to value
        }.toMap()
    }

    // --- Transport ---

    private fun authBase(): String = authUrl.trimEnd('/')

    private fun validatedEmail(email: String): String {
        val trimmedEmail = email.trim()
        if (!EMAIL_REGEX.matches(trimmedEmail)) {
            throw AuthClientException("Enter a valid email address.")
        }
        return trimmedEmail
    }

    private suspend fun performRequest(
        url: String,
        body: String,
        bearerToken: String? = null,
    ): String =
        withContext(Dispatchers.IO) {
            val builder = Request.Builder()
                .url(url)
                .post(body.toRequestBody("application/json".toMediaType()))
            if (bearerToken != null) {
                builder.header("Authorization", "Bearer $bearerToken")
            }
            val request = builder.build()
            httpClient.newCall(request).execute().use { response ->
                val responseBody = response.body?.string() ?: ""
                if (response.code !in 200..299) {
                    val message = parseErrorMessage(responseBody)
                    if (message != null) {
                        throw AuthClientException(
                            "Authentication request failed (${response.code}): $message"
                        )
                    }
                    throw AuthClientException("Authentication request failed (${response.code}).")
                }
                responseBody
            }
        }

    private fun parseErrorMessage(body: String): String? {
        if (body.isEmpty()) {
            return null
        }
        val payload = try {
            json.decodeFromString<ErrorPayload>(body)
        } catch (_: Exception) {
            return null
        }
        return payload.error?.message?.trim()?.takeIf { it.isNotEmpty() }
    }

    private fun decodeTokenPayload(body: String): TokenResponsePayload {
        val payload = try {
            json.decodeFromString<TokenResponsePayload>(body)
        } catch (_: Exception) {
            throw AuthClientException("Authentication response could not be parsed.")
        }
        if (payload.accessToken.isNullOrEmpty()) {
            throw AuthClientException("Authentication response could not be parsed.")
        }
        return payload
    }

    // --- Payloads ---

    @Serializable
    private data class RuntimeConfigPayload(val methods: List<String>? = null)

    @Serializable
    private data class EmailRequest(val email: String)

    @Serializable
    private data class VerifyRequest(
        val email: String,
        val code: String,
        val type: String,
    )

    @Serializable
    private data class PasswordGrantRequest(
        @SerialName("grant_type") val grantType: String,
        val email: String,
        val password: String,
    )

    @Serializable
    private data class SignUpRequest(
        val email: String,
        val password: String,
    )

    @Serializable
    private data class UpdatePasswordRequest(val password: String)

    @Serializable
    private data class SignOutRequest(
        @SerialName("refresh_token") val refreshToken: String,
    )

    @Serializable
    private data class MfaVerifyRequest(
        @SerialName("challenge_token") val challengeToken: String,
        val code: String,
    )

    @Serializable
    private data class MfaCodeRequest(val code: String)

    @Serializable
    private data class MfaChallengePayload(
        @SerialName("mfa_required") val mfaRequired: Boolean? = null,
        @SerialName("challenge_token") val challengeToken: String? = null,
    )

    @Serializable
    private data class MfaEnrollmentPayload(
        val secret: String,
        @SerialName("otpauth_uri") val otpauthUri: String,
    )

    @Serializable
    private data class MfaRecoveryCodesPayload(
        @SerialName("recovery_codes") val recoveryCodes: List<String>,
    )

    @Serializable
    private data class MfaStatusPayload(val enabled: Boolean? = null)

    @Serializable
    private data class TokenResponsePayload(
        @SerialName("access_token") val accessToken: String? = null,
        @SerialName("refresh_token") val refreshToken: String? = null,
        @SerialName("expires_in") val expiresIn: Long? = null,
        val email: String? = null,
    )

    @Serializable
    private data class ErrorPayload(val error: ErrorBody? = null) {
        @Serializable
        data class ErrorBody(
            val code: String? = null,
            val message: String? = null,
        )
    }

    private companion object {
        val EMAIL_REGEX = Regex("""[^\s@]+@[^\s@]+\.[^\s@]+""")
    }
}
