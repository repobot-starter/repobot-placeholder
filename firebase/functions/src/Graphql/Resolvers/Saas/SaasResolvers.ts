import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { saasService } from "../../../Services/Saas/SaasService.js"
import { RpcError } from "../../../Utils/RpcError.js"

/**
 * Saas resolvers: the subscription exemplar over the payments kernel. Unlike
 * the shop's anonymous checkout, createSubscriptionCheckoutSession is
 * authenticated (deliberately NOT in the public allowlist) — recurring
 * billing entitles an account, so the resolver translates the principal into
 * the acting user and the service refuses to run without one.
 */
export const saasResolvers: GqlResolvers = {
    Mutation: {
        createSubscriptionCheckoutSession: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Subscribing requires an authenticated user.")
            }
            return await saasService.createSubscriptionCheckoutSession({
                idempotencyKey: input.idempotencyKey,
                actingUserId: userId,
                fields: input.fields,
            })
        },
    },
}
