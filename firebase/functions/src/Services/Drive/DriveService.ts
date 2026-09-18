import { and, asc, eq, inArray, isNull, SQL, sql } from "drizzle-orm"
import {
    driveAlbumEntriesTable,
    driveAlbumEntryInsertSchema,
    driveAlbumInsertSchema,
    driveAlbumsTable,
    driveAlbumUpdateSchema,
    DriveAlbum,
} from "../../Data/Drive/DriveAlbum.js"
import {
    DriveEntry,
    driveEntriesTable,
    driveEntryInsertSchema,
    DriveEntryKind,
    driveEntryUpdateSchema,
} from "../../Data/Drive/DriveEntry.js"
import {
    countAlbumEntries,
    driveAlbumOwnerCondition,
    driveDb,
    driveEntryInAlbumCondition,
    driveEntrySearchCondition,
    driveOwnerCondition,
    listSubtreeEntryIds,
} from "../../Data/DriveDatabase.js"
import {
    ConnectionParameters,
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    listRows,
    ListRowsResult,
    updateRowReturning,
} from "../../Data/Utils/index.js"
import { RpcError } from "../../Utils/RpcError.js"
import { storageService } from "../Storage/StorageService.js"

/**
 * The drive domain: an owner-scoped file tree and photo library over the
 * storage kernel. Entries never carry bytes — FILE entries bind a finalized
 * upload the browser already PUT through the kernel (create/PUT/finalize),
 * and this service owns the tree around it: folders, naming, starring,
 * trash, capture metadata, albums, and the share flip (the underlying
 * upload's PUBLIC/PRIVATE visibility).
 *
 * Every method takes the acting user id from the authenticated principal
 * and scopes reads and writes to rows whose userId matches — the storage
 * kernel's assertOwner semantics: rows created by a principal without an
 * application user (userId null) are only reachable by such principals.
 */
class DriveService {
    async listEntries(request: ListDriveEntriesRequest): Promise<ListRowsResult<DriveEntry>> {
        const filters = request.filters ?? {}
        const conditions: (SQL | undefined)[] = [driveOwnerCondition(request.userId)]

        // Trash is a view, not a place: normal listings exclude trashed
        // rows, and the trash listing shows only them.
        conditions.push(
            filters.inTrash === true
                ? sql`${driveEntriesTable.trashedAt} IS NOT NULL`
                : isNull(driveEntriesTable.trashedAt),
        )

        if (filters.folderId != null) {
            conditions.push(eq(driveEntriesTable.parentId, filters.folderId))
        } else if (filters.rootOnly === true) {
            conditions.push(isNull(driveEntriesTable.parentId))
        }
        const search = filters.search?.trim()
        if (search != null && search.length > 0) {
            conditions.push(driveEntrySearchCondition(search))
        }
        if (filters.kind != null) {
            conditions.push(eq(driveEntriesTable.kind, filters.kind))
        }
        if (filters.starred === true) {
            conditions.push(eq(driveEntriesTable.starred, true))
        }
        if (filters.albumId != null) {
            await this.getAlbumByIdOrThrow(request.userId, filters.albumId)
            conditions.push(driveEntryInAlbumCondition(filters.albumId))
        }

        return await listRows(driveDb, driveEntriesTable, request.connection, {
            filters: conditions,
            sortColumnKeys: ["name", "kind", "starred", "capturedAt", "trashedAt", "rowCreatedAt"],
        })
    }

    async getEntryByIdOrThrow(userId: string | undefined, entryId: string): Promise<DriveEntry> {
        const entry = await getRowByIdOrThrow(driveDb, driveEntriesTable, entryId)
        assertEntryOwner(entry, userId)
        return entry
    }

    async createFolder(request: CreateDriveFolderRequest): Promise<DriveEntry> {
        if (request.fields.parentId != null) {
            await this.assertUsableFolder(request.userId, request.fields.parentId)
        }
        const newFolder = driveEntryInsertSchema.parse({
            userId: request.userId ?? null,
            uploadId: null,
            parentId: request.fields.parentId ?? null,
            name: request.fields.name,
            kind: "FOLDER",
        })
        return await idempotentInsertAndGet(driveDb, driveEntriesTable, newFolder, request.idempotencyKey)
    }

    /**
     * Binds a finalized upload into the tree as a FILE entry. The upload
     * must be READY, owned by the caller, and not already registered (one
     * entry per upload — the unique constraint backs this). The optional
     * photo fields (capture time, caption, thumbnail upload) are recorded
     * as given; the thumbnail must also be a READY upload of the caller's.
     */
    async registerFile(request: RegisterDriveFileRequest): Promise<DriveEntry> {
        if (request.fields.parentId != null) {
            await this.assertUsableFolder(request.userId, request.fields.parentId)
        }
        await this.assertOwnedReadyUpload(request.userId, request.fields.uploadId, "register")
        await this.assertUploadUnregistered(request.fields.uploadId)
        if (request.fields.thumbUploadId != null) {
            await this.assertOwnedReadyUpload(request.userId, request.fields.thumbUploadId, "register")
        }

        const newFile = driveEntryInsertSchema.parse({
            userId: request.userId ?? null,
            uploadId: request.fields.uploadId,
            parentId: request.fields.parentId ?? null,
            name: request.fields.name,
            kind: "FILE",
            capturedAt: request.fields.capturedTime ?? null,
            caption: request.fields.caption ?? null,
            thumbUploadId: request.fields.thumbUploadId ?? null,
        })
        try {
            return await idempotentInsertAndGet(driveDb, driveEntriesTable, newFile, request.idempotencyKey)
        } catch (error) {
            throw remapUploadConflict(error)
        }
    }

    async renameEntry(request: {
        userId: string | undefined
        objectId: string
        name: string
    }): Promise<DriveEntry> {
        await this.getEntryByIdOrThrow(request.userId, request.objectId)
        return await updateRowReturning(
            driveDb,
            driveEntriesTable,
            request.objectId,
            driveEntryUpdateSchema.parse({ name: request.name }),
        )
    }

    /**
     * Reparents an entry (null moves it to the root). The destination must
     * be one of the caller's usable folders, and moving a folder into its
     * own subtree is refused — that would detach the cycle from the root.
     */
    async moveEntry(request: {
        userId: string | undefined
        objectId: string
        parentId: string | null
    }): Promise<DriveEntry> {
        const entry = await this.getEntryByIdOrThrow(request.userId, request.objectId)
        if (request.parentId != null) {
            await this.assertUsableFolder(request.userId, request.parentId)
            if (entry.kind === "FOLDER") {
                const subtreeIds = await listSubtreeEntryIds(entry.id)
                if (subtreeIds.includes(request.parentId)) {
                    throw new RpcError(
                        "INVALID_ARGUMENT",
                        "A folder cannot be moved into itself or one of its subfolders.",
                    )
                }
            }
        }
        return await updateRowReturning(driveDb, driveEntriesTable, entry.id, {
            parentId: request.parentId,
        })
    }

    /** Moves an entry (and, for folders, its whole subtree) to the trash. */
    async trashEntry(request: { userId: string | undefined; objectId: string }): Promise<DriveEntry> {
        const entry = await this.getEntryByIdOrThrow(request.userId, request.objectId)
        const subtreeIds = await listSubtreeEntryIds(entry.id)
        await driveDb
            .update(driveEntriesTable)
            .set({ trashedAt: new Date() })
            .where(and(inArray(driveEntriesTable.id, subtreeIds), isNull(driveEntriesTable.trashedAt)))
        return await getRowByIdOrThrow(driveDb, driveEntriesTable, entry.id)
    }

    /**
     * Restores an entry (and its subtree) from the trash. When the original
     * parent is itself trashed or gone, the entry surfaces at the root so a
     * restore never lands in an invisible place.
     */
    async restoreEntry(request: { userId: string | undefined; objectId: string }): Promise<DriveEntry> {
        const entry = await this.getEntryByIdOrThrow(request.userId, request.objectId)
        const subtreeIds = await listSubtreeEntryIds(entry.id)
        await driveDb
            .update(driveEntriesTable)
            .set({ trashedAt: null })
            .where(inArray(driveEntriesTable.id, subtreeIds))

        let parentId = entry.parentId
        if (parentId !== null) {
            const [parent] = await driveDb
                .select()
                .from(driveEntriesTable)
                .where(eq(driveEntriesTable.id, parentId))
            if (parent === undefined || parent.trashedAt !== null) {
                parentId = null
            }
        }
        return await updateRowReturning(driveDb, driveEntriesTable, entry.id, { parentId })
    }

    /**
     * Permanently deletes an entry and, for folders, everything beneath it:
     * memberships first, then the rows, then the stored objects (and their
     * thumbnails) through the storage kernel. Object deletion is best
     * effort last — a failed bucket delete leaves an orphaned object, never
     * a dangling entry.
     */
    async deleteEntry(request: { userId: string | undefined; objectId: string }): Promise<void> {
        const entry = await this.getEntryByIdOrThrow(request.userId, request.objectId)
        const subtreeIds = await listSubtreeEntryIds(entry.id)
        const rows = await driveDb
            .select()
            .from(driveEntriesTable)
            .where(inArray(driveEntriesTable.id, subtreeIds))

        await driveDb
            .delete(driveAlbumEntriesTable)
            .where(inArray(driveAlbumEntriesTable.entryId, subtreeIds))
        await driveDb.delete(driveEntriesTable).where(inArray(driveEntriesTable.id, subtreeIds))

        for (const row of rows) {
            for (const uploadId of [row.uploadId, row.thumbUploadId]) {
                if (uploadId === null) {
                    continue
                }
                await storageService.deleteUpload({ userId: request.userId, uploadId }).catch(() => undefined)
            }
        }
    }

    async setEntryStarred(request: {
        userId: string | undefined
        objectId: string
        starred: boolean
    }): Promise<DriveEntry> {
        await this.getEntryByIdOrThrow(request.userId, request.objectId)
        return await updateRowReturning(
            driveDb,
            driveEntriesTable,
            request.objectId,
            driveEntryUpdateSchema.parse({ starred: request.starred }),
        )
    }

    async setEntryCaption(request: {
        userId: string | undefined
        objectId: string
        caption: string | null
    }): Promise<DriveEntry> {
        await this.getEntryByIdOrThrow(request.userId, request.objectId)
        const caption =
            request.caption === null
                ? null
                : driveEntryUpdateSchema.parse({ caption: request.caption }).caption
        return await updateRowReturning(driveDb, driveEntriesTable, request.objectId, { caption })
    }

    /**
     * Swaps a FILE entry's media for freshly filed uploads (the photo
     * pack's rotate: the client re-encodes, files new bytes through the
     * kernel, and rebinds here). The replaced uploads are deleted best
     * effort so rotated originals don't accumulate.
     */
    async replaceEntryMedia(request: ReplaceDriveEntryMediaRequest): Promise<DriveEntry> {
        const entry = await this.getEntryByIdOrThrow(request.userId, request.objectId)
        if (entry.kind !== "FILE") {
            throw new RpcError("INVALID_ARGUMENT", "Only files carry media to replace.")
        }
        await this.assertOwnedReadyUpload(request.userId, request.uploadId, "bind")
        if (request.uploadId !== entry.uploadId) {
            await this.assertUploadUnregistered(request.uploadId)
        }
        if (request.thumbUploadId != null) {
            await this.assertOwnedReadyUpload(request.userId, request.thumbUploadId, "bind")
        }

        const previousUploadId = entry.uploadId
        const previousThumbUploadId = entry.thumbUploadId
        let updated: DriveEntry
        try {
            updated = await updateRowReturning(driveDb, driveEntriesTable, entry.id, {
                uploadId: request.uploadId,
                thumbUploadId: request.thumbUploadId ?? null,
            })
        } catch (error) {
            throw remapUploadConflict(error)
        }

        for (const uploadId of [previousUploadId, previousThumbUploadId]) {
            if (uploadId === null || uploadId === request.uploadId || uploadId === request.thumbUploadId) {
                continue
            }
            await storageService.deleteUpload({ userId: request.userId, uploadId }).catch(() => undefined)
        }
        return updated
    }

    /**
     * The share seam: flips the entry's underlying upload between PUBLIC
     * (anyone with the stable /file/<id> URL can read it) and PRIVATE
     * (owner-only, short-lived URLs). The thumbnail stays PRIVATE — shares
     * hand out the file, never the library's browsing artifacts.
     */
    async setEntryShared(request: {
        userId: string | undefined
        objectId: string
        shared: boolean
    }): Promise<DriveEntry> {
        const entry = await this.getEntryByIdOrThrow(request.userId, request.objectId)
        if (entry.kind !== "FILE" || entry.uploadId === null) {
            throw new RpcError("INVALID_ARGUMENT", "Only files can be shared.")
        }
        await storageService.setUploadVisibility({
            userId: request.userId,
            uploadId: entry.uploadId,
            visibility: request.shared ? "PUBLIC" : "PRIVATE",
        })
        return entry
    }

    //
    // Albums
    //

    async listAlbums(userId: string | undefined): Promise<DriveAlbum[]> {
        return await driveDb
            .select()
            .from(driveAlbumsTable)
            .where(driveAlbumOwnerCondition(userId))
            .orderBy(asc(driveAlbumsTable.name), asc(driveAlbumsTable.id))
    }

    async getAlbumByIdOrThrow(userId: string | undefined, albumId: string): Promise<DriveAlbum> {
        const album = await getRowByIdOrThrow(driveDb, driveAlbumsTable, albumId)
        if (album.userId !== (userId ?? null)) {
            throw new RpcError("PERMISSION_DENIED", "Only the album's owner may access it.")
        }
        return album
    }

    async createAlbum(request: {
        userId: string | undefined
        idempotencyKey: string
        name: string
    }): Promise<DriveAlbum> {
        const newAlbum = driveAlbumInsertSchema.parse({
            userId: request.userId ?? null,
            name: request.name,
        })
        return await idempotentInsertAndGet(driveDb, driveAlbumsTable, newAlbum, request.idempotencyKey)
    }

    async renameAlbum(request: {
        userId: string | undefined
        objectId: string
        name: string
    }): Promise<DriveAlbum> {
        await this.getAlbumByIdOrThrow(request.userId, request.objectId)
        return await updateRowReturning(
            driveDb,
            driveAlbumsTable,
            request.objectId,
            driveAlbumUpdateSchema.parse({ name: request.name }),
        )
    }

    /** Deletes the album and its memberships; the entries stay untouched. */
    async deleteAlbum(request: { userId: string | undefined; objectId: string }): Promise<void> {
        await this.getAlbumByIdOrThrow(request.userId, request.objectId)
        await driveDb
            .delete(driveAlbumEntriesTable)
            .where(eq(driveAlbumEntriesTable.albumId, request.objectId))
        await driveDb.delete(driveAlbumsTable).where(eq(driveAlbumsTable.id, request.objectId))
    }

    /** Adds an owned FILE entry to an owned album. Idempotent on the pair. */
    async addAlbumEntry(request: {
        userId: string | undefined
        idempotencyKey: string
        albumId: string
        entryId: string
    }): Promise<DriveAlbum> {
        const album = await this.getAlbumByIdOrThrow(request.userId, request.albumId)
        const entry = await this.getEntryByIdOrThrow(request.userId, request.entryId)
        if (entry.kind !== "FILE") {
            throw new RpcError("INVALID_ARGUMENT", "Folders cannot join albums; add files instead.")
        }
        // Already a member (unique pair): adding again is a no-op.
        const [existing] = await driveDb
            .select()
            .from(driveAlbumEntriesTable)
            .where(
                and(
                    eq(driveAlbumEntriesTable.albumId, album.id),
                    eq(driveAlbumEntriesTable.entryId, entry.id),
                ),
            )
        if (existing !== undefined) {
            return album
        }
        const membership = driveAlbumEntryInsertSchema.parse({
            albumId: album.id,
            entryId: entry.id,
        })
        await idempotentInsertAndGet(driveDb, driveAlbumEntriesTable, membership, request.idempotencyKey)
        return album
    }

    async removeAlbumEntry(request: {
        userId: string | undefined
        albumId: string
        entryId: string
    }): Promise<void> {
        await this.getAlbumByIdOrThrow(request.userId, request.albumId)
        await driveDb
            .delete(driveAlbumEntriesTable)
            .where(
                and(
                    eq(driveAlbumEntriesTable.albumId, request.albumId),
                    eq(driveAlbumEntriesTable.entryId, request.entryId),
                ),
            )
    }

    /** Album sizes for the shelf, in one grouped query. */
    async countAlbumEntries(albumIds: readonly string[]): Promise<Map<string, number>> {
        return await countAlbumEntries(albumIds)
    }

    /**
     * Empties the caller's whole library: every entry, album, membership,
     * and stored object. This is the "Clear demo library" action — and a
     * real account reset. Objects are deleted best effort after the rows.
     */
    async clearLibrary(userId: string | undefined): Promise<void> {
        const entries = await driveDb.select().from(driveEntriesTable).where(driveOwnerCondition(userId))
        const albums = await this.listAlbums(userId)

        if (albums.length > 0) {
            await driveDb.delete(driveAlbumEntriesTable).where(
                inArray(
                    driveAlbumEntriesTable.albumId,
                    albums.map((album) => album.id),
                ),
            )
            await driveDb.delete(driveAlbumsTable).where(
                inArray(
                    driveAlbumsTable.id,
                    albums.map((album) => album.id),
                ),
            )
        }
        if (entries.length > 0) {
            await driveDb.delete(driveEntriesTable).where(
                inArray(
                    driveEntriesTable.id,
                    entries.map((entry) => entry.id),
                ),
            )
        }
        for (const entry of entries) {
            for (const uploadId of [entry.uploadId, entry.thumbUploadId]) {
                if (uploadId === null) {
                    continue
                }
                await storageService.deleteUpload({ userId, uploadId }).catch(() => undefined)
            }
        }
    }

    /** The destination of a create/move: an owned, untrashed FOLDER. */
    private async assertUsableFolder(userId: string | undefined, folderId: string): Promise<DriveEntry> {
        const folder = await this.getEntryByIdOrThrow(userId, folderId)
        if (folder.kind !== "FOLDER") {
            throw new RpcError("INVALID_ARGUMENT", "The destination is a file, not a folder.")
        }
        if (folder.trashedAt !== null) {
            throw new RpcError("FAILED_PRECONDITION", "The destination folder is in the trash.")
        }
        return folder
    }

    /**
     * One entry per upload (drive_entries_upload_id_unique). The pre-check
     * gives the clean message; a concurrent insert still lands on the
     * constraint, which remapUploadConflict translates.
     */
    private async assertUploadUnregistered(uploadId: string): Promise<void> {
        const [taken] = await driveDb
            .select()
            .from(driveEntriesTable)
            .where(eq(driveEntriesTable.uploadId, uploadId))
        if (taken !== undefined) {
            throw new RpcError("INVALID_ARGUMENT", "This upload is already registered as a drive entry.")
        }
    }

    /** An upload a drive entry may bind: the caller's own, and READY. */
    private async assertOwnedReadyUpload(
        userId: string | undefined,
        uploadId: string,
        action: string,
    ): Promise<void> {
        const upload = await storageService.getUpload(uploadId)
        if (upload.userId !== (userId ?? null)) {
            throw new RpcError("PERMISSION_DENIED", `Only the upload's owner may ${action} it.`)
        }
        if (upload.status !== "READY") {
            throw new RpcError("FAILED_PRECONDITION", "The upload has not been finalized yet.")
        }
    }
}

function assertEntryOwner(entry: DriveEntry, actingUserId: string | undefined): void {
    if (entry.userId !== (actingUserId ?? null)) {
        throw new RpcError("PERMISSION_DENIED", "Only the entry's owner may access it.")
    }
}

/** The error's message joined with its cause chain's (drizzle wraps pg). */
function errorMessage(error: unknown): string {
    const parts: string[] = []
    let current: unknown = error
    while (current instanceof Error) {
        parts.push(current.message)
        current = current.cause
    }
    if (parts.length === 0) {
        parts.push(String(error))
    }
    return parts.join(" <- ")
}

function remapUploadConflict(error: unknown): Error {
    const message = errorMessage(error)
    if (message.includes("drive_entries_upload_id_unique")) {
        return new RpcError("INVALID_ARGUMENT", "This upload is already registered as a drive entry.")
    }
    return error instanceof Error ? error : new Error(message)
}

export const driveService = new DriveService()

export interface ListDriveEntriesRequest {
    userId: string | undefined
    connection: ConnectionParameters
    filters?: {
        /** Children of this folder. Overrides rootOnly. */
        folderId?: string | null
        /** When true (and no folderId), only entries at the library root. */
        rootOnly?: boolean | null
        /** Case-insensitive substring match across name and caption. */
        search?: string | null
        kind?: DriveEntryKind | null
        starred?: boolean | null
        /** True lists the trash; otherwise trashed entries are excluded. */
        inTrash?: boolean | null
        /** Entries that appear in this album (owner-checked). */
        albumId?: string | null
    } | null
}

export interface CreateDriveFolderRequest {
    userId: string | undefined
    idempotencyKey: string
    fields: {
        name: string
        parentId?: string | null
    }
}

export interface RegisterDriveFileRequest {
    userId: string | undefined
    idempotencyKey: string
    fields: {
        uploadId: string
        parentId?: string | null
        name: string
        capturedTime?: Date | null
        caption?: string | null
        thumbUploadId?: string | null
    }
}

export interface ReplaceDriveEntryMediaRequest {
    userId: string | undefined
    objectId: string
    uploadId: string
    thumbUploadId?: string | null
}
