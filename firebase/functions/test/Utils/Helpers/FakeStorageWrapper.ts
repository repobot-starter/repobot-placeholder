import {
    SignedDownloadUrlRequest,
    SignedUploadUrl,
    SignedUploadUrlRequest,
    StorageObjectMetadata,
    StorageWrapper,
    UploadObjectRequest,
} from "../../../src/DependencyWrappers/StorageWrapper/index.js"

/**
 * In-memory StorageWrapper for gcs-mode tests: no network, deterministic
 * "signed" URLs, and an object map tests populate to simulate a client's
 * direct-to-GCS PUT having happened.
 */
export class FakeStorageWrapper implements StorageWrapper {
    /** Object metadata by "bucket/key"; tests seed this to simulate uploads. */
    readonly objects = new Map<string, StorageObjectMetadata>()
    /** Bytes by "bucket/key" for objects written through uploadObject. */
    readonly objectBytes = new Map<string, Buffer>()
    readonly signedUploadRequests: SignedUploadUrlRequest[] = []
    readonly signedDownloadRequests: SignedDownloadUrlRequest[] = []
    readonly uploadedObjects: UploadObjectRequest[] = []
    readonly deletedKeys: string[] = []

    async createSignedUploadUrl(request: SignedUploadUrlRequest): Promise<SignedUploadUrl> {
        this.signedUploadRequests.push(request)
        return {
            url: `https://storage.fake/${request.bucket}/${request.key}?signature=upload`,
            headers: { "Content-Type": request.contentType },
        }
    }

    async createSignedDownloadUrl(request: SignedDownloadUrlRequest): Promise<string> {
        this.signedDownloadRequests.push(request)
        return `https://storage.fake/${request.bucket}/${request.key}?signature=download`
    }

    async uploadObject(request: UploadObjectRequest): Promise<void> {
        this.uploadedObjects.push(request)
        this.objects.set(`${request.bucket}/${request.key}`, {
            sizeBytes: request.bytes.length,
            contentType: request.contentType,
        })
        this.objectBytes.set(`${request.bucket}/${request.key}`, request.bytes)
    }

    async getObjectMetadata(bucket: string, key: string): Promise<StorageObjectMetadata | undefined> {
        return this.objects.get(`${bucket}/${key}`)
    }

    async downloadObject(bucket: string, key: string): Promise<Buffer | undefined> {
        return this.objectBytes.get(`${bucket}/${key}`)
    }

    async deleteObject(bucket: string, key: string): Promise<void> {
        this.deletedKeys.push(`${bucket}/${key}`)
        // eslint-disable-next-line drizzle/enforce-delete-with-where -- Map.delete, not drizzle
        this.objects.delete(`${bucket}/${key}`)
    }

    /** Simulates the client's direct PUT to the signed URL. */
    simulateUploadedObject(bucket: string, key: string, metadata: StorageObjectMetadata): void {
        this.objects.set(`${bucket}/${key}`, metadata)
    }
}
