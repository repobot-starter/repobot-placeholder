import { randomUUID } from "node:crypto"
import {
    CreateStripeBillingPortalSessionRequest,
    CreateStripeCheckoutSessionRequest,
    StripeBillingPortalSession,
    StripeCheckoutSession,
    StripeSubscription,
    StripeWrapper,
} from "../../../src/DependencyWrappers/StripeWrapper/index.js"

/**
 * The shared Stripe fake for PAYMENTS_MODE=stripe tests. Install with
 * setStripeWrapperForTests(fake) and restore with
 * setStripeWrapperForTests(undefined) in a finally/afterEach. Mutate the
 * public fields to script what "Stripe" reports back.
 */
export class FakeStripeWrapper implements StripeWrapper {
    /** Every createCheckoutSession request, for asserting what was sent to Stripe. */
    createdRequests: CreateStripeCheckoutSessionRequest[] = []
    /** Every createBillingPortalSession request. */
    portalRequests: CreateStripeBillingPortalSessionRequest[] = []

    /** What retrieveCheckoutSession reports as payment_status. */
    paymentStatus = "unpaid"
    /** The buyer email retrieveCheckoutSession reports. */
    customerEmail: string | null = null
    /** The subscription id retrieveCheckoutSession reports (subscription mode). */
    subscriptionId: string | null = null
    /** The customer id retrieve calls report. */
    customerId: string | null = null
    /** What retrieveSubscription reports as the Stripe status. */
    subscriptionStatus = "active"
    /** What retrieveSubscription reports as current_period_end. */
    currentPeriodEndEpochSeconds: number | null = null
    /** The Billing Portal URL createBillingPortalSession returns. */
    portalUrl = "https://billing.stripe.com/p/session/test_fake"

    async createCheckoutSession(request: CreateStripeCheckoutSessionRequest): Promise<StripeCheckoutSession> {
        this.createdRequests.push(request)
        return {
            id: `cs_test_${randomUUID().slice(0, 8)}`,
            url: "https://checkout.stripe.com/c/pay/cs_test_fake",
            paymentStatus: "unpaid",
            customerEmail: null,
            subscriptionId: null,
            customerId: null,
        }
    }

    async retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
        return {
            id: sessionId,
            url: null,
            paymentStatus: this.paymentStatus,
            customerEmail: this.customerEmail,
            subscriptionId: this.subscriptionId,
            customerId: this.customerId,
        }
    }

    async retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
        return {
            id: subscriptionId,
            status: this.subscriptionStatus,
            currentPeriodEndEpochSeconds: this.currentPeriodEndEpochSeconds,
            customerId: this.customerId,
        }
    }

    async createBillingPortalSession(
        request: CreateStripeBillingPortalSessionRequest,
    ): Promise<StripeBillingPortalSession> {
        this.portalRequests.push(request)
        return { url: this.portalUrl }
    }
}
