import { StripeApiWrapper } from "./StripeApiWrapper.js"
import { StripeWrapper } from "./StripeWrapper.js"

export * from "./StripeApiWrapper.js"
export * from "./StripeWrapper.js"

let instance: StripeWrapper | undefined

/**
 * The Stripe client the Shop domain calls when PAYMENTS_MODE=stripe.
 * Constructed lazily so booting without a STRIPE_SECRET_KEY (every non-shop
 * deploy, and every local sandbox) never fails; local checkout never touches
 * this wrapper at all. Tests may replace it via setStripeWrapperForTests.
 */
export function getStripeWrapper(): StripeWrapper {
    if (instance === undefined) {
        instance = new StripeApiWrapper()
    }
    return instance
}

/** Test-only: substitutes a fake and returns a restore function. */
export function setStripeWrapperForTests(wrapper: StripeWrapper | undefined): void {
    instance = wrapper
}
