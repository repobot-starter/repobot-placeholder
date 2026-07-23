/**
 * The storefront's product, server-side so the price a buyer is charged can
 * never be tampered with from the client. The starter sells one book; agents
 * growing the shop should turn this into a list keyed by productKey and add
 * the key to CreateCheckoutSessionFields.
 *
 * Presentation copy (author bio, reviews, cover art) lives with the web view
 * in web/app/src/View/Shop/shopContent.ts; this file is only what checkout
 * needs to charge correctly.
 */

export interface ShopProduct {
    /** Stable key recorded on checkout sessions, e.g. "book". */
    key: string
    /** Shown on the storefront and on Stripe's hosted checkout page. */
    name: string
    /** One-line descriptor under the name. */
    tagline: string
    /** Price in the currency's minor units (cents for USD). */
    priceMinorUnits: number
    /** Lowercase ISO currency code Stripe accepts, e.g. "usd". */
    currency: string
}

export const shopProduct: ShopProduct = {
    key: "book",
    name: "The Lighthouse Letters",
    tagline: "A novel — first edition hardcover, signed by the author",
    priceMinorUnits: 2400,
    currency: "usd",
}
