import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { creditService } from "../../../Services/Credit/CreditService.js"
import { RpcError } from "../../../Utils/RpcError.js"
import { GraphqlRequestContext } from "../../GraphqlServer.js"

/** The authenticated application user behind the request, or UNAUTHENTICATED. */
function requireUserId(context: GraphqlRequestContext, action: string): string {
    const userId = context.principal?.userId
    if (userId === undefined) {
        throw new RpcError("UNAUTHENTICATED", `${action} requires an authenticated user.`)
    }
    return userId
}

export const creditResolvers: GqlResolvers = {
    Query: {
        creditLcs: async (_parent, _args, context) => {
            const userId = requireUserId(context, "Listing letters of credit")
            return await creditService.listLcs(userId)
        },

        creditLc: async (_parent, { lcId }, context) => {
            const userId = requireUserId(context, "Reading a letter of credit")
            return await creditService.getLc({ userId, lcId })
        },
    },

    Mutation: {
        creditIngestLc: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Ingesting a letter of credit")
            return await creditService.ingestLc({
                idempotencyKey: input.idempotencyKey,
                userId,
                uploadId: input.uploadId,
            })
        },

        creditAttachDocument: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Attaching a document")
            return await creditService.attachDocument({
                idempotencyKey: input.idempotencyKey,
                userId,
                lcId: input.lcId,
                uploadId: input.uploadId,
                fileName: input.fileName ?? undefined,
            })
        },

        creditRemoveDocument: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Removing a document")
            await creditService.removeDocument({ userId, documentId: input.documentId })
            return true
        },

        creditDeleteLc: async (_parent, { input }, context) => {
            const userId = requireUserId(context, "Deleting a letter of credit")
            await creditService.deleteLc({ userId, lcId: input.lcId })
            return true
        },
    },

    CreditLc: {
        documentsRequired: (lc) => (lc.documentsRequired === "" ? [] : lc.documentsRequired.split("\n")),
        ingestedTime: (lc) => lc.rowCreatedAt,
        // Documents and findings resolve lazily — the list view selects
        // neither and costs two queries total.
        documents: async (lc) => {
            return await creditService.listDocuments({ userId: lc.userId, lcId: lc.id })
        },
        findings: async (lc) => {
            return await creditService.checkDiscrepancies({ userId: lc.userId, lcId: lc.id })
        },
    },

    CreditDocument: {
        attachedTime: (document) => document.rowCreatedAt,
    },
}
