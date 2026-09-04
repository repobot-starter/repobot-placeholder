import type { Meta, StoryObj } from "@storybook/react"
import { MarketingPage } from "./MarketingPage"
import { MarketingShowcase } from "./MarketingShowcase"

const meta: Meta<typeof MarketingShowcase> = {
    title: "Marketing/Showcase",
    component: MarketingShowcase,
    decorators: [
        (Story) => (
            <MarketingPage preset="editorial">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingShowcase>

const projects = [
    {
        title: "Fjord Coffee",
        description: "Naming, identity, and packaging for a roastery that ships worldwide.",
        eyebrow: "2025",
        tags: ["Identity", "Packaging"],
        media: { kind: "emoji", emoji: "☕" } as const,
        url: "#",
    },
    {
        title: "Ledger Press",
        description: "A serif-led editorial site for an independent publisher.",
        eyebrow: "2025",
        tags: ["Web"],
        media: { kind: "emoji", emoji: "📚" } as const,
        url: "#",
    },
    {
        title: "Northlight Films",
        description: "Title system and poster grid for a documentary studio.",
        eyebrow: "2024",
        tags: ["Identity", "Web"],
        media: { kind: "emoji", emoji: "🎬" } as const,
    },
    {
        title: "Harbor & Co",
        description: "Wayfinding and shelf presence for a harborside grocer.",
        eyebrow: "2024",
        tags: ["Packaging"],
        media: { kind: "emoji", emoji: "⚓" } as const,
    },
]

export const CardGrid: Story = {
    args: {
        variant: "card-grid",
        kicker: "Selected work",
        title: "Things we made properly",
        items: projects,
    },
}

export const FilterableGrid: Story = {
    args: {
        variant: "filterable-grid",
        kicker: "Selected work",
        title: "Things we made properly",
        items: projects,
    },
}

/** Large cover tiles, whole card a link — the album index for photographers. */
export const Collections: Story = {
    args: {
        variant: "collections",
        kicker: "The work",
        title: "Collections",
        items: [
            {
                title: "Portraits",
                description: "Studio and location portraiture, 2024–2026.",
                eyebrow: "Ongoing",
                meta: "24 photographs",
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/collection-portraits/1500/1000",
                    alt: "A portrait subject in low window light",
                    width: 1500,
                    height: 1000,
                },
                url: "#",
            },
            {
                title: "Editorial",
                description: "Commissioned stories for print and web.",
                eyebrow: "Commissions",
                meta: "18 photographs",
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/collection-editorial/1500/1000",
                    alt: "An editorial frame in a concrete stairwell",
                    width: 1500,
                    height: 1000,
                },
                url: "#",
            },
        ],
    },
}

/** The same cover tiles as `collections`, on a scroll-snapped rail. */
export const MediaRail: Story = {
    args: {
        variant: "media-rail",
        kicker: "The work",
        title: "Collections",
        items: ["portraits", "editorial", "coastal", "studio"].map((seed, index) => ({
            title: seed.charAt(0).toUpperCase() + seed.slice(1),
            description: "A sequenced body of work, hung in order.",
            eyebrow: "2025",
            meta: `${12 + index * 4} photographs`,
            media: {
                kind: "image" as const,
                src: `https://picsum.photos/seed/rail-${seed}/1500/1000`,
                alt: `Cover frame from the ${seed} collection`,
                width: 1500,
                height: 1000,
            },
            url: "#",
        })),
    },
}

/** Status badges over the media — a real-estate listings grid's grammar. */
export const ListingsWithBadges: Story = {
    args: {
        variant: "filterable-grid",
        kicker: "Listings",
        title: "On the market",
        allLabel: "All neighborhoods",
        items: [
            {
                title: "14 Benefit Street",
                description: "A 1790s brick rowhouse with twelve-pane windows and a walled garden.",
                eyebrow: "4 bd · 3 ba · 2,940 sq ft",
                meta: "$1,285,000",
                tags: ["College Hill"],
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/listing-rowhouse/1500/1000",
                    alt: "A brick rowhouse with black shutters",
                    width: 1500,
                    height: 1000,
                },
                badge: { label: "New this week" },
                url: "#",
            },
            {
                title: "82 Transit Street",
                description: "A clapboard cottage two blocks up from the harbor.",
                eyebrow: "2 bd · 1 ba · 1,180 sq ft",
                meta: "$539,000",
                tags: ["Fox Point"],
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/listing-cottage/1500/1000",
                    alt: "A yellow clapboard cottage",
                    width: 1500,
                    height: 1000,
                },
                badge: { label: "Sale pending" },
                url: "#",
            },
            {
                title: "9 Governor Street",
                description: "A garden cottage with a deep porch, closed above asking.",
                eyebrow: "3 bd · 2 ba · 1,610 sq ft",
                meta: "$685,000",
                tags: ["Fox Point"],
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/listing-garden/1500/1000",
                    alt: "A brick garden cottage behind an iron gate",
                    width: 1500,
                    height: 1000,
                },
                badge: { label: "Sold", tone: "neutral" },
            },
        ],
    },
}

export const MenuWithPrices: Story = {
    args: {
        variant: "filterable-grid",
        kicker: "Menu",
        title: "Baked every morning",
        allLabel: "Everything",
        items: [
            {
                title: "Cardamom knot",
                description: "Twice-proofed dough, hand-rolled with green cardamom.",
                meta: "$4.50",
                tags: ["Pastry"],
                media: { kind: "emoji", emoji: "🥐" },
            },
            {
                title: "Rye sourdough",
                description: "Forty-hour ferment, dark crust, keeps a week.",
                meta: "$9",
                tags: ["Bread"],
                media: { kind: "emoji", emoji: "🍞" },
            },
            {
                title: "Flat white",
                description: "Single-origin espresso, milk from the farm up the road.",
                meta: "$5",
                tags: ["Coffee"],
                media: { kind: "emoji", emoji: "☕" },
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="warm-boutique">
                <Story />
            </MarketingPage>
        ),
    ],
}
