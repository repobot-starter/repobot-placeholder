import { newRowIdForTable } from "../../Data/BaseTable.js"
import { storageDb } from "../../Data/StorageDatabase.js"
import {
    Upload,
    uploadInsertSchema,
    UploadProfile,
    uploadsTable,
    uploadUpdateSchema,
    UploadVisibility,
} from "../../Data/Storage/Upload.js"
import {
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    orderedBatchLoadRowsByIds,
    updateRowReturning,
} from "../../Data/Utils/RowOperations.js"
import { getStorageWrapper } from "../../DependencyWrappers/StorageWrapper/index.js"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"
import { eq } from "drizzle-orm"
import { deleteLocalObject, readLocalObject, statLocalObject, writeLocalObject } from "./LocalStorageStore.js"
import { storageConfig, uploadProfileConfig } from "./StorageConfig.js"
import { mintStorageToken, verifyStorageToken } from "./StorageTokens.js"

/**
 * The storage kernel: every file the app persists goes through this service —
 * uploads are never hand-built against a bucket or the filesystem. The
 * browser lifecycle is create (PENDING row + an upload URL the client PUTs
 * bytes to), finalize (bytes verified, row flips to READY), serve (PUBLIC
 * via the stable /file/<id> URL on the storage function; PRIVATE via an
 * owner-checked short-lived URL), delete (owner-checked, object and row
 * together). Server-side flows (a domain service filing bytes it already
 * has, like a generated PDF) use writeFile instead: inline bytes, same
 * admission validation and backend, same READY-verified record — no
 * browser-shaped round-trip.
 *
 * STORAGE_MODE=local (sandbox, tests, dev-posture fallback): bytes live on
 * disk under the local storage root and every URL is a path on the storage
 * function, guarded by short-lived single-upload tokens.
 *
 * STORAGE_MODE=gcs (deployed): bytes live in the provisioned STORAGE_BUCKET.
 * Clients talk to GCS directly with V4 signed URLs — upload PUTs and private
 * downloads alike — minted through the StorageWrapper (the only GCS call
 * site). PUBLIC serving still goes through /file/<id>, which 302s to a fresh
 * signed URL, so the bucket never needs public ACLs and clients never see
 * bucket credentials.
 *
 * URL shape: signed GCS URLs are absolute; everything served by the storage
 * function is a path starting with "/" that the web client resolves against
 * the storage endpoint it derives from VITE_GRAPHQL_URL (see
 * web/core/src/Storage/StorageApi.ts).
 */
class StorageService {
    /**
     * Validates the declared upload against the config allowlist and size
     * cap, inserts the PENDING row, and mints the upload slot the client
     * PUTs its bytes to.
     */
    async createUpload(request: CreateUploadRequest): Promise<UploadSlot> {
        const profile = request.profile ?? "DEFAULT"
        const contentType = assertUploadAdmission(request.contentType, request.sizeBytes, profile)

        // The row id is part of the storage key, so it is allocated before
        // the insert; idempotentInsertAndGet keeps the explicit id.
        const uploadId = newRowIdForTable(uploadsTable)
        const newUpload = uploadInsertSchema.parse({
            userId: request.userId ?? null,
            storageKey: `uploads/${uploadId}`,
            contentType,
            sizeBytes: request.sizeBytes,
            visibility: request.visibility,
            status: "PENDING",
            profile,
        })
        const upload = await idempotentInsertAndGet(
            storageDb,
            uploadsTable,
            { ...newUpload, id: uploadId },
            request.idempotencyKey,
        )

        if (storageMode() === "local") {
            const token = await mintStorageToken(
                { uploadId: upload.id, scope: "upload" },
                storageConfig.uploadUrlTtlSeconds,
            )
            return {
                upload,
                uploadUrl: `/upload?token=${encodeURIComponent(token)}`,
                headers: { "Content-Type": upload.contentType },
            }
        }

        const slot = await getStorageWrapper().createSignedUploadUrl({
            bucket: requiredBucket(),
            key: bucketKey(upload.storageKey),
            contentType: upload.contentType,
            expiresInSeconds: storageConfig.uploadUrlTtlSeconds,
        })
        return { upload, uploadUrl: slot.url, headers: slot.headers }
    }

    /**
     * The server-side write path: files inline bytes in one call, with no
     * client round-trip. The bytes pass the same admission validation as a
     * browser upload (allowlist + size cap), land in the same storage
     * backend (local disk or the provisioned bucket), and the row flips to
     * READY through the same finalize verification — the record is
     * indistinguishable from a browser-filed upload downstream.
     *
     * Idempotent: replaying the idempotency key returns the original row;
     * a key left PENDING by an interrupted first call is completed by the
     * retry.
     */
    async writeFile(request: WriteFileRequest): Promise<Upload> {
        const bytes = decodeBase64Bytes(request.bytesBase64)
        // Always the DEFAULT profile: the bytes ride the GraphQL JSON body,
        // whose limit derives from the DEFAULT cap (see GraphqlServer.ts).
        const contentType = assertUploadAdmission(request.contentType, bytes.length, "DEFAULT")

        const uploadId = newRowIdForTable(uploadsTable)
        const newUpload = uploadInsertSchema.parse({
            userId: request.userId ?? null,
            storageKey: `uploads/${uploadId}`,
            contentType,
            sizeBytes: bytes.length,
            visibility: request.visibility,
            fileName: request.fileName ?? null,
            status: "PENDING",
            profile: "DEFAULT",
        })
        const upload = await idempotentInsertAndGet(
            storageDb,
            uploadsTable,
            { ...newUpload, id: uploadId },
            request.idempotencyKey,
        )
        if (upload.status === "READY") {
            return upload
        }

        if (storageMode() === "local") {
            await writeLocalObject(upload.storageKey, bytes)
        } else {
            await getStorageWrapper().uploadObject({
                bucket: requiredBucket(),
                key: bucketKey(upload.storageKey),
                contentType: upload.contentType,
                bytes,
            })
        }
        return await this.finalizeUpload({ userId: request.userId, uploadId: upload.id })
    }

    /**
     * Verifies the bytes arrived (local: the storage function wrote them;
     * gcs: the object exists in the bucket), records the actual size, and
     * flips the row to READY. Idempotent: finalizing a READY row returns it
     * unchanged. Only the creator may finalize.
     */
    async finalizeUpload(request: { userId: string | undefined; uploadId: string }): Promise<Upload> {
        const upload = await getRowByIdOrThrow(storageDb, uploadsTable, request.uploadId)
        assertOwner(upload, request.userId, "finalize")
        if (upload.status === "READY") {
            return upload
        }

        let actualSizeBytes: number
        if (storageMode() === "local") {
            const stat = statLocalObject(upload.storageKey)
            if (stat === undefined) {
                throw new RpcError("FAILED_PRECONDITION", "No bytes have been uploaded for this upload yet.")
            }
            actualSizeBytes = stat.sizeBytes
        } else {
            const metadata = await getStorageWrapper().getObjectMetadata(
                requiredBucket(),
                bucketKey(upload.storageKey),
            )
            if (metadata === undefined) {
                throw new RpcError("FAILED_PRECONDITION", "No bytes have been uploaded for this upload yet.")
            }
            actualSizeBytes = metadata.sizeBytes
        }
        const profileCap = uploadProfileConfig(upload.profile).maxSizeBytes
        if (actualSizeBytes > profileCap) {
            throw new RpcError(
                "INVALID_ARGUMENT",
                `The uploaded object is ${actualSizeBytes} bytes, exceeding the maximum of ` +
                    `${profileCap} bytes.`,
            )
        }

        return await updateRowReturning(
            storageDb,
            uploadsTable,
            upload.id,
            uploadUpdateSchema.parse({ status: "READY", sizeBytes: actualSizeBytes }),
        )
    }

    /**
     * Resolves the download URL for a READY upload. PUBLIC files get the
     * stable serving URL (/file/<id> on the storage function) in both modes.
     * PRIVATE files are owner-checked and get a short-lived URL: a V4 signed
     * GCS URL in gcs mode, a token-guarded /file URL in local mode.
     */
    async resolveFileUrl(request: { userId: string | undefined; uploadId: string }): Promise<string> {
        const upload = await getRowByIdOrThrow(storageDb, uploadsTable, request.uploadId)
        return await this.resolveUrlForUpload(upload, request.userId)
    }

    /**
     * The URL resolution behind resolveFileUrl, for callers that already
     * hold the row (e.g. the drive resolvers hydrating a listing) — same
     * owner check, same per-visibility URL shapes, no refetch.
     */
    async resolveUrlForUpload(upload: Upload, actingUserId: string | undefined): Promise<string> {
        if (upload.status !== "READY") {
            throw new RpcError("FAILED_PRECONDITION", "This upload has not been finalized yet.")
        }
        if (upload.visibility === "PUBLIC") {
            return publicFilePath(upload.id)
        }

        assertOwner(upload, actingUserId, "download")
        if (storageMode() === "local") {
            const token = await mintStorageToken(
                { uploadId: upload.id, scope: "download" },
                storageConfig.downloadUrlTtlSeconds,
            )
            return `${publicFilePath(upload.id)}?token=${encodeURIComponent(token)}`
        }
        return await getStorageWrapper().createSignedDownloadUrl({
            bucket: requiredBucket(),
            key: bucketKey(upload.storageKey),
            expiresInSeconds: storageConfig.downloadUrlTtlSeconds,
        })
    }

    /**
     * Flips a READY upload between PUBLIC and PRIVATE (owner-only). This is
     * the share-link seam: PUBLIC files serve freely from the stable
     * /file/<id> URL, so sharing is exactly a visibility flip — and
     * un-sharing revokes the link just as cheaply. Idempotent.
     */
    async setUploadVisibility(request: {
        userId: string | undefined
        uploadId: string
        visibility: UploadVisibility
    }): Promise<Upload> {
        const upload = await getRowByIdOrThrow(storageDb, uploadsTable, request.uploadId)
        assertOwner(upload, request.userId, "share")
        if (upload.status !== "READY") {
            throw new RpcError("FAILED_PRECONDITION", "This upload has not been finalized yet.")
        }
        if (upload.visibility === request.visibility) {
            return upload
        }
        return await updateRowReturning(
            storageDb,
            uploadsTable,
            upload.id,
            uploadUpdateSchema.parse({ visibility: request.visibility }),
        )
    }

    /**
     * The server-side read path: an upload's bytes for domain services that
     * process file contents (document intake, spreadsheet import). Owner-
     * checked like a PRIVATE download — services acting for another user
     * (e.g. an advisor reading a client's file) must authorize that
     * relationship themselves and pass the owner's id.
     */
    async readFileBytes(request: { userId: string | undefined; uploadId: string }): Promise<{
        upload: Upload
        bytes: Buffer
    }> {
        const upload = await getRowByIdOrThrow(storageDb, uploadsTable, request.uploadId)
        if (upload.status !== "READY") {
            throw new RpcError("FAILED_PRECONDITION", "This upload has not been finalized yet.")
        }
        if (upload.visibility !== "PUBLIC") {
            assertOwner(upload, request.userId, "read")
        }

        const bytes =
            storageMode() === "local"
                ? await readLocalObject(upload.storageKey)
                : await getStorageWrapper().downloadObject(requiredBucket(), bucketKey(upload.storageKey))
        if (bytes === undefined) {
            throw new RpcError("FAILED_PRECONDITION", "The stored object for this upload is missing.")
        }
        return { upload, bytes }
    }

    /**
     * Deletes the stored object and the row. Owner-checked; deleting an
     * already-deleted upload throws NOT_FOUND (the row is gone).
     */
    async deleteUpload(request: { userId: string | undefined; uploadId: string }): Promise<void> {
        const upload = await getRowByIdOrThrow(storageDb, uploadsTable, request.uploadId)
        assertOwner(upload, request.userId, "delete")

        if (storageMode() === "local") {
            deleteLocalObject(upload.storageKey)
        } else {
            await getStorageWrapper().deleteObject(requiredBucket(), bucketKey(upload.storageKey))
        }
        await storageDb.delete(uploadsTable).where(eq(uploadsTable.id, upload.id))
    }

    /**
     * Local-mode ingest, called by the storage function's PUT /upload after
     * it verified the upload-scoped token: validates the bytes against the
     * declared slot, writes them to disk, and finalizes the row.
     */
    async receiveLocalUploadBytes(request: {
        token: string
        contentType: string | undefined
        bytes: Buffer
    }): Promise<Upload> {
        if (storageMode() !== "local") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "Direct uploads to the storage function only exist when STORAGE_MODE=local. " +
                    "In gcs mode clients PUT to the signed GCS URL instead.",
            )
        }
        const claims = await verifyStorageToken(request.token)
        if (claims.scope !== "upload") {
            throw new RpcError("PERMISSION_DENIED", "This token cannot upload.")
        }
        const upload = await getRowByIdOrThrow(storageDb, uploadsTable, claims.uploadId)
        if (upload.status === "READY") {
            return upload
        }
        const contentType = request.contentType?.trim().toLowerCase()
        if (contentType !== undefined && contentType !== "" && contentType !== upload.contentType) {
            throw new RpcError(
                "INVALID_ARGUMENT",
                `Content type "${contentType}" does not match the declared "${upload.contentType}".`,
            )
        }
        if (request.bytes.length === 0) {
            throw new RpcError("INVALID_ARGUMENT", "The upload body is empty.")
        }
        const profileCap = uploadProfileConfig(upload.profile).maxSizeBytes
        if (request.bytes.length > profileCap) {
            throw new RpcError(
                "INVALID_ARGUMENT",
                `The upload is ${request.bytes.length} bytes, exceeding the maximum of ` +
                    `${profileCap} bytes.`,
            )
        }

        await writeLocalObject(upload.storageKey, request.bytes)
        return await updateRowReturning(
            storageDb,
            uploadsTable,
            upload.id,
            uploadUpdateSchema.parse({ status: "READY", sizeBytes: request.bytes.length }),
        )
    }

    /**
     * Serving decision for GET /file/<id> on the storage function. READY
     * PUBLIC files serve freely; PRIVATE files require a download-scoped
     * token for this exact upload. Local mode serves the bytes from disk;
     * gcs mode redirects to a fresh short-lived signed URL.
     */
    async resolveServing(request: { uploadId: string; token: string | undefined }): Promise<ServingPlan> {
        const [upload] = await storageDb
            .select()
            .from(uploadsTable)
            .where(eq(uploadsTable.id, request.uploadId))
        if (upload === undefined || upload.status !== "READY") {
            throw new RpcError("NOT_FOUND", "There is no file to serve for this id.")
        }
        if (upload.visibility === "PRIVATE") {
            if (request.token === undefined) {
                throw new RpcError("PERMISSION_DENIED", "This file is private.")
            }
            const claims = await verifyStorageToken(request.token)
            if (claims.scope !== "download" || claims.uploadId !== upload.id) {
                throw new RpcError("PERMISSION_DENIED", "This token cannot download this file.")
            }
        }

        if (storageMode() === "local") {
            return { kind: "local", upload }
        }
        const redirectUrl = await getStorageWrapper().createSignedDownloadUrl({
            bucket: requiredBucket(),
            key: bucketKey(upload.storageKey),
            expiresInSeconds: storageConfig.downloadUrlTtlSeconds,
        })
        return { kind: "redirect", redirectUrl }
    }

    async getUpload(uploadId: string): Promise<Upload> {
        return await getRowByIdOrThrow(storageDb, uploadsTable, uploadId)
    }

    /** Batch load for the request context's upload dataloader. */
    async orderedBatchLoadUploadsByIds(ids: readonly string[]): Promise<(Upload | RpcError)[]> {
        return await orderedBatchLoadRowsByIds(storageDb, uploadsTable, ids)
    }
}

/**
 * Owner check shared by finalize/private-download/delete: the acting user
 * must be the upload's owner. Uploads created without an application user
 * (userId null) are only manageable by principals that also carry none —
 * the test harness case — never by a different signed-in user.
 */
function assertOwner(upload: Upload, actingUserId: string | undefined, action: string): void {
    if (upload.userId !== (actingUserId ?? null)) {
        throw new RpcError("PERMISSION_DENIED", `Only the upload's owner may ${action} it.`)
    }
}

/**
 * Admission validation shared by createUpload and writeFile: the content
 * type must be on the requested profile's allowlist and the size within its
 * cap (StorageConfig.ts). Returns the normalized content type.
 * (finalizeUpload and the local-mode ingest re-check arriving bytes on
 * their own, against the profile recorded on the row — that is verification
 * of a previous admission, not admission itself.)
 */
function assertUploadAdmission(contentType: string, sizeBytes: number, profile: UploadProfile): string {
    const rules = uploadProfileConfig(profile)
    const normalized = contentType.trim().toLowerCase()
    if (!rules.allowedContentTypes.includes(normalized)) {
        throw new RpcError(
            "INVALID_ARGUMENT",
            `Content type "${normalized}" is not allowed. Allowed types: ` +
                rules.allowedContentTypes.join(", "),
        )
    }
    if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
        throw new RpcError("INVALID_ARGUMENT", "sizeBytes must be a positive integer.")
    }
    if (sizeBytes > rules.maxSizeBytes) {
        throw new RpcError(
            "INVALID_ARGUMENT",
            `The size ${sizeBytes} exceeds the maximum of ${rules.maxSizeBytes} bytes.`,
        )
    }
    return normalized
}

/**
 * Strict base64 decode for writeFile: Buffer.from tolerates invalid
 * characters and sloppy padding, so a re-encode round-trip is the strict
 * check — only canonical base64 survives it. (A regex over the whole
 * payload overflows the regex engine's stack at the kernel's size cap.)
 */
function decodeBase64Bytes(bytesBase64: string): Buffer {
    const bytes = Buffer.from(bytesBase64, "base64")
    if (bytes.length > 0 && bytes.toString("base64") !== bytesBase64) {
        throw new RpcError("INVALID_ARGUMENT", "bytesBase64 is not valid base64.")
    }
    return bytes
}

/** The stable serving path for a PUBLIC file, relative to the storage endpoint. */
function publicFilePath(uploadId: string): string {
    return `/file/${uploadId}`
}

function storageMode(): "local" | "gcs" {
    return validatedEnv().STORAGE_MODE
}

function requiredBucket(): string {
    const bucket = validatedEnv().STORAGE_BUCKET
    if (bucket === undefined || bucket === "") {
        throw new RpcError(
            "FAILED_PRECONDITION",
            "STORAGE_BUCKET is not set; it is required when STORAGE_MODE=gcs. " +
                "Deploys with the STORAGE capability receive it from the platform.",
        )
    }
    return bucket
}

/** Full object key inside the bucket: STORAGE_PREFIX (normalized) + storage key. */
function bucketKey(storageKey: string): string {
    const prefix = validatedEnv().STORAGE_PREFIX
    if (prefix === undefined || prefix === "") {
        return storageKey
    }
    return prefix.endsWith("/") ? `${prefix}${storageKey}` : `${prefix}/${storageKey}`
}

export const storageService = new StorageService()

export interface CreateUploadRequest {
    idempotencyKey: string
    /** The authenticated owner; undefined for principals without a user row. */
    userId: string | undefined
    contentType: string
    /** The declared size; the actual byte count is recorded at finalize. */
    sizeBytes: number
    visibility: UploadVisibility
    /** The admission profile (StorageConfig.ts); DEFAULT when omitted. */
    profile?: UploadProfile
}

export interface WriteFileRequest {
    idempotencyKey: string
    /** The authenticated owner; undefined for principals without a user row. */
    userId: string | undefined
    contentType: string
    /** The file bytes, base64-encoded; the decoded length is the admitted size. */
    bytesBase64: string
    visibility: UploadVisibility
    /** Optional download-friendly name recorded on the row. */
    fileName?: string
}

export interface UploadSlot {
    upload: Upload
    /**
     * Where the client PUTs the bytes: an absolute V4 signed GCS URL in gcs
     * mode, or a "/upload?token=..." path on the storage function in local
     * mode (resolved client-side against the derived storage endpoint).
     */
    uploadUrl: string
    /** Headers the client must send verbatim on the PUT. */
    headers: Record<string, string>
}

export type ServingPlan = { kind: "local"; upload: Upload } | { kind: "redirect"; redirectUrl: string }
