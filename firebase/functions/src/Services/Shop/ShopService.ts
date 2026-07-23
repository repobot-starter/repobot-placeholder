import {
    CheckoutSession,
    checkoutSessionInsertSchema,
    checkoutSessionsTable,
    checkoutSessionUpdateSchema,
} from "../../Data/Shop/CheckoutSession.js"
import { shopDb } from "../../Data/ShopDatabase.js"
import { getRowByIdOrThrow, idempotentInsertAndGet, updateRowReturning } from "../../Data/Utils/index.js"
import { newRowIdForTable } from "../../Data/BaseTable.js"
import { getStripeWrapper } from "../../DependencyWrappers/StripeWrapper/index.js"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError, checkArgument } from "../../Utils/RpcError.js"
import { ShopProduct, shopProduct } from "./ShopCatalog.js"

/** The in-app test checkout page (see web/app/src/View/Shop/TestCheckoutPage). */
const TEST_CHECKOUT_PATH = "/checkout/test"
const SUCCESS_PATH = "/checkout/success"
const CANCELLED_PATH = "/checkout/cancelled"

class ShopService {
    getProduct(): ShopProduct {
        return shopProduct
    }

    /**
     * Starts a checkout for the storefront's product and returns the session
     * whose `checkoutUrl` the buyer should be sent to. Buyers are anonymous;
     * no principal is involved by design.
     *
     * PAYMENTS_MODE=local (sandbox): the session is a Postgres row and the
     * URL points at the in-app test checkout page, which completes it via
     * completeTestCheckoutSession. No real money can move in this mode.
     *
     * PAYMENTS_MODE=stripe (deployed): a Stripe Checkout Session is created
     * with the product's server-side price, and the URL is Stripe's hosted
     * payment page. The success URL carries our row id so the success page
     * can verify payment server-side (getCheckoutSession).
     */
    async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<CheckoutSession> {
        const origin = parseOrigin(request.fields.origin)
        const product = this.getProduct()
        // The row id goes into the redirect URLs, so it is allocated before
        // the insert; idempotentInsertAndGet keeps the explicit id.
        const sessionId = newRowIdForTable(checkoutSessionsTable)

        if (paymentsMode() === "local") {
            const newSession = checkoutSessionInsertSchema.parse({
                provider: "LOCAL",
                status: "PENDING",
                productKey: product.key,
                productName: product.name,
                amountTotal: product.priceMinorUnits,
                currency: product.currency,
                checkoutUrl: `${origin}${TEST_CHECKOUT_PATH}?session=${sessionId}`,
            })
            return await idempotentInsertAndGet(
                shopDb,
                checkoutSessionsTable,
                { ...newSession, id: sessionId },
                request.idempotencyKey,
            )
        }

        const stripeSession = await getStripeWrapper().createCheckoutSession({
            productName: product.name,
            amountMinorUnits: product.priceMinorUnits,
            currency: product.currency,
            successUrl: `${origin}${SUCCESS_PATH}?session=${sessionId}`,
            cancelUrl: `${origin}${CANCELLED_PATH}`,
        })
        if (stripeSession.url === null) {
            throw new RpcError("INTERNAL", "Stripe returned a checkout session without a URL.")
        }
        const newSession = checkoutSessionInsertSchema.parse({
            provider: "STRIPE",
            status: "PENDING",
            productKey: product.key,
            productName: product.name,
            amountTotal: product.priceMinorUnits,
            currency: product.currency,
            stripeSessionId: stripeSession.id,
            checkoutUrl: stripeSession.url,
        })
        return await idempotentInsertAndGet(
            shopDb,
            checkoutSessionsTable,
            { ...newSession, id: sessionId },
            request.idempotencyKey,
        )
    }

    /**
     * Loads a checkout session for the success page. STRIPE sessions still
     * PENDING are verified against Stripe server-side and marked PAID once
     * Stripe reports payment_status "paid" — the buyer's redirect alone is
     * never trusted as proof of payment.
     */
    async getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
        const session = await getRowByIdOrThrow(shopDb, checkoutSessionsTable, sessionId)
        if (session.provider !== "STRIPE" || session.status === "PAID") {
            return session
        }
        checkArgument(session.stripeSessionId !== null, "Stripe session id is missing.")
        const stripeSession = await getStripeWrapper().retrieveCheckoutSession(session.stripeSessionId)
        if (stripeSession.paymentStatus !== "paid") {
            return session
        }
        return await updateRowReturning(
            shopDb,
            checkoutSessionsTable,
            session.id,
            checkoutSessionUpdateSchema.parse({ status: "PAID" }),
        )
    }

    /**
     * The test checkout's "Pay" button. Only meaningful in PAYMENTS_MODE=local
     * — in stripe mode this refuses outright, so a deployed storefront can
     * never have a session faked to PAID through this mutation.
     */
    async completeTestCheckoutSession(sessionId: string): Promise<CheckoutSession> {
        if (paymentsMode() !== "local") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "The test checkout only exists when PAYMENTS_MODE=local. " +
                    "Deployed storefronts complete payment on Stripe's hosted page.",
            )
        }
        const session = await getRowByIdOrThrow(shopDb, checkoutSessionsTable, sessionId)
        if (session.provider !== "LOCAL") {
            throw new RpcError("FAILED_PRECONDITION", "Only LOCAL sessions can be test-completed.")
        }
        if (session.status === "PAID") {
            return session
        }
        return await updateRowReturning(
            shopDb,
            checkoutSessionsTable,
            session.id,
            checkoutSessionUpdateSchema.parse({ status: "PAID" }),
        )
    }
}

function paymentsMode(): "local" | "stripe" {
    return validatedEnv().PAYMENTS_MODE
}

/**
 * Normalizes and validates the client-reported web origin that redirect URLs
 * are built from. Only the origin part is kept (no path smuggling), and only
 * http(s) is accepted.
 */
function parseOrigin(rawOrigin: string): string {
    let url: URL
    try {
        url = new URL(rawOrigin)
    } catch {
        throw new RpcError("INVALID_ARGUMENT", "origin must be a valid URL.")
    }
    checkArgument(url.protocol === "https:" || url.protocol === "http:", "origin must be an http(s) URL.")
    return url.origin
}

export const shopService = new ShopService()

export interface CreateCheckoutSessionRequest {
    idempotencyKey: string
    fields: {
        /** The web app's origin, e.g. "https://myshop.example"; redirect URLs are built from it. */
        origin: string
    }
}
