import type { MarketingIconName } from "@ui"

/**
 * Everything LaunchBot renders lives in this file: the product story, the
 * features, the pricing tiers, and the FAQ. Edit it (or ask the agent to)
 * and the landing page updates — there is no backend and no CMS.
 *
 * The demo product is Lumina, a smart night light that tells dad jokes —
 * the page speaks in the lamp's own first-person voice on purpose. Keep
 * that conceit or replace it wholesale; half-measures read worst.
 */

export const product = {
    name: "Lumina",
    logoEmoji: "💡",
    /** The one-line pitch; the headline's last word gets the accent. */
    headline: "Hi, I'm Lumina. Your nights, fully lit.",
    subheadline:
        "I'm a smart night light that knows the bedtime routine: warm glow on schedule, a soft path for 2 a.m. missions, and exactly one dad joke at tuck-in. That last part is non-negotiable.",
    /** The pill above the headline; empty string hides it. */
    heroBadge: "Currently glowing",
    /** The hero's two buttons — both scroll-anchors into the page. */
    primaryCtaLabel: "See what I can do",
    secondaryCtaLabel: "Read the reviews",
    /** CTA copy for the waitlist form. */
    waitlistCta: "Join the glow list",
    waitlistPlaceholder: "night.owl@example.com",
    /** Text-logo social proof strip. Empty array hides the strip. */
    trustedBy: [
        "Bedtime Weekly",
        "The Tuck-In Times",
        "Glow Report",
        "Nightstand Quarterly",
        "Dad Joke Digest",
    ],
}

export interface Feature {
    /** Named icon from the design system's marketing icon set. */
    icon: MarketingIconName
    title: string
    description: string
}

export const features: Feature[] = [
    {
        icon: "zap",
        title: "Glow that reads the room",
        description:
            "Warm amber light that starts below candlelight and dims as eyes adjust — bright enough to comfort, never enough to wake.",
    },
    {
        icon: "clock",
        title: "Bedtime on schedule",
        description:
            "Set the routine once. I ease on at story time, hold through the night, and fade myself out when morning takes over.",
    },
    {
        icon: "star",
        title: "Certified dad jokes",
        description:
            "One vetted joke at tuck-in, every night. Fresh packs weekly — puns, knock-knocks, and the occasional groaner you'll pretend not to love.",
    },
    {
        icon: "shield",
        title: "The night-shift guardian",
        description:
            "Motion wakes a soft floor path to the bathroom and back. No overhead lights, no stubbed toes, no drama.",
    },
    {
        icon: "sliders",
        title: "Yours to tune",
        description:
            "Warmth, brightness, joke frequency, wake-up fade — every knob lives in an app your thumb can find at 2 a.m.",
    },
    {
        icon: "bell",
        title: "Gentle wake-ups",
        description:
            "A slow sunrise glow instead of an alarm: I brighten over ten minutes so mornings start on your side for once.",
    },
]

export interface Step {
    title: string
    description: string
}

export const steps: Step[] = [
    {
        title: "Plug me in",
        description:
            "Any outlet works. I read the room's darkness in about a minute and pick a glow that won't wake anyone.",
    },
    {
        title: "Tell me the routine",
        description:
            "Bedtime and wake-up go in the app once. Dimming, the midnight hallway glow, and the dawn fade are on me.",
    },
    {
        title: "Lights out, joke on",
        description:
            "One dad joke at tuck-in — that's the deal. Then I hold the night shift so you don't have to.",
    },
]

/**
 * The feature deep-dive rows (web only — the native surfaces render the
 * grid above instead). Each row pairs a piece of night photography with
 * one job the lamp does after everyone else is asleep.
 */
export interface NightlyHighlight {
    image: { src: string; alt: string }
    headline: string
    body: string
}

export const nightly = {
    kicker: "A night on the job",
    title: "What I do while you sleep",
    highlights: [
        {
            image: {
                src: "/showcase/lumina-fort.jpg",
                alt: "A blanket fort at night, lit warmly by Lumina with a storybook open on the floor",
            },
            headline: "Story time's best light",
            body: "Blanket forts, final chapters, one-more-pages: I hold a warm, page-friendly glow and save the dad joke for the tuck-in. After that, the night is mine.",
        },
        {
            image: {
                src: "/showcase/lumina-hallway.jpg",
                alt: "A dark hallway with soft pools of warm light leading to a bedroom door left ajar",
            },
            headline: "The 2 a.m. escort",
            body: "Feet hit the floor and I lay a soft path to the bathroom and back — bright enough to dodge the brick, dim enough that everyone falls right back asleep.",
        },
        {
            image: {
                src: "/showcase/lumina-dawn.jpg",
                alt: "Lumina on a nightstand fading to a faint ember as cool dawn light comes through the curtains",
            },
            headline: "I know when to bow out",
            body: "When morning creeps through the curtains I fade myself to an ember and clock out. No switch to remember, no blazing lamp at breakfast.",
        },
    ] satisfies NightlyHighlight[],
}

/** The quote wall (web only). */
export interface Review {
    quote: string
    author: string
    title: string
}

export const reviews: Review[] = [
    {
        quote: "The bedtime joke bought us five years of cool-parent status. The night light part is also excellent.",
        author: "Maya R.",
        title: "Mother of two, former joke skeptic",
    },
    {
        quote: "It dimmed itself the second we finished the last story. I have never felt so seen by a lamp.",
        author: "Devon P.",
        title: "Professional tuck-in engineer (dad)",
    },
    {
        quote: "I bought it for the hallway glow. I stayed for “why don't eggs tell jokes? They'd crack up.”",
        author: "Priya S.",
        title: "Night-shift nurse",
    },
]

export interface PricingTier {
    name: string
    /** Monthly price in dollars; 0 renders "Free". */
    monthly: number
    /** Yearly price per month in dollars (the discount price). */
    yearlyPerMonth: number
    description: string
    features: string[]
    /** Highlighted tier gets the accent treatment and the badge. */
    highlighted?: boolean
    badge?: string
}

/** The lamp is a one-time purchase; these plans are its app brain. */
export const pricing: PricingTier[] = [
    {
        name: "Nightlight",
        monthly: 0,
        yearlyPerMonth: 0,
        description: "Everything the lamp does out of the box, free forever.",
        features: ["Warm glow with auto dimming", "Sunrise fade-out", "Seven starter dad jokes"],
    },
    {
        name: "Pro",
        monthly: 4,
        yearlyPerMonth: 3,
        description: "Fresh puns and a smarter night shift.",
        features: [
            "Everything in Nightlight",
            "Weekly dad-joke packs",
            "Custom bedtime schedules",
            "Vacation mode",
        ],
        highlighted: true,
        badge: "Most popular",
    },
    {
        name: "Family",
        monthly: 9,
        yearlyPerMonth: 7,
        description: "Every room in the house, one glow.",
        features: ["Everything in Pro", "Up to six lamps in sync", "Per-kid routines", "Hallway path mode"],
    },
]

export interface FaqItem {
    question: string
    answer: string
}

export const faq: FaqItem[] = [
    {
        question: "Are the dad jokes optional?",
        answer: "Technically yes — there's a switch in the app. No household has ever flipped it, but it's there, gathering dust, as it should.",
    },
    {
        question: "Will it wake the baby?",
        answer: "No. The glow starts below candlelight and I never speak after lights-out — jokes are strictly a tuck-in feature, delivered at storybook volume.",
    },
    {
        question: "What happens when the WiFi goes down?",
        answer: "I keep glowing. Schedules run on the lamp itself; the network is only for fetching new jokes and app tweaks. Puns resume when the router does.",
    },
    {
        question: "How bright does it get?",
        answer: "Anywhere from “is it even on?” to “found the brick before my foot did.” The hallway path setting is the consistent family favorite.",
    },
]

export const footer = {
    blurb: "Built by three parents who kept stepping on the same brick.",
    links: [
        { label: "Journal", url: "https://lumina.example/journal" },
        { label: "Press kit", url: "https://lumina.example/press" },
        { label: "Contact", url: "mailto:hello@lumina.example" },
    ],
}
