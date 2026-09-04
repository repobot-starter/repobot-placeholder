/**
 * The payments kernel's product contract. The kernel never owns a catalog:
 * each consuming domain (shop is the exemplar for one-off sales, saas for
 * subscriptions) keeps its own server-side product list and passes a resolved
 * PaymentProduct into paymentsService.createCheckoutSession /
 * createSubscriptionCheckoutSession, so the price a buyer is charged can
 * never be tampered with from the client.
 */
export interface PaymentProduct {
    /** Stable key recorded on checkout sessions and purchases, e.g. "book". */
    key: string
    /** Shown on Stripe's hosted checkout page and in purchase history. */
    name: string
    /** Price in the currency's minor units (cents for USD). */
    priceMinorUnits: number
    /** Lowercase ISO currency code Stripe accepts, e.g. "usd". */
    currency: string
    /**
     * What buying this product means: a single charge ("one_time", the
     * default) or recurring billing ("subscription"). Subscription products
     * must also declare an interval and are only accepted by
     * createSubscriptionCheckoutSession.
     */
    kind?: "one_time" | "subscription"
    /** Recurring billing period; required when kind is "subscription". */
    interval?: "month" | "year"
}
