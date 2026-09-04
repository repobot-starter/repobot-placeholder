package com.baseapp.android.components.storage

import java.net.URLEncoder
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

sealed class StorageUploadFailure(override val message: String) : Exception(message) {
    class EndpointUnavailable :
        StorageUploadFailure("The storage endpoint could not be derived from the backend config.")
    class MalformedSlot :
        StorageUploadFailure("The upload slot returned by the backend is malformed.")
    class PutFailed(statusCode: Int) :
        StorageUploadFailure("Uploading the file failed ($statusCode).")
}

/**
 * Transport for the storage kernel's non-GraphQL half: resolving the
 * kernel's storage-endpoint-relative URLs and PUTting file bytes to a minted
 * upload slot. The native twin of web/core's StorageApi.ts and the iOS
 * StorageUploadClient — the GraphQL side (createUpload / finalizeUpload /
 * deleteUpload) lives on GraphQLClient. See docs/storage.md.
 */
class StorageUploadClient(
    private val httpClient: OkHttpClient = OkHttpClient(),
) {
    companion object {
        /**
         * The storage endpoint is the storage__request__api function, which
         * lives next to the GraphQL function in every environment (the
         * emulator and the platform deployer treat all exports uniformly), so
         * its URL is the GraphQL URL with the trailing function name swapped —
         * the same derivation as the auth endpoint (AppConfig.authUrl).
         */
        fun endpoint(graphqlUrl: String): String? {
            if (!graphqlUrl.contains("graphql__request__api")) {
                return null
            }
            return graphqlUrl.replace("graphql__request__api", "storage__request__api")
        }

        /**
         * Resolves a URL returned by the storage kernel: V4 signed GCS URLs are
         * absolute and pass through; everything served by the storage function
         * ("/upload?...", "/file/<id>") is a path resolved against the endpoint.
         */
        fun resolveStorageUrl(endpoint: String, url: String): String {
            if (url.startsWith("http://") || url.startsWith("https://")) {
                return url
            }
            return "$endpoint$url"
        }

        /** The stable serving URL for a PUBLIC upload (both modes serve /file/<id>). */
        fun publicFileUrl(endpoint: String, uploadId: String): String {
            val encodedId = URLEncoder.encode(uploadId, Charsets.UTF_8.name())
            return "$endpoint/file/$encodedId"
        }
    }

    /**
     * PUTs the file bytes to a minted upload slot (the createUpload mutation's
     * uploadUrl + headersJson). Works against both slot flavors: the signed
     * GCS URL and the local-mode storage function. Throws on any non-2xx
     * response.
     */
    suspend fun putUploadBytes(endpoint: String, uploadUrl: String, headersJson: String, body: ByteArray) {
        val headers = try {
            Json.parseToJsonElement(headersJson).jsonObject.mapValues { it.value.jsonPrimitive.content }
        } catch (_: Exception) {
            throw StorageUploadFailure.MalformedSlot()
        }
        val target = resolveStorageUrl(endpoint, uploadUrl)
        val request = try {
            Request.Builder()
                .url(target)
                // A null media type keeps OkHttp from overriding the slot's
                // verbatim Content-Type header below.
                .put(body.toRequestBody(null))
                .apply { headers.forEach { (name, value) -> header(name, value) } }
                .build()
        } catch (_: IllegalArgumentException) {
            throw StorageUploadFailure.MalformedSlot()
        }
        withContext(Dispatchers.IO) {
            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw StorageUploadFailure.PutFailed(response.code)
                }
            }
        }
    }
}
