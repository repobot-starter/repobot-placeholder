import type { LandingConfig } from "@ui"

/**
 * The kernel's landing exemplar (`/landing`): an editorial studio page —
 * deliberately a different business type, preset, and section stack than
 * the launch pack's SaaS page, so the two together show the kernel's range.
 * This file IS the page: reorder sections, swap variants, or change the
 * style preset and the page follows (docs/landing.md).
 */
/**
 * Document meta for the page (docs/seo.md): meta is content, so it lives in
 * this file next to the copy it summarizes and `LandingPage` renders it
 * through `PageMeta`.
 */
export const landingMeta = {
    title: "Atelier North",
    description:
        "Brand systems for companies that mean it — a two-person studio in Reykjavik. We name things, draw them, and build the sites they live on.",
}

export const landing: LandingConfig = {
    style: { preset: "editorial" },
    sections: [
        {
            id: "nav",
            type: "nav",
            variant: "minimal",
            content: {
                logo: { name: "Atelier North" },
                cta: { label: "Start a project", anchor: "lead-form" },
            },
        },
        {
            id: "hero",
            type: "hero",
            variant: "statement",
            content: {
                badge: "Taking projects for autumn",
                headline: "Brand systems for companies that mean it.",
                subheadline:
                    "A two-person studio in Reykjavik. We name things, draw them, and build the sites they live on.",
                primaryCta: { label: "See how we work", anchor: "steps" },
                secondaryCta: { label: "Start a project", anchor: "lead-form" },
            },
        },
        {
            id: "social-proof",
            type: "social-proof",
            variant: "text-logos",
            content: {
                label: "Selected clients",
                items: ["Harbor & Co", "Fjord Coffee", "Ledger Press", "Northlight Films"],
            },
        },
        {
            id: "feature-grid",
            type: "feature-grid",
            variant: "icon-list",
            content: {
                kicker: "What we do",
                title: "Four things, done properly",
                features: [
                    {
                        emoji: "✒️",
                        title: "Naming",
                        description:
                            "The word people will say out loud for the next decade. We take it seriously.",
                    },
                    {
                        emoji: "🖋️",
                        title: "Identity",
                        description:
                            "Marks, type, and color that survive a favicon and a building sign alike.",
                    },
                    {
                        emoji: "🖥️",
                        title: "Web design",
                        description: "Sites that read like the brand sounds — built by us, not handed off.",
                    },
                    {
                        emoji: "📦",
                        title: "Packaging",
                        description: "Shelf presence for physical goods, from dieline to press check.",
                    },
                ],
            },
        },
        {
            id: "showcase",
            type: "showcase",
            variant: "filterable-grid",
            content: {
                kicker: "Selected work",
                title: "Things we made properly",
                items: [
                    {
                        title: "Fjord Coffee",
                        description: "Naming, identity, and packaging for a roastery that ships worldwide.",
                        eyebrow: "2025",
                        tags: ["Identity", "Packaging"],
                        media: { kind: "emoji", emoji: "☕" },
                    },
                    {
                        title: "Ledger Press",
                        description: "A serif-led editorial site for an independent publisher.",
                        eyebrow: "2025",
                        tags: ["Web"],
                        media: { kind: "emoji", emoji: "📚" },
                    },
                    {
                        title: "Northlight Films",
                        description: "Title system and poster grid for a documentary studio.",
                        eyebrow: "2024",
                        tags: ["Identity", "Web"],
                        media: { kind: "emoji", emoji: "🎬" },
                    },
                    {
                        title: "Harbor & Co",
                        description: "Wayfinding and shelf presence for a harborside grocer.",
                        eyebrow: "2024",
                        tags: ["Packaging"],
                        media: { kind: "emoji", emoji: "⚓" },
                    },
                ],
            },
        },
        {
            id: "steps",
            type: "steps",
            variant: "numbered-cards",
            content: {
                kicker: "How we work",
                title: "Six weeks, three milestones",
                steps: [
                    {
                        title: "Listen",
                        description:
                            "A week of conversations before we draw anything. Strategy is written down, not implied.",
                    },
                    {
                        title: "Make",
                        description: "Two directions, presented as finished artifacts — never mood boards.",
                    },
                    {
                        title: "Ship",
                        description:
                            "Files, guidelines, and the site live. We stay on call for the first month.",
                    },
                ],
            },
        },
        {
            id: "faq",
            type: "faq",
            variant: "accordion",
            content: {
                kicker: "FAQ",
                title: "Sensible questions",
                items: [
                    {
                        question: "What does an engagement cost?",
                        answer: "Identity work starts at $18k; naming alone at $6k. Fixed price, agreed before we start — no hourly meters.",
                    },
                    {
                        question: "Do you take equity or trade?",
                        answer: "No. It keeps every recommendation honest, including the one where we tell you not to rebrand.",
                    },
                    {
                        question: "How soon can you start?",
                        answer: "We run one project at a time. The badge at the top of this page is always current.",
                    },
                ],
            },
        },
        {
            id: "cta-banner",
            type: "cta-banner",
            variant: "card",
            content: {
                title: "Tell us what you're making.",
                body: "Two paragraphs about your company and where it's stuck is the perfect first email.",
                cta: { label: "Start a project", anchor: "lead-form" },
            },
        },
        {
            id: "lead-form",
            type: "lead-form",
            variant: "inline-email",
            content: {
                kicker: "Contact",
                title: "Start the conversation",
                placeholder: "you@company.com",
                cta: "Request an intro call",
                confirmation: "Thanks — we reply within two working days.",
            },
        },
        {
            id: "footer",
            type: "footer",
            variant: "single-row",
            content: {
                blurb: "Atelier North · Reykjavik",
                // Social links wait for real profiles: bare platform
                // homepages are dead-end navigation (and social platforms
                // refuse to load back inside embedded previews), so the demo
                // footer keeps only the contact link that always works.
                links: [{ label: "Email", href: "mailto:hello@ateliernorth.example" }],
                note: "· Made with Repobot",
            },
        },
    ],
}
