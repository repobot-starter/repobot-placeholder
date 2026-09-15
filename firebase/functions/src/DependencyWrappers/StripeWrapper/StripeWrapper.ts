/**
 * The payments kernel's boundary with Stripe. Only the endpoints the kernel
 * needs are wrapped (create/retrieve a hosted Checkout Session, retrieve a
 * subscription, create a Billing Portal session), called over Stripe's
 * form-encoded REST API directly so the kernel carries no Stripe SDK
 * dependency.
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
    /** "payment" (the default) or "subscription" for recurring billing. */
    mode?: "payment" | "subscription"
    /** Recurring billing period; required when mode is "subscription". */
    recurringInterval?: "month" | "year"
}

export interface StripeCheckoutSession {
    /** Stripe's session id, "cs_...". */
    id: string
    /** The hosted checkout page URL; null once the session is complete. */
    url: string | null
    /** "paid" once payment has settled. */
    paymentStatus: string
    /** The buyer's email as collected by Stripe Checkout; null until known. */
    customerEmail: string | null
    /** The subscription created by a mode=subscription session ("sub_..."); null otherwise. */
    subscriptionId: string | null
    /** Stripe's customer ("cus_..."); null until Stripe creates one. */
    customerId: string | null
}

export interface StripeSubscription {
    /** Stripe's subscription id, "sub_...". */
    id: string
    /** Stripe's status: "active", "past_due", "canceled", ... */
    status: string
    /** End of the current billing period (unix seconds); null when Stripe omits it. */
    currentPeriodEndEpochSeconds: number | null
    /** The owning Stripe customer ("cus_..."). */
    customerId: string | null
}

export interface CreateStripeBillingPortalSessionRequest {
    /** The Stripe customer ("cus_...") the portal manages. */
    customerId: string
    /** Where the portal's "back" link returns the user. */
    returnUrl: string
}

export interface StripeBillingPortalSession {
    /** The hosted Billing Portal URL to send the user to. */
    url: string
}

export interface StripeWrapper {
    createCheckoutSession(request: CreateStripeCheckoutSessionRequest): Promise<StripeCheckoutSession>
    retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession>
    retrieveSubscription(subscriptionId: string): Promise<StripeSubscription>
    createBillingPortalSession(
        request: CreateStripeBillingPortalSessionRequest,
    ): Promise<StripeBillingPortalSession>
}
