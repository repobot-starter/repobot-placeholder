import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { expect } from "chai"
import {
    setStripeWrapperForTests,
    StripeCheckoutSession,
    StripeWrapper,
} from "../../src/DependencyWrappers/StripeWrapper/index.js"
import { resetValidatedEnvForTests } from "../../src/Utils/Env.js"
import { executeGql, executeGqlAt, firstGqlError } from "../Utils/Gql/GqlUtils.js"

const shopProductQuery = `
    query ShopProduct {
        shopProduct { key name tagline priceMinorUnits currency }
    }
`

const createCheckoutSessionMutation = `
    mutation CreateCheckoutSession($input: CreateCheckoutSessionInput!) {
        createCheckoutSession(input: $input) {
            id provider status checkoutUrl productName amountTotal currency
        }
    }
`

const checkoutSessionQuery = `
    query CheckoutSession($id: Id!) {
        checkoutSession(id: $id) { id provider status checkoutUrl }
    }
`

const completeTestCheckoutSessionMutation = `
    mutation CompleteTestCheckoutSession($input: CompleteTestCheckoutSessionInput!) {
        completeTestCheckoutSession(input: $input) { id status }
    }
`

interface GqlCheckoutSessionResult {
    id: string
    provider: string
    status: string
    checkoutUrl: string
    productName?: string
    amountTotal?: number
    currency?: string
}

function createSessionInput(origin = "http://localhost:5173"): Record<string, unknown> {
    return { input: { idempotencyKey: randomUUID(), fields: { origin } } }
}

/**
 * Runs a block with PAYMENTS_MODE temporarily overridden; the validated-env
 * cache is reset around it so the service sees the override.
 */
async function withPaymentsMode(mode: string, block: () => Promise<void>): Promise<void> {
    const original = process.env.PAYMENTS_MODE
    process.env.PAYMENTS_MODE = mode
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        process.env.PAYMENTS_MODE = original
        resetValidatedEnvForTests()
    }
}

class FakeStripeWrapper implements StripeWrapper {
    createdRequests: unknown[] = []
    paymentStatus = "unpaid"

    async createCheckoutSession(request: unknown): Promise<StripeCheckoutSession> {
        this.createdRequests.push(request)
        return {
            id: "cs_test_fake",
            url: "https://checkout.stripe.com/c/pay/cs_test_fake",
            paymentStatus: "unpaid",
        }
    }

    async retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
        return { id: sessionId, url: null, paymentStatus: this.paymentStatus }
    }
}

describe("Shop", function () {
    describe("shopProduct", function () {
        it("is queryable anonymously", async function () {
            // Buyers never sign in: null principal exercises the public gate.
            const response = await executeGql(this.apolloServer, shopProductQuery, {}, null)
            assert(response.body.kind === "single")
            expect(response.body.singleResult.errors).to.equal(undefined)
            const product = response.body.singleResult.data?.shopProduct as {
                priceMinorUnits: number
                currency: string
            }
            expect(product.priceMinorUnits).to.be.greaterThan(0)
            expect(product.currency).to.match(/^[a-z]{3}$/)
        })
    })

    describe("local checkout (PAYMENTS_MODE=local)", function () {
        it("creates a PENDING LOCAL session pointing at the test checkout page", async function () {
            const response = await executeGql(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput("http://localhost:5173/some/path"),
                null,
            )
            assert(response.body.kind === "single")
            expect(response.body.singleResult.errors).to.equal(undefined)
            const session = response.body.singleResult.data?.createCheckoutSession as GqlCheckoutSessionResult

            expect(session.provider).to.equal("LOCAL")
            expect(session.status).to.equal("PENDING")
            // Only the origin is kept — no path smuggling into redirect URLs.
            expect(session.checkoutUrl).to.equal(`http://localhost:5173/checkout/test?session=${session.id}`)
        })

        it("snapshots the server-side product price", async function () {
            const product = await executeGqlAt<{ name: string; priceMinorUnits: number; currency: string }>(
                this.apolloServer,
                shopProductQuery,
                {},
                "shopProduct",
            )
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput(),
                "createCheckoutSession",
            )
            expect(session.productName).to.equal(product.name)
            expect(session.amountTotal).to.equal(product.priceMinorUnits)
            expect(session.currency).to.equal(product.currency)
        })

        it("is idempotent on the idempotency key", async function () {
            const variables = createSessionInput()
            const first = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createCheckoutSessionMutation,
                variables,
                "createCheckoutSession",
            )
            const second = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createCheckoutSessionMutation,
                variables,
                "createCheckoutSession",
            )
            expect(second.id).to.equal(first.id)
        })

        it("rejects a non-URL origin", async function () {
            const response = await executeGql(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput("not a url"),
                null,
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("INVALID_ARGUMENT")
        })

        it("rejects a non-http(s) origin", async function () {
            const response = await executeGql(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput("javascript:alert(1)"),
                null,
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("INVALID_ARGUMENT")
        })

        it("completes the test checkout to PAID and stays PAID", async function () {
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput(),
                "createCheckoutSession",
            )

            const paid = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )
            expect(paid.status).to.equal("PAID")

            // Completing again is a no-op, and the success page sees PAID.
            const again = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                completeTestCheckoutSessionMutation,
                { input: { sessionId: session.id } },
                "completeTestCheckoutSession",
            )
            expect(again.status).to.equal("PAID")

            const loaded = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                checkoutSessionQuery,
                { id: session.id },
                "checkoutSession",
            )
            expect(loaded.status).to.equal("PAID")
        })

        it("fails NOT_FOUND for an unknown session id", async function () {
            const response = await executeGql(
                this.apolloServer,
                checkoutSessionQuery,
                { id: "csn_does_not_exist" },
                null,
            )
            const error = firstGqlError(response)
            expect(error.code).to.equal("NOT_FOUND")
        })
    })

    describe("stripe checkout (PAYMENTS_MODE=stripe)", function () {
        let fakeStripe: FakeStripeWrapper

        beforeEach(function () {
            fakeStripe = new FakeStripeWrapper()
            setStripeWrapperForTests(fakeStripe)
        })

        afterEach(function () {
            setStripeWrapperForTests(undefined)
        })

        it("creates a STRIPE session with the hosted checkout URL", async function () {
            await withPaymentsMode("stripe", async () => {
                const session = await executeGqlAt<GqlCheckoutSessionResult>(
                    this.apolloServer,
                    createCheckoutSessionMutation,
                    createSessionInput("https://myshop.example"),
                    "createCheckoutSession",
                )
                expect(session.provider).to.equal("STRIPE")
                expect(session.status).to.equal("PENDING")
                expect(session.checkoutUrl).to.equal("https://checkout.stripe.com/c/pay/cs_test_fake")

                // Redirect URLs are built from the buyer's origin and carry
                // our row id so the success page can verify server-side.
                const request = fakeStripe.createdRequests[0] as {
                    successUrl: string
                    cancelUrl: string
                }
                expect(request.successUrl).to.equal(
                    `https://myshop.example/checkout/success?session=${session.id}`,
                )
                expect(request.cancelUrl).to.equal("https://myshop.example/checkout/cancelled")
            })
        })

        it("verifies payment server-side on the success page query", async function () {
            await withPaymentsMode("stripe", async () => {
                const session = await executeGqlAt<GqlCheckoutSessionResult>(
                    this.apolloServer,
                    createCheckoutSessionMutation,
                    createSessionInput(),
                    "createCheckoutSession",
                )

                // Stripe has not settled payment: the session stays PENDING.
                const pending = await executeGqlAt<GqlCheckoutSessionResult>(
                    this.apolloServer,
                    checkoutSessionQuery,
                    { id: session.id },
                    "checkoutSession",
                )
                expect(pending.status).to.equal("PENDING")

                // Once Stripe reports "paid", the query marks the row PAID.
                fakeStripe.paymentStatus = "paid"
                const paid = await executeGqlAt<GqlCheckoutSessionResult>(
                    this.apolloServer,
                    checkoutSessionQuery,
                    { id: session.id },
                    "checkoutSession",
                )
                expect(paid.status).to.equal("PAID")
            })
        })

        it("refuses the test-checkout completion outside local mode", async function () {
            const session = await executeGqlAt<GqlCheckoutSessionResult>(
                this.apolloServer,
                createCheckoutSessionMutation,
                createSessionInput(),
                "createCheckoutSession",
            )
            await withPaymentsMode("stripe", async () => {
                const response = await executeGql(
                    this.apolloServer,
                    completeTestCheckoutSessionMutation,
                    { input: { sessionId: session.id } },
                    null,
                )
                const error = firstGqlError(response)
                expect(error.code).to.equal("FAILED_PRECONDITION")
            })
        })
    })
})
