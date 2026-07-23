import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { userService } from "../../../Services/Identity/UserService.js"
import { RpcError } from "../../../Utils/RpcError.js"

export const userResolvers: GqlResolvers = {
    Query: {
        currentUser: async (_parent, _args, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "The request has no authenticated application user.")
            }
            return await context.userDataloader.load(userId)
        },

        users: async (_parent, { input }) => {
            return await userService.listUsers({
                connection: input.connection,
                filters: input.filters,
            })
        },
    },

    Mutation: {
        createUser: async (_parent, { input }) => {
            return await userService.createUser({
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        updateUser: async (_parent, { input }) => {
            return await userService.updateUser({
                objectId: input.objectId,
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },
    },

    User: {
        // Field resolvers hydrate relations via per-request dataloaders; the
        // parent row only carries accountId.
        account: async (user, _args, context) => {
            return await context.accountDataloader.load(user.accountId)
        },
        createdTime: (user) => user.rowCreatedAt,
    },
}
