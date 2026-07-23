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
        // authorizes the password update below.
        val body = performRequest(
            url = "${authBase()}/verify",
            body = json.encodeToString(
                VerifyRequest(email = trimmedEmail, code = trimmedCode, type = "recovery")
            ),
        )
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
        if (provider != AuthMethod.GOOGLE) {
            return null
        }
        val encodedRedirect = java.net.URLEncoder.encode(redirectUrl, Charsets.UTF_8.name())
        return "${authBase()}/google/start?redirect_to=$encodedRedirect"
    }

    override suspend fun handleIncomingUrl(url: String): AuthSession? {
        if (!isExpectedAuthRedirect(url)) {
            return null
        }
        val session = parseSession(url) ?: return null
        sessionStorage.persistSession(session)
        return session
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
