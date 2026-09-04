import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { createServer, Server } from "node:http"
import { AddressInfo } from "node:net"
import { expect } from "chai"
import { buildPaymentsExpressApp } from "../../src/CloudFunctions/Payments.js"
import { FakeMailWrapper, setMailWrapperForTests } from "../../src/DependencyWrappers/MailWrapper/index.js"
import { setStripeWrapperForTests } from "../../src/DependencyWrappers/StripeWrapper/index.js"
import { buildStripeSignatureHeaderForTests } from "../../src/Services/Payments/StripeWebhook.js"
import { resetValidatedEnvForTests, validatedEnv } from "../../src/Utils/Env.js"
import { executeGql, executeGqlAt, firstGqlError } from "../Utils/Gql/GqlUtils.js"
import { FakeStripeWrapper } from "../Utils/Helpers/FakeStripeWrapper.js"

const createCheckoutSessionMutation = `
    mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
        createCheckoutSession(input: $input) {
            id provider status checkoutUrl productKey productName amountTotal currency deliveryAvailable
        }
    }
`

const checkoutSessionQuery = `
    query CheckoutSession($id: Id!) {
        checkoutSession(id: $id) { id provider status deliveryAvailable }
    }
`

const completeTestCheckoutSessionMutation = `
    mutation CompleteTestCheckoutSession($input: CompleteTestCheckoutSessionInput!) {
        completeTestCheckoutSession(input: $input) { id status }
    }
`

const purchasesQuery = `
    query Purchases($input: PurchaseConnectionInput!) {
        purchases(input: $input) {
            nodes { id checkoutSessionId provider productKey productName amountTotal currency buyerEmail createdTime }
            pageInfo { hasNextPage }
        }
    }
`

const firstPageInput = {
    input: { connection: { pagination: { first: 10 }, sort: [] } },
}

interface GqlCheckoutSessionResult {
    id: string
    provider: string
    status: string
    checkoutUrl?: string
    productKey?: string
    deliveryAvailable?: boolean
}

interface GqlPurchasesResult {
    nodes: {
        id: string
        checkoutSessionId: string
        provider: string
        productKey: string
        amountTotal: number
        buyerEmail: string | null
    }[]
    pageInfo: { hasNextPage: boolean }
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

function webhookPayload(
    stripeSessionId: string,
    type = "checkout.session.completed",
    buyerEmail?: string,
): string {
    return JSON.stringify({
        type,
        data: {
            object: {
                id: stripeSessionId,
                ...(buyerEmail !== undefined ? { customer_details: { email: buyerEmail } } : {}),
            },
        },
    })
}

describe("Payments", function () {
    describe("purchases ledger", function () {
        it("records a purchase when the local test checkout completes, exactly once", async function () {
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput(),
                "createCheckoutSession",
            )
            await executeGqlAt(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )
            // Completing again must not write a second ledger row.
            await executeGqlAt(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )

            const purchases = await executeGqlAt<GqlPurchasesResult>(
                this.apolloServer,
                purchasesQuery,
                firstPageInput,
                "purchases",
            )
            const matching = purchases.nodes.filter((purchase) => purchase.checkoutSessionId === session.id)
            expect(matching).to.have.length(1)
            expect(matching[0].provider).to.equal("LOCAL")
            expect(matching[0].productKey).to.equal(session.productKey)
            // Sandbox checkouts have no buyer, so no email and no receipt.
            expect(matching[0].buyerEmail).to.equal(null)
        })

        it("records the purchase (with buyer email and receipt) when server-side verification observes a paid Stripe session", async function () {
            const fakeStripe = new FakeStripeWrapper()
            setStripeWrapperForTests(fakeStripe)
            const mail = new FakeMailWrapper()
            setMailWrapperForTests(mail)
            try {
                await withEnv({ PAYMENTS_MODE: "stripe" }, async () => {
                    const session = await executeGqlAt<GqlCheckoutSessionResult>(
                        this.apolloServer,
                        createCheckoutSessionMutation,
                        createSessionInput(),
                        "createCheckoutSession",
                    )
                    fakeStripe.paymentStatus = "paid"
                    fakeStripe.customerEmail = "verify-buyer@example.com"
                    const paid = await executeGqlAt<GqlCheckoutSessionResult>(
                        this.apolloServer,
                        checkoutSessionQuery,
                        { id: session.id },
                        "checkoutSession",
                    )
                    expect(paid.status).to.equal("PAID")

                    const purchases = await executeGqlAt<GqlPurchasesResult>(
                        this.apolloServer,
                        purchasesQuery,
                        firstPageInput,
                        "purchases",
                    )
                    const matching = purchases.nodes.filter(
                        (purchase) => purchase.checkoutSessionId === session.id,
                    )
                    expect(matching).to.have.length(1)
                    expect(matching[0].provider).to.equal("STRIPE")
                    expect(matching[0].buyerEmail).to.equal("verify-buyer@example.com")
                    expect(mail.lastMessageTo("verify-buyer@example.com")).to.not.equal(undefined)
                })
            } finally {
                setStripeWrapperForTests(undefined)
                setMailWrapperForTests(undefined)
            }
        })

        // The gate throws from the Apollo request pipeline (not a resolver),
        // so executeOperation rejects; over HTTP the client still receives a
        // GraphQL error with extensions.code UNAUTHENTICATED via formatError.
        it("requires an authenticated caller", async function () {
            await expect(
                executeGql(this.apolloServer, purchasesQuery, firstPageInput, null),
            ).to.be.rejectedWith("This operation requires an authenticated caller.")
        })
    })

    describe("boot guard for the simulated mode", function () {
        // Deployed = neither emulator nor tests, faked via env overrides.
        const deployedBase = {
            NODE_ENV: "production",
            FUNCTIONS_EMULATOR: undefined,
            PAYMENTS_MODE: "local",
        }

        it("refuses PAYMENTS_MODE=local on deployed production posture", async function () {
            await withEnv({ ...deployedBase, DEPLOY_POSTURE: "prod" }, async () => {
                expect(() => validatedEnv()).to.throw("Production must set PAYMENTS_MODE=stripe")
            })
            // No posture at all (defensive default) refuses too.
            await withEnv({ ...deployedBase, DEPLOY_POSTURE: undefined }, async () => {
                expect(() => validatedEnv()).to.throw("Production must set PAYMENTS_MODE=stripe")
            })
        })

        it("allows PAYMENTS_MODE=local on dev-posture deploys (simulated checkout before Stripe is connected)", async function () {
            await withEnv(
                // AUTH_MODE=builtin: the test env's AUTH_MODE=local would
                // (correctly) trip its own deployed-boot guard first.
                { ...deployedBase, DEPLOY_POSTURE: "dev", AUTH_MODE: "builtin" },
                async () => {
                    expect(validatedEnv().PAYMENTS_MODE).to.equal("local")
                },
            )
        })

        it("allows sandbox local modes once the brief GraphQL harness primes the emulator flag", async function () {
            // brief-gql loads .env.local (AUTH_MODE=local, PAYMENTS_MODE=local)
            // outside the Firebase emulator process. Without priming, the
            // PAYMENTS mutation-roundtrip fails project setup's storefront ask.
            const { primeBriefGqlSandboxEnv } = await import("../../scripts/brief-gql-env.mjs")
            await withEnv(
                {
                    ...deployedBase,
                    AUTH_MODE: "local",
                    PAYMENTS_MODE: "local",
                    DEPLOY_POSTURE: undefined,
                    LOCAL_AUTH_SECRET: "a".repeat(64),
                },
                async () => {
                    expect(() => validatedEnv()).to.throw("Environment validation failed")
                    primeBriefGqlSandboxEnv()
                    resetValidatedEnvForTests()
                    expect(validatedEnv().AUTH_MODE).to.equal("local")
                    expect(validatedEnv().PAYMENTS_MODE).to.equal("local")
                },
            )
        })
    })

    describe("shop catalog over the kernel", function () {
        it("creates a session for an explicit productKey and snapshots it", async function () {
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput({ productKey: "book" }),
                "createCheckoutSession",
            )
            expect(session.productKey).to.equal("book")
            // The book ships a delivery file (firebase/functions/delivery/book/).
            expect(session.deliveryAvailable).to.equal(true)
        })

        it("rejects an unknown productKey", async function () {
            const response = await executeGql(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput({ productKey: "no-such-product" }),
                null,
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("NOT_FOUND")
        })
    })

    describe("HTTP surface (payments__request__api)", function () {
        let server: Server
        let baseUrl: string

        beforeEach(function (done) {
            server = createServer(buildPaymentsExpressApp())
            server.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                done()
            })
        })

        afterEach(function (done) {
            server.close(() => done())
        })

        async function postWebhook(payload: string, signatureHeader: string | undefined): Promise<Response> {
            return await fetch(`${baseUrl}/webhook`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    ...(signatureHeader !== undefined ? { "stripe-signature": signatureHeader } : {}),
                },
                body: payload,
            })
        }

        function signedHeader(payload: string, secret = WEBHOOK_SECRET): string {
            return buildStripeSignatureHeaderForTests({
                payload,
                secret,
                timestampEpochSeconds: Math.floor(Date.now() / 1000),
            })
        }

        it("marks the session PAID, ledgers the purchase, and sends one receipt on checkout.session.completed", async function () {
            const fakeStripe = new FakeStripeWrapper()
            setStripeWrapperForTests(fakeStripe)
            const mail = new FakeMailWrapper()
            setMailWrapperForTests(mail)
            try {
                await withEnv(
                    { PAYMENTS_MODE: "stripe", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET },
                    async () => {
                        const session = await executeGqlAt<GqlCheckoutSessionResult>(
                            this.apolloServer,
                            createCheckoutSessionMutation,
                            createSessionInput(),
                            "createCheckoutSession",
                        )
                        // Look up the Stripe session id recorded on the row.
                        const stripeSessionId = await stripeSessionIdForRow(session.id)

                        const payload = webhookPayload(
                            stripeSessionId,
                            "checkout.session.completed",
                            "buyer@example.com",
                        )
                        const response = await postWebhook(payload, signedHeader(payload))
                        expect(response.status).to.equal(200)
                        // Stripe retries deliveries; the ledger's exactly-once
                        // write must also gate the receipt to exactly one.
                        const retried = await postWebhook(payload, signedHeader(payload))
                        expect(retried.status).to.equal(200)

                        const loaded = await executeGqlAt<GqlCheckoutSessionResult>(
                            this.apolloServer,
                            checkoutSessionQuery,
                            { id: session.id },
                            "checkoutSession",
                        )
                        expect(loaded.status).to.equal("PAID")

                        const purchases = await executeGqlAt<GqlPurchasesResult>(
                            this.apolloServer,
                            purchasesQuery,
                            firstPageInput,
                            "purchases",
                        )
                        const matching = purchases.nodes.filter(
                            (purchase) => purchase.checkoutSessionId === session.id,
                        )
                        expect(matching).to.have.length(1)
                        expect(matching[0].buyerEmail).to.equal("buyer@example.com")

                        const receipts = mail.sentMessages.filter(
                            (message) => message.toEmail === "buyer@example.com",
                        )
                        expect(receipts).to.have.length(1)
                        expect(receipts[0].subject).to.contain("receipt")
                        expect(receipts[0].html).to.contain(session.id)
                    },
                )
            } finally {
                setStripeWrapperForTests(undefined)
                setMailWrapperForTests(undefined)
            }
        })

        it("acknowledges deliveries for unknown sessions and unhandled event types", async function () {
            await withEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }, async () => {
                const unknownSession = webhookPayload("cs_unknown_session")
                const unknown = await postWebhook(unknownSession, signedHeader(unknownSession))
                expect(unknown.status).to.equal(200)

                const otherType = webhookPayload("cs_whatever", "invoice.paid")
                const ignored = await postWebhook(otherType, signedHeader(otherType))
                expect(ignored.status).to.equal(200)
            })
        })

        it("rejects a bad signature and a missing header", async function () {
            await withEnv({ STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET }, async () => {
                const payload = webhookPayload("cs_any")
                const badSignature = await postWebhook(payload, signedHeader(payload, "whsec_wrong"))
                expect(badSignature.status).to.equal(403)

                const missingHeader = await postWebhook(payload, undefined)
                expect(missingHeader.status).to.equal(403)
            })
        })

        it("refuses webhook deliveries when no signing secret is configured", async function () {
            await withEnv({ STRIPE_WEBHOOK_SECRET: undefined }, async () => {
                const payload = webhookPayload("cs_any")
                const response = await postWebhook(payload, signedHeader(payload))
                expect(response.status).to.equal(409)
                const body = (await response.json()) as { error: { code: string } }
                expect(body.error.code).to.equal("FAILED_PRECONDITION")
            })
        })

        it("delivers the product file only for PAID sessions", async function () {
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput({ productKey: "book" }),
                "createCheckoutSession",
            )

            // PENDING: delivery is refused.
            const refused = await fetch(`${baseUrl}/delivery?session=${session.id}`)
            expect(refused.status).to.equal(403)

            await executeGqlAt(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )

            const delivered = await fetch(`${baseUrl}/delivery?session=${session.id}`)
            expect(delivered.status).to.equal(200)
            expect(delivered.headers.get("content-disposition")).to.contain("bonus-letter")
            const body = await delivered.text()
            expect(body).to.contain("THE LIGHTHOUSE LETTERS")
        })

        it("fails NOT_FOUND for an unknown delivery session", async function () {
            const response = await fetch(`${baseUrl}/delivery?session=csn_does_not_exist`)
            expect(response.status).to.equal(404)
        })
    })
})

/** Reads the Stripe session id recorded on a checkout session row. */
async function stripeSessionIdForRow(sessionId: string): Promise<string> {
    const { paymentsService } = await import("../../src/Services/Payments/PaymentsService.js")
    const session = await paymentsService.getCheckoutSession(sessionId)
    assert(session.stripeSessionId !== null, "Expected a Stripe session id on the row.")
    return session.stripeSessionId
}
