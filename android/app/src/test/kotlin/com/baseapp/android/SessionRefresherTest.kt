package com.baseapp.android

import com.baseapp.android.auth.AuthSession
import com.baseapp.android.auth.BuiltinSessionRefresher
import com.baseapp.android.auth.SessionStorage
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test
import java.util.concurrent.TimeUnit

class SessionRefresherTest {
    private val server = MockWebServer()

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun returnsSessionUntouchedWhenNotNearExpiry() = runBlocking {
        val session = makeSession(expiresInMs = 3_600_000)
        val storage = InMemorySessionStorage(session)
        val refresher = makeRefresher(storage)

        val result = refresher.validSession()

        assertEquals(session, result)
        assertEquals(0, server.requestCount)
    }

    @Test
    fun refreshesExpiredSessionAndPersistsResult() = runBlocking {
        server.enqueue(
            MockResponse().setResponseCode(200).setBody(
                """
                {
                  "access_token": "new-access",
                  "refresh_token": "new-refresh",
                  "expires_in": 3600,
                  "email": "person@example.com"
                }
                """.trimIndent()
            )
        )
        val storage = InMemorySessionStorage(makeSession(expiresInMs = -60_000))
        val refresher = makeRefresher(storage)

        val result = refresher.validSession()

        assertEquals("new-access", result?.accessToken)
        assertEquals("new-refresh", result?.refreshToken)
        assertEquals("new-access", storage.loadSession()?.accessToken)
        assertNotNull(result?.expiresAtEpochMs)
        assertEquals(1, server.requestCount)
    }

    @Test
    fun clearsSessionWhenRefreshTokenIsRejected() = runBlocking {
        server.enqueue(
            MockResponse().setResponseCode(401).setBody(
                """{ "error": { "code": "UNAUTHENTICATED", "message": "Invalid or expired refresh token." } }"""
            )
        )
        val storage = InMemorySessionStorage(makeSession(expiresInMs = -60_000))
        val refresher = makeRefresher(storage)

        val result = refresher.validSession()

        assertNull(result)
        assertNull(storage.loadSession())
    }

    @Test
    fun keepsStaleSessionOnServerError() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(503).setBody("{}"))
        val staleSession = makeSession(expiresInMs = -60_000)
        val storage = InMemorySessionStorage(staleSession)
        val refresher = makeRefresher(storage)

        val result = refresher.validSession()

        assertEquals(staleSession, result)
        assertEquals(staleSession, storage.loadSession())
    }

    @Test
    fun concurrentCallersShareOneRefresh() = runBlocking {
        server.enqueue(
            MockResponse()
                .setBodyDelay(200, TimeUnit.MILLISECONDS)
                .setResponseCode(200)
                .setBody(
                    """{ "access_token": "new-access", "refresh_token": "new-refresh", "expires_in": 3600 }"""
                )
        )
        val storage = InMemorySessionStorage(makeSession(expiresInMs = -60_000))
        val refresher = makeRefresher(storage)

        val results = listOf(
            async { refresher.validSession() },
            async { refresher.validSession() },
            async { refresher.validSession() },
        ).awaitAll()

        assertEquals(1, server.requestCount)
        for (result in results) {
            assertEquals("new-access", result?.accessToken)
        }
    }

    @Test
    fun sessionWithoutRefreshTokenIsReturnedAsIs() = runBlocking {
        val session = AuthSession(
            accessToken = "orphan",
            refreshToken = null,
            expiresAtEpochMs = System.currentTimeMillis() - 60_000,
        )
        val storage = InMemorySessionStorage(session)
        val refresher = makeRefresher(storage)

        val result = refresher.validSession()

        assertEquals(session, result)
        assertEquals(0, server.requestCount)
    }

    private fun makeSession(expiresInMs: Long) = AuthSession(
        accessToken = "old-access",
        refreshToken = "old-refresh",
        expiresAtEpochMs = System.currentTimeMillis() + expiresInMs,
        email = "person@example.com",
    )

    private fun makeRefresher(storage: SessionStorage) = BuiltinSessionRefresher(
        authUrl = server.url("/auth__request__api").toString(),
        sessionStorage = storage,
        httpClient = OkHttpClient(),
    )
}

private class InMemorySessionStorage(private var session: AuthSession?) : SessionStorage {
    override fun loadSession(): AuthSession? = session

    override fun persistSession(session: AuthSession) {
        this.session = session
    }

    override fun clearSession() {
        session = null
    }
}
