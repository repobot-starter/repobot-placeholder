package com.baseapp.android.view.launch

/**
 * Everything the LaunchBot surface renders — the native twin of
 * `web/app/src/View/Launch/content.ts`. Edit this file (or ask the agent to)
 * and the app updates; there is no backend and no CMS.
 *
 * The demo product is Lumina, a smart night light that tells dad jokes —
 * the copy speaks in the lamp's own first-person voice on purpose.
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
        name = "Lumina",
        logoEmoji = "💡",
        headline = "Hi, I'm Lumina. Your nights, fully lit.",
        subheadline = "I'm a smart night light that knows the bedtime routine: warm glow on " +
            "schedule, a soft path for 2 a.m. missions, and exactly one dad joke at tuck-in. " +
            "That last part is non-negotiable.",
        waitlistCta = "Join the glow list",
        waitlistPlaceholder = "night.owl@example.com",
        trustedBy = listOf(
            "Bedtime Weekly", "The Tuck-In Times", "Glow Report", "Nightstand Quarterly",
            "Dad Joke Digest",
        ),
    )

    val features = listOf(
        Feature(
            "🕯️", "Glow that reads the room",
            "Warm amber light that starts below candlelight and dims as eyes adjust — bright " +
                "enough to comfort, never enough to wake.",
        ),
        Feature(
            "⏰", "Bedtime on schedule",
            "Set the routine once. I ease on at story time, hold through the night, and fade " +
                "myself out when morning takes over.",
        ),
        Feature(
            "🥸", "Certified dad jokes",
            "One vetted joke at tuck-in, every night. Fresh packs weekly — puns, knock-knocks, " +
                "and the occasional groaner you'll pretend not to love.",
        ),
        Feature(
            "🛡️", "The night-shift guardian",
            "Motion wakes a soft floor path to the bathroom and back. No overhead lights, no " +
                "stubbed toes, no drama.",
        ),
        Feature(
            "🎚️", "Yours to tune",
            "Warmth, brightness, joke frequency, wake-up fade — every knob lives in an app " +
                "your thumb can find at 2 a.m.",
        ),
        Feature(
            "🌅", "Gentle wake-ups",
            "A slow sunrise glow instead of an alarm: I brighten over ten minutes so mornings " +
                "start on your side for once.",
        ),
    )

    val steps = listOf(
        Step(
            "Plug me in",
            "Any outlet works. I read the room's darkness in about a minute and pick a glow " +
                "that won't wake anyone.",
        ),
        Step(
            "Tell me the routine",
            "Bedtime and wake-up go in the app once. Dimming, the midnight hallway glow, and " +
                "the dawn fade are on me.",
        ),
        Step(
            "Lights out, joke on",
            "One dad joke at tuck-in — that's the deal. Then I hold the night shift so you " +
                "don't have to.",
        ),
    )

    val pricing = listOf(
        PricingTier(
            name = "Nightlight",
            monthly = 0,
            yearlyPerMonth = 0,
            description = "Everything the lamp does out of the box, free forever.",
            features = listOf(
                "Warm glow with auto dimming", "Sunrise fade-out", "Seven starter dad jokes",
            ),
        ),
        PricingTier(
            name = "Pro",
            monthly = 4,
            yearlyPerMonth = 3,
            description = "Fresh puns and a smarter night shift.",
            features = listOf(
                "Everything in Nightlight", "Weekly dad-joke packs", "Custom bedtime schedules",
                "Vacation mode",
            ),
            highlighted = true,
            badge = "Most popular",
        ),
        PricingTier(
            name = "Family",
            monthly = 9,
            yearlyPerMonth = 7,
            description = "Every room in the house, one glow.",
            features = listOf(
                "Everything in Pro", "Up to six lamps in sync", "Per-kid routines",
                "Hallway path mode",
            ),
        ),
    )

    val faq = listOf(
        FaqItem(
            "Are the dad jokes optional?",
            "Technically yes — there's a switch in the app. No household has ever flipped it, " +
                "but it's there, gathering dust, as it should.",
        ),
        FaqItem(
            "Will it wake the baby?",
            "No. The glow starts below candlelight and I never speak after lights-out — jokes " +
                "are strictly a tuck-in feature, delivered at storybook volume.",
        ),
        FaqItem(
            "What happens when the WiFi goes down?",
            "I keep glowing. Schedules run on the lamp itself; the network is only for " +
                "fetching new jokes and app tweaks. Puns resume when the router does.",
        ),
        FaqItem(
            "How bright does it get?",
            "Anywhere from “is it even on?” to “found the brick before my foot did.” The " +
                "hallway path setting is the consistent family favorite.",
        ),
    )
}
