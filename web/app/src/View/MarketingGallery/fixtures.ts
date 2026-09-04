import type { LandingConfig, LandingSection, MarketingPresetName, MarketingShellConfig } from "@ui"
import type { MarketingPageEntry } from "../../Config/projectManifest"
import { blueprintExemplarConfig } from "../Site/blueprints"

/**
 * The marketing gallery's fixture site: "Waypoint", a fictional customer
 * onboarding product. Placeholder-free copy on purpose — a preset can only
 * be judged wearing real-looking content, and blueprint lorem flatters
 * nothing. The showcase page exercises the wide middle of the section
 * vocabulary (proof, features, highlights, stats, quotes, pricing, FAQ) so
 * a preset's card, rule, and type decisions all show up on one scroll.
 */

const SITE_NAME = "Waypoint"

function showcaseShell(preset?: MarketingPresetName): MarketingShellConfig {
    return {
        nav: {
            // Mirrors the blueprint layer's preset lean: hard-ruled and
            // sunlit presets read better with the inset bar than the flush
            // translucent band.
            variant: preset === "brutalist" || preset === "warm-boutique" ? "inline" : "full-width",
            content: {
                logo: { name: SITE_NAME },
                links: [
                    {
                        label: "Product",
                        anchor: "feature-grid",
                        menu: {
                            columns: [
                                {
                                    title: "Platform",
                                    links: [
                                        {
                                            label: "Adaptive checklists",
                                            anchor: "feature-grid",
                                            description:
                                                "Steps reorder around what each customer already did.",
                                        },
                                        {
                                            label: "In-product tours",
                                            anchor: "feature-grid",
                                            description: "Point at real UI — tours survive your redesigns.",
                                        },
                                        {
                                            label: "Activation analytics",
                                            anchor: "feature-grid",
                                            description: "See exactly where trials stall, cohort by cohort.",
                                        },
                                    ],
                                },
                                {
                                    title: "Workflows",
                                    links: [
                                        {
                                            label: "Lifecycle nudges",
                                            anchor: "highlights",
                                            description: "Email and in-app nudges that adapt per customer.",
                                        },
                                        {
                                            label: "Playbooks",
                                            anchor: "steps",
                                            description: "Design the path once, publish instantly.",
                                        },
                                    ],
                                },
                                {
                                    title: "Company",
                                    links: [
                                        { label: "Customers", anchor: "testimonials" },
                                        { label: "Pricing", anchor: "pricing" },
                                        { label: "FAQ", anchor: "faq" },
                                    ],
                                },
                            ],
                        },
                    },
                    { label: "Customers", anchor: "testimonials" },
                    { label: "Pricing", anchor: "pricing" },
                    { label: "FAQ", anchor: "faq" },
                ],
                cta: { label: "Start free", anchor: "lead-form" },
            },
        },
        footer: {
            variant: "multi-column",
            content: {
                blurb: "Waypoint — onboarding your customers actually finish.",
                columns: [
                    {
                        title: "Product",
                        links: [
                            { label: "Features", anchor: "feature-grid" },
                            { label: "Pricing", anchor: "pricing" },
                        ],
                    },
                    {
                        title: "Company",
                        links: [
                            { label: "Customers", anchor: "testimonials" },
                            { label: "FAQ", anchor: "faq" },
                        ],
                    },
                ],
                note: `© ${new Date().getFullYear()} ${SITE_NAME}`,
            },
        },
    }
}

function showcaseSections(): LandingSection[] {
    return [
        {
            type: "hero",
            variant: "centered-stack",
            content: {
                badge: "New: guided setup flows",
                headline: "Onboarding your customers actually finish",
                subheadline:
                    "Waypoint turns your product's first hour into a guided path — checklists, tours, and nudges that adapt to what each customer already did.",
                primaryCta: { label: "Start free", anchor: "lead-form" },
                secondaryCta: { label: "See it in action", anchor: "highlights" },
            },
        },
        {
            type: "social-proof",
            variant: "text-logos",
            content: {
                label: "Trusted by onboarding teams at",
                items: ["Fieldnote", "Cobalt Labs", "Meridian", "Harbor Analytics", "Piper & Co"],
            },
        },
        {
            type: "feature-grid",
            variant: "cards-3up",
            content: {
                kicker: "Why Waypoint",
                title: "Three things your first hour is missing",
                features: [
                    {
                        emoji: "🧭",
                        title: "Adaptive checklists",
                        description:
                            "Steps reorder around what each customer already did — nobody re-reads instructions for things they finished.",
                    },
                    {
                        emoji: "📍",
                        title: "In-product tours",
                        description:
                            "Point at real UI, not screenshots. Tours survive your redesigns because they anchor to elements, not pixels.",
                    },
                    {
                        emoji: "📈",
                        title: "Activation analytics",
                        description:
                            "See exactly where trials stall, cohort by cohort, and fix the step that loses the most accounts first.",
                    },
                ],
            },
        },
        {
            type: "highlights",
            variant: "alternating",
            content: {
                kicker: "How teams use it",
                title: "From signup to habit, without the drop-off",
                highlights: [
                    {
                        headline: "Design the path once",
                        body: "Compose your flow from steps, tours, and emails in one editor. Publish instantly — no release train, no engineering ticket.",
                        media: { kind: "emoji", emoji: "🗺️" },
                    },
                    {
                        headline: "Let it adapt per customer",
                        body: "Waypoint watches product events and skips, reorders, or re-opens steps automatically. Every customer gets the short version of your onboarding.",
                        media: { kind: "emoji", emoji: "🎛️" },
                    },
                    {
                        headline: "Watch activation climb",
                        body: "The funnel view ties every step to retention. When a step underperforms, you'll know by Tuesday, not at the quarterly review.",
                        media: { kind: "emoji", emoji: "📊" },
                    },
                ],
            },
        },
        {
            type: "stats",
            variant: "row",
            content: {
                kicker: "In production",
                stats: [
                    { value: "38%", label: "median lift in trial activation" },
                    { value: "11 min", label: "average time to first value" },
                    { value: "4.9/5", label: "onboarding CSAT across customers" },
                ],
            },
        },
        {
            type: "testimonials",
            variant: "quote-grid",
            content: {
                kicker: "Customers",
                title: "Teams that stopped losing trials",
                quotes: [
                    {
                        quote: "We rebuilt onboarding three times before Waypoint. The fourth time took an afternoon and outperformed all three.",
                        author: "Dana Whitfield",
                        title: "Head of Growth, Meridian",
                    },
                    {
                        quote: "The adaptive checklist alone paid for the year. Enterprise trials stopped asking us for kickoff calls.",
                        author: "Luis Ortega",
                        title: "VP Customer Experience, Cobalt Labs",
                    },
                    {
                        quote: "First tool where the analytics matched what support was hearing. We fixed the real stall point in a week.",
                        author: "Priya Raman",
                        title: "Product Lead, Harbor Analytics",
                    },
                ],
            },
        },
        {
            type: "pricing",
            variant: "tiers",
            content: {
                kicker: "Pricing",
                title: "Priced by active accounts, not seats",
                tiers: [
                    {
                        name: "Starter",
                        monthly: 0,
                        yearlyPerMonth: 0,
                        description: "For your first flow.",
                        features: ["1 onboarding flow", "500 tracked accounts", "Community support"],
                    },
                    {
                        name: "Growth",
                        monthly: 89,
                        yearlyPerMonth: 74,
                        description: "For teams shipping weekly.",
                        features: [
                            "Unlimited flows and tours",
                            "10,000 tracked accounts",
                            "Activation analytics",
                            "Slack support",
                        ],
                        highlighted: true,
                        badge: "Most popular",
                    },
                    {
                        name: "Scale",
                        monthly: 249,
                        yearlyPerMonth: 207,
                        description: "For onboarding at volume.",
                        features: [
                            "Everything in Growth",
                            "Unlimited accounts",
                            "SSO and audit log",
                            "Dedicated success engineer",
                        ],
                    },
                ],
            },
        },
        {
            type: "faq",
            variant: "accordion",
            content: {
                kicker: "FAQ",
                title: "Before you ask",
                items: [
                    {
                        question: "How long does installation take?",
                        answer: "One script tag or the npm package — most teams see their first live checklist within the hour.",
                    },
                    {
                        question: "Does it work with our design system?",
                        answer: "Yes. Every surface Waypoint renders inherits your fonts and colors, and the CSS is yours to override.",
                    },
                    {
                        question: "What about customers who skip onboarding?",
                        answer: "Skippers stay tracked. When they hit a wall later, Waypoint re-offers exactly the step that unblocks them.",
                    },
                ],
            },
        },
        {
            type: "cta-banner",
            variant: "card",
            content: {
                title: "Your trial customers are stalling right now.",
                body: "Connect your product this afternoon and watch where the first hour actually goes.",
                cta: { label: "Start free", anchor: "lead-form" },
            },
        },
        {
            type: "lead-form",
            variant: "inline-email",
            content: {
                kicker: "Get started",
                title: "Start with your work email",
                placeholder: "you@company.com",
                cta: "Create workspace",
                confirmation: "Check your inbox — your workspace link is on the way.",
            },
        },
    ]
}

/** The rich exemplar page under a given preset (and optional live overrides). */
export function showcaseConfig(
    preset: MarketingPresetName,
    overrides?: Record<string, string>,
): LandingConfig {
    return {
        style: { preset, ...(overrides !== undefined ? { overrides } : {}) },
        shell: showcaseShell(preset),
        sections: showcaseSections(),
    }
}

/**
 * The fixture manifest pages: one entry per blueprint, with just the
 * title/description a fresh setup would carry — so the gallery's blueprint
 * views show the untouched skeletons agents start from.
 */
export const fixturePages: MarketingPageEntry[] = [
    {
        id: "home",
        path: "/",
        title: "Home",
        blueprint: "landing",
        description: "Onboarding flows your customers actually finish.",
    },
    {
        id: "pricing",
        path: "/pricing",
        title: "Pricing",
        blueprint: "pricing",
        description: "Priced by active accounts, not seats.",
    },
    {
        id: "about",
        path: "/about",
        title: "About",
        blueprint: "about",
        description: "A small team obsessed with everyone else's first hour.",
    },
    {
        id: "faq",
        path: "/faq",
        title: "FAQ",
        blueprint: "faq",
        description: "Everything teams ask before switching.",
    },
    {
        id: "contact",
        path: "/contact",
        title: "Contact",
        blueprint: "contact",
        description: "Talk to a human about your onboarding.",
    },
]

/** A fixture blueprint page under a given preset (and optional live overrides). */
export function fixtureBlueprintConfig(
    page: MarketingPageEntry,
    preset: MarketingPresetName,
    overrides?: Record<string, string>,
): LandingConfig {
    const config = blueprintExemplarConfig({ page, pages: fixturePages, siteName: SITE_NAME, preset })
    if (overrides === undefined) {
        return config
    }
    return { ...config, style: { ...config.style, overrides } }
}
