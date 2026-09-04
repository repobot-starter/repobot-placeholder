package com.baseapp.android.components.billing

import com.baseapp.android.components.gql
import com.baseapp.android.graphql.generated.type.CreateBillingPortalSessionInput
import com.baseapp.android.graphql.generated.type.CreateSubscriptionCheckoutSessionFields
import com.baseapp.android.graphql.generated.type.CreateSubscriptionCheckoutSessionInput
import com.apollographql.apollo.api.Optional
import java.net.URI
import java.util.UUID

/**
 * The payments-kernel operations the billing workflows need, behind a small
 * seam so BillingComponent's state transitions are unit-testable with a
 * stubbed client (the twin of the iOS BillingApi protocol and the web hooks
 * the Billing card / SubscribePage call). The real implementation delegates
 * to GraphQLClient.
 */
interface BillingApi {
    suspend fun fetchMySubscription(productKey: String?): SubscriptionSummary?

    /**
     * Returns the Billing Portal URL (Stripe's portal, or the in-app test
     * billing page in local mode).
     */
    suspend fun createBillingPortalSession(origin: String): String

    /**
     * Returns the checkout URL (Stripe's hosted page, or the in-app test
     * checkout in local mode).
     */
    suspend fun createSubscriptionCheckoutSession(origin: String, productKey: String?): String
}

sealed class BillingApiFailure(override val message: String) : Exception(message) {
    class MalformedPortalUrl : BillingApiFailure("The billing portal could not be opened.")
    class MalformedCheckoutUrl : BillingApiFailure("The checkout could not be started. Please try again.")
}

class GraphQLBillingApi : BillingApi {
    override suspend fun fetchMySubscription(productKey: String?): SubscriptionSummary? {
        val data = gql.fetchMySubscription(productKey) ?: return null
        return SubscriptionSummary(data)
    }

    override suspend fun createBillingPortalSession(origin: String): String {
        val url = gql.createBillingPortalSession(CreateBillingPortalSessionInput(origin = origin))
        if (!isParseableUrl(url)) {
            throw BillingApiFailure.MalformedPortalUrl()
        }
        return url
    }

    override suspend fun createSubscriptionCheckoutSession(origin: String, productKey: String?): String {
        val session = gql.createSubscriptionCheckoutSession(
            CreateSubscriptionCheckoutSessionInput(
                idempotencyKey = UUID.randomUUID().toString(),
                fields = CreateSubscriptionCheckoutSessionFields(
                    origin = origin,
                    productKey = Optional.presentIfNotNull(productKey),
                ),
            )
        )
        if (!isParseableUrl(session.checkoutUrl)) {
            throw BillingApiFailure.MalformedCheckoutUrl()
        }
        return session.checkoutUrl
    }

    private fun isParseableUrl(url: String): Boolean = try {
        URI(url).scheme != null
    } catch (_: Exception) {
        false
    }
}
