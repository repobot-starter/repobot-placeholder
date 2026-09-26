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

/**
 * The materials board: tall portrait plates named with their use — here a
 * builder's wood species. Reusable for any trade that sells by what it
 * works in (stone, tile, fabric, paint).
 */
export const Specimens: Story = {
    args: {
        variant: "specimens",
        kicker: "Species",
        title: "What the house is made of.",
        items: [
            {
                title: "Douglas fir",
                meta: "frame, beams",
                description: "Pegged timber that outlasts the mortgage.",
                seed: "fir",
            },
            {
                title: "Western red cedar",
                meta: "siding, decks",
                description: "Salt-proof, silvering to the color of fog.",
                seed: "cedar",
            },
            {
                title: "White oak",
                meta: "floors, stairs",
                description: "Rift-sawn, the grain runs straight as rain.",
                seed: "oak",
            },
            {
                title: "Bigleaf maple",
                meta: "cabinetry",
                description: "Figured boards from storm-felled trees.",
                seed: "maple",
            },
        ].map(({ seed, ...item }) => ({
            ...item,
            media: {
                kind: "image" as const,
                src: `https://picsum.photos/seed/specimen-${seed}/900/1200`,
                alt: `${item.title} boards`,
                width: 900,
                height: 1200,
            },
        })),
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="tideline">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * Newspaper stories: a flag, then column-ruled articles — the grid sizes
 * a lead story for 1/4/7 items, two halves for 2/5/8, thirds otherwise.
 */
export const Stories: Story = {
    args: {
        variant: "stories",
        kicker: "Also inside",
        title: "Around the block",
        items: [
            {
                eyebrow: "Exclusive",
                title: "Bakery sells out by 9am, again",
                description:
                    "Line reached the corner before the shutters went up. Regulars blame the cardamom knot.",
                meta: "Fort Greene",
                url: "#",
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/story-a/900/675",
                    alt: "A bakery line",
                    width: 900,
                    height: 675,
                },
            },
            {
                eyebrow: "Sources say",
                title: "Dog attends every open studio",
                description: "Has opinions on ceramics. Declined to comment.",
                meta: "Red Hook",
                url: "#",
                linkLabel: "Continued, page 6 →",
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/story-b/900/675",
                    alt: "A dog in a studio",
                    width: 900,
                    height: 675,
                },
            },
            {
                eyebrow: "Late edition",
                title: "Band plays past curfew, nobody complains",
                description: "Neighbors reportedly brought lawn chairs.",
                meta: "Ridgewood",
                url: "#",
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/story-c/900/675",
                    alt: "A band on a stoop",
                    width: 900,
                    height: 675,
                },
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="tabloid">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The same stories under `trailhead` + `fieldbook`: field notes, one row
 * each — the photograph, a pencil trail map (one cell of the preset's
 * ornament strip per note), the essay opening on its byline (`meta`).
 */
export const FieldNotes: Story = {
    args: {
        variant: "stories",
        kicker: "Field notes",
        title: "Short essays from the trail.",
        items: [
            {
                title: "Why walking makes it easier to talk.",
                meta: "Hannah Albright, LPC",
                description:
                    "Walking, you look at the path instead of each other, and the hard sentence tends to arrive on its own.",
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/trail-walk/1600/1200",
                    alt: "Two people walking a creekside trail under aspens",
                    width: 1600,
                    height: 1200,
                },
            },
            {
                title: "What happens when it snows.",
                meta: "Priya Raman, LPC",
                description:
                    "Light snow, we walk the lower trails. Ice or wind, we move to the room or to video.",
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/trail-snow/1600/1200",
                    alt: "A video session by a window full of snowy pines",
                    width: 1600,
                    height: 1200,
                },
            },
            {
                title: "Your first walk: what to wear, where we meet.",
                meta: "Hannah Albright, LPC",
                description:
                    "Shoes you can walk a couple of miles in, a layer, and water. We meet at the gate.",
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/trailhead-gate/1600/1200",
                    alt: "A therapist greeting a client at a trailhead fence",
                    width: 1600,
                    height: 1200,
                },
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="trailhead">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * A filterable roster under `hearth` + `weave`: tall portrait cards with a
 * dyed foot, pill filters from the items' tags, tags as ochre chips.
 */
export const TherapistDirectory: Story = {
    args: {
        variant: "filterable-grid",
        kicker: "Our therapists",
        title: "Find your therapist.",
        items: [
            {
                title: "Aisha Grant",
                eyebrow: "LMFT · Founder",
                description: "Couples and individuals. Emotionally focused, warm, and direct.",
                tags: ["Individual", "Couples"],
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/kindred-a/1024/1365",
                    alt: "A therapist laughing on a lounge sofa",
                    width: 1024,
                    height: 1365,
                },
            },
            {
                title: "Beverly Jackson",
                eyebrow: "LCSW",
                description: "Twenty-five years with grief and loss. Faith in the room if you want it.",
                tags: ["Grief", "Faith-integrated"],
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/kindred-b/1024/1365",
                    alt: "A therapist with silver locs mid-laugh",
                    width: 1024,
                    height: 1365,
                },
            },
            {
                title: "Jamal Williams",
                eyebrow: "LPC",
                description: "Men's mental health: anxiety, anger, burnout, fatherhood.",
                tags: ["Individual", "Takes insurance", "Evenings"],
                media: {
                    kind: "image",
                    src: "https://picsum.photos/seed/kindred-c/1024/1365",
                    alt: "A therapist in glasses leaning forward mid-sentence",
                    width: 1024,
                    height: 1365,
                },
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="hearth">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The paint deck: flat chips wall to wall, each filled with its item's
 * `color` and printed in whichever ink reads on it; a `url` makes the
 * whole chip a link. Phones stack the chips as strips.
 */
export const Swatches: Story = {
    args: {
        variant: "swatches",
        items: [
            {
                title: "Frenchmen Coral",
                meta: "014",
                description: "Creole warmth. Made for sun‑days.",
                color: "#f0634e",
            },
            {
                title: "Bywater Teal",
                meta: "027",
                description: "Bold & calm. Bayou soul in every coat.",
                color: "#0e6f73",
            },
            {
                title: "Marigold Heights",
                meta: "039",
                description: "Joyful. Bright. For porches that pop.",
                color: "#f5a623",
            },
            {
                title: "Tremé Lavender",
                meta: "052",
                description: "Soft history. Strong character.",
                color: "#a58bd0",
            },
            {
                title: "Garden District Green",
                meta: "063",
                description: "Timeless. Deep. New Orleans.",
                color: "#1f5b3c",
            },
        ].map((item) => ({ ...item, url: "#quote" })),
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="paintchip">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * Specimens under the `riso` register's `two-ink` treatment: every plate
 * reprinted as an orange-and-sage dot-screen pair, names on ink bands.
 */
export const RisoSpecimens: Story = {
    args: { ...Specimens.args, kicker: "Native plants. Local habitat.", title: "Plant index" },
    decorators: [
        (Story) => (
            <MarketingPage preset="riso">
                <Story />
            </MarketingPage>
        ),
    ],
}
