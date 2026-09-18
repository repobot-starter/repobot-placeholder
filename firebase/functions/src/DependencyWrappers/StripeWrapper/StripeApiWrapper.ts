import { RpcError } from "../../Utils/RpcError.js"
import {
    CreateStripeBillingPortalSessionRequest,
    CreateStripeCheckoutSessionRequest,
    StripeBillingPortalSession,
    StripeCheckoutSession,
    StripeSubscription,
    StripeWrapper,
} from "./StripeWrapper.js"

const STRIPE_API_BASE = "https://api.stripe.com/v1"

interface StripeSessionResponse {
    id: string
    url: string | null
    payment_status: string
    customer_details?: { email?: string | null } | null
    // Expanded objects come back as objects; unexpanded as id strings.
    subscription?: string | { id: string } | null
    customer?: string | { id: string } | null
}

interface StripeSubscriptionResponse {
    id: string
    status: string
    current_period_end?: number | null
    customer?: string | { id: string } | null
}

interface StripePortalSessionResponse {
    url: string
}

/**
 * The real Stripe client, used when PAYMENTS_MODE=stripe. The secret key is
 * injected by the platform at deploy time from the account's connected Stripe
 * integration (see docs/payments.md); it is never present locally.
 */
export class StripeApiWrapper implements StripeWrapper {
    private readonly secretKey: string

    constructor() {
        const secretKey = process.env.STRIPE_SECRET_KEY
        if (secretKey === undefined || secretKey === "") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "STRIPE_SECRET_KEY is not set. Connect a Stripe account under Integrations " +
                    "and redeploy, or run locally with PAYMENTS_MODE=local.",
            )
        }
        this.secretKey = secretKey
    }

    async createCheckoutSession(request: CreateStripeCheckoutSessionRequest): Promise<StripeCheckoutSession> {
        const mode = request.mode ?? "payment"
        const body = new URLSearchParams({
            mode,
            success_url: request.successUrl,
            cancel_url: request.cancelUrl,
            "line_items[0][quantity]": "1",
            "line_items[0][price_data][currency]": request.currency,
            "line_items[0][price_data][unit_amount]": String(request.amountMinorUnits),
            "line_items[0][price_data][product_data][name]": request.productName,
        })
        if (mode === "subscription") {
            if (request.recurringInterval === undefined) {
                throw new RpcError(
                    "INVALID_ARGUMENT",
                    "A subscription checkout session needs a recurringInterval.",
                )
            }
            body.set("line_items[0][price_data][recurring][interval]", request.recurringInterval)
        }
        const response = await this.request<StripeSessionResponse>("/checkout/sessions", {
            method: "POST",
            body,
        })
        return toStripeCheckoutSession(response)
    }

    async retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
        // Expanding the subscription lets one retrieval both verify payment
        // and learn the subscription id for activation.
        const response = await this.request<StripeSessionResponse>(
            `/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`,
            { method: "GET" },
        )
        return toStripeCheckoutSession(response)
    }

    async retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
        const response = await this.request<StripeSubscriptionResponse>(
            `/subscriptions/${encodeURIComponent(subscriptionId)}`,
            { method: "GET" },
        )
        return {
            id: response.id,
            status: response.status,
            currentPeriodEndEpochSeconds: response.current_period_end ?? null,
            customerId: idOf(response.customer),
        }
    }

    async createBillingPortalSession(
        request: CreateStripeBillingPortalSessionRequest,
    ): Promise<StripeBillingPortalSession> {
        const body = new URLSearchParams({
            customer: request.customerId,
            return_url: request.returnUrl,
        })
        const response = await this.request<StripePortalSessionResponse>("/billing_portal/sessions", {
            method: "POST",
            body,
        })
        return { url: response.url }
    }

    private async request<TResponse>(
        path: string,
        init: { method: string; body?: URLSearchParams },
    ): Promise<TResponse> {
        const response = await fetch(`${STRIPE_API_BASE}${path}`, {
            method: init.method,
            headers: {
                authorization: `Bearer ${this.secretKey}`,
                ...(init.body !== undefined ? { "content-type": "application/x-www-form-urlencoded" } : {}),
            },
            body: init.body,
        })
        const payload = (await response.json()) as TResponse | { error?: { message?: string } }
        if (!response.ok) {
            const message =
                (typeof payload === "object" && payload !== null && "error" in payload
                    ? (payload as { error?: { message?: string } }).error?.message
                    : undefined) ?? `Stripe request failed with status ${response.status}.`
            throw new RpcError("UNAVAILABLE", `Stripe: ${message}`)
        }
        return payload as TResponse
    }
}

function toStripeCheckoutSession(response: StripeSessionResponse): StripeCheckoutSession {
    return {
        id: response.id,
        url: response.url,
        paymentStatus: response.payment_status,
        customerEmail: response.customer_details?.email ?? null,
        subscriptionId: idOf(response.subscription),
        customerId: idOf(response.customer),
    }
}

function idOf(value: string | { id: string } | null | undefined): string | null {
    if (value == null) {
        return null
    }
    return typeof value === "string" ? value : value.id
}
