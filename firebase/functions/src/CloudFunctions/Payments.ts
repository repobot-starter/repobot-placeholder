import { createReadStream } from "node:fs"
import express, { type Request, type Response } from "express"
import { onRequest } from "firebase-functions/v2/https"
import { z } from "zod"
import { findDeliveryFile } from "../Services/Payments/DeliveryFiles.js"
import { paymentsService, subscriptionStatusFromStripe } from "../Services/Payments/PaymentsService.js"
import { verifyStripeWebhookSignature } from "../Services/Payments/StripeWebhook.js"
import { validatedEnv } from "../Utils/Env.js"
import { httpStatusFromRpcStatus, RpcError } from "../Utils/RpcError.js"

/**
 * The payments kernel's HTTP surface. Clients derive this URL from their
 * GraphQL URL by swapping the trailing function name (payments__request__api),
 * which holds in every environment because the emulator and the platform
 * deployer treat all exports uniformly.
 *
 * POST /webhook receives Stripe events. checkout.session.completed marks the
 * session PAID and writes its ledger row (purchases for one-off sessions,
 * subscriptions for subscription sessions, receipt through the mail kernel);
 * customer.subscription.updated/deleted and invoice.paid/payment_failed move
 * the matching subscription row through ACTIVE / PAST_DUE / CANCELED. Every
 * delivery is verified against STRIPE_WEBHOOK_SECRET before any processing.
 *
 * GET /delivery?session=<id> is session-gated digital delivery: after
 * verifying the checkout session is PAID (server-side, never trusting the
 * redirect), it streams the product's delivery file — the single file in
 * /firebase/functions/delivery/<productKey>/. See docs/payments.md.
 */
export const payments__request__api = onRequest({ cors: true }, buildPaymentsExpressApp())

export function buildPaymentsExpressApp(): express.Express {
    const app = express()

    app.post(
        "/webhook",
        // Signature verification needs the exact raw bytes Stripe signed.
        express.raw({ type: "*/*", limit: "1mb" }),
        asyncRoute(async (request, response) => {
            const secret = validatedEnv().STRIPE_WEBHOOK_SECRET
            if (secret === undefined || secret === "") {
                throw new RpcError(
                    "FAILED_PRECONDITION",
                    "STRIPE_WEBHOOK_SECRET is not set. Configure the webhook endpoint in Stripe " +
                        "and set its signing secret, or remove the webhook configuration.",
                )
            }
            const payload = Buffer.isBuffer(request.body) ? request.body.toString("utf8") : ""
            verifyStripeWebhookSignature({
                payload,
                signatureHeader: request.header("stripe-signature"),
                secret,
            })

            const event = stripeEventSchema.parse(parseJsonOrThrow(payload))
            await handleStripeEvent(event)
            // Unhandled event types are acknowledged so Stripe stops retrying.
            response.json({ received: true })
        }),
    )

    app.get(
        "/delivery",
        asyncRoute(async (request, response) => {
            const sessionId = z.string().min(1).parse(request.query.session)
            const session = await paymentsService.requirePaidCheckoutSession(sessionId)
            const delivery = findDeliveryFile(session.productKey)
            if (delivery === undefined) {
                throw new RpcError("NOT_FOUND", "This purchase has no digital delivery.")
            }
            response.status(200)
            response.setHeader("content-type", "application/octet-stream")
            response.setHeader("content-disposition", `attachment; filename="${delivery.fileName}"`)
            createReadStream(delivery.filePath).pipe(response)
        }),
    )

    return app
}

/**
 * Routes a verified Stripe event to the payments kernel. Sessions reaching
 * PAID and subscription lifecycle transitions both ignore unknown ids —
 * Stripe retries deliveries and other Stripe products may share the endpoint.
 */
async function handleStripeEvent(event: z.infer<typeof stripeEventSchema>): Promise<void> {
    const object = event.data.object
    switch (event.type) {
        case "checkout.session.completed": {
            await paymentsService.markSessionPaidByStripeSessionId(object.id, {
                buyerEmail: object.customer_details?.email,
                stripeSubscriptionId: stripeIdOf(object.subscription),
                stripeCustomerId: stripeIdOf(object.customer),
            })
            return
        }
        case "customer.subscription.updated": {
            const status = subscriptionStatusFromStripe(object.status ?? "")
            if (status !== undefined) {
                await paymentsService.applyStripeSubscriptionEvent({
                    stripeSubscriptionId: object.id,
                    status,
                    currentPeriodEndEpochSeconds: object.current_period_end,
                })
            }
            return
        }
        case "customer.subscription.deleted": {
            await paymentsService.applyStripeSubscriptionEvent({
                stripeSubscriptionId: object.id,
                status: "CANCELED",
                currentPeriodEndEpochSeconds: object.current_period_end,
            })
            return
        }
        case "invoice.paid":
        case "invoice.payment_failed": {
            // Invoice events carry the subscription they bill as a reference.
            const stripeSubscriptionId = stripeIdOf(object.subscription)
            if (stripeSubscriptionId !== undefined) {
                await paymentsService.applyStripeSubscriptionEvent({
                    stripeSubscriptionId,
                    status: event.type === "invoice.paid" ? "ACTIVE" : "PAST_DUE",
                })
            }
            return
        }
        default:
            return
    }
}

function parseJsonOrThrow(payload: string): unknown {
    try {
        return JSON.parse(payload)
    } catch {
        throw new RpcError("INVALID_ARGUMENT", "Webhook payload is not valid JSON.")
    }
}

/** Stripe references come as ids or expanded objects; normalize to the id. */
function stripeIdOf(value: string | { id: string } | null | undefined): string | undefined {
    if (value == null) {
        return undefined
    }
    return typeof value === "string" ? value : value.id
}

const stripeReferenceSchema = z.union([z.string(), z.object({ id: z.string() }).passthrough()])

const stripeEventSchema = z.object({
    type: z.string(),
    data: z.object({
        object: z
            .object({
                id: z.string(),
                // The buyer's email; feeds the purchase ledger and receipt.
                customer_details: z.object({ email: z.string().nullish() }).nullish(),
                // Subscription checkout: the created subscription + customer.
                subscription: stripeReferenceSchema.nullish(),
                customer: stripeReferenceSchema.nullish(),
                // customer.subscription.* events: Stripe's status + period end.
                status: z.string().nullish(),
                current_period_end: z.number().nullish(),
            })
            .passthrough(),
    }),
})

type RouteHandler = (request: Request, response: Response) => Promise<void>

function asyncRoute(handler: RouteHandler): RouteHandler {
    return async (request, response) => {
        try {
            await handler(request, response)
        } catch (error) {
            if (error instanceof z.ZodError) {
                response.status(400).json({
                    error: {
                        code: "INVALID_ARGUMENT",
                        message: error.issues[0]?.message ?? "Invalid request.",
                    },
                })
                return
            }
            if (error instanceof RpcError) {
                response
                    .status(httpStatusFromRpcStatus(error.status))
                    .json({ error: { code: error.status, message: error.message } })
                return
            }
            console.error("Unexpected payments API failure.", error)
            response
                .status(500)
                .json({ error: { code: "INTERNAL", message: "Unexpected payments failure." } })
        }
    }
}
