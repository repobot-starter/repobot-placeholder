package com.baseapp.android

import com.baseapp.android.components.storage.StorageUploadClient
import com.baseapp.android.components.storage.StorageUploadFailure
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

/**
 * Tests for the storage kernel's transport half: endpoint derivation from the
 * GraphQL URL, slot URL resolution, and the raw PUT — mirroring the iOS
 * StorageUploadClientTests (the endpoint swap matches web/core's
 * deriveStorageEndpoint).
 */
class StorageUploadClientTest {
    @Test
    fun derivesTheStorageEndpointBySwappingTheFunctionName() {
        assertEquals(
            "http://127.0.0.1:5001/demo/us-central1/storage__request__api",
            StorageUploadClient.endpoint("http://127.0.0.1:5001/demo/us-central1/graphql__request__api"),
        )
        assertEquals(
            "https://example.com/prefix__storage__request__api",
            StorageUploadClient.endpoint("https://example.com/prefix__graphql__request__api"),
        )
    }

    @Test
    fun endpointIsNullForAGraphqlUrlWithoutTheWellKnownFunctionName() {
        assertNull(StorageUploadClient.endpoint("https://example.com/graphql"))
    }

    @Test
    fun resolvesPathsAgainstTheEndpointAndPassesAbsoluteUrlsThrough() {
        val endpoint = "https://example.com/storage__request__api"
        assertEquals(
            "https://example.com/storage__request__api/upload?token=abc",
            StorageUploadClient.resolveStorageUrl(endpoint, "/upload?token=abc"),
        )
        // V4 signed GCS URLs are absolute and pass through untouched.
        assertEquals(
            "https://storage.googleapis.com/bucket/object?X-Goog-Signature=sig",
            StorageUploadClient.resolveStorageUrl(
                endpoint,
                "https://storage.googleapis.com/bucket/object?X-Goog-Signature=sig",
            ),
        )
    }

    @Test
    fun buildsTheStablePublicFileUrl() {
        assertEquals(
            "https://example.com/storage__request__api/file/upload_1",
            StorageUploadClient.publicFileUrl("https://example.com/storage__request__api", "upload_1"),
        )
    }

    @Test
    fun putUploadBytesSendsTheSlotHeadersAndBody() = runTest {
        val server = MockWebServer()
        server.enqueue(MockResponse().setResponseCode(200))
        server.start()
        try {
            val client = StorageUploadClient()
            client.putUploadBytes(
                endpoint = server.url("/storage__request__api").toString(),
                uploadUrl = "/upload?token=abc",
                headersJson = """{"Content-Type":"image/jpeg","X-Custom":"slot-value"}""",
                body = "jpeg-bytes".toByteArray(),
            )

            val recorded = server.takeRequest()
            assertEquals("PUT", recorded.method)
            assertEquals("/storage__request__api/upload?token=abc", recorded.path)
            assertEquals("image/jpeg", recorded.getHeader("Content-Type"))
            assertEquals("slot-value", recorded.getHeader("X-Custom"))
            assertEquals("jpeg-bytes", recorded.body.readUtf8())
        } finally {
            server.shutdown()
        }
    }

    @Test
    fun putUploadBytesThrowsOnNonSuccessStatus() {
        val server = MockWebServer()
        server.enqueue(MockResponse().setResponseCode(403))
        server.start()
        try {
            val client = StorageUploadClient()
            val failure = assertThrows(StorageUploadFailure.PutFailed::class.java) {
                runBlocking {
                    client.putUploadBytes(
                        endpoint = server.url("/storage__request__api").toString(),
                        uploadUrl = "/upload?token=abc",
                        headersJson = """{"Content-Type":"image/jpeg"}""",
                        body = "jpeg-bytes".toByteArray(),
                    )
                }
            }
            assertEquals("Uploading the file failed (403).", failure.message)
        } finally {
            server.shutdown()
        }
    }

    @Test
    fun putUploadBytesThrowsOnMalformedHeadersJson() {
        val client = StorageUploadClient()
        assertThrows(StorageUploadFailure.MalformedSlot::class.java) {
            runBlocking {
                client.putUploadBytes(
                    endpoint = "https://example.com/storage__request__api",
                    uploadUrl = "/upload?token=abc",
                    headersJson = "not-json",
                    body = "jpeg-bytes".toByteArray(),
                )
            }
        }
    }
}
