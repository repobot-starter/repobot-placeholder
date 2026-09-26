package com.baseapp.android.auth

import kotlinx.coroutines.Deferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
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
 * Hands out a session suitable for authenticating a request right now,
 * refreshing it first when it is expired or about to expire.
 */
interface SessionProviding {
    suspend fun validSession(): AuthSession?
}

/**
 * Returns whatever is in storage without refreshing. Used for the sandbox
 * flavor, whose local dev tokens never expire server-side.
 */
class StoredSessionProvider(private val sessionStorage: SessionStorage) : SessionProviding {
    override suspend fun validSession(): AuthSession? = sessionStorage.loadSession()
}

/**
 * Proactively redeems the refresh token when the access token is near expiry.
 * The built-in auth service rotates refresh tokens (each one is single-use),
 * so concurrent callers are funneled into one in-flight refresh.
 */
class BuiltinSessionRefresher(
    private val authUrl: String,
    private val sessionStorage: SessionStorage,
    private val httpClient: OkHttpClient = OkHttpClient(),
    private val nowEpochMs: () -> Long = System::currentTimeMillis,
) : SessionProviding {

    private val json = Json { ignoreUnknownKeys = true }
    private val refreshMutex = Mutex()
    private val refreshScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var inFlightRefresh: Deferred<AuthSession?>? = null

    override suspend fun validSession(): AuthSession? {
        val session = sessionStorage.loadSession() ?: return null
        if (!needsRefresh(session, nowEpochMs()) || session.refreshToken == null) {
            return session
        }

        val refresh = refreshMutex.withLock {
            inFlightRefresh?.takeIf { it.isActive }
                ?: refreshScope.async { performRefresh(session) }.also { inFlightRefresh = it }
        }
        val refreshed = refresh.await()
        refreshMutex.withLock {
            if (inFlightRefresh === refresh) {
                inFlightRefresh = null
            }
        }
        return refreshed
    }

    private suspend fun performRefresh(current: AuthSession): AuthSession? {
        val refreshToken = current.refreshToken ?: return current

        val response = try {
            postRefreshRequest(refreshToken)
        } catch (_: Exception) {
            // Network failure: the token may still be fine; keep the session and
            // let the caller's request surface its own error instead of logging out.
            return current
        }

        if (response.statusCode !in 200..299) {
            if (response.statusCode in listOf(400, 401, 403)) {
                // The refresh token was definitively rejected (revoked or already
                // rotated away). The session is unrecoverable.
                sessionStorage.clearSession()
                return null
            }
            return current
        }

        val payload = try {
            json.decodeFromString<RefreshResponsePayload>(response.body)
        } catch (_: Exception) {
            return current
        }
        val accessToken = payload.accessToken
        if (accessToken.isNullOrEmpty()) {
            return current
        }

        val refreshed = AuthSession(
            accessToken = accessToken,
            refreshToken = payload.refreshToken ?: refreshToken,
            expiresAtEpochMs = payload.expiresIn?.let { nowEpochMs() + it * 1000L },
            email = payload.email ?: current.email,
        )
        sessionStorage.persistSession(refreshed)
        return refreshed
    }

    private suspend fun postRefreshRequest(refreshToken: String): RawResponse =
        withContext(Dispatchers.IO) {
            val body = json.encodeToString(RefreshRequestBody(refreshToken = refreshToken))
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("${authUrl.trimEnd('/')}/token")
                .post(body)
                .build()
            httpClient.newCall(request).execute().use { response ->
                RawResponse(response.code, response.body?.string() ?: "")
            }
        }

    private data class RawResponse(val statusCode: Int, val body: String)

    @Serializable
    private data class RefreshRequestBody(
        @SerialName("grant_type") val grantType: String = "refresh_token",
        @SerialName("refresh_token") val refreshToken: String,
    )

    @Serializable
    private data class RefreshResponsePayload(
        @SerialName("access_token") val accessToken: String? = null,
        @SerialName("refresh_token") val refreshToken: String? = null,
        @SerialName("expires_in") val expiresIn: Long? = null,
        val email: String? = null,
    )

    companion object {
        /**
         * Refresh this long before the access token actually expires so a
         * request never leaves the device with a token that dies mid-flight.
         */
        const val REFRESH_MARGIN_MS = 120_000L

        fun needsRefresh(session: AuthSession, nowEpochMs: Long): Boolean {
            // No expiry recorded (e.g. an old persisted session): optimistically
            // use it as-is rather than burning the single-use refresh token.
            val expiresAt = session.expiresAtEpochMs ?: return false
            return expiresAt - nowEpochMs < REFRESH_MARGIN_MS
        }
    }
}
