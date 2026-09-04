import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { quickBooksService } from "../../../Services/QuickBooks/QuickBooksService.js"
import { RpcError } from "../../../Utils/RpcError.js"

export const quickBooksResolvers: GqlResolvers = {
    Query: {
        quickBooksStatus: async () => {
            return await quickBooksService.getStatus()
        },

        quickBooksCompanySnapshot: async () => {
            return await quickBooksService.getCompanySnapshot()
        },

        quickBooksCustomers: async () => {
            return await quickBooksService.listCustomers()
        },

        quickBooksInvoices: async (_parent, { input }) => {
            return await quickBooksService.listInvoices({ filters: input?.filters })
        },

        quickBooksProfitAndLoss: async () => {
            return await quickBooksService.getProfitAndLoss()
        },

        quickBooksBalanceSheet: async () => {
            return await quickBooksService.getBalanceSheet()
        },

        myBooksConnection: async (_parent, _args, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Reading your books requires an authenticated user.")
            }
            return await quickBooksService.getConnectionForUser(userId)
        },
    },

    Mutation: {
        connectQuickBooks: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Connecting QuickBooks requires an authenticated user.")
            }
            return await quickBooksService.connectQuickBooks({
                idempotencyKey: input.idempotencyKey,
                connectedByUserId: userId,
                provider: input.provider,
            })
        },

        disconnectQuickBooks: async () => {
            return await quickBooksService.disconnectQuickBooks()
        },

        beginQuickBooksAuthorization: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Connecting QuickBooks requires an authenticated user.")
            }
            return {
                authorizationUrl: quickBooksService.beginAuthorization({
                    userId,
                    redirectUri: input.redirectUri,
                }),
            }
        },

        completeQuickBooksAuthorization: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Connecting QuickBooks requires an authenticated user.")
            }
            return await quickBooksService.completeAuthorization({
                idempotencyKey: input.idempotencyKey,
                userId,
                code: input.code,
                state: input.state,
                realmId: input.realmId,
                redirectUri: input.redirectUri,
            })
        },

        connectMyBooks: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Connecting your books requires an authenticated user.")
            }
            return await quickBooksService.connectForUser({
                idempotencyKey: input.idempotencyKey,
                userId,
                provider: input.provider,
            })
        },

        disconnectMyBooks: async (_parent, _args, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError(
                    "UNAUTHENTICATED",
                    "Disconnecting your books requires an authenticated user.",
                )
            }
            return await quickBooksService.disconnectForUser(userId)
        },

        exportQuickBooksStatementsXlsx: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Exporting statements requires an authenticated user.")
            }
            return await quickBooksService.exportStatementsXlsx({
                idempotencyKey: input.idempotencyKey,
                userId,
                statement: input.statement ?? "ALL",
            })
        },
    },

    QuickBooksConnection: {
        connectedTime: (connection) => connection.rowCreatedAt,
    },
}
