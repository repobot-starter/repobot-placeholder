package com.baseapp.android.view.launch

/**
 * Everything the LaunchBot surface renders — the native twin of
 * `web/app/src/View/Launch/content.ts`. Edit this file (or ask the agent to)
 * and the app updates; there is no backend and no CMS.
 */
object LaunchContent {
    data class Product(
        val name: String,
        val logoEmoji: String,
        val headline: String,
        val subheadline: String,
        val waitlistCta: String,
        val waitlistPlaceholder: String,
        val trustedBy: List<String>,
    )

    data class Feature(
        val emoji: String,
        val title: String,
        val description: String,
    )

    data class Step(
        val title: String,
        val description: String,
    )

    data class PricingTier(
        val name: String,
        /** Monthly price in dollars; 0 renders "Free". */
        val monthly: Int,
        /** Yearly price per month in dollars (the discount price). */
        val yearlyPerMonth: Int,
        val description: String,
        val features: List<String>,
        val highlighted: Boolean = false,
        val badge: String? = null,
    )

    data class FaqItem(
        val question: String,
        val answer: String,
    )

    val product = Product(
        name = "Sundial",
        logoEmoji = "☀️",
        headline = "Your team's time, finally visible.",
        subheadline = "Sundial turns your calendar chaos into a clear picture: where the hours " +
            "go, which meetings earn their keep, and what to cut first.",
        waitlistCta = "Join the waitlist",
        waitlistPlaceholder = "you@company.com",
        trustedBy = listOf("Northwind", "Fogline", "Basalt", "Meridian Labs", "Pocketworks"),
    )

    val features = listOf(
        Feature(
            "🗺️", "The time map",
            "One glance shows the week's true shape: deep work, meetings, and the gaps too " +
                "small to use.",
        ),
        Feature(
            "⚖️", "Meeting scorecards",
            "Every recurring meeting gets a cost and a keep/kill score based on who attends " +
                "and what it displaces.",
        ),
        Feature(
            "🔕", "Focus guardrails",
            "Sundial blocks fragmentation before it happens — it declines the 3:30 that would " +
                "split your last deep-work window.",
        ),
        Feature(
            "📈", "Weekly digest",
            "Monday morning, every teammate gets one email: what changed, what it cost, and " +
                "one suggestion to try.",
        ),
        Feature(
            "🤝", "Team agreements",
            "Codify no-meeting Wednesdays and quiet hours; Sundial enforces them politely so " +
                "nobody has to.",
        ),
        Feature(
            "🔌", "Works with your stack",
            "Google Calendar and Outlook today; the API is open for whatever your team lives in.",
        ),
    )

    val steps = listOf(
        Step(
            "Connect your calendar",
            "Read-only at first. Sundial never moves anything without asking.",
        ),
        Step(
            "See the real picture",
            "Within a day you get the time map and every meeting's true cost.",
        ),
        Step(
            "Reclaim your week",
            "Accept a suggestion, watch the hours come back. Most teams save 4+ hours per person.",
        ),
    )

    val pricing = listOf(
        PricingTier(
            name = "Solo",
            monthly = 0,
            yearlyPerMonth = 0,
            description = "Your own calendar, mapped.",
            features = listOf("Time map", "Weekly digest", "One calendar"),
        ),
        PricingTier(
            name = "Pro",
            monthly = 12,
            yearlyPerMonth = 10,
            description = "For people who run their own week.",
            features = listOf(
                "Everything in Solo", "Meeting scorecards", "Focus guardrails",
                "Unlimited calendars",
            ),
            highlighted = true,
            badge = "Most popular",
        ),
        PricingTier(
            name = "Team",
            monthly = 49,
            yearlyPerMonth = 41,
            description = "Agreements and analytics for the whole team.",
            features = listOf(
                "Everything in Pro", "Team agreements", "Org-wide analytics", "Priority support",
            ),
        ),
    )

    val faq = listOf(
        FaqItem(
            "Do you read the contents of my meetings?",
            "No. Sundial only uses event metadata — times, attendees, and recurrence. Titles " +
                "are processed on your device and never stored.",
        ),
        FaqItem(
            "Will it start declining meetings on its own?",
            "Never by default. Guardrails are suggestions until you flip a specific rule to " +
                "automatic, and every automatic action is logged and reversible.",
        ),
        FaqItem(
            "What calendars do you support?",
            "Google Calendar and Outlook at launch. ICS import works for everything else, and " +
                "the API is open.",
        ),
        FaqItem(
            "When does the beta open?",
            "We onboard a new group from the waitlist every two weeks, smallest teams first. " +
                "Joining today puts you in the next cohort draw.",
        ),
    )
}
