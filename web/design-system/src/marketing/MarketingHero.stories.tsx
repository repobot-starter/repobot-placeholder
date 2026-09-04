import type { Meta, StoryObj } from "@storybook/react"
import { MarketingHero } from "./MarketingHero"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingHero> = {
    title: "Marketing/Hero",
    component: MarketingHero,
    decorators: [
        (Story) => (
            <MarketingPage preset="dark-dev">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingHero>

const copy = {
    headline: "Your team's time, finally visible.",
    subheadline:
        "Sundial turns your calendar chaos into a clear picture: where the hours go, which meetings earn their keep, and what to cut first.",
    primaryCta: { label: "Get started", anchor: "lead-form" },
    secondaryCta: { label: "See pricing", anchor: "pricing" },
}

export const CenteredStack: Story = {
    args: { variant: "centered-stack", ...copy },
}

export const SplitMedia: Story = {
    args: {
        variant: "split-media",
        ...copy,
        media: { kind: "emoji", emoji: "🗓️" },
    },
}

export const Statement: Story = {
    args: {
        variant: "statement",
        badge: "Open to freelance projects",
        headline: "I design interfaces that feel obvious in hindsight.",
        subheadline: "Product designer who codes. Toronto, Canada.",
        primaryCta: { label: "See the work", anchor: "showcase" },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="editorial">
                <Story />
            </MarketingPage>
        ),
    ],
}

export const ProductFrame: Story = {
    args: {
        variant: "product-frame",
        ...copy,
        media: { kind: "emoji", emoji: "📊" },
    },
}

export const FormFirst: Story = {
    args: {
        variant: "form-first",
        headline: copy.headline,
        subheadline: copy.subheadline,
        form: {
            placeholder: "you@company.com",
            cta: "Join the waitlist",
            confirmation: "You're on the list — watch your inbox for the next cohort.",
        },
        formJoined: false,
        onFormSubmit: () => {},
    },
}

/**
 * The photograph is the hero: viewport-wide, copy floated low over a dark
 * grade, several frames on a slow crossfade — the photographer home page.
 */
export const FullBleedMedia: Story = {
    args: {
        variant: "full-bleed-media",
        badge: "Portrait · Editorial",
        headline: "Photographs that hold still.",
        accent: "none",
        subheadline: "Mara Voss — portrait and editorial photography, Portland.",
        primaryCta: { label: "See the work", href: "/work" },
        secondaryCta: { label: "Inquire", href: "/inquire" },
        slides: [
            {
                kind: "image",
                src: "https://picsum.photos/seed/full-bleed-a/2000/1250",
                alt: "A portrait subject in low window light",
                width: 2000,
                height: 1250,
            },
            {
                kind: "image",
                src: "https://picsum.photos/seed/full-bleed-b/2000/1250",
                alt: "An editorial frame in a concrete stairwell",
                width: 2000,
                height: 1250,
            },
            {
                kind: "image",
                src: "https://picsum.photos/seed/full-bleed-c/2000/1250",
                alt: "A figure against fog on the coast",
                width: 2000,
                height: 1250,
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="editorial">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The flagship-launch collage: centered copy over the product in browser
 * chrome, with two crops of real UI floating over the frame's edges.
 */
export const PanelCollage: Story = {
    args: {
        variant: "panel-collage",
        badge: "Now in public beta",
        headline: "Every dollar, accounted for.",
        subheadline:
            "Outlay gives your team cards with built-in budgets, approvals that take one tap, and a ledger that closes itself.",
        primaryCta: { label: "Start free", href: "/signup" },
        secondaryCta: { label: "See pricing", anchor: "pricing" },
        media: {
            kind: "browser",
            src: "https://picsum.photos/seed/collage-frame/1800/1080",
            alt: "The Outlay overview dashboard",
            url: "app.outlay.com",
            width: 1800,
            height: 1080,
        },
        fragments: [
            {
                kind: "image",
                src: "https://picsum.photos/seed/collage-left/560/320",
                alt: "A spend stat card",
                width: 560,
                height: 320,
            },
            {
                kind: "image",
                src: "https://picsum.photos/seed/collage-right/560/280",
                alt: "An approval row",
                width: 560,
                height: 280,
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="luxe-light">
                <Story />
            </MarketingPage>
        ),
    ],
}

/** Full-bleed art behind the copy — the editorial/brand-led hero treatment. */
export const WithBackdrop: Story = {
    args: {
        variant: "statement",
        headline: "First in war. First in peace.",
        subheadline:
            "Soldier, statesman, and a man of unwavering integrity, leading a nation with courage, wisdom, and humility.",
        primaryCta: { label: "Explore the story", anchor: "highlights" },
        backdrop: {
            src: "https://picsum.photos/seed/hero-backdrop/1600/700",
            overlay: "soft",
            position: "center top",
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="editorial">
                <Story />
            </MarketingPage>
        ),
    ],
}
