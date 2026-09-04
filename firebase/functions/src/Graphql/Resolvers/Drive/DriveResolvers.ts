import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { DriveEntryKind } from "../../../Data/Drive/DriveEntry.js"
import { driveService } from "../../../Services/Drive/index.js"
import { storageService } from "../../../Services/Storage/StorageService.js"

// Every Drive operation is authenticated by the execution-level gate in
// GraphqlServer.ts (layer 1 of docs/authorization.md): none of these root
// fields are in the public sets. Ownership (layer 2) is re-checked in the
// service on every read and write — the acting user id always comes from
// the principal, never from client input.
export const driveResolvers: GqlResolvers = {
    Query: {
        driveEntries: async (_parent, { input }, context) => {
            return await driveService.listEntries({
                userId: context.principal?.userId,
                connection: input.connection,
                filters:
                    input.filters == null
                        ? null
                        : {
                              ...input.filters,
                              kind: input.filters.kind as DriveEntryKind | null | undefined,
                          },
            })
        },

        driveEntry: async (_parent, { id }, context) => {
            return await driveService.getEntryByIdOrThrow(context.principal?.userId, id)
        },

        driveAlbums: async (_parent, _args, context) => {
            return await driveService.listAlbums(context.principal?.userId)
        },

        driveAlbum: async (_parent, { albumId }, context) => {
            return await driveService.getAlbumByIdOrThrow(context.principal?.userId, albumId)
        },
    },

    Mutation: {
        createDriveFolder: async (_parent, { input }, context) => {
            return await driveService.createFolder({
                userId: context.principal?.userId,
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        registerDriveFile: async (_parent, { input }, context) => {
            return await driveService.registerFile({
                userId: context.principal?.userId,
                idempotencyKey: input.idempotencyKey,
                fields: {
                    ...input.fields,
                    capturedTime:
                        input.fields.capturedTime == null ? null : new Date(input.fields.capturedTime),
                },
            })
        },

        renameDriveEntry: async (_parent, { input }, context) => {
            return await driveService.renameEntry({
                userId: context.principal?.userId,
                objectId: input.objectId,
                name: input.name,
            })
        },

        moveDriveEntry: async (_parent, { input }, context) => {
            return await driveService.moveEntry({
                userId: context.principal?.userId,
                objectId: input.objectId,
                parentId: input.parentId ?? null,
            })
        },

        trashDriveEntry: async (_parent, { input }, context) => {
            return await driveService.trashEntry({
                userId: context.principal?.userId,
                objectId: input.objectId,
            })
        },

        restoreDriveEntry: async (_parent, { input }, context) => {
            return await driveService.restoreEntry({
                userId: context.principal?.userId,
                objectId: input.objectId,
            })
        },

        deleteDriveEntry: async (_parent, { input }, context) => {
            await driveService.deleteEntry({
                userId: context.principal?.userId,
                objectId: input.objectId,
            })
            return true
        },

        setDriveEntryStarred: async (_parent, { input }, context) => {
            return await driveService.setEntryStarred({
                userId: context.principal?.userId,
                objectId: input.objectId,
                starred: input.starred,
            })
        },

        setDriveEntryCaption: async (_parent, { input }, context) => {
            return await driveService.setEntryCaption({
                userId: context.principal?.userId,
                objectId: input.objectId,
                caption: input.caption ?? null,
            })
        },

        replaceDriveEntryMedia: async (_parent, { input }, context) => {
            return await driveService.replaceEntryMedia({
                userId: context.principal?.userId,
                objectId: input.objectId,
                uploadId: input.uploadId,
                thumbUploadId: input.thumbUploadId ?? null,
            })
        },

        shareDriveEntry: async (_parent, { input }, context) => {
            return await driveService.setEntryShared({
                userId: context.principal?.userId,
                objectId: input.objectId,
                shared: input.shared,
            })
        },

        createDriveAlbum: async (_parent, { input }, context) => {
            return await driveService.createAlbum({
                userId: context.principal?.userId,
                idempotencyKey: input.idempotencyKey,
                name: input.fields.name,
            })
        },

        renameDriveAlbum: async (_parent, { input }, context) => {
            return await driveService.renameAlbum({
                userId: context.principal?.userId,
                objectId: input.objectId,
                name: input.name,
            })
        },

        deleteDriveAlbum: async (_parent, { input }, context) => {
            await driveService.deleteAlbum({
                userId: context.principal?.userId,
                objectId: input.objectId,
            })
            return true
        },

        addDriveAlbumEntry: async (_parent, { input }, context) => {
            return await driveService.addAlbumEntry({
                userId: context.principal?.userId,
                idempotencyKey: input.idempotencyKey,
                albumId: input.albumId,
                entryId: input.entryId,
            })
        },

        removeDriveAlbumEntry: async (_parent, { input }, context) => {
            await driveService.removeAlbumEntry({
                userId: context.principal?.userId,
                albumId: input.albumId,
                entryId: input.entryId,
            })
            return true
        },

        clearDriveLibrary: async (_parent, _args, context) => {
            await driveService.clearLibrary(context.principal?.userId)
            return true
        },
    },

    DriveEntry: {
        parentId: (entry) => entry.parentId ?? undefined,
        trashedTime: (entry) => entry.trashedAt ?? undefined,
        capturedTime: (entry) => entry.capturedAt ?? undefined,
        caption: (entry) => entry.caption ?? undefined,
        uploadId: (entry) => entry.uploadId ?? undefined,
        thumbUploadId: (entry) => entry.thumbUploadId ?? undefined,
        createdTime: (entry) => entry.rowCreatedAt,
        updatedTime: (entry) => entry.rowUpdatedAt,

        // Upload-derived fields hydrate through the request's upload
        // dataloader, so a listing costs one batched uploads query. URL
        // resolution reuses the storage kernel's owner-checked logic.
        contentType: async (entry, _args, context) => {
            if (entry.uploadId === null) {
                return undefined
            }
            const upload = await context.uploadDataloader.load(entry.uploadId)
            return upload.contentType
        },

        sizeBytes: async (entry, _args, context) => {
            if (entry.uploadId === null) {
                return undefined
            }
            const upload = await context.uploadDataloader.load(entry.uploadId)
            return upload.sizeBytes
        },

        fileUrl: async (entry, _args, context) => {
            if (entry.uploadId === null) {
                return undefined
            }
            const upload = await context.uploadDataloader.load(entry.uploadId)
            return await storageService.resolveUrlForUpload(upload, context.principal?.userId)
        },

        thumbUrl: async (entry, _args, context) => {
            if (entry.thumbUploadId === null) {
                return undefined
            }
            const upload = await context.uploadDataloader.load(entry.thumbUploadId)
            return await storageService.resolveUrlForUpload(upload, context.principal?.userId)
        },

        shared: async (entry, _args, context) => {
            if (entry.uploadId === null) {
                return false
            }
            const upload = await context.uploadDataloader.load(entry.uploadId)
            return upload.visibility === "PUBLIC"
        },
    },

    DriveAlbum: {
        entryCount: async (album) => {
            const counts = await driveService.countAlbumEntries([album.id])
            return counts.get(album.id) ?? 0
        },
        createdTime: (album) => album.rowCreatedAt,
        updatedTime: (album) => album.rowUpdatedAt,
    },
}
