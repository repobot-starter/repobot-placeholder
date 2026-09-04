import { PaymentProduct } from "../Payments/index.js"
import { RpcError } from "../../Utils/RpcError.js"

/**
 * The storefront's catalog, server-side so the price a buyer is charged can
 * never be tampered with from the client. The starter sells one book; agents
 * growing the shop add entries here and pass their keys through
 * CreateCheckoutSessionFields.productKey.
 *
 * Presentation copy (author bio, reviews, cover art) lives with the web view
 * in web/app/src/View/Shop/shopContent.ts; this file is only what checkout
 * needs to charge correctly.
 */

export interface ShopProduct extends PaymentProduct {
    /** One-line descriptor under the name. */
    tagline: string
}

export const shopProducts: ShopProduct[] = [
    {
        key: "book",
        name: "The Lighthouse Letters",
        tagline: "A novel — first edition hardcover, signed by the author",
        priceMinorUnits: 2400,
        currency: "usd",
    },
    // The checkout feature pack's product (packs/checkout): a service rather
    // than a good, so the two payment surfaces read differently. Its
    // presentation copy lives in web/app/src/View/Checkout/checkoutContent.ts.
    {
        key: "session",
        name: "Strategy Session",
        tagline: "A focused 60-minute working session, scheduled after checkout",
        priceMinorUnits: 7500,
        currency: "usd",
    },
]

/**
 * Resolves a product for checkout. No key means the storefront's default
 * (first) product, so single-product storefronts never send one.
 */
export function getShopProduct(productKey?: string | null): ShopProduct {
    if (productKey === undefined || productKey === null) {
        return shopProducts[0]
    }
    const product = shopProducts.find((candidate) => candidate.key === productKey)
    if (product === undefined) {
        const known = shopProducts.map((candidate) => candidate.key).join(", ")
        throw new RpcError("NOT_FOUND", `Unknown product '${productKey}'. Known products: ${known}.`)
    }
    return product
}
