package com.baseapp.android.components.billing

import com.baseapp.android.store.BillingStore

/**
 * Workflows for the payments-kernel twin surfaces: loading the caller's
 * subscription (the Settings Billing card, web twin BillingCard in
 * SettingsPage.tsx), opening the Billing Portal, and starting a subscription
 * checkout (web twin SubscribePage.tsx). URL-opening is the view's concern
 * (an ACTION_VIEW intent, matching the OAuth pattern in SignInView); this
 * component owns the state transitions. Mirrors the iOS BillingComponent.
 */
class BillingComponent(
    private val billingStore: BillingStore,
    private val api: BillingApi,
    /**
     * The web app's origin the payments kernel builds redirect URLs from —
     * the twin of the web's window.location.origin. Null when the build
     * carries no WEB_ORIGIN (billing surfaces report unavailability).
     */
    private val webOrigin: () -> String?,
) {
    /**
     * Loads (or reloads) the caller's subscription. Mirrors the web card's
     * network-only fetch policy: always hits the backend so state set by a
     * checkout or the portal is picked up when the user returns to the app.
     */
    suspend fun loadSubscription() {
        billingStore.setLoadingSubscription(true)
        try {
            billingStore.setSubscription(api.fetchMySubscription(productKey = null))
        } catch (error: Exception) {
            // Web parity: a failed mySubscription query renders no Billing card;
            // the error is kept for the surfaces that want to show it.
            billingStore.setBillingError(error.message ?: FAILED_MESSAGE)
        } finally {
            billingStore.setLoadingSubscription(false)
        }
    }

    /**
     * Mints a Billing Portal session and returns its URL for the view to
     * open (Stripe's hosted portal, or the in-app test billing page in local
     * mode). Null means the attempt failed and billingError explains why.
     */
    suspend fun openBillingPortal(): String? {
        billingStore.setBillingError(null)
        val origin = webOrigin() ?: run {
            billingStore.setBillingError(MISSING_ORIGIN_MESSAGE)
            return null
        }
        billingStore.setOpeningPortal(true)
        return try {
            api.createBillingPortalSession(origin)
        } catch (error: Exception) {
            billingStore.setBillingError(error.message ?: FAILED_MESSAGE)
            null
        } finally {
            billingStore.setOpeningPortal(false)
        }
    }

    /**
     * Starts a subscription checkout and returns the session's checkout URL
     * for the view to open (Stripe's hosted page, or the in-app test checkout
     * in local mode). Null means the attempt failed and checkoutError explains
     * why. Never anonymous: the mutation is authenticated, and the shell only
     * reaches this surface signed in (the web twin routes signed-out visitors
     * to sign-up).
     */
    suspend fun startSubscriptionCheckout(productKey: String?): String? {
        billingStore.setCheckoutError(null)
        val origin = webOrigin() ?: run {
            billingStore.setCheckoutError(MISSING_ORIGIN_MESSAGE)
            return null
        }
        billingStore.setStartingCheckout(true)
        return try {
            api.createSubscriptionCheckoutSession(origin, productKey)
        } catch (error: Exception) {
            billingStore.setCheckoutError(error.message ?: FAILED_MESSAGE)
            null
        } finally {
            billingStore.setStartingCheckout(false)
        }
    }

    private companion object {
        const val MISSING_ORIGIN_MESSAGE =
            "Billing is not available in this build (no web app URL is configured)."
        const val FAILED_MESSAGE = "The billing request failed. Please try again."
    }
}
