/**
 * The nonprofit pack's single content file: mission, impact numbers,
 * programs, voices, volunteer days, and page copy. Everything the site
 * renders comes from here — edit this file (not the page components) to
 * make the site yours.
 *
 * The volunteer calendar is computed: `events` are dated entries that the
 * site splits into upcoming vs. past at render time with the soonest
 * highlighted as "Next up" (pure logic in `../Landing/events.ts`). Add
 * and remove entries freely — a passed date can never show as upcoming.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/nonprofit` (see PACK.md). Never point a slot at a raw
 * original.
 */
import type { DatedEvent } from "../Landing/events"

export interface NonprofitImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): NonprofitImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/nonprofit/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/nonprofit/${name}-${step}w.webp`, width: step })),
    }
}

export const org = {
    name: "The Waterline Project",
    tagline: "Watershed restoration, block by block",
    location: "Seattle, Washington",
    email: "hello@waterlineproject.example",
    /**
     * The Donate CTA's target: an external donation page (the org's own
     * processor — no payments run through this site). Replace with your
     * real donation link.
     */
    donateUrl: "https://donate.example.org/waterline",
}

export const home = {
    headline: "The creeks were here first.",
    subheadline:
        "Seattle buried, straightened, and wrote off its urban streams for a century. We put volunteers in the mud until the water runs clear — fourteen miles and counting.",
    hero: photo(
        "hero",
        1536,
        1024,
        "Volunteers in waders passing native saplings down a misty urban creek bank",
    ),
    restored: {
        kicker: "What restored looks like",
        headline: "Two thousand volunteer hours, one heron.",
        body: "Thornton Creek, mile nine. In 2019 this reach ran gray after every rain and the state listed it as impaired. Four planting seasons later the alders hold the bank, the water meets swimming standards most of the year, and the wildlife came back on its own — nobody reintroduces a heron. It shows up when the water is worth its time.",
        image: photo(
            "creek",
            1536,
            1024,
            "A restored urban creek running clear between young alders, a heron at the water's edge",
        ),
    },
    featuredQuote: {
        quote: "I've lived on this block for thirty years and watched the creek die. Last summer my grandson caught a crawdad in it. That's the whole review.",
        author: "Ray Delgado",
        title: "Neighbor and Saturday regular, Longfellow Creek",
    },
}

/** The year in numbers — the annual-report spine, set at display scale. */
export const stats = [
    { value: "14", label: "miles of creekbank restored" },
    { value: "212,000", label: "native plants in the ground" },
    { value: "38", label: "neighborhoods with a standing crew" },
    { value: "4,100", label: "volunteers out last year" },
]

/** The longer ledger for the impact page — each number with its sentence. */
export const impactStats = [
    {
        value: "92%",
        label: "of samples meeting state clean-water standards",
        description: "Across 61 monitored sites — up from 41% when sampling began in 2016.",
    },
    {
        value: "17",
        label: "species documented back in restored reaches",
        description:
            "Cutthroat trout, crawdads, and one improbable heron, verified by our volunteer science crews.",
    },
    {
        value: "310",
        label: "rain gardens built on residential streets",
        description:
            "Together they soak up roughly nine million gallons of runoff before it reaches a storm drain.",
    },
    {
        value: "5,200",
        label: "students in the watershed classroom",
        description: "Every fourth grader in three districts now meets their nearest creek with a dip net.",
    },
    {
        value: "$0.86",
        label: "of every dollar goes to fieldwork",
        description: "Programs and crew leads first; our books are audited and published every March.",
    },
    {
        value: "9",
        label: "creeks off the impaired list",
        description: "Delisted by the state since 2018 — the only scoreboard we ultimately care about.",
    },
]

export interface Program {
    slug: string
    title: string
    /** Small uppercase label: the program's cadence. */
    eyebrow: string
    description: string
    bullets: string[]
    image: NonprofitImage
}

export const programs: Program[] = [
    {
        slug: "restoration",
        title: "Creekbank restoration",
        eyebrow: "Planting season · Oct – Mar",
        description:
            "The flagship: crews clear invasives, regrade eroded banks, and plant native willow, alder, and sedge until the roots do the engineering. A restored reach shades the water, feeds the insects, and holds the soil through winter storms.",
        bullets: [
            "Every site follows a state-reviewed restoration plan",
            "Crews return to each reach for three seasons of stewardship",
            "40,000+ plants go in the ground every winter",
        ],
        image: photo(
            "hero",
            1536,
            1024,
            "Volunteers in waders passing native saplings down a misty urban creek bank",
        ),
    },
    {
        slug: "water-watch",
        title: "Water quality watch",
        eyebrow: "Monthly · Year-round",
        description:
            "Volunteer scientists sample 61 sites a month for bacteria, temperature, and dissolved oxygen — the dataset behind every grant we win and every polluter the city has fined since 2019. Training takes one Saturday; the habit lasts years.",
        bullets: [
            "61 sites sampled monthly, lab-verified quarterly",
            "All data published openly within thirty days",
            "The evidence behind nine state delistings",
        ],
        image: photo(
            "testing",
            1536,
            1024,
            "Two field volunteers taking a water sample at a creek with a vial and clipboard",
        ),
    },
    {
        slug: "rain-gardens",
        title: "Rain garden corps",
        eyebrow: "Builds · Apr – Sep",
        description:
            "Street runoff is the number-one creek killer, so we intercept it a yard at a time: engineered basins of stone and native grasses that swallow a roofline's worth of stormwater. Homeowners host; the corps digs; the city reimburses most of the cost.",
        bullets: [
            "310 gardens built, ~9 million gallons intercepted yearly",
            "Free site assessment and permitting for every host",
            "One build day per garden, tools and plants provided",
        ],
        image: photo(
            "raingarden",
            1536,
            1024,
            "Neighbors setting river stones and native grasses into a new rain garden",
        ),
    },
    {
        slug: "classroom",
        title: "Watershed classroom",
        eyebrow: "School year · 3 districts",
        description:
            "Every fourth grader in three districts spends a day at their nearest creek with dip nets, sorting trays, and a crew lead who can name what wriggles. The macroinvertebrates they count feed the same public dataset as the adult science crews.",
        bullets: [
            "5,200 students in the field last school year",
            "Curriculum aligned to state science standards",
            "Bus and gear costs fully covered by donors",
        ],
        image: photo(
            "youth",
            1536,
            1024,
            "Fourth graders with dip nets sorting creek finds into a white tray with an instructor",
        ),
    },
]

export interface NonprofitEvent extends DatedEvent {
    image?: NonprofitImage
}

/**
 * Volunteer days — upcoming vs. past is computed at render time, never
 * curated by hand. Keep past entries around: they're the field record.
 */
export const events: NonprofitEvent[] = [
    {
        slug: "earth-day-2026",
        title: "Earth Day cleanup, all crews",
        start: "2026-04-22T09:00",
        end: "2026-04-22T14:00",
        location: "All 38 neighborhood sites",
        description:
            "Our biggest day of the year: eleven hundred volunteers, six tons of debris out of the water, and the season's first crawdad sighting.",
        image: photo(
            "cleanup",
            1536,
            1024,
            "A chain of volunteers hauling a waterlogged tire up a creek bank",
        ),
    },
    {
        slug: "science-saturday-jun",
        title: "Science Saturday: summer sampling",
        start: "2026-06-13T08:30",
        end: "2026-06-13T12:00",
        location: "Meet at the field lab, Georgetown",
        description:
            "Monthly water-quality round with the summer index samples — the readings the state delisting reviews lean on hardest.",
    },
    {
        slug: "august-garden-blitz",
        title: "Rain garden blitz week",
        start: "2026-08-10T08:00",
        end: "2026-08-14T16:00",
        location: "Delridge · 12 host yards",
        description:
            "Five days, twelve gardens, one very sore corps. Delridge's runoff now has twelve fewer straight shots at Longfellow Creek.",
        image: photo(
            "raingarden",
            1536,
            1024,
            "Neighbors setting river stones and native grasses into a new rain garden",
        ),
    },
    {
        slug: "coastal-cleanup",
        title: "Coastal cleanup day",
        start: "2026-09-19T09:00",
        end: "2026-09-19T13:00",
        location: "Duwamish river mouth",
        description:
            "We take the watershed's finish line: two miles of shoreline where everything the creeks carry ends up. Gloves, grabbers, and coffee provided.",
        image: photo(
            "cleanup",
            1536,
            1024,
            "A chain of volunteers hauling a waterlogged tire up a creek bank",
        ),
    },
    {
        slug: "fall-planting-kickoff",
        title: "Fall planting kickoff",
        start: "2026-10-10T09:00",
        end: "2026-10-10T14:00",
        location: "Thornton Creek, mile 9",
        description:
            "First dig of the planting season: four thousand willow stakes and sedge plugs into the reach the summer crews prepped. No experience needed — the mud teaches fast.",
        image: photo(
            "crew",
            1536,
            1024,
            "A muddy volunteer crew on a coffee break beside the creek with trays of seedlings",
        ),
    },
    {
        slug: "raingarden-build-nov",
        title: "Rain garden build day",
        start: "2026-11-07T09:00",
        end: "2026-11-07T15:00",
        location: "Beacon Hill · 3 host yards",
        description:
            "Last builds before the ground gets stubborn. Three yards, three basins, and the corps' famous chili at noon.",
    },
    {
        slug: "volunteer-night-2026",
        title: "Volunteer appreciation night",
        start: "2026-12-04T18:00",
        end: "2026-12-04T21:00",
        location: "The field lab, Georgetown",
        description:
            "The year's numbers on the big screen, the blooper reel from the trail cameras, and the golden wader award. Plus-ones welcome.",
    },
]

export const impact = {
    headline: "The water is the report card.",
    body: "We publish everything: sample data within thirty days, audited books every March, and the only metric that can't be spun — whether the state still lists your creek as impaired.",
    letter: {
        kicker: "From the founder",
        headline: "Restoration is just showing up in the rain.",
        body: "People imagine environmental work as policy and lawsuits. Ours is mostly Saturdays: the same forty neighbors, wet to the elbow, putting sedge plugs in a bank the city gave up on. The creeks don't need everyone — they need a crew per mile that refuses to quit. Twelve years in, the herons are voting with their feet. — Mara Voss, founder & executive director",
        portrait: photo(
            "director",
            1024,
            1536,
            "Founder Mara Voss standing at the edge of a restored creek in a field jacket",
        ),
    },
    voices: [
        {
            quote: "Their dataset is better than anything my agency could fund. When Waterline flags a reach, we move.",
            author: "Dr. Elena Marsh",
            title: "Water quality lead, state ecology department",
        },
        {
            quote: "My students talk about 'their' creek all year. You can't teach that from a slideshow.",
            author: "Tomás Rivera",
            title: "4th grade teacher, Highland Elementary",
        },
        {
            quote: "The build crew turned my soggy yard into the corner's favorite thing. The creek gets the runoff it can handle now, and I get the birds.",
            author: "June Okafor",
            title: "Rain garden host, Beacon Hill",
        },
    ],
}

export const volunteer = {
    headline: "Show up for your creek.",
    body: "No experience, no gear, no minimum commitment — every skill on a crew was learned on a crew. Pick a day below or tell us what you're good at and we'll find it a use.",
    confirmation:
        "You're on the list — a crew lead will write back within the week with the next dates near you.",
    steps: [
        {
            title: "Sign up",
            description:
                "The form below reaches a real crew lead, not a mailing list. Tell us your neighborhood and we'll match you to the nearest standing crew.",
        },
        {
            title: "Dress for mud",
            description:
                "Long sleeves, closed shoes, and clothes you've already forgiven. We bring the tools, gloves, waders, training, and coffee.",
        },
        {
            title: "Do work that stays done",
            description:
                "Three hours on a Saturday. The willow you stake this winter holds that bank for the rest of your life.",
        },
    ],
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "neighborhood", label: "Neighborhood", placeholder: "e.g. Delridge" },
        {
            name: "interests",
            label: "What sounds like you?",
            placeholder: "planting, water sampling, teaching, driving a truck…",
        },
        {
            name: "note",
            label: "Anything else?",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}

export const donate = {
    headline: "Eighty-six cents of every dollar ends up in a creek.",
    body: "Donations buy sedge plugs, lab tests, and bus rides to the water — the books are audited and published every March. Giving runs through our secure external donation page; nothing is processed on this site.",
    cta: "Donate",
}

export const programsPage = {
    headline: "Four programs, one watershed.",
    body: "Everything we run points at the same outcome: water clean enough that the wildlife files the report for us.",
}
