import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { storageService } from "../../../Services/Storage/StorageService.js"
import { UploadProfile, UploadVisibility } from "../../../Data/Storage/Upload.js"

/**
 * Storage kernel resolvers. Every operation is authenticated (none appear in
 * the public allowlists in GraphqlServer.ts): files always have an
 * accountable principal behind them. Ownership is recorded from the
 * principal's application user and re-checked in the service on finalize,
 * private download, and delete — never trusted from client input.
 */
export const storageResolvers: GqlResolvers = {
    Query: {
        fileUrl: async (_parent, { uploadId }, context) => {
            const url = await storageService.resolveFileUrl({
                userId: context.principal?.userId,
                uploadId,
            })
            return { url }
        },
    },

    Mutation: {
        createUpload: async (_parent, { input }, context) => {
            const slot = await storageService.createUpload({
                idempotencyKey: input.idempotencyKey,
                userId: context.principal?.userId,
                contentType: input.fields.contentType,
                sizeBytes: input.fields.sizeBytes,
                visibility: input.fields.visibility as UploadVisibility,
                profile: (input.fields.profile ?? undefined) as UploadProfile | undefined,
            })
            return {
                uploadId: slot.upload.id,
                uploadUrl: slot.uploadUrl,
                headersJson: JSON.stringify(slot.headers),
                upload: slot.upload,
            }
        },

        finalizeUpload: async (_parent, { input }, context) => {
            return await storageService.finalizeUpload({
                userId: context.principal?.userId,
                uploadId: input.uploadId,
            })
        },

        writeFile: async (_parent, { input }, context) => {
            return await storageService.writeFile({
                idempotencyKey: input.idempotencyKey,
                userId: context.principal?.userId,
                contentType: input.fields.contentType,
                bytesBase64: input.fields.bytesBase64,
                visibility: input.fields.visibility as UploadVisibility,
                fileName: input.fields.fileName ?? undefined,
            })
        },

        deleteUpload: async (_parent, { input }, context) => {
            await storageService.deleteUpload({
                userId: context.principal?.userId,
                uploadId: input.uploadId,
            })
            return true
        },
    },

    Upload: {
        createdTime: (upload) => upload.rowCreatedAt,
    },
}
