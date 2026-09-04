package com.baseapp.android.store

import com.baseapp.android.components.billing.SubscriptionSummary
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * State for the payments-kernel twin surfaces: the Settings Billing card
 * (mySubscription + the Billing Portal) and the subscribe flow. State only —
 * the workflows live in BillingComponent. Mirrors the iOS BillingStore.
 */
class BillingStore {
    data class State(
        val subscription: SubscriptionSummary? = null,
        /**
         * True once the first mySubscription load settled (the Billing card
         * stays hidden until then, mirroring the web card's
         * render-nothing-while-loading).
         */
        val hasLoadedSubscription: Boolean = false,
        val isLoadingSubscription: Boolean = false,
        val isOpeningPortal: Boolean = false,
        val isStartingCheckout: Boolean = false,
        val billingError: String? = null,
        val checkoutError: String? = null,
    )

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()

    fun setSubscription(value: SubscriptionSummary?) {
        _state.value = _state.value.copy(subscription = value, hasLoadedSubscription = true)
    }

    fun setLoadingSubscription(value: Boolean) {
        _state.value = _state.value.copy(isLoadingSubscription = value)
    }

    fun setOpeningPortal(value: Boolean) {
        _state.value = _state.value.copy(isOpeningPortal = value)
    }

    fun setStartingCheckout(value: Boolean) {
        _state.value = _state.value.copy(isStartingCheckout = value)
    }

    fun setBillingError(value: String?) {
        _state.value = _state.value.copy(billingError = value)
    }

    fun setCheckoutError(value: String?) {
        _state.value = _state.value.copy(checkoutError = value)
    }
}
