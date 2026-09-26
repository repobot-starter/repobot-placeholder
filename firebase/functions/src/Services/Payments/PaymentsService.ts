import { and, desc, eq } from "drizzle-orm"
import { newRowIdForTable } from "../../Data/BaseTable.js"
import {
    CheckoutSession,
    checkoutSessionInsertSchema,
    checkoutSessionsTable,
    checkoutSessionUpdateSchema,
    RecurringInterval,
} from "../../Data/Payments/CheckoutSession.js"
import { Purchase, purchaseInsertSchema, purchasesTable } from "../../Data/Payments/Purchase.js"
import {
    Subscription,
    subscriptionInsertSchema,
    subscriptionsTable,
    SubscriptionStatus,
    subscriptionUpdateSchema,
} from "../../Data/Payments/Subscription.js"
import { paymentsDb } from "../../Data/PaymentsDatabase.js"
import {
    ConnectionParameters,
    getRowByIdOrThrow,
    idempotentInsertAndGet,
    listRows,
    ListRowsResult,
    updateRowReturning,
} from "../../Data/Utils/index.js"
import { getStripeWrapper } from "../../DependencyWrappers/StripeWrapper/index.js"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError, checkArgument } from "../../Utils/RpcError.js"
import { mailService } from "../Mail/index.js"
import { PaymentProduct } from "./PaymentCatalog.js"

/** The in-app test checkout page (see web/app/src/View/Shop/TestCheckoutPage). */
const TEST_CHECKOUT_PATH = "/checkout/test"
const SUCCESS_PATH = "/checkout/success"
const CANCELLED_PATH = "/checkout/cancelled"
/** The in-app test billing page (see web/app/src/View/Billing/TestBillingPage). */
const TEST_BILLING_PATH = "/billing/test"
/** Where the Stripe Billing Portal's "back" link returns the user. */
const SETTINGS_PATH = "/settings"

/**
 * The payments kernel: one-off and subscription checkout sessions with a
 * simulated sandbox mode, a purchase ledger, a subscription state table, and
 * session-gated delivery. Catalog-agnostic by design — callers resolve a
 * PaymentProduct from their own server-side catalog (Services/Shop and
 * Services/Saas are the exemplars) and this service never sees a
 * client-supplied price.
 */
class PaymentsService {
    /**
     * Starts a one-off checkout for the given product and returns the session
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
        const product = request.product
        checkArgument(
            (product.kind ?? "one_time") === "one_time",
            "createCheckoutSession only accepts one_time products; " +
                "use createSubscriptionCheckoutSession for subscriptions.",
        )
        return await this.createSession({
            idempotencyKey: request.idempotencyKey,
            origin: request.origin,
            product,
            mode: "PAYMENT",
            userId: null,
        })
    }

    /**
     * Starts a subscription checkout. Unlike one-off checkout, this is never
     * anonymous: recurring billing entitles an account, so the caller must
     * pass the authenticated user the subscription will belong to (the
     * GraphQL mutation is deliberately NOT in the public allowlist).
     *
     * The modes mirror one-off checkout: local sessions point at the in-app
     * test checkout page (completing it activates a simulated subscription);
     * stripe sessions are real `mode=subscription` Checkout Sessions on
     * Stripe's hosted page.
     */
    async createSubscriptionCheckoutSession(
        request: CreateSubscriptionCheckoutSessionRequest,
    ): Promise<CheckoutSession> {
        const product = request.product
        checkArgument(
            product.kind === "subscription",
            "createSubscriptionCheckoutSession only accepts subscription products.",
        )
        checkArgument(product.interval !== undefined, "A subscription product must declare an interval.")
        checkArgument(request.userId !== "", "userId must not be empty.")
        return await this.createSession({
            idempotencyKey: request.idempotencyKey,
            origin: request.origin,
            product,
            mode: "SUBSCRIPTION",
            userId: request.userId,
        })
    }

    private async createSession(request: {
        idempotencyKey: string
        origin: string
        product: PaymentProduct
        mode: "PAYMENT" | "SUBSCRIPTION"
        userId: string | null
    }): Promise<CheckoutSession> {
        const origin = parseOrigin(request.origin)
        const product = request.product
        const recurringInterval: RecurringInterval | null =
            request.mode === "SUBSCRIPTION" && product.interval !== undefined
                ? (product.interval.toUpperCase() as RecurringInterval)
                : null
        // The row id goes into the redirect URLs, so it is allocated before
        // the insert; idempotentInsertAndGet keeps the explicit id.
        const sessionId = newRowIdForTable(checkoutSessionsTable)

        if (paymentsMode() === "local") {
            const newSession = checkoutSessionInsertSchema.parse({
                provider: "LOCAL",
                status: "PENDING",
                mode: request.mode,
                userId: request.userId,
                productKey: product.key,
                productName: product.name,
                amountTotal: product.priceMinorUnits,
                currency: product.currency,
                recurringInterval,
                checkoutUrl: `${origin}${TEST_CHECKOUT_PATH}?session=${sessionId}`,
            })
            return await idempotentInsertAndGet(
                paymentsDb,
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
            ...(request.mode === "SUBSCRIPTION"
                ? { mode: "subscription" as const, recurringInterval: product.interval }
                : {}),
        })
        if (stripeSession.url === null) {
            throw new RpcError("INTERNAL", "Stripe returned a checkout session without a URL.")
        }
        const newSession = checkoutSessionInsertSchema.parse({
            provider: "STRIPE",
            status: "PENDING",
            mode: request.mode,
            userId: request.userId,
            productKey: product.key,
            productName: product.name,
            amountTotal: product.priceMinorUnits,
            currency: product.currency,
            recurringInterval,
            stripeSessionId: stripeSession.id,
            checkoutUrl: stripeSession.url,
        })
        return await idempotentInsertAndGet(
            paymentsDb,
            checkoutSessionsTable,
            { ...newSession, id: sessionId },
            request.idempotencyKey,
        )
    }

    /**
     * Loads a checkout session for the success page. STRIPE sessions still
     * PENDING are verified against Stripe server-side and marked PAID once
     * Stripe reports payment_status "paid" — the buyer's redirect alone is
     * never trusted as proof of payment. Subscription sessions activate
     * their subscription row on the same observation, so subscription state
     * converges even when no webhook is configured.
     */
    async getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
        const session = await getRowByIdOrThrow(paymentsDb, checkoutSessionsTable, sessionId)
        if (session.provider !== "STRIPE" || session.status === "PAID") {
            return session
        }
        checkArgument(session.stripeSessionId !== null, "Stripe session id is missing.")
        const stripeSession = await getStripeWrapper().retrieveCheckoutSession(session.stripeSessionId)
        if (stripeSession.paymentStatus !== "paid") {
            return session
        }
        const paid = await this.markSessionPaid(session, {
            buyerEmail: stripeSession.customerEmail,
            stripeSubscriptionId: stripeSession.subscriptionId,
            stripeCustomerId: stripeSession.customerId,
        })
        // Pull the authoritative status + period end once at activation so
        // the success-page path converges without the webhook.
        if (paid.mode === "SUBSCRIPTION" && stripeSession.subscriptionId !== null) {
            const stripeSubscription = await getStripeWrapper().retrieveSubscription(
                stripeSession.subscriptionId,
            )
            const status = subscriptionStatusFromStripe(stripeSubscription.status)
            if (status !== undefined) {
                await this.applyStripeSubscriptionEvent({
                    stripeSubscriptionId: stripeSubscription.id,
                    status,
                    currentPeriodEndEpochSeconds: stripeSubscription.currentPeriodEndEpochSeconds,
                })
            }
        }
        return paid
    }

    /**
     * The test checkout's "Pay" button. Only meaningful in PAYMENTS_MODE=local
     * — in stripe mode this refuses outright, so a deployed storefront can
     * never have a session faked to PAID through this mutation. Completing a
     * SUBSCRIPTION session activates the simulated subscription.
     */
    async completeTestCheckoutSession(sessionId: string): Promise<CheckoutSession> {
        if (paymentsMode() !== "local") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "The test checkout only exists when PAYMENTS_MODE=local. " +
                    "Deployed storefronts complete payment on Stripe's hosted page.",
            )
        }
        const session = await getRowByIdOrThrow(paymentsDb, checkoutSessionsTable, sessionId)
        if (session.provider !== "LOCAL") {
            throw new RpcError("FAILED_PRECONDITION", "Only LOCAL sessions can be test-completed.")
        }
        if (session.status === "PAID") {
            return session
        }
        return await this.markSessionPaid(session, {})
    }

    /**
     * The Stripe webhook's path to PAID: checkout.session.completed carries
     * Stripe's session id, and the matching row (if any) is marked PAID and
     * ledgered (purchases for one-off sessions, subscriptions for
     * subscription sessions). Unknown ids are ignored — Stripe retries
     * deliveries and other Stripe products may share the endpoint.
     */
    async markSessionPaidByStripeSessionId(
        stripeSessionId: string,
        observation?: PaidObservation,
    ): Promise<CheckoutSession | undefined> {
        checkArgument(stripeSessionId !== "", "stripeSessionId must not be empty.")
        const [session] = await paymentsDb
            .select()
            .from(checkoutSessionsTable)
            .where(eq(checkoutSessionsTable.stripeSessionId, stripeSessionId))
        if (session === undefined) {
            return undefined
        }
        if (session.status === "PAID") {
            return session
        }
        return await this.markSessionPaid(session, observation ?? {})
    }

    /**
     * The session-gated delivery guard: loads the session (verifying against
     * Stripe if still PENDING) and throws PERMISSION_DENIED unless it is
     * PAID. Endpoints that unlock content after purchase call this first.
     */
    async requirePaidCheckoutSession(sessionId: string): Promise<CheckoutSession> {
        const session = await this.getCheckoutSession(sessionId)
        if (session.status !== "PAID") {
            throw new RpcError("PERMISSION_DENIED", "This checkout session has not been paid.")
        }
        return session
    }

    /**
     * The purchase ledger, newest first by default. Authenticated (owner
     * dashboards); buyers see their own confirmation via getCheckoutSession.
     */
    async listPurchases(request: { connection: ConnectionParameters }): Promise<ListRowsResult<Purchase>> {
        return await listRows(paymentsDb, purchasesTable, request.connection)
    }

    /**
     * The entitlement check every subscription-gated feature goes through:
     * true when the user holds an ACTIVE subscription to the product.
     * PAST_DUE and CANCELED do not entitle — Stripe's own dunning emails are
     * the grace period.
     */
    async hasActiveSubscription(userId: string, productKey: string): Promise<boolean> {
        checkArgument(userId !== "", "userId must not be empty.")
        const [row] = await paymentsDb
            .select({ id: subscriptionsTable.id })
            .from(subscriptionsTable)
            .where(
                and(
                    eq(subscriptionsTable.userId, userId),
                    eq(subscriptionsTable.productKey, productKey),
                    eq(subscriptionsTable.status, "ACTIVE"),
                ),
            )
            .limit(1)
        return row !== undefined
    }

    /**
     * The caller's most recent subscription (optionally scoped to one
     * product), or undefined. Backs the `mySubscription` query and the
     * settings Billing card.
     */
    async getSubscriptionForUser(
        userId: string,
        productKey?: string | null,
    ): Promise<Subscription | undefined> {
        checkArgument(userId !== "", "userId must not be empty.")
        const conditions = [eq(subscriptionsTable.userId, userId)]
        if (productKey !== undefined && productKey !== null) {
            conditions.push(eq(subscriptionsTable.productKey, productKey))
        }
        const [row] = await paymentsDb
            .select()
            .from(subscriptionsTable)
            .where(and(...conditions))
            .orderBy(desc(subscriptionsTable.rowCreatedAt))
            .limit(1)
        return row
    }

    /**
     * A Billing Portal session URL for the user's subscription.
     *
     * PAYMENTS_MODE=local: the in-app test billing page (/billing/test),
     * clearly labeled like the test checkout, where the simulated
     * subscription can be cancelled.
     *
     * PAYMENTS_MODE=stripe: a real Stripe Billing Portal session for the
     * subscription's Stripe customer; Stripe owns cancellation, payment
     * methods, and invoices there.
     */
    async createBillingPortalSession(request: { userId: string; origin: string }): Promise<string> {
        const origin = parseOrigin(request.origin)
        if (paymentsMode() === "local") {
            return `${origin}${TEST_BILLING_PATH}`
        }
        const subscription = await this.getSubscriptionForUser(request.userId)
        if (subscription === undefined || subscription.stripeCustomerId === null) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "There is no billed subscription to manage for this account.",
            )
        }
        const portal = await getStripeWrapper().createBillingPortalSession({
            customerId: subscription.stripeCustomerId,
            returnUrl: `${origin}${SETTINGS_PATH}`,
        })
        return portal.url
    }

    /**
     * The test billing page's "Cancel subscription" button. Only meaningful
     * in PAYMENTS_MODE=local — in stripe mode this refuses outright
     * (mirroring completeTestCheckoutSession), so a deployed subscription
     * can only be cancelled through Stripe's Billing Portal.
     */
    async cancelTestSubscription(userId: string): Promise<Subscription> {
        if (paymentsMode() !== "local") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "The test billing page only exists when PAYMENTS_MODE=local. " +
                    "Deployed subscriptions are managed through Stripe's Billing Portal.",
            )
        }
        const subscription = await this.getSubscriptionForUser(userId)
        if (subscription === undefined) {
            throw new RpcError("NOT_FOUND", "There is no subscription to cancel.")
        }
        if (subscription.provider !== "LOCAL") {
            throw new RpcError("FAILED_PRECONDITION", "Only LOCAL subscriptions can be test-cancelled.")
        }
        if (subscription.status === "CANCELED") {
            return subscription
        }
        return await updateRowReturning(
            paymentsDb,
            subscriptionsTable,
            subscription.id,
            subscriptionUpdateSchema.parse({ status: "CANCELED" }),
        )
    }

    /**
     * The Stripe webhook's path for subscription lifecycle transitions
     * (customer.subscription.updated/deleted, invoice.paid/payment_failed):
     * the matching row (by Stripe's subscription id) moves to the given
     * status. Unknown ids are ignored — Stripe retries deliveries and other
     * Stripe products may share the endpoint.
     */
    async applyStripeSubscriptionEvent(request: {
        stripeSubscriptionId: string
        status: SubscriptionStatus
        currentPeriodEndEpochSeconds?: number | null
    }): Promise<Subscription | undefined> {
        checkArgument(request.stripeSubscriptionId !== "", "stripeSubscriptionId must not be empty.")
        const [subscription] = await paymentsDb
            .select()
            .from(subscriptionsTable)
            .where(eq(subscriptionsTable.stripeSubscriptionId, request.stripeSubscriptionId))
        if (subscription === undefined) {
            return undefined
        }
        const currentPeriodEnd =
            request.currentPeriodEndEpochSeconds != null
                ? new Date(request.currentPeriodEndEpochSeconds * 1000)
                : undefined
        return await updateRowReturning(
            paymentsDb,
            subscriptionsTable,
            subscription.id,
            subscriptionUpdateSchema.parse({ status: request.status, currentPeriodEnd }),
        )
    }

    /**
     * Marks a session PAID and writes its ledger row — purchases for one-off
     * sessions, subscriptions for subscription sessions — in one transaction.
     * The unique constraint on checkout_session_id makes the write idempotent
     * across the racing observers (webhook delivery retries, the success
     * page's verification, ...) — and gates the receipt email, so the buyer
     * gets exactly one receipt no matter how many observers see the same
     * payment.
     */
    private async markSessionPaid(
        session: CheckoutSession,
        observation: PaidObservation,
    ): Promise<CheckoutSession> {
        const buyerEmail = observation.buyerEmail ?? null
        const { updated, ledgered } = await paymentsDb.transaction(async (tx) => {
            const updatedSession = await updateRowReturning(
                tx,
                checkoutSessionsTable,
                session.id,
                checkoutSessionUpdateSchema.parse({ status: "PAID" }),
            )

            if (updatedSession.mode === "SUBSCRIPTION") {
                if (updatedSession.userId === null || updatedSession.recurringInterval === null) {
                    throw new RpcError(
                        "INTERNAL",
                        "A SUBSCRIPTION checkout session is missing its user or interval.",
                    )
                }
                const newSubscription = subscriptionInsertSchema.parse({
                    checkoutSessionId: updatedSession.id,
                    userId: updatedSession.userId,
                    provider: updatedSession.provider,
                    stripeSubscriptionId: observation.stripeSubscriptionId ?? null,
                    stripeCustomerId: observation.stripeCustomerId ?? null,
                    productKey: updatedSession.productKey,
                    productName: updatedSession.productName,
                    amountTotal: updatedSession.amountTotal,
                    currency: updatedSession.currency,
                    recurringInterval: updatedSession.recurringInterval,
                    status: "ACTIVE",
                })
                const inserted = await tx
                    .insert(subscriptionsTable)
                    .values({ ...newSubscription, id: newRowIdForTable(subscriptionsTable) })
                    .onConflictDoNothing({ target: subscriptionsTable.checkoutSessionId })
                    .returning({ id: subscriptionsTable.id })
                return { updated: updatedSession, ledgered: inserted.length > 0 }
            }

            const newPurchase = purchaseInsertSchema.parse({
                checkoutSessionId: updatedSession.id,
                provider: updatedSession.provider,
                productKey: updatedSession.productKey,
                productName: updatedSession.productName,
                amountTotal: updatedSession.amountTotal,
                currency: updatedSession.currency,
                buyerEmail,
            })
            const inserted = await tx
                .insert(purchasesTable)
                .values({ ...newPurchase, id: newRowIdForTable(purchasesTable) })
                .onConflictDoNothing({ target: purchasesTable.checkoutSessionId })
                .returning({ id: purchasesTable.id })
            return { updated: updatedSession, ledgered: inserted.length > 0 }
        })
        if (ledgered && buyerEmail !== null && buyerEmail !== "") {
            await this.sendReceipt(updated, buyerEmail)
        }
        return updated
    }

    /**
     * The mail kernel composition: one receipt per ledgered purchase or
     * activated subscription, sent after the transaction commits.
     * Best-effort — a mail failure must never fail the payment observation
     * it rides on (Stripe would retry the webhook against an already-PAID
     * session and the receipt would be lost anyway, since the ledger write
     * only happens once).
     */
    private async sendReceipt(session: CheckoutSession, buyerEmail: string): Promise<void> {
        try {
            if (session.mode === "SUBSCRIPTION") {
                await mailService.sendTemplatedMail({
                    toEmail: buyerEmail,
                    templateKey: "subscriptionStarted",
                    variables: {
                        productName: session.productName,
                        amountLabel: formatAmountLabel(session.amountTotal, session.currency),
                        intervalLabel: (session.recurringInterval ?? "MONTH").toLowerCase(),
                        orderReference: session.id,
                    },
                })
                return
            }
            await mailService.sendTemplatedMail({
                toEmail: buyerEmail,
                templateKey: "purchaseReceipt",
                variables: {
                    productName: session.productName,
                    amountLabel: formatAmountLabel(session.amountTotal, session.currency),
                    orderReference: session.id,
                },
            })
        } catch (error) {
            console.error("Failed to send the payment receipt email.", error)
        }
    }
}

/** What an observer of payment learned from Stripe; empty for LOCAL test completions. */
interface PaidObservation {
    buyerEmail?: string | null
    stripeSubscriptionId?: string | null
    stripeCustomerId?: string | null
}

/**
 * Maps Stripe's subscription status vocabulary onto the kernel's three
 * states. Unknown statuses map to undefined — callers should leave the row
 * unchanged rather than guess.
 */
export function subscriptionStatusFromStripe(stripeStatus: string): SubscriptionStatus | undefined {
    switch (stripeStatus) {
        case "active":
        case "trialing":
            return "ACTIVE"
        case "past_due":
        case "incomplete":
            return "PAST_DUE"
        case "canceled":
        case "unpaid":
        case "incomplete_expired":
            return "CANCELED"
        default:
            return undefined
    }
}

/** "$12.34" from minor units, honoring the currency's decimal places (JPY has none). */
function formatAmountLabel(amountMinorUnits: number, currency: string): string {
    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
    })
    const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2
    return formatter.format(amountMinorUnits / 10 ** fractionDigits)
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

export const paymentsService = new PaymentsService()

export interface CreateCheckoutSessionRequest {
    idempotencyKey: string
    /** The web app's origin, e.g. "https://myshop.example"; redirect URLs are built from it. */
    origin: string
    /** Resolved server-side by the caller's catalog; never from client input. */
    product: PaymentProduct
}

export interface CreateSubscriptionCheckoutSessionRequest {
    idempotencyKey: string
    /** The web app's origin, e.g. "https://myapp.example"; redirect URLs are built from it. */
    origin: string
    /** Resolved server-side by the caller's catalog; never from client input. Must be kind "subscription". */
    product: PaymentProduct
    /** The authenticated user the subscription entitles. Never anonymous. */
    userId: string
}
