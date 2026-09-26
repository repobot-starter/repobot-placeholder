/**
 * The chef remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the résumé pack from the product manager to a chef de
 * cuisine — same document shape, a different trade, and photographs. The
 * derived template `repobot-resume-yara` is composed from the resume pack
 * with this file copied over `content.ts` and the galley register
 * (`packs/resume-yara/catalog.json`) merged over the pack's editorial paper.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same shapes, dates as "YYYY-MM" data with
 * durations never written into prose (the page computes them — dates.ts).
 * The parity test (`tests/View/Resume/remixSeeds.test.ts`) pins the export
 * surface and the content rules against the real module.
 *
 * The photographs are what make this résumé its own: `person.portrait`
 * turns the hero into the full-bleed frame, each role's `image` hangs the
 * kitchens on a photographic timeline, and each project's `image` sets the
 * work as newspaper stories (resumeLanding.ts). Drop a field and that
 * section returns to the type-only résumé. Every photograph is 4:3; print
 * leaves them all off the paper.
 */

export interface SiteImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

export interface Role {
    title: string
    company: string
    /** First month on the job, "YYYY-MM". */
    start: string
    /** Last month on the job, "YYYY-MM"; omit while you still work there. */
    end?: string
    /** Two or three lines on what you owned and what happened because of you. */
    summary: string
    /** The kitchen, photographed (4:3) — hung beside the role on the timeline. */
    image?: SiteImage
}

export interface Education {
    credential: string
    school: string
    /** Display years, e.g. "2011 – 2015" — no math runs on these. */
    years: string
}

export interface SkillGroup {
    title: string
    skills: string[]
}

export interface Project {
    title: string
    description: string
    /** Display year, e.g. "2024". */
    year: string
    /** Where the work lives — a menu, a write-up, a booking page. Leave ""
     * until it's a real page: the shipped demo destinations are fiction. */
    url?: string
    /** Short trailing note beside the title, e.g. the place or the format. */
    meta?: string
    /** The work, photographed (4:3) — the story's picture. */
    image?: SiteImage
}

export interface ProfileLink {
    label: string
    /** Display text, e.g. "@yara.cooks". */
    value: string
    /** Leave "" until the profile is real. */
    url?: string
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): SiteImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/resume-yara/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/resume-yara/${name}-${step}w.webp`, width: step })),
    }
}

export const person = {
    name: "Yara Haddad",
    title: "Chef de cuisine",
    location: "Portland, Maine",
    email: "yara@haddad.example",
    /** Shown as the hero badge; empty string hides it. */
    availability: "Open to opening-chef roles for 2027",
    summary: [
        "I cook seafood over wood and I run kitchens people want to stay in. Day-boat fish bought off the pier at six, a pantry that carries the winter menu, and a line where the newest cook is taught the whole fish, not just their station.",
        "Semifinalist for the Northeast Rising Chef award in 2025. Now looking for the next room to open — a team to build, a menu to write from the first delivery.",
    ],
    /** The hero photograph (4:3): the whole first screen of the page. */
    portrait: photo(
        "hero",
        2400,
        1800,
        "Yara Haddad laughing at the pass as she plates seared scallops in a warm, copper-hung kitchen",
    ),
}

export const roles: Role[] = [
    {
        title: "Chef de cuisine",
        company: "Tidewrack, Portland",
        start: "2023-03",
        summary:
            "Run a 70-cover wood-fire seafood room on the waterfront and a brigade of fourteen. Rewrote the menu around the day-boat catch — whole fish over the hearth, sold by the ounce — and cut food cost from 34% to 28% without taking a dish off.",
        image: photo(
            "role-tidewrack",
            1600,
            1200,
            "Yara grilling a whole fish over the wood fire at Tidewrack, sparks rising from the hearth",
        ),
    },
    {
        title: "Sous chef",
        company: "Hearth & Hull, Portland",
        start: "2020-02",
        end: "2023-02",
        summary:
            "Second in a raw-bar and grill kitchen. Took over buying from the pier — five boats, one handshake each — and built the fish program the restaurant is still known for; ran the pass four nights a week.",
        image: photo(
            "role-pier",
            1600,
            1200,
            "Yara laughing with a fisherman over a crate of iced fish on the Portland pier at dawn",
        ),
    },
    {
        title: "Chef de partie",
        company: "Café Ardoise, Portland",
        start: "2017-05",
        end: "2020-01",
        summary:
            "Garde manger, then the fish station, in a thirty-seat bistro. Started the oyster list and the pickling shelf that became the house's winter menu; learned to cook French from a chef who cooked it for forty years.",
        image: photo(
            "role-bistro",
            1600,
            1200,
            "Yara picking herbs at a scrubbed table while the chef shucks oysters beside a snowy window",
        ),
    },
    {
        title: "Line cook",
        company: "Marrow, Boston",
        start: "2014-06",
        end: "2017-04",
        summary:
            "Sauté and grill on a 200-cover Saturday line. Learned speed, then learned to stay calm at speed.",
        image: photo(
            "role-line",
            1600,
            1200,
            "Yara calling orders on a busy restaurant line, a pan flaring on the burner beside her",
        ),
    },
]

export const education: Education[] = [
    {
        credential: "A.O.S. Culinary Arts",
        school: "Southern Maine Community College",
        years: "2012 – 2014",
    },
    {
        credential: "Stage, whole-fish and smoking",
        school: "Saltbrygga, Bergen",
        years: "2019",
    },
]

export const skillGroups: SkillGroup[] = [
    {
        title: "Fire",
        skills: ["Wood-fire grill", "Hearth roasting", "Whole-fish cookery", "Smoking & curing"],
    },
    {
        title: "Pantry",
        skills: ["Lacto-ferments", "Preserving", "Sea vegetables", "House vinegars"],
    },
    {
        title: "Sourcing",
        skills: ["Day-boat buying", "Farm relationships", "Seasonal menus", "Whole-animal ordering"],
    },
    {
        title: "The room",
        skills: ["Brigade of 14", "Menu costing", "Training line cooks", "Opening checklists"],
    },
]

// Projects ship with `url: ""`: the demo destinations are fiction, so the
// stories render unlinked until you paste your real pages.
export const projects: Project[] = [
    {
        title: "The Island Suppers",
        description:
            "A Levantine supper at one long table above the water, six Sundays a summer: my grandmother's flatbreads off the hearth, za'atar mackerel, whatever the boats brought in. Forty seats, sold out all season.",
        year: "2025",
        meta: "Supper series · Peaks Island",
        url: "",
        image: photo(
            "project-island",
            1600,
            1200,
            "Yara serving grilled fish at a long outdoor table of laughing guests above the sea at golden hour",
        ),
    },
    {
        title: "Fish Wednesdays",
        description:
            "A free butchery class before service: one fish, a board and a sharp knife for every cook in the building — and, once a month, for the culinary students from the high school down the street.",
        year: "2024",
        meta: "Teaching · Tidewrack",
        url: "",
        image: photo(
            "project-class",
            1600,
            1200,
            "Yara teaching young cooks to fillet a whole fish at a wooden prep table, everyone laughing",
        ),
    },
    {
        title: "The winter pantry",
        description:
            "Three hundred jars put up every fall — beets, rhubarb, lemons, green tomatoes — so the menu still tastes like Maine in February.",
        year: "2023",
        meta: "Preserving · Tidewrack",
        url: "",
        image: photo(
            "project-pantry",
            1600,
            1200,
            "Yara holding a jar of pickled rhubarb up to the window light in a pantry lined with preserves",
        ),
    },
]

// The non-email entries ship with `url: ""`: the addresses are demo
// fiction, so they render as plain text until you replace them with your
// real profiles (set both `value` and `url`).
export const links: ProfileLink[] = [
    { label: "Email", value: "yara@haddad.example", url: "mailto:yara@haddad.example" },
    { label: "Instagram", value: "@yara.cooks", url: "" },
    { label: "Menus", value: "yarahaddad.example/menus", url: "" },
    { label: "Press", value: "yarahaddad.example/press", url: "" },
]

/**
 * Register-owned strings, re-valued for the kitchen: the page speaks like
 * the pass (kitchens, stations, off the menu). The skeleton and the math
 * stay the base pack's.
 */
export const landingCopy = {
    /** The print CTA — the same page typesets to a one-page PDF. */
    printCta: "Download résumé",
    contactCta: "Email me",
    summary: { kicker: "The cook" },
    experience: { kicker: "Kitchens", title: "Where I've cooked" },
    stats: {
        experienceLabel: "behind the stove",
        rolesLabel: "kitchens",
        projectsLabel: "projects of my own",
    },
    skills: { kicker: "Stations", title: "What I run" },
    projects: { kicker: "Off the menu", title: "Suppers, classes, jars" },
    education: { kicker: "Training", title: "Where I learned" },
    links: {
        kicker: "Contact",
        title: "Talk to me about the next kitchen",
        body: "Opening teams, private dinners, a stage for your cooks — the fastest way in is email.",
    },
}
