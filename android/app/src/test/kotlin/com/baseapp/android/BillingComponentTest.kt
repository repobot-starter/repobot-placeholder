package com.baseapp.android

import com.baseapp.android.components.billing.BillingApi
import com.baseapp.android.components.billing.BillingComponent
import com.baseapp.android.components.billing.SubscriptionSummary
import com.baseapp.android.graphql.SubscriptionStatusValue
import com.baseapp.android.store.BillingStore
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * State-transition tests for the billing workflows (web twins: BillingCard's
 * manageBilling and SubscribePage's checkout effect) against a stubbed
 * payments API — mirroring the iOS BillingComponentTests.
 */
class BillingComponentTest {
    private val webOrigin = "https://myapp.example"

    private fun makeSummary() = SubscriptionSummary(
        status = SubscriptionStatusValue.ACTIVE,
        productName = "Pro",
        amountTotal = 2400,
        currency = "usd",
        recurringInterval = "MONTH",
        currentPeriodEnd = null,
    )

    private fun makeComponent(
        store: BillingStore,
        api: StubBillingApi,
        origin: String? = webOrigin,
    ) = BillingComponent(billingStore = store, api = api, webOrigin = { origin })

    @Test
    fun loadSubscriptionStoresTheSummaryAndMarksLoaded() = runTest {
        val store = BillingStore()
        val api = StubBillingApi(subscriptionResult = Result.success(makeSummary()))
        val component = makeComponent(store, api)

        assertFalse(store.state.value.hasLoadedSubscription)
        component.loadSubscription()

        assertEquals(makeSummary(), store.state.value.subscription)
        assertTrue(store.state.value.hasLoadedSubscription)
        assertFalse(store.state.value.isLoadingSubscription)
        assertNull(store.state.value.billingError)
    }

    @Test
    fun loadSubscriptionWithNoSubscriptionStillMarksLoaded() = runTest {
        val store = BillingStore()
        val component = makeComponent(store, StubBillingApi(subscriptionResult = Result.success(null)))

        component.loadSubscription()

        assertNull(store.state.value.subscription)
        assertTrue(store.state.value.hasLoadedSubscription)
    }

    @Test
    fun loadSubscriptionFailureRecordsErrorAndStaysUnloaded() = runTest {
        val store = BillingStore()
        val component = makeComponent(
            store,
            StubBillingApi(subscriptionResult = Result.failure(BillingStubFailure())),
        )

        component.loadSubscription()

        // Web parity: a failed mySubscription query renders no Billing card.
        assertFalse(store.state.value.hasLoadedSubscription)
        assertNotNull(store.state.value.billingError)
        assertFalse(store.state.value.isLoadingSubscription)
    }

    @Test
    fun openBillingPortalReturnsUrlAndPassesTheWebOrigin() = runTest {
        val store = BillingStore()
        val api = StubBillingApi(portalResult = Result.success("https://myapp.example/billing/test"))
        val component = makeComponent(store, api)

        val url = component.openBillingPortal()

        assertEquals("https://myapp.example/billing/test", url)
        assertEquals(listOf("https://myapp.example"), api.portalOrigins)
        assertFalse(store.state.value.isOpeningPortal)
        assertNull(store.state.value.billingError)
    }

    @Test
    fun openBillingPortalFailureRecordsError() = runTest {
        val store = BillingStore()
        val component = makeComponent(store, StubBillingApi(portalResult = Result.failure(BillingStubFailure())))

        val url = component.openBillingPortal()

        assertNull(url)
        assertNotNull(store.state.value.billingError)
        assertFalse(store.state.value.isOpeningPortal)
    }

    @Test
    fun openBillingPortalWithoutWebOriginFailsWithoutCallingApi() = runTest {
        val store = BillingStore()
        val api = StubBillingApi()
        val component = makeComponent(store, api, origin = null)

        val url = component.openBillingPortal()

        assertNull(url)
        assertNotNull(store.state.value.billingError)
        assertTrue(api.portalOrigins.isEmpty())
    }

    @Test
    fun startSubscriptionCheckoutReturnsCheckoutUrlAndClearsError() = runTest {
        val store = BillingStore()
        val api = StubBillingApi(checkoutResult = Result.failure(BillingStubFailure()))
        val component = makeComponent(store, api)

        // First attempt fails and records the error...
        val failedUrl = component.startSubscriptionCheckout(productKey = "pro")
        assertNull(failedUrl)
        assertNotNull(store.state.value.checkoutError)

        // ...a retry clears it and hands back the session's checkout URL.
        api.checkoutResult = Result.success("https://myapp.example/checkout/test?session=s1")
        val url = component.startSubscriptionCheckout(productKey = "pro")

        assertEquals("https://myapp.example/checkout/test?session=s1", url)
        assertNull(store.state.value.checkoutError)
        assertFalse(store.state.value.isStartingCheckout)
        assertEquals("https://myapp.example" to "pro", api.checkoutRequests.last())
    }

    @Test
    fun startSubscriptionCheckoutPassesNullProductKeyForTheDefaultPlan() = runTest {
        val store = BillingStore()
        val api = StubBillingApi(checkoutResult = Result.success("https://pay.example/session"))
        val component = makeComponent(store, api)

        component.startSubscriptionCheckout(productKey = null)

        assertEquals(1, api.checkoutRequests.size)
        assertNull(api.checkoutRequests[0].second)
    }
}

private class BillingStubFailure : Exception("The payments backend is unavailable.")

private class StubBillingApi(
    var subscriptionResult: Result<SubscriptionSummary?> = Result.success(null),
    var portalResult: Result<String> = Result.failure(BillingStubFailure()),
    var checkoutResult: Result<String> = Result.failure(BillingStubFailure()),
) : BillingApi {
    val portalOrigins = mutableListOf<String>()
    val checkoutRequests = mutableListOf<Pair<String, String?>>()

    override suspend fun fetchMySubscription(productKey: String?): SubscriptionSummary? =
        subscriptionResult.getOrThrow()

    override suspend fun createBillingPortalSession(origin: String): String {
        portalOrigins.add(origin)
        return portalResult.getOrThrow()
    }

    override suspend fun createSubscriptionCheckoutSession(origin: String, productKey: String?): String {
        checkoutRequests.add(origin to productKey)
        return checkoutResult.getOrThrow()
    }
}
