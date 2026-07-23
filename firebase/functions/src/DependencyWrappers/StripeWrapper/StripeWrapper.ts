/**
 * The Shop domain's boundary with Stripe. Only the two Checkout endpoints the
 * storefront needs are wrapped (create a hosted Checkout Session, retrieve it
 * for verification), called over Stripe's form-encoded REST API directly so
 * the kernel carries no Stripe SDK dependency.
 */

export interface CreateStripeCheckoutSessionRequest {
    /** Product name shown on Stripe's hosted checkout page. */
    productName: string
    /** Amount in the currency's minor units (cents for USD). */
    amountMinorUnits: number
    /** Lowercase ISO currency code, e.g. "usd". */
    currency: string
    /** Where Stripe sends the buyer after paying. */
    successUrl: string
    /** Where Stripe sends the buyer if they back out. */
    cancelUrl: string
}

export interface StripeCheckoutSession {
    /** Stripe's session id, "cs_...". */
    id: string
    /** The hosted checkout page URL; null once the session is complete. */
    url: string | null
    /** "paid" once payment has settled. */
    paymentStatus: string
}

export interface StripeWrapper {
    createCheckoutSession(request: CreateStripeCheckoutSessionRequest): Promise<StripeCheckoutSession>
    retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession>
}
