import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { shopService } from "../../../Services/Shop/ShopService.js"

/**
 * Shop resolvers: the storefront exemplar over the payments kernel. Every
 * operation here is public (buyers are anonymous); the execution-level gate
 * allows them via publicQueryRootFields / publicMutationRootFields in
 * GraphqlServer.ts. The shop resolves products from its own server-side
 * catalog and delegates checkout to the kernel (see ShopService).
 */
export const shopResolvers: GqlResolvers = {
    Query: {
        shopProduct: () => {
            return shopService.getProduct()
        },

        shopProducts: () => {
            return shopService.getProducts()
        },
    },

    Mutation: {
        createCheckoutSession: async (_parent, { input }) => {
            return await shopService.createCheckoutSession({
                idempotencyKey: input.idempotencyKey,
                fields: input.fields,
            })
        },
    },
}
