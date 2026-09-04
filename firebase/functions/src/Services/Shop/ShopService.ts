import { CheckoutSession } from "../../Data/Payments/CheckoutSession.js"
import { paymentsService } from "../Payments/index.js"
import { getShopProduct, ShopProduct, shopProducts } from "./ShopCatalog.js"

/**
 * The shop domain: the storefront exemplar composing the payments kernel.
 * All of checkout (sessions, modes, verification, the purchase ledger) is
 * the kernel's; this service only resolves products from the shop's own
 * server-side catalog. A new selling domain follows the same shape: own
 * catalog, delegate to paymentsService.
 */
class ShopService {
    getProducts(): ShopProduct[] {
        return shopProducts
    }

    getProduct(productKey?: string | null): ShopProduct {
        return getShopProduct(productKey)
    }

    async createCheckoutSession(request: CreateShopCheckoutSessionRequest): Promise<CheckoutSession> {
        const product = getShopProduct(request.fields.productKey)
        return await paymentsService.createCheckoutSession({
            idempotencyKey: request.idempotencyKey,
            origin: request.fields.origin,
            product,
        })
    }
}

export const shopService = new ShopService()

export interface CreateShopCheckoutSessionRequest {
    idempotencyKey: string
    fields: {
        /** The web app's origin, e.g. "https://myshop.example"; redirect URLs are built from it. */
        origin: string
        /** Which catalog product to charge for; omitted means the default product. */
        productKey?: string | null
    }
}
