import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { accountService } from "../../../Services/Identity/AccountService.js"

export const accountResolvers: GqlResolvers = {
    Query: {
        accounts: async (_parent, { input }) => {
            return await accountService.listAccounts({
                connection: input.connection,
                filters: input.filters,
            })
        },
    },

    Mutation: {
        createAccount: async (_parent, { input }) => {
            return await accountService.createAccount({
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },
    },

    Account: {
        createdTime: (account) => account.rowCreatedAt,
    },
}
