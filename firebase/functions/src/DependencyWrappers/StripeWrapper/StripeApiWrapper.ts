import { RpcError } from "../../Utils/RpcError.js"
import { CreateStripeCheckoutSessionRequest, StripeCheckoutSession, StripeWrapper } from "./StripeWrapper.js"

const STRIPE_API_BASE = "https://api.stripe.com/v1"

interface StripeSessionResponse {
    id: string
    url: string | null
    payment_status: string
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
        const body = new URLSearchParams({
            mode: "payment",
            success_url: request.successUrl,
            cancel_url: request.cancelUrl,
            "line_items[0][quantity]": "1",
            "line_items[0][price_data][currency]": request.currency,
            "line_items[0][price_data][unit_amount]": String(request.amountMinorUnits),
            "line_items[0][price_data][product_data][name]": request.productName,
        })
        const response = await this.post("/checkout/sessions", body)
        return toStripeCheckoutSession(response)
    }

    async retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
        const response = await this.get(`/checkout/sessions/${encodeURIComponent(sessionId)}`)
        return toStripeCheckoutSession(response)
    }

    private async post(path: string, body: URLSearchParams): Promise<StripeSessionResponse> {
        return await this.request(path, { method: "POST", body })
    }

    private async get(path: string): Promise<StripeSessionResponse> {
        return await this.request(path, { method: "GET" })
    }

    private async request(
        path: string,
        init: { method: string; body?: URLSearchParams },
    ): Promise<StripeSessionResponse> {
        const response = await fetch(`${STRIPE_API_BASE}${path}`, {
            method: init.method,
            headers: {
                authorization: `Bearer ${this.secretKey}`,
                ...(init.body !== undefined ? { "content-type": "application/x-www-form-urlencoded" } : {}),
            },
            body: init.body,
        })
        const payload = (await response.json()) as StripeSessionResponse | { error?: { message?: string } }
        if (!response.ok) {
            const message =
                ("error" in payload ? payload.error?.message : undefined) ??
                `Stripe request failed with status ${response.status}.`
            throw new RpcError("UNAVAILABLE", `Stripe: ${message}`)
        }
        return payload as StripeSessionResponse
    }
}

function toStripeCheckoutSession(response: StripeSessionResponse): StripeCheckoutSession {
    return {
        id: response.id,
        url: response.url,
        paymentStatus: response.payment_status,
    }
}
