package com.baseapp.android

import com.baseapp.android.components.billing.InstantParsing
import com.baseapp.android.components.billing.MoneyFormat
import com.baseapp.android.components.billing.SubscriptionBadgeTone
import com.baseapp.android.components.billing.SubscriptionStatusBadge
import com.baseapp.android.components.billing.SubscriptionSummary
import com.baseapp.android.graphql.SubscriptionStatusValue
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

/**
 * Parity tests for the Billing card's display models against the web twin's
 * tables in SettingsPage.tsx (subscriptionBadgeTone / subscriptionStatusLabel)
 * and web/core's formatMinorUnits — mirroring the iOS BillingModelsTests.
 */
class BillingModelsTest {
    @Test
    fun badgeMappingMirrorsWebToneAndLabelTables() {
        assertEquals(
            SubscriptionStatusBadge(label = "Active", tone = SubscriptionBadgeTone.SUCCESS),
            SubscriptionStatusBadge.badge(SubscriptionStatusValue.ACTIVE),
        )
        assertEquals(
            SubscriptionStatusBadge(label = "Past due", tone = SubscriptionBadgeTone.DANGER),
            SubscriptionStatusBadge.badge(SubscriptionStatusValue.PAST_DUE),
        )
        assertEquals(
            SubscriptionStatusBadge(label = "Cancelled", tone = SubscriptionBadgeTone.NEUTRAL),
            SubscriptionStatusBadge.badge(SubscriptionStatusValue.CANCELED),
        )
    }

    @Test
    fun unknownStatusFallsBackToNeutralWithSanitizedLabel() {
        // Apollo Kotlin collapses unrecognized server values into the
        // UNKNOWN__ sentinel (the iOS GraphQLEnum keeps the raw value; that
        // fidelity is not available here).
        assertEquals(
            SubscriptionStatusBadge(label = "Unknown", tone = SubscriptionBadgeTone.NEUTRAL),
            SubscriptionStatusBadge.badge(SubscriptionStatusValue.UNKNOWN__),
        )
    }

    @Test
    fun formatMinorUnitsMatchesWebFormatting() {
        assertEquals("$24.00", MoneyFormat.formatMinorUnits(2400, "usd"))
        assertEquals("$9.50", MoneyFormat.formatMinorUnits(950, "USD"))
        assertEquals("€14.00", MoneyFormat.formatMinorUnits(1400, "eur"))
    }

    @Test
    fun priceLabelMirrorsWebBillingCard() {
        val summary = SubscriptionSummary(
            status = SubscriptionStatusValue.ACTIVE,
            productName = "Pro",
            amountTotal = 2400,
            currency = "usd",
            recurringInterval = "MONTH",
            currentPeriodEnd = null,
        )
        assertEquals("$24.00 / month", summary.priceLabel)

        val yearly = summary.copy(amountTotal = 24000, recurringInterval = "YEAR")
        assertEquals("$240.00 / year", yearly.priceLabel)
    }

    @Test
    fun instantParsingHandlesBackendTimestamps() {
        // The backend serializes Instants with milliseconds.
        assertNotNull(InstantParsing.parse("2026-07-18T00:00:00.000Z"))

        // Stripe-derived period ends may come back without a fractional part;
        // both spellings parse to the same moment.
        val wholeSeconds = InstantParsing.parse("2026-07-18T12:30:00Z")
        assertNotNull(wholeSeconds)
        assertEquals(InstantParsing.parse("2026-07-18T12:30:00.000Z"), wholeSeconds)

        assertNull(InstantParsing.parse("not-a-date"))
    }
}
