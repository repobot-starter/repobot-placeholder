import type { Meta, StoryObj } from "@storybook/react"
import { MarketingGallery } from "./MarketingGallery"
import { MarketingPage } from "./MarketingPage"

const meta: Meta<typeof MarketingGallery> = {
    title: "Marketing/Gallery",
    component: MarketingGallery,
    decorators: [
        (Story) => (
            <MarketingPage preset="editorial">
                <Story />
            </MarketingPage>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof MarketingGallery>

const items = [
    {
        media: { kind: "emoji", emoji: "☕" } as const,
        caption: "Fjord Coffee — packaging system, 2025",
    },
    {
        media: { kind: "emoji", emoji: "📚" } as const,
        caption: "Ledger Press — editorial site",
    },
    {
        media: { kind: "emoji", emoji: "🎬" } as const,
        caption: "Northlight Films — title system",
    },
    {
        media: { kind: "emoji", emoji: "⚓" } as const,
        caption: "Harbor & Co — wayfinding",
    },
    {
        media: { kind: "emoji", emoji: "🕯️" } as const,
        caption: "Tallow & Wick — identity",
    },
    {
        media: { kind: "emoji", emoji: "🧵" } as const,
        caption: "Selvedge Studio — lookbook",
    },
]

export const Uniform: Story = {
    args: {
        variant: "uniform",
        kicker: "The work",
        title: "Six projects, properly finished",
        items,
    },
}

export const Masonry: Story = {
    args: {
        variant: "masonry",
        kicker: "The work",
        title: "Six projects, properly finished",
        items,
    },
}

/**
 * Justified rows need real aspect ratios to level — photo items carry
 * intrinsic dimensions, which also exercise the srcset-ready image path.
 */
const photoItems = [
    { seed: "gallery-a", width: 1600, height: 1067 },
    { seed: "gallery-b", width: 1067, height: 1600 },
    { seed: "gallery-c", width: 1600, height: 1067 },
    { seed: "gallery-d", width: 1600, height: 900 },
    { seed: "gallery-e", width: 1200, height: 1500 },
    { seed: "gallery-f", width: 1600, height: 1067 },
    { seed: "gallery-g", width: 1600, height: 1200 },
    { seed: "gallery-h", width: 1000, height: 1500 },
].map(({ seed, width, height }, index) => ({
    media: {
        kind: "image",
        src: `https://picsum.photos/seed/${seed}/${width}/${height}`,
        alt: `Portfolio frame ${index + 1}`,
        width,
        height,
    } as const,
    caption: `Frame ${String(index + 1).padStart(2, "0")}`,
}))

export const Justified: Story = {
    args: {
        variant: "justified",
        kicker: "Selected work",
        title: "In sequence, as shot",
        items: photoItems,
        lightbox: true,
    },
}

export const JustifiedFullBleed: Story = {
    args: {
        variant: "justified",
        items: photoItems,
        fullBleed: true,
        lightbox: true,
    },
}

export const Sequence: Story = {
    args: {
        variant: "sequence",
        kicker: "Selected work",
        title: "One frame at a time",
        items: photoItems,
        lightbox: true,
    },
}

export const Filmstrip: Story = {
    args: {
        variant: "filmstrip",
        kicker: "Selected work",
        title: "Along the strip",
        items: photoItems,
        fullBleed: true,
        lightbox: true,
    },
}

/**
 * The trades treatment: each pair is the same project before and after
 * the work, revealed under the draggable divider. Real pairs must share
 * a camera angle; the story's stand-ins only exercise the mechanics.
 */
const compareItems = [
    { before: "compare-a1", after: "compare-a2", caption: "Maple Street kitchen — full remodel" },
    { before: "compare-b1", after: "compare-b2", caption: "Harbor View bath — tile and vanity" },
    { before: "compare-c1", after: "compare-c2", caption: "Orchard Lane deck — rebuild" },
    { before: "compare-d1", after: "compare-d2", caption: "Foundry loft — open-plan conversion" },
].map(({ before, after, caption }) => ({
    media: {
        kind: "image",
        src: `https://picsum.photos/seed/${after}/1600/1067`,
        alt: `${caption}, after`,
        width: 1600,
        height: 1067,
    } as const,
    beforeMedia: {
        kind: "image",
        src: `https://picsum.photos/seed/${before}/1600/1067`,
        alt: `${caption}, before`,
        width: 1600,
        height: 1067,
    } as const,
    caption,
}))

export const BeforeAfter: Story = {
    args: {
        variant: "before-after",
        kicker: "The work",
        title: "Drag to see the difference",
        items: compareItems,
        lightbox: true,
    },
}

/**
 * One photograph under every variant: each must present the single frame
 * full width (the `sequence` treatment), never a flex-spacer orphan —
 * composed documents can carry any variant over single-photo content
 * (remix re-rolls variants without seeing item counts).
 */
export const SingleItemEveryVariant: Story = {
    render: () => (
        <>
            {(
                [
                    "uniform",
                    "masonry",
                    "justified",
                    "sequence",
                    "filmstrip",
                    "scrapbook",
                    "before-after",
                ] as const
            ).map((variant) => (
                <MarketingGallery
                    key={variant}
                    variant={variant}
                    kicker="Single item"
                    title={variant}
                    items={photoItems.slice(0, 1)}
                />
            ))}
        </>
    ),
}
