import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { createServer, Server } from "node:http"
import { AddressInfo } from "node:net"
import { expect } from "chai"
import { eq } from "drizzle-orm"
import { buildPaymentsExpressApp } from "../../src/CloudFunctions/Payments.js"
import { subscriptionsTable } from "../../src/Data/Payments/Subscription.js"
import { paymentsDb } from "../../src/Data/PaymentsDatabase.js"
import { FakeMailWrapper, setMailWrapperForTests } from "../../src/DependencyWrappers/MailWrapper/index.js"
import { setStripeWrapperForTests } from "../../src/DependencyWrappers/StripeWrapper/index.js"
import { paymentsService } from "../../src/Services/Payments/PaymentsService.js"
import { buildStripeSignatureHeaderForTests } from "../../src/Services/Payments/StripeWebhook.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import { asUser, executeGql, executeGqlAt, firstGqlError } from "../Utils/Gql/GqlUtils.js"
import { FakeStripeWrapper } from "../Utils/Helpers/FakeStripeWrapper.js"
import { addDefaults } from "../Utils/TestContext.js"

const createSubscriptionCheckoutSessionMutation = `
    mutation CreateSubscriptionCheckoutSession($input: CreateSubscriptionCheckoutSessionInput!) {
        createSubscriptionCheckoutSession(input: $input) {
            id provider status mode checkoutUrl productKey productName amountTotal currency recurringInterval
        }
    }
`

const checkoutSessionQuery = `
    query CheckoutSession($id: Id!) {
        checkoutSession(id: $id) { id provider status mode }
    }
`

const completeTestCheckoutSessionMutation = `
    mutation CompleteTestCheckoutSession($input: CompleteTestCheckoutSessionInput!) {
        completeTestCheckoutSession(input: $input) { id status mode }
    }
`

const mySubscriptionQuery = `
    query MySubscription($productKey: String) {
        mySubscription(productKey: $productKey) {
            id status provider productKey productName amountTotal currency recurringInterval currentPeriodEnd
        }
    }
`

const createBillingPortalSessionMutation = `
    mutation CreateBillingPortalSession($input: CreateBillingPortalSessionInput!) {
        createBillingPortalSession(input: $input) { url }
    }
`

const cancelTestSubscriptionMutation = `
    mutation CancelTestSubscription {
        cancelTestSubscription { id status }
    }
`

interface GqlCheckoutSessionResult {
    id: string
    provider: string
    status: string
    mode: string
    checkoutUrl: string
    productKey: string
    productName: string
    amountTotal: number
    currency: string
    recurringInterval: string | null
}

interface GqlSubscriptionResult {
    id: string
    status: string
    provider: string
    productKey: string
    productName: string
    amountTotal: number
    currency: string
    recurringInterval: string
    currentPeriodEnd: string | null
}

function createSessionInput(fields: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        input: {
            idempotencyKey: randomUUID(),
            fields: { origin: "http://localhost:5173", ...fields },
        },
    }
}

/**
 * Runs a block with an env override; the validated-env cache is reset around
 * it so services see the override.
 */
async function withEnv(
    overrides: Record<string, string | undefined>,
    block: () => Promise<void>,
): Promise<void> {
    const originals = new Map<string, string | undefined>()
    for (const [name, value] of Object.entries(overrides)) {
        originals.set(name, process.env[name])
        if (value === undefined) {
            delete process.env[name]
        } else {
            process.env[name] = value
        }
    }
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        for (const [name, value] of originals) {
            if (value === undefined) {
                delete process.env[name]
            } else {
                process.env[name] = value
            }
        }
        resetValidatedEnvForTests()
    }
}

const WEBHOOK_SECRET = "whsec_test_secret"

describe("Subscriptions", function () {
    describe("subscription checkout is never anonymous", function () {
        // The gate throws from the Apollo request pipeline (not a resolver),
        // so executeOperation rejects; over HTTP the client still receives a
        // GraphQL error with extensions.code UNAUTHENTICATED via formatError.
        it("refuses an anonymous caller at the execution gate", async function () {
            await expect(
                executeGql(
                    this.apolloServer,
                    createSubscriptionCheckoutSessionMutation,
                    createSessionInput(),
                    null,
                ),
            ).to.be.rejectedWith("This operation requires an authenticated caller.")
        })

        it("refuses a caller without an application user", async function () {
            // The default harness principal is authenticated but has no user.
            const response = await executeGql(
                this.apolloServer,
                createSubscriptionCheckoutSessionMutation,
                createSessionInput(),
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("UNAUTHENTICATED")
        })

        it("refuses anonymous mySubscription and cancelTestSubscription too", async function () {
            await expect(executeGql(this.apolloServer, mySubscriptionQuery, {}, null)).to.be.rejectedWith(
                "This operation requires an authenticated caller.",
            )
            await expect(
                executeGql(this.apolloServer, cancelTestSubscriptionMutation, {}, null),
            ).to.be.rejectedWith("This operation requires an authenticated caller.")
        })
    })

    describe("local mode (PAYMENTS_MODE=local)", function () {
        it("activates a simulated subscription through the test checkout, exactly once", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)

            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createSubscriptionCheckoutSessionMutation,
                createSessionInput(),
                "createSubscriptionCheckoutSession",
                principal,
            )
            expect(session.provider).to.equal("LOCAL")
            expect(session.mode).to.equal("SUBSCRIPTION")
            expect(session.status).to.equal("PENDING")
            expect(session.recurringInterval).to.equal("MONTH")
            // The server-side plan catalog priced the session, not the client.
            expect(session.productKey).to.equal("growth")
            expect(session.amountTotal).to.equal(2900)
            expect(session.checkoutUrl).to.equal(`http://localhost:5173/checkout/test?session=${session.id}`)

            // Before payment there is no subscription and no entitlement.
            const before = await executeGql(this.apolloServer, mySubscriptionQuery, {}, principal)
            assert(before.body.kind === "single")
            expect(before.body.singleResult.data?.mySubscription).to.equal(null)
            expect(await paymentsService.hasActiveSubscription(this.defaults.user!.id, "growth")).to.equal(
                false,
            )

            // Completing the test checkout twice must activate exactly once.
            await executeGqlAt(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )
            await executeGqlAt(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )
            // No GraphQL path enumerates subscription rows, so the
            // exactly-once assertion reads the table directly.
            const rows = await paymentsDb
                .select({ id: subscriptionsTable.id })
                .from(subscriptionsTable)
                .where(eq(subscriptionsTable.checkoutSessionId, session.id))
            expect(rows).to.have.length(1)

            const subscription = await executeGqlAt<GqlSubscriptionResult>(
                this.apolloServer,
                mySubscriptionQuery,
                {},
                "mySubscription",
                principal,
            )
            expect(subscription.status).to.equal("ACTIVE")
            expect(subscription.provider).to.equal("LOCAL")
            expect(subscription.productKey).to.equal("growth")
            expect(subscription.recurringInterval).to.equal("MONTH")

            // The entitlement helper sees the activation; other products don't.
            expect(await paymentsService.hasActiveSubscription(this.defaults.user!.id, "growth")).to.equal(
                true,
            )
            expect(
                await paymentsService.hasActiveSubscription(this.defaults.user!.id, "other-plan"),
            ).to.equal(false)
        })

        it("scopes mySubscription by productKey", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createSubscriptionCheckoutSessionMutation,
                createSessionInput({ productKey: "growth" }),
                "createSubscriptionCheckoutSession",
                principal,
            )
            await executeGqlAt(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )

            const scoped = await executeGqlAt<GqlSubscriptionResult>(
                this.apolloServer,
                mySubscriptionQuery,
                { productKey: "growth" },
                "mySubscription",
                principal,
            )
            expect(scoped.productKey).to.equal("growth")

            const other = await executeGql(
                this.apolloServer,
                mySubscriptionQuery,
                { productKey: "no-such-plan" },
                principal,
            )
            assert(other.body.kind === "single")
            expect(other.body.singleResult.data?.mySubscription).to.equal(null)
        })

        it("returns the in-app test billing page as the billing portal and cancels through it", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createSubscriptionCheckoutSessionMutation,
                createSessionInput(),
                "createSubscriptionCheckoutSession",
                principal,
            )
            await executeGqlAt(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )

            const portal = await executeGqlAt<{ url: string }>(
                this.apolloServer,
                createBillingPortalSessionMutation,
                { input: { origin: "http://localhost:5173/some/path" } },
                "createBillingPortalSession",
                principal,
            )
            // Only the origin is kept — no path smuggling.
            expect(portal.url).to.equal("http://localhost:5173/billing/test")

            const cancelled = await executeGqlAt<{ id: string; status: string }>(
                this.apolloServer,
                cancelTestSubscriptionMutation,
                {},
                "cancelTestSubscription",
                principal,
            )
            expect(cancelled.status).to.equal("CANCELED")
            expect(await paymentsService.hasActiveSubscription(this.defaults.user!.id, "growth")).to.equal(
                false,
            )
        })

        it("rejects an unknown plan key", async function () {
            await addDefaults(this, ["account", "user"])
            const response = await executeGql(
                this.apolloServer,
                createSubscriptionCheckoutSessionMutation,
                createSessionInput({ productKey: "no-such-plan" }),
                asUser(this.defaults.user!),
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("NOT_FOUND")
        })
    })

    describe("stripe mode (PAYMENTS_MODE=stripe)", function () {
        let fakeStripe: FakeStripeWrapper

        beforeEach(function () {
            fakeStripe = new FakeStripeWrapper()
            setStripeWrapperForTests(fakeStripe)
        })

        afterEach(function () {
            setStripeWrapperForTests(undefined)
        })

        it("creates a mode=subscription session with the recurring interval", async function () {
            await addDefaults(this, ["account", "user"])
            await withEnv({ PAYMENTS_MODE: "stripe" }, async () => {
                const session = await executeGqlAt<GqlCheckoutSessionResult>(
                    this.apolloServer,
                    createSubscriptionCheckoutSessionMutation,
                    createSessionInput(),
                    "createSubscriptionCheckoutSession",
                    asUser(this.defaults.user!),
                )
                expect(session.provider).to.equal("STRIPE")
                expect(session.mode).to.equal("SUBSCRIPTION")
                expect(session.checkoutUrl).to.equal("https://checkout.stripe.com/c/pay/cs_test_fake")

                const request = fakeStripe.createdRequests[0]
                expect(request.mode).to.equal("subscription")
                expect(request.recurringInterval).to.equal("month")
                expect(request.amountMinorUnits).to.equal(2900)
            })
        })

        it("activates via success-page verification (no webhook) and records Stripe ids", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            const mail = new FakeMailWrapper()
            setMailWrapperForTests(mail)
            try {
                await withEnv({ PAYMENTS_MODE: "stripe" }, async () => {
                    const session = await executeGqlAt<GqlCheckoutSessionResult>(
                        this.apolloServer,
                        createSubscriptionCheckoutSessionMutation,
                        createSessionInput(),
                        "createSubscriptionCheckoutSession",
                        principal,
                    )

                    const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 3600
                    fakeStripe.paymentStatus = "paid"
                    fakeStripe.customerEmail = "subscriber@example.com"
                    fakeStripe.subscriptionId = "sub_test_123"
                    fakeStripe.customerId = "cus_test_123"
                    fakeStripe.subscriptionStatus = "active"
                    fakeStripe.currentPeriodEndEpochSeconds = periodEnd

                    const paid = await executeGqlAt<GqlCheckoutSessionResult>(
                        this.apolloServer,
                        checkoutSessionQuery,
                        { id: session.id },
                        "checkoutSession",
                    )
                    expect(paid.status).to.equal("PAID")

                    const subscription = await executeGqlAt<GqlSubscriptionResult>(
                        this.apolloServer,
                        mySubscriptionQuery,
                        {},
                        "mySubscription",
                        principal,
                    )
                    expect(subscription.status).to.equal("ACTIVE")
                    expect(subscription.provider).to.equal("STRIPE")
                    assert(subscription.currentPeriodEnd !== null)
                    expect(new Date(subscription.currentPeriodEnd).getTime()).to.equal(periodEnd * 1000)

                    // Exactly one subscription-started receipt.
                    const receipts = mail.sentMessages.filter(
                        (message) => message.toEmail === "subscriber@example.com",
                    )
                    expect(receipts).to.have.length(1)
                    expect(receipts[0].subject).to.contain("subscription")

                    // The Billing Portal now works off the recorded customer.
                    const portal = await executeGqlAt<{ url: string }>(
                        this.apolloServer,
                        createBillingPortalSessionMutation,
                        { input: { origin: "https://myapp.example" } },
                        "createBillingPortalSession",
                        principal,
                    )
                    expect(portal.url).to.equal(fakeStripe.portalUrl)
                    expect(fakeStripe.portalRequests[0].customerId).to.equal("cus_test_123")
                    expect(fakeStripe.portalRequests[0].returnUrl).to.equal("https://myapp.example/settings")
                })
            } finally {
                setMailWrapperForTests(undefined)
            }
        })

        it("refuses the test cancellation outside local mode", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            // Activate a simulated subscription in local mode first.
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createSubscriptionCheckoutSessionMutation,
                createSessionInput(),
                "createSubscriptionCheckoutSession",
                principal,
            )
            await executeGqlAt(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )

            await withEnv({ PAYMENTS_MODE: "stripe" }, async () => {
                const response = await executeGql(
                    this.apolloServer,
                    cancelTestSubscriptionMutation,
                    {},
                    principal,
                )
                const error = firstGqlError(response)
                expect(error.code).to.equal("FAILED_PRECONDITION")
            })

            // The subscription is untouched.
            expect(await paymentsService.hasActiveSubscription(this.defaults.user!.id, "growth")).to.equal(
                true,
            )
        })
    })

    describe("webhook lifecycle transitions", function () {
        let server: Server
        let baseUrl: string
        let fakeStripe: FakeStripeWrapper

        beforeEach(function (done) {
            fakeStripe = new FakeStripeWrapper()
            setStripeWrapperForTests(fakeStripe)
            server = createServer(buildPaymentsExpressApp())
            server.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                done()
            })
        })

        afterEach(function (done) {
            setStripeWrapperForTests(undefined)
            server.close(() => done())
        })

        async function postWebhook(payload: string): Promise<Response> {
            const signatureHeader = buildStripeSignatureHeaderForTests({
                payload,
                secret: WEBHOOK_SECRET,
                timestampEpochSeconds: Math.floor(Date.now() / 1000),
            })
            return await fetch(`${baseUrl}/webhook`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "stripe-signature": signatureHeader,
                },
                body: payload,
            })
        }

        it("activates on checkout.session.completed and follows updated/deleted/invoice events", async function () {
            await addDefaults(this, ["account", "user"])
            const principal = asUser(this.defaults.user!)
            await withEnv({ PAYMENTS_MODE: "stripe", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }, async () => {
                const session = await executeGqlAt<GqlCheckoutSessionResult>(
                    this.apolloServer,
                    createSubscriptionCheckoutSessionMutation,
                    createSessionInput(),
                    "createSubscriptionCheckoutSession",
                    principal,
                )
                const stripeSessionId = await stripeSessionIdForRow(session.id)

                // checkout.session.completed → ACTIVE, exactly once even retried.
                const completed = JSON.stringify({
                    type: "checkout.session.completed",
                    data: {
                        object: {
                            id: stripeSessionId,
                            customer_details: { email: "subscriber@example.com" },
                            subscription: "sub_hook_1",
                            customer: "cus_hook_1",
                        },
                    },
                })
                expect((await postWebhook(completed)).status).to.equal(200)
                expect((await postWebhook(completed)).status).to.equal(200)

                const rows = await paymentsDb
                    .select({ id: subscriptionsTable.id })
                    .from(subscriptionsTable)
                    .where(eq(subscriptionsTable.checkoutSessionId, session.id))
                expect(rows).to.have.length(1)

                let subscription = await mySubscription(this, principal)
                expect(subscription.status).to.equal("ACTIVE")

                // customer.subscription.updated (past_due) → PAST_DUE.
                const periodEnd = Math.floor(Date.now() / 1000) + 7 * 24 * 3600
                const updated = JSON.stringify({
                    type: "customer.subscription.updated",
                    data: {
                        object: {
                            id: "sub_hook_1",
                            status: "past_due",
                            current_period_end: periodEnd,
                        },
                    },
                })
                expect((await postWebhook(updated)).status).to.equal(200)
                subscription = await mySubscription(this, principal)
                expect(subscription.status).to.equal("PAST_DUE")
                assert(subscription.currentPeriodEnd !== null)
                expect(new Date(subscription.currentPeriodEnd).getTime()).to.equal(periodEnd * 1000)

                // invoice.paid → back to ACTIVE (entitlement restored).
                const invoicePaid = JSON.stringify({
                    type: "invoice.paid",
                    data: { object: { id: "in_hook_1", subscription: "sub_hook_1" } },
                })
                expect((await postWebhook(invoicePaid)).status).to.equal(200)
                subscription = await mySubscription(this, principal)
                expect(subscription.status).to.equal("ACTIVE")

                // invoice.payment_failed → PAST_DUE.
                const invoiceFailed = JSON.stringify({
                    type: "invoice.payment_failed",
                    data: { object: { id: "in_hook_2", subscription: "sub_hook_1" } },
                })
                expect((await postWebhook(invoiceFailed)).status).to.equal(200)
                subscription = await mySubscription(this, principal)
                expect(subscription.status).to.equal("PAST_DUE")

                // customer.subscription.deleted → CANCELED.
                const deleted = JSON.stringify({
                    type: "customer.subscription.deleted",
                    data: { object: { id: "sub_hook_1", status: "canceled" } },
                })
                expect((await postWebhook(deleted)).status).to.equal(200)
                subscription = await mySubscription(this, principal)
                expect(subscription.status).to.equal("CANCELED")
                expect(
                    await paymentsService.hasActiveSubscription(this.defaults.user!.id, "growth"),
                ).to.equal(false)
            })
        })

        it("acknowledges subscription events for unknown subscription ids", async function () {
            await withEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }, async () => {
                const unknown = JSON.stringify({
                    type: "customer.subscription.updated",
                    data: { object: { id: "sub_unknown", status: "past_due" } },
                })
                expect((await postWebhook(unknown)).status).to.equal(200)
            })
        })
    })
})

/** Reads the caller's subscription through the GraphQL surface. */
async function mySubscription(
    context: Mocha.Context,
    principal: ReturnType<typeof asUser>,
): Promise<{ status: string; currentPeriodEnd: string | null }> {
    return await executeGqlAt<{ status: string; currentPeriodEnd: string | null }>(
        context.apolloServer,
        `query MySubscription { mySubscription { status currentPeriodEnd } }`,
        {},
        "mySubscription",
        principal,
    )
}

/** Reads the Stripe session id recorded on a checkout session row. */
async function stripeSessionIdForRow(sessionId: string): Promise<string> {
    const session = await paymentsService.getCheckoutSession(sessionId)
    assert(session.stripeSessionId !== null, "Expected a Stripe session id on the row.")
    return session.stripeSessionId
}
