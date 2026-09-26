/**
 * Transport for the storage kernel (storage__request__api + the upload PUT).
 * The GraphQL side (createUpload / finalizeUpload / fileUrl / deleteUpload)
 * lives in the app's generated hooks; this module handles the two things
 * GraphQL cannot: resolving the kernel's storage-endpoint-relative URLs and
 * PUTting the file bytes to the minted upload slot. See docs/storage.md.
 */

/**
 * The storage endpoint is the storage__request__api function, which lives
 * next to the GraphQL function in every environment — the emulator and the
 * platform deployer treat all exports uniformly — so its URL is the GraphQL
 * URL with the trailing function name swapped. The app passes its GraphQL
 * URL (import.meta.env.VITE_GRAPHQL_URL); core never reads env directly.
 */
export function deriveStorageEndpoint(graphqlUrl: string): string {
    const endpoint = graphqlUrl.replace(/graphql__request__api\/?$/, "storage__request__api")
    if (endpoint === graphqlUrl) {
        throw new Error(
            "Could not derive the storage endpoint: the GraphQL URL does not end with " +
                "the graphql__request__api function name.",
        )
    }
    return endpoint
}

/**
 * Resolves a URL returned by the storage kernel: V4 signed GCS URLs are
 * absolute and pass through; everything served by the storage function
 * ("/upload?...", "/file/<id>") is a path resolved against the endpoint.
 */
export function resolveStorageUrl(endpoint: string, url: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url
    }
    return `${endpoint}${url}`
}

/** The stable serving URL for a PUBLIC upload (both modes serve /file/<id>). */
export function buildPublicFileUrl(endpoint: string, uploadId: string): string {
    return `${endpoint}/file/${encodeURIComponent(uploadId)}`
}

/**
 * PUTs the file bytes to a minted upload slot (the createUpload mutation's
 * uploadUrl + headersJson). Works against both slot flavors: the signed GCS
 * URL and the local-mode storage function. Throws on any non-2xx response.
 */
export async function putUploadBytes(request: {
    endpoint: string
    uploadUrl: string
    headersJson: string
    body: Blob
}): Promise<void> {
    const headers = JSON.parse(request.headersJson) as Record<string, string>
    const response = await fetch(resolveStorageUrl(request.endpoint, request.uploadUrl), {
        method: "PUT",
        headers,
        body: request.body,
    })
    if (!response.ok) {
        throw new Error(`Uploading the file failed (${response.status}).`)
    }
}
