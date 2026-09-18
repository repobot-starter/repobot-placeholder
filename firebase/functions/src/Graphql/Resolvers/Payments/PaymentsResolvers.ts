import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { findDeliveryFile } from "../../../Services/Payments/DeliveryFiles.js"
import { paymentsService } from "../../../Services/Payments/PaymentsService.js"
import { RpcError } from "../../../Utils/RpcError.js"

/**
 * Payments kernel resolvers. checkoutSession and completeTestCheckoutSession
 * are public (one-off buyers are anonymous); the execution-level gate allows
 * them via publicQueryRootFields / publicMutationRootFields in
 * GraphqlServer.ts. Safety lives in the service: prices are server-side,
 * verification is against Stripe, and test completion refuses outside local
 * mode. purchases is NOT public — the ledger is for authenticated owner
 * surfaces — and every subscription field (mySubscription,
 * createBillingPortalSession, cancelTestSubscription) is authenticated too:
 * subscriptions are never anonymous.
 */
export const paymentsResolvers: GqlResolvers = {
    Query: {
        checkoutSession: async (_parent, { id }) => {
            return await paymentsService.getCheckoutSession(id)
        },

        purchases: async (_parent, { input }) => {
            return await paymentsService.listPurchases({ connection: input.connection })
        },

        mySubscription: async (_parent, { productKey }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError(
                    "UNAUTHENTICATED",
                    "Reading a subscription requires an authenticated user.",
                )
            }
            return await paymentsService.getSubscriptionForUser(userId, productKey)
        },
    },

    Mutation: {
        completeTestCheckoutSession: async (_parent, { input }) => {
            return await paymentsService.completeTestCheckoutSession(input.sessionId)
        },

        createBillingPortalSession: async (_parent, { input }, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError("UNAUTHENTICATED", "Managing billing requires an authenticated user.")
            }
            const url = await paymentsService.createBillingPortalSession({
                userId,
                origin: input.origin,
            })
            return { url }
        },

        cancelTestSubscription: async (_parent, _args, context) => {
            const userId = context.principal?.userId
            if (userId === undefined) {
                throw new RpcError(
                    "UNAUTHENTICATED",
                    "Cancelling a subscription requires an authenticated user.",
                )
            }
            return await paymentsService.cancelTestSubscription(userId)
        },
    },

    CheckoutSession: {
        createdTime: (session) => session.rowCreatedAt,
        recurringInterval: (session) => session.recurringInterval ?? undefined,
        deliveryAvailable: (session) => findDeliveryFile(session.productKey) !== undefined,
    },

    Purchase: {
        createdTime: (purchase) => purchase.rowCreatedAt,
    },

    PaymentSubscription: {
        createdTime: (subscription) => subscription.rowCreatedAt,
        currentPeriodEnd: (subscription) => subscription.currentPeriodEnd ?? undefined,
    },
}
