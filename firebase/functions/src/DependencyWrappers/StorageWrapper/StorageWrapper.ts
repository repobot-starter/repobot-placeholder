/**
 * The storage kernel's boundary with Google Cloud Storage — the ONLY GCS
 * call site in the kernel. Only the operations the kernel needs are wrapped:
 * minting V4 signed URLs for client-direct upload (PUT) and private
 * download (GET), writing an object inline for server-side writes,
 * verifying an uploaded object, and deleting one.
 *
 * Local mode (STORAGE_MODE=local) never touches this wrapper: file bytes
 * live on disk and are served by the storage function (see
 * Services/Storage/LocalStorageStore.ts).
 */

export interface SignedUploadUrlRequest {
    bucket: string
    /** Full object key including any STORAGE_PREFIX. */
    key: string
    /** The exact content type the client must send on the PUT. */
    contentType: string
    expiresInSeconds: number
}

export interface SignedUploadUrl {
    /** The V4 signed PUT URL the client uploads bytes to. */
    url: string
    /** Headers the client must send verbatim (the signature covers them). */
    headers: Record<string, string>
}

export interface SignedDownloadUrlRequest {
    bucket: string
    key: string
    expiresInSeconds: number
}

export interface UploadObjectRequest {
    bucket: string
    /** Full object key including any STORAGE_PREFIX. */
    key: string
    contentType: string
    /** The full object bytes; callers stay under the kernel's size cap. */
    bytes: Buffer
}

export interface StorageObjectMetadata {
    sizeBytes: number
    contentType: string | undefined
}

export interface StorageWrapper {
    createSignedUploadUrl(request: SignedUploadUrlRequest): Promise<SignedUploadUrl>
    createSignedDownloadUrl(request: SignedDownloadUrlRequest): Promise<string>
    /**
     * Writes an object server-side (the writeFile mutation's gcs path), as
     * the runtime service account — no signed URL round-trip.
     */
    uploadObject(request: UploadObjectRequest): Promise<void>
    /** Metadata for an object, or undefined when it does not exist. */
    getObjectMetadata(bucket: string, key: string): Promise<StorageObjectMetadata | undefined>
    /**
     * Reads an object's bytes server-side (the document-intake read path),
     * or undefined when it does not exist. The kernel's upload size cap
     * keeps these bodies small enough to buffer whole.
     */
    downloadObject(bucket: string, key: string): Promise<Buffer | undefined>
    /** Deletes an object; succeeding when it is already gone. */
    deleteObject(bucket: string, key: string): Promise<void>
}
