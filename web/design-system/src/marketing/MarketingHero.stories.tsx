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
 * The title card: a thin monumental headline low-left, a tracked credit
 * line under it, and the photograph's own caption on the lower right. In
 * the tideline register the frame dissolves into the page at its edges
 * (the `mist` treatment).
 */
export const FullBleedCaptioned: Story = {
    args: {
        variant: "full-bleed-media",
        headline: "Built for the weather.",
        accent: "none",
        credit: "Custom homes · Timber frame · Restoration — Cannon Beach, Oregon",
        mediaCaption: "The Haystack House, 2025 — 26 months, 14 trades, one view.",
        primaryCta: { label: "Begin a project", href: "/quote" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/full-bleed-coast/2000/1125",
            alt: "A timber house above the sea at dusk",
            width: 2000,
            height: 1125,
        },
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

/**
 * A tabloid front page: the accent dateline bar, a banner headline over a
 * deck and byline, the lead photo, and a caption with a jump link.
 */
export const FrontPage: Story = {
    args: {
        variant: "front-page",
        badge: "Exclusive",
        headline: "Corner diner\nserves pie at 3am",
        accent: "last-word",
        subheadline: "Night shift confirms: the cherry is worth the wait.",
        primaryCta: { label: "Read the menu", anchor: "menu" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/front-page/1200/900",
            alt: "A diner counter at night",
            width: 1200,
            height: 900,
        },
        edition: {
            dateline: "Late edition",
            masthead: "All the news that fits on a napkin",
            issue: "Vol. 3 · No. 12",
            byline: "Rae Kim",
            bylineRole: "Night desk",
            caption: "The counter at 3:04am. Photo: staff.",
            jump: { label: "Story, page 3 →", anchor: "stories" },
        },
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
 * The riso poster: under `two-ink` the title card becomes an inset print —
 * the photograph reprinted as an orange-and-sage plate pair, the credit on
 * a tape strip, the caption a round stamp.
 */
export const RisoPoster: Story = {
    args: {
        variant: "full-bleed-media",
        headline: "Let it grow wild.",
        accent: "none",
        credit: "Native plant landscapes · Austin, Texas",
        mediaCaption: "No lawns since 2014",
        primaryCta: { label: "Start a garden", href: "/quote" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/riso-meadow/2000/1125",
            alt: "A native meadow in front of a limestone cottage",
            width: 2000,
            height: 1125,
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="riso">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The paint deck's storefront: under `colorblock` the split hero runs edge
 * to edge — copy column, full-height photograph — and the `credit` line
 * closes the copy under the asks.
 */
export const ColorblockSplit: Story = {
    args: {
        variant: "split-media",
        headline: "We paint loud houses.",
        subheadline: "Exteriors, interiors, porches & shutters — historic approvals handled, two full coats.",
        badge: "Open — closes 4 PM",
        badgeLive: true,
        credit: "New Orleans house painting",
        primaryCta: { label: "Pick your color → get a quote", href: "/quote" },
        secondaryCta: { label: "Call (504) 555-0139", href: "tel:+15045550139" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/shotgun-row/1600/1200",
            alt: "A row of brightly painted shotgun houses",
            width: 1600,
            height: 1200,
        },
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
 * The sign painter's van door (`jacaranda` + `signpaint`): the headline
 * painted over the photograph, the `price-board` aside lettered on it, and
 * a `seal` roundel whose line break splits its small top line.
 */
export const FullBleedPriceBoard: Story = {
    args: {
        variant: "full-bleed-media",
        badge: "On call now, 24/7 · Avg. arrival 38 min",
        headline: "The price is the price.",
        subheadline: "Flat-rate plumbing across Pasadena — the quote is what you pay, at noon or at 3 AM.",
        primaryCta: { label: "Call (626) 555-0148", href: "tel:+16265550148" },
        secondaryCta: { label: "Request service", href: "/request" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/van-door/2160/1350",
            alt: "A plumber leaning on his van on a jacaranda-lined street",
            width: 2160,
            height: 1350,
        },
        aside: {
            kind: "price-board",
            title: "Upfront pricing.",
            items: [
                { name: "Drains", price: "$189" },
                { name: "Toilets", price: "$425" },
                { name: "Water heaters", price: "$1,850" },
                { name: "Night calls", price: "$95" },
            ],
            footnote: "Same price at 3 AM.",
            cta: { label: "Get an exact quote", href: "/request" },
        },
        seal: "On call\n24/7",
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="jacaranda">
                <Story />
            </MarketingPage>
        ),
    ],
}

/** The techno flyer as a wiring diagram (`schematic` + `linework`). */
export const FullBleedSchematic: Story = {
    args: {
        variant: "full-bleed-media",
        badge: "On call now, 24/7 · Avg. outage response 52 min",
        headline: "We wire Detroit.",
        subheadline: "Panels, rewires, EV chargers — licensed master electricians since 1998.",
        primaryCta: { label: "Call (313) 555-0187", href: "tel:+13135550187" },
        secondaryCta: { label: "Request service", href: "/request" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/panel-glow/2400/1350",
            alt: "An electrician at a glowing breaker panel",
            width: 2400,
            height: 1350,
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="schematic">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * 70s desert modern (`sunbelt` + `sunburst`): the `readout` — a monumental
 * figure with a script note, a brand statement rather than a live reading
 * — over the headline, the photograph bleeding off the page edge.
 */
export const SplitReadout: Story = {
    args: {
        variant: "split-media",
        headline: "Cold air. Fast.",
        subheadline: "Same-day AC repair across the Valley and a person on the line at 2 AM.",
        primaryCta: { label: "Call (602) 555-0115", href: "tel:+16025550115" },
        secondaryCta: { label: "Request service", href: "/request" },
        readout: { value: "115°", note: "72° inside" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/rooftop-ac/2400/1800",
            alt: "A technician kneeling at a rooftop AC unit under a desert sky",
            width: 2400,
            height: 1800,
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="sunbelt">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The glossy cover (`crown` + `metallic`): the masthead cast in chrome with
 * a gold accent word, the kicker behind a sparkle, and `coverLines` run
 * down the left edge — a "\n" splits each line's lead from its tail.
 */
export const CrownCover: Story = {
    args: {
        variant: "masthead-overlay",
        headline: "The\nCrown Room",
        accent: "last-word",
        badge: "Est. 2014 · The braids issue",
        credit: "Braids & natural hair studio",
        coverLines: ["Knotless · Boho ·\nLocs retwist", "Book\n3 weeks out", "Bed-Stuy's\nfavorite chair"],
        primaryCta: { label: "Book your chair", href: "/quote" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/crown-cover/2000/1125",
            alt: "A braided portrait on a plum and gold backdrop",
            width: 2000,
            height: 1125,
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="crown">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The beauty counter (`vanity` + `lacquer`): the headline's first line at
 * fashion scale over a smaller second, the accent word back at size in
 * lipstick, and a hairline-led credit in tiny spaced caps.
 */
export const VanityCounter: Story = {
    args: {
        variant: "full-bleed-media",
        headline: "Beat\nfor the gods.",
        accent: "last-word",
        credit: "Editorial & bridal makeup artist · Los Angeles",
        primaryCta: { label: "Book a consultation", href: "/quote" },
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/vanity-counter/2000/1125",
            alt: "A glam makeup portrait beside swatch strokes on black",
            width: 2000,
            height: 1125,
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="vanity">
                <Story />
            </MarketingPage>
        ),
    ],
}

const boothFrame = (seed: string) => ({
    kind: "image" as const,
    src: `https://picsum.photos/seed/${seed}/640/480`,
    alt: "A couple mugging in a photo booth",
    width: 640,
    height: 480,
})

const snapshot = (seed: string, width: number, height: number, alt: string) => ({
    kind: "image" as const,
    src: `https://picsum.photos/seed/${seed}/${width}/${height}`,
    alt,
    width,
    height,
})

/**
 * The photo-booth wedding (`photobooth` + `zine`): the `invitation` — the
 * headline in three marker lines, a countdown tag, and the pasted-up wall
 * of booth strips (`frames`) and flash snapshots with taped `sticker`
 * labels; the particulars typed along the foot with the jump to the details.
 */
export const InvitationWall: Story = {
    args: {
        variant: "invitation",
        badge: "261 days to go",
        headline: "Okay,\nwe're\ndoing it.",
        subheadline: "Join us for our wedding — an unstaged, real-life kind of party.",
        primaryCta: { label: "RSVP", href: "/rsvp" },
        secondaryCta: { label: "Details, maps & all that jazz", href: "/schedule" },
        credit: "Saturday, June 12 · Chicago · RSVP by May 1",
        media: snapshot("kitchen-flash", 1600, 1200, "Cooking together in a tiny kitchen"),
        snapshots: [
            { frames: [boothFrame("booth-a1"), boothFrame("booth-a2")] },
            { media: snapshot("kitchen-flash", 1600, 1200, "Cooking together in a tiny kitchen") },
            {
                frames: [boothFrame("booth-b1"), boothFrame("booth-b2")],
                sticker: "Not picture perfect.\nPicture us.",
            },
            { media: snapshot("platform-flash", 1600, 2133, "Laughing on a train platform at night") },
            {
                media: snapshot(
                    "roadtrip-flash",
                    1600,
                    2133,
                    "Bare feet on a car dashboard, open road ahead",
                ),
                sticker: "Road trip. Bad cooking. Best people. ♥",
            },
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="photobooth">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The disco supper club (`disco` + `mirrorball`): the same `invitation`
 * with a `readout` (the name in pink script over tracked gold "turns"),
 * the big number in lacquer red, the rest of the line sung in script, a
 * `seal` beside the ask, and one portrait dissolving into the dark.
 */
export const InvitationPortrait: Story = {
    args: {
        variant: "invitation",
        badge: "23 days to go",
        readout: { value: "Vivienne", note: "turns" },
        headline: "Sixty\nlooks good on me.",
        subheadline:
            "A 1970s disco supper-club celebration of friendship, flavor, and fabulousness. Darling, we're just getting started.",
        primaryCta: { label: "RSVP", href: "/rsvp" },
        seal: "Dancing\ntill late",
        credit: "Saturday, October 16 · The Starlight Room, Miami · Cocktails at nine · Dress: dazzle",
        media: snapshot(
            "disco-floor",
            2400,
            1350,
            "A woman in red sequins laughing on a dance floor under a mirror ball",
        ),
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="disco">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The station sign (`wayfinding` + `transit`): the `directory` aside under
 * the subheadline — three pictogram facts a patient looks for first.
 */
export const SplitDirectoryTransit: Story = {
    args: {
        variant: "split-media",
        badge: "Open — closes 6 PM",
        badgeLive: true,
        headline: "A doctor who texts back.",
        accent: "none",
        subheadline:
            "Direct primary care in South Philadelphia. One flat membership, same-day visits, labs at cost.",
        primaryCta: { label: "Book a visit", href: "/book" },
        secondaryCta: { label: "Meet the doctor", href: "/providers" },
        credit: "Direct primary care · South Philadelphia",
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/rowhouse-clinic/2400/1800",
            alt: "A doctor laughing with an older patient by a rowhouse window",
            width: 2400,
            height: 1800,
        },
        aside: {
            kind: "directory",
            items: [
                {
                    label: "$89/mo",
                    note: "Membership, not insurance",
                    icon: "shield",
                    href: "/what-we-treat",
                },
                { label: "Same-day visits", note: "Text by noon, seen today", icon: "clock" },
                { label: "Text your doctor", note: "Her number, her replies", icon: "message" },
            ],
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="wayfinding">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The gallery poster (`inkblot` + `wall-label`): the `directory` aside as
 * the museum label — title, lines, then catalogue links — and the
 * `mediaCaption` beside the plate.
 */
export const SplitDirectoryWallLabel: Story = {
    args: {
        variant: "split-media",
        headline: "You're not too much.",
        accent: "last-word",
        subheadline: "Therapy and adult ADHD evaluation in Park Slope and by telehealth.",
        primaryCta: { label: "Book a consultation", href: "/book" },
        secondaryCta: { label: "Meet the psychologists", href: "/providers" },
        mediaCaption: "What do you see?\n(There's no wrong answer.)",
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/inkblot-plate/2400/2400",
            alt: "A symmetrical ultramarine inkblot on folded paper",
            width: 2400,
            height: 2400,
        },
        aside: {
            kind: "directory",
            title: "Miriam Castellanos, PsyD",
            lines: ["Anxiety · ADHD · Burnout", "Park Slope & telehealth"],
            items: [
                { label: "First session", href: "/new-patients" },
                { label: "Fees & insurance", href: "#pricing" },
                { label: "Is this right for me?", href: "#faq" },
            ],
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="inkblot">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The Southern parlor (`parlor` + `gilt`): the full-bleed photograph graded
 * warm from the lower left, the `last-line` accent in Baskervville italic,
 * the `credit` in small caps under a gilt rule.
 */
export const FullBleedParlor: Story = {
    args: {
        variant: "full-bleed-media",
        badge: "Open — closes 5 PM",
        headline: "Time with your doctor.\nImagine that.",
        accent: "last-line",
        subheadline:
            "Concierge internal medicine: same-day visits, house calls, and appointments that run an hour.",
        primaryCta: { label: "Schedule an introduction", href: "/book" },
        secondaryCta: { label: "Meet the physicians", href: "/providers" },
        credit: "Membership from $250/month · Limited to 400 members",
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/parlor-table/2400/1350",
            alt: "A doctor and her patient laughing over coffee at a walnut table",
            width: 2400,
            height: 1350,
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="parlor">
                <Story />
            </MarketingPage>
        ),
    ],
}

const fridgePrint = (seed: string, alt: string, caption: string) => ({
    media: {
        kind: "image" as const,
        src: `https://picsum.photos/seed/${seed}/1500/1000`,
        alt,
        width: 1500,
        height: 1000,
    },
    caption,
})

/**
 * The fridge door (`snapshot` + `taped`): a pile of white-bordered prints
 * under masking tape beside the headline, marker captions, the `seal` as a
 * sticky note and the `credit` as a marker scribble.
 */
export const Pinboard: Story = {
    args: {
        variant: "pinboard",
        badge: "Documentary family photos · Chicago",
        headline: "Not a portrait.\nYour Saturday.",
        accent: "last-line",
        subheadline:
            "I show up for a real day — pancakes, the park, the meltdown, bath time — and you get the pictures you'll actually keep.",
        primaryCta: { label: "Book a day", href: "/book" },
        secondaryCta: { label: "See real days", href: "/work" },
        credit: "no posing, promise",
        seal: "now booking\nweekends!",
        prints: [
            fridgePrint("fridge-pancakes", "A dad flipping pancakes while two kids watch", "pancake sunday"),
            fridgePrint("fridge-hose", "Kids running through a garden hose", "the hose incident"),
            fridgePrint("fridge-porch", "A grandmother reading on a porch with a toddler", "nana's porch"),
            fridgePrint("fridge-bath", "A toddler laughing in a bubble bath", "bath time, 7:40pm"),
        ],
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="snapshot">
                <Story />
            </MarketingPage>
        ),
    ],
}

/**
 * The Western show bill (`rodeo` + `lariat`): the `last-line` accent prints
 * the line after the break nearly twice the size, the badge a countdown
 * line, the `credit` a ribbon, the `seal` a roundel over the photograph.
 */
export const RodeoBill: Story = {
    args: {
        variant: "split-media",
        badge: "386 days till we ride",
        headline: "The Calloways\nride again.",
        accent: "last-line",
        subheadline:
            "Three days at a desert guest ranch — trail rides, a long table under the stars, and every branch of the family in one place.",
        primaryCta: { label: "RSVP", href: "/rsvp" },
        secondaryCta: { label: "See the schedule", anchor: "schedule" },
        credit: "A Calloway ranch gathering",
        seal: "Join us\nOct 15–17",
        media: {
            kind: "image",
            src: "https://picsum.photos/seed/desert-ride/2400/1600",
            alt: "A family riding horses through the desert at sunset",
            width: 2400,
            height: 1600,
        },
    },
    decorators: [
        (Story) => (
            <MarketingPage preset="rodeo">
                <Story />
            </MarketingPage>
        ),
    ],
}
