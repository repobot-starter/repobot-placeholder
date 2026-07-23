import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { shopService } from "../../../Services/Shop/ShopService.js"

/**
 * Shop resolvers. Every operation here is public (buyers are anonymous); the
 * execution-level gate allows them via publicQueryRootFields /
 * publicMutationRootFields in GraphqlServer.ts. Safety lives in the service:
 * prices are server-side and test completion refuses outside local mode.
 */
export const shopResolvers: GqlResolvers = {
    Query: {
        shopProduct: () => {
            return shopService.getProduct()
        },

        checkoutSession: async (_parent, { id }) => {
            return await shopService.getCheckoutSession(id)
        },
    },

    Mutation: {
        createCheckoutSession: async (_parent, { input }) => {
            return await shopService.createCheckoutSession({
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },

        completeTestCheckoutSession: async (_parent, { input }) => {
            return await shopService.completeTestCheckoutSession(input.sessionId)
        },
    },

    CheckoutSession: {
        createdTime: (session) => session.rowCreatedAt,
    },
}
