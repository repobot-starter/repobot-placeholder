import { getApps, initializeApp } from "firebase-admin/app"
import { getStorage } from "firebase-admin/storage"
import {
    SignedDownloadUrlRequest,
    SignedUploadUrl,
    SignedUploadUrlRequest,
    StorageObjectMetadata,
    StorageWrapper,
    UploadObjectRequest,
} from "./StorageWrapper.js"

/**
 * Real GCS implementation on the Cloud Storage client bundled with
 * firebase-admin, authenticated as the deployed runtime's default service
 * account (Application Default Credentials — no key files). V4 signed URLs
 * are minted via the IAM signBlob API, which requires the runtime service
 * account to hold roles/iam.serviceAccountTokenCreator on itself; inline
 * object writes (uploadObject) ride the same account's storage.objectAdmin
 * grant on the bucket. The platform's STORAGE_BUCKET provisioning step
 * grants both.
 */
export class GcsStorageWrapper implements StorageWrapper {
    private bucketHandle(bucket: string) {
        if (getApps().length === 0) {
            initializeApp()
        }
        return getStorage().bucket(bucket)
    }

    async createSignedUploadUrl(request: SignedUploadUrlRequest): Promise<SignedUploadUrl> {
        const [url] = await this.bucketHandle(request.bucket)
            .file(request.key)
            .getSignedUrl({
                version: "v4",
                action: "write",
                expires: Date.now() + request.expiresInSeconds * 1000,
                contentType: request.contentType,
            })
        // The signature covers Content-Type: the client must send it verbatim.
        return { url, headers: { "Content-Type": request.contentType } }
    }

    async createSignedDownloadUrl(request: SignedDownloadUrlRequest): Promise<string> {
        const [url] = await this.bucketHandle(request.bucket)
            .file(request.key)
            .getSignedUrl({
                version: "v4",
                action: "read",
                expires: Date.now() + request.expiresInSeconds * 1000,
            })
        return url
    }

    async uploadObject(request: UploadObjectRequest): Promise<void> {
        // Single-shot (non-resumable) upload: the kernel's size cap keeps
        // these bodies small enough that a resumable session buys nothing.
        await this.bucketHandle(request.bucket).file(request.key).save(request.bytes, {
            contentType: request.contentType,
            resumable: false,
        })
    }

    async getObjectMetadata(bucket: string, key: string): Promise<StorageObjectMetadata | undefined> {
        try {
            const [metadata] = await this.bucketHandle(bucket).file(key).getMetadata()
            return {
                sizeBytes: Number(metadata.size ?? 0),
                contentType: metadata.contentType ?? undefined,
            }
        } catch (error) {
            if (isNotFound(error)) {
                return undefined
            }
            throw error
        }
    }

    async downloadObject(bucket: string, key: string): Promise<Buffer | undefined> {
        try {
            const [bytes] = await this.bucketHandle(bucket).file(key).download()
            return bytes
        } catch (error) {
            if (isNotFound(error)) {
                return undefined
            }
            throw error
        }
    }

    async deleteObject(bucket: string, key: string): Promise<void> {
        // eslint-disable-next-line drizzle/enforce-delete-with-where -- GCS file delete, not a drizzle table.
        await this.bucketHandle(bucket).file(key).delete({ ignoreNotFound: true })
    }
}

function isNotFound(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: unknown }).code === 404
    )
}
