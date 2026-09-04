package com.baseapp.android.components.billing

import com.baseapp.android.graphql.PaymentSubscriptionData
import com.baseapp.android.graphql.SubscriptionStatusValue
import java.text.NumberFormat
import java.time.Instant
import java.time.format.DateTimeParseException
import java.util.Currency
import java.util.Locale

/**
 * Plain-value summary of the caller's subscription — what the Settings
 * Billing card renders. Mirrors the iOS SubscriptionSummary and the web
 * twin's PaymentSubscriptionFields selection; a value type so stores and
 * tests never depend on generated Apollo models.
 */
data class SubscriptionSummary(
    val status: SubscriptionStatusValue,
    val productName: String,
    /** Per-period total in the currency's minor units. */
    val amountTotal: Int,
    val currency: String,
    val recurringInterval: String,
    /** End of the current billing period; null for LOCAL subscriptions. */
    val currentPeriodEnd: Instant?,
) {
    constructor(data: PaymentSubscriptionData) : this(
        status = data.status,
        productName = data.productName,
        amountTotal = data.amountTotal,
        currency = data.currency,
        recurringInterval = data.recurringInterval.rawValue,
        currentPeriodEnd = data.currentPeriodEnd?.let(InstantParsing::parse),
    )

    /** "$24.00 / month" — the web Billing card's price label. */
    val priceLabel: String
        get() {
            val interval = recurringInterval.lowercase(Locale.US)
            return "${MoneyFormat.formatMinorUnits(amountTotal, currency)} / $interval"
        }
}

enum class SubscriptionBadgeTone {
    SUCCESS,
    DANGER,
    NEUTRAL,
}

/**
 * Status badge shown on the Billing card. The mapping mirrors the web
 * twin's subscriptionBadgeTone / subscriptionStatusLabel tables in
 * SettingsPage.tsx (and the iOS SubscriptionStatusBadge).
 */
data class SubscriptionStatusBadge(
    val label: String,
    val tone: SubscriptionBadgeTone,
) {
    companion object {
        fun badge(status: SubscriptionStatusValue): SubscriptionStatusBadge = when (status) {
            SubscriptionStatusValue.ACTIVE ->
                SubscriptionStatusBadge(label = "Active", tone = SubscriptionBadgeTone.SUCCESS)
            SubscriptionStatusValue.PAST_DUE ->
                SubscriptionStatusBadge(label = "Past due", tone = SubscriptionBadgeTone.DANGER)
            SubscriptionStatusValue.CANCELED ->
                SubscriptionStatusBadge(label = "Cancelled", tone = SubscriptionBadgeTone.NEUTRAL)
            // Unrecognized statuses render neutrally, like the iOS twin's
            // .none fallback. One delta: Apollo Kotlin collapses unknown enum
            // values into UNKNOWN__ (dropping the raw server value the iOS
            // GraphQLEnum keeps), so the label comes from the sanitized
            // rawValue — "Unknown" for the sentinel itself.
            else -> SubscriptionStatusBadge(
                label = status.rawValue.trimEnd('_').replace('_', ' ').lowercase(Locale.US)
                    .replaceFirstChar { it.uppercase(Locale.US) },
                tone = SubscriptionBadgeTone.NEUTRAL,
            )
        }
    }
}

/**
 * Formats amounts in a currency's minor units for display, matching the web
 * twin's formatMinorUnits (Intl.NumberFormat "en-US" currency style):
 * formatMinorUnits(2400, "usd") -> "$24.00".
 */
object MoneyFormat {
    fun formatMinorUnits(amountMinorUnits: Int, currency: String): String {
        val amount = amountMinorUnits / 100.0
        return try {
            val formatter = NumberFormat.getCurrencyInstance(Locale.US)
            formatter.currency = Currency.getInstance(currency.uppercase(Locale.US))
            formatter.format(amount)
        } catch (_: IllegalArgumentException) {
            String.format(Locale.US, "%.2f %s", amount, currency.uppercase(Locale.US))
        }
    }
}

/**
 * Parses the backend's Instant scalar (ISO-8601 with milliseconds, e.g.
 * "2026-07-18T00:00:00.000Z"); tolerates whole-second timestamps too.
 */
object InstantParsing {
    fun parse(instant: String): Instant? = try {
        Instant.parse(instant)
    } catch (_: DateTimeParseException) {
        null
    }
}
