import { CheckoutSession } from "../../Data/Payments/CheckoutSession.js"
import { paymentsService } from "../Payments/index.js"
import { getSaasPlan, SaasPlan, saasPlans } from "./SaasPlanCatalog.js"

/**
 * The saas domain: the subscription exemplar composing the payments kernel,
 * the recurring-billing sibling of Services/Shop. All of checkout (sessions,
 * modes, verification, the subscription state table, the Billing Portal) is
 * the kernel's; this service only resolves plans from the saas pack's own
 * server-side catalog. A new subscribing domain follows the same shape: own
 * catalog, delegate to paymentsService.
 */
class SaasService {
    getPlans(): SaasPlan[] {
        return saasPlans
    }

    getPlan(productKey?: string | null): SaasPlan {
        return getSaasPlan(productKey)
    }

    /**
     * Starts a subscription checkout for the acting user. Never anonymous:
     * recurring billing entitles the authenticated account (the GraphQL
     * mutation stays out of the public allowlist).
     */
    async createSubscriptionCheckoutSession(
        request: CreateSaasSubscriptionCheckoutSessionRequest,
    ): Promise<CheckoutSession> {
        const plan = getSaasPlan(request.fields.productKey)
        return await paymentsService.createSubscriptionCheckoutSession({
            idempotencyKey: request.idempotencyKey,
            origin: request.fields.origin,
            product: plan,
            userId: request.actingUserId,
        })
    }

    /** The saas pack's entitlement check: does the user hold an active Pro plan? */
    async hasActivePlan(userId: string, productKey?: string | null): Promise<boolean> {
        const plan = getSaasPlan(productKey)
        return await paymentsService.hasActiveSubscription(userId, plan.key)
    }
}

export const saasService = new SaasService()

export interface CreateSaasSubscriptionCheckoutSessionRequest {
    idempotencyKey: string
    /** The authenticated user the subscription entitles. */
    actingUserId: string
    fields: {
        /** The web app's origin, e.g. "https://myapp.example"; redirect URLs are built from it. */
        origin: string
        /** Which catalog plan to subscribe to; omitted means the default plan. */
        productKey?: string | null
    }
}
