/**
 * Everything LaunchBot renders lives in this file: the product story, the
 * features, the pricing tiers, and the FAQ. Edit it (or ask the agent to)
 * and the landing page updates — there is no backend and no CMS.
 */

export const product = {
    name: "Sundial",
    logoEmoji: "☀️",
    /** The one-line pitch, split so the accent word can be art-directed. */
    headline: "Your team's time, finally visible.",
    subheadline:
        "Sundial turns your calendar chaos into a clear picture: where the hours go, which meetings earn their keep, and what to cut first.",
    /** CTA copy for the waitlist form. */
    waitlistCta: "Join the waitlist",
    waitlistPlaceholder: "you@company.com",
    /** Text-logo social proof strip. Empty array hides the strip. */
    trustedBy: ["Northwind", "Fogline", "Basalt", "Meridian Labs", "Pocketworks"],
}

export interface Feature {
    emoji: string
    title: string
    description: string
}

export const features: Feature[] = [
    {
        emoji: "🗺️",
        title: "The time map",
        description:
            "One glance shows the week's true shape: deep work, meetings, and the gaps too small to use.",
    },
    {
        emoji: "⚖️",
        title: "Meeting scorecards",
        description:
            "Every recurring meeting gets a cost and a keep/kill score based on who attends and what it displaces.",
    },
    {
        emoji: "🔕",
        title: "Focus guardrails",
        description:
            "Sundial blocks fragmentation before it happens — it declines the 3:30 that would split your last deep-work window.",
    },
    {
        emoji: "📈",
        title: "Weekly digest",
        description:
            "Monday morning, every teammate gets one email: what changed, what it cost, and one suggestion to try.",
    },
    {
        emoji: "🤝",
        title: "Team agreements",
        description:
            "Codify no-meeting Wednesdays and quiet hours; Sundial enforces them politely so nobody has to.",
    },
    {
        emoji: "🔌",
        title: "Works with your stack",
        description: "Google Calendar and Outlook today; the API is open for whatever your team lives in.",
    },
]

export interface Step {
    title: string
    description: string
}

export const steps: Step[] = [
    {
        title: "Connect your calendar",
        description: "Read-only at first. Sundial never moves anything without asking.",
    },
    {
        title: "See the real picture",
        description: "Within a day you get the time map and every meeting's true cost.",
    },
    {
        title: "Reclaim your week",
        description: "Accept a suggestion, watch the hours come back. Most teams save 4+ hours per person.",
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

export const pricing: PricingTier[] = [
    {
        name: "Solo",
        monthly: 0,
        yearlyPerMonth: 0,
        description: "Your own calendar, mapped.",
        features: ["Time map", "Weekly digest", "One calendar"],
    },
    {
        name: "Pro",
        monthly: 12,
        yearlyPerMonth: 10,
        description: "For people who run their own week.",
        features: ["Everything in Solo", "Meeting scorecards", "Focus guardrails", "Unlimited calendars"],
        highlighted: true,
        badge: "Most popular",
    },
    {
        name: "Team",
        monthly: 49,
        yearlyPerMonth: 41,
        description: "Agreements and analytics for the whole team.",
        features: ["Everything in Pro", "Team agreements", "Org-wide analytics", "Priority support"],
    },
]

export interface FaqItem {
    question: string
    answer: string
}

export const faq: FaqItem[] = [
    {
        question: "Do you read the contents of my meetings?",
        answer: "No. Sundial only uses event metadata — times, attendees, and recurrence. Titles are processed on your device and never stored.",
    },
    {
        question: "Will it start declining meetings on its own?",
        answer: "Never by default. Guardrails are suggestions until you flip a specific rule to automatic, and every automatic action is logged and reversible.",
    },
    {
        question: "What calendars do you support?",
        answer: "Google Calendar and Outlook at launch. ICS import works for everything else, and the API is open.",
    },
    {
        question: "When does the beta open?",
        answer: "We onboard a new group from the waitlist every two weeks, smallest teams first. Joining today puts you in the next cohort draw.",
    },
]

export const footer = {
    blurb: "Built by three ex-calendar-admins who have seen things.",
    links: [
        { label: "Manifesto", url: "https://sundial.example/manifesto" },
        { label: "Changelog", url: "https://sundial.example/changelog" },
        { label: "Contact", url: "mailto:hello@sundial.example" },
    ],
}
