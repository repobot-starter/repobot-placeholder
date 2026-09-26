/**
 * The reunion pack's single content file: the family, the weekend, the
 * activities, the memory wall, and the head-count ask. Everything the site
 * renders comes from here — edit this file (not the page components) to
 * make the site yours. The demo weekend is the Calloways' fortieth at a
 * New Hampshire lake, but the slots fit any gathering — a class reunion, a
 * fiftieth birthday campout, the annual cousins' weekend.
 *
 * The countdown is data (`reunion.startDateIso`); the labels the site
 * renders from it ("351 days till the lake", "It's reunion weekend") are
 * computed per render by the clock engine (`countdown.ts`) in the words
 * `landingCopy.countdown` and `landingCopy.nudge` give it — change the
 * date here and the hero badge and the RSVP nudge follow.
 *
 * `home.layout` picks the home page's composition: `lawn` (this
 * weekend's) sets the masthead over the long table, the organizers' note,
 * the weekend as numbered cards, the activities, and the scrapbook;
 * `poster` opens on the split rodeo bill (the headline's last line in the
 * accent, `reunion.ribbon` under it, `reunion.seal` on the photograph),
 * runs the activities as a strip of day-stamped stops (`activities.items[].when`),
 * and wears the admission-ticket banner and accented page headlines. The
 * content-driven sections ship empty here and render once filled, in
 * either layout: the full schedule (`weekend.intro` and each day's
 * `items`), the lodging block, the family branches, getting there, and
 * the pack list.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/reunion` (see PACK.md). Never point a slot at a raw
 * camera file — and yes, the scanned ones count: run the scans through
 * the same verb.
 */

import type { MarketingLeadFormField } from "@ui"

export interface SiteImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): SiteImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/reunion/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/reunion/${name}-${step}w.webp`, width: step })),
    }
}

export const reunion = {
    /** The masthead: what the family calls it. */
    title: "The Calloways, all of us.",
    subtitle: "The 40th annual Calloway reunion — three days at Birch Point, same lake as always.",
    familyName: "Calloway",
    /** The ribbon under the poster headline (the `poster` layout). */
    ribbon: "",
    /** ISO date the clock engine counts toward (the weekend's first day). */
    startDateIso: "2027-08-13",
    /** The weekend as the fridge magnet says it. */
    datesLabel: "August 13–15, 2027",
    /** The seal on the poster's photograph: first line small, then the dates. */
    seal: "",
    venueShort: "Birch Point · Lake Winnisquam, New Hampshire",
    /** Reaching the organizers. */
    email: "calloway.reunion@example.com",
    /** Who's herding this year. */
    organizers: "Aunt Ro and Uncle Pete",
    heroImage: photo(
        "hero",
        1536,
        1024,
        "A long reunion lunch table on a lakeside lawn, four generations laughing under bunting strung between maples",
    ),
}

/** The home page's composition — see the header. */
export type HomeLayout = "lawn" | "poster"

export const home: {
    layout: HomeLayout
    welcomeTitle: string
    welcomeBody: string
} = {
    layout: "lawn",
    welcomeTitle: "Fortieth. FORTIETH.",
    welcomeBody:
        "Forty summers since Grandma Junie first burned the burgers at Birch Point, and we're doing it the same way: everybody comes, nobody cooks alone, and the cousins' cannonball contest settles all arguments. Reply below so we rent enough tables, then start practicing your cannonball.",
}

export interface ScheduleItem {
    time: string
    title: string
    detail?: string
}

export interface WeekendDay {
    label: string
    title: string
    description: string
    /** The day's program, in order, for the full schedule (renders once any day has one). */
    items: ScheduleItem[]
}

// Typed by annotation (not `satisfies` on the arrays): the workspace
// content service edits collection slots by walking this module's AST, and
// a `satisfies` expression between a slot path and its array literal makes
// the collection read-only in the Content panel.
export const weekend: {
    headline: string
    intro: string
    days: WeekendDay[]
} = {
    headline: "The shape of the weekend",
    intro: "",
    days: [
        {
            label: "Friday, August 13",
            title: "Roll in whenever",
            description:
                "The point opens at noon; claim a campsite or check into the lodge, then find the campfire — first s'mores at dusk, no agenda, big hellos.",
            items: [],
        },
        {
            label: "Saturday, August 14",
            title: "The big day",
            description:
                "Pancakes at nine, the lake all day, the cannonball contest at three (defending champion: Aunt Ro, age 71), the potluck at six, and the porch dance after — bring your dish and your knees.",
            items: [],
        },
        {
            label: "Sunday, August 15",
            title: "One more pancake",
            description:
                "A slow breakfast, the group photo on the dock at eleven — fortieth-anniversary edition, wear whatever — and the long goodbyes until next summer.",
            items: [],
        },
    ],
}

export interface Activity {
    /** The stop's day stamp on the poster's strip (the `poster` layout). */
    when: string
    title: string
    body: string
    image: SiteImage
}

export const activities: {
    headline: string
    items: Activity[]
} = {
    headline: "What we do all weekend",
    items: [
        {
            when: "",
            title: "The lake, obviously",
            body: "The dock, the tubes, the cannonball contest, and water warm enough by August that even Uncle Pete gets in. Life jackets for the little ones live in the boathouse.",
            image: photo(
                "lake",
                1536,
                1024,
                "Three kids mid-air jumping off a wooden dock into a lake, inner tubes floating below",
            ),
        },
        {
            when: "",
            title: "The tournament",
            body: "Cornhole, horseshoes, and the card table on the porch. The bracket is drawn Saturday at noon, the trash talk starts Friday, and the trophy is a spray-painted pinecone nobody would dare retire.",
            image: photo(
                "games",
                1536,
                1024,
                "A grandmother triumphantly tossing a cornhole bag while teenagers cheer under pennant flags",
            ),
        },
        {
            when: "",
            title: "The campfire",
            body: "Every night after dark: s'mores, the same six ghost stories, and whoever brought a guitar earning their dinner. Quiet hours at eleven — the loons file complaints.",
            image: photo(
                "campfire",
                1536,
                1024,
                "A family campfire on a lakeside beach at dusk, kids and grandparents toasting marshmallows",
            ),
        },
    ],
}

export interface RoomBlock {
    branch: string
    where: string
}

/** Where everyone sleeps — rooms held by family branch (renders once it has rooms and a photograph). */
export const lodging: {
    headline: string
    body: string
    rooms: RoomBlock[]
    image: SiteImage | null
} = {
    headline: "",
    body: "",
    rooms: [],
    image: null,
}

export interface TravelStep {
    title: string
    body: string
}

/** How to get there, step by step (renders once it has steps). */
export const gettingThere: {
    headline: string
    steps: TravelStep[]
} = {
    headline: "",
    steps: [],
}

export interface PackItem {
    title: string
    note: string
}

/** The pack list beside a photograph (renders once it has items and a photograph). */
export const packing: {
    headline: string
    cardTitle: string
    body: string
    items: PackItem[]
    image: SiteImage | null
} = {
    headline: "",
    cardTitle: "",
    body: "",
    items: [],
    image: null,
}

export interface FamilyBranch {
    /** How many are coming from this branch (the running count). */
    count: string
    name: string
    home: string
}

/** The family tree as a head count, branch by branch (renders once it has branches). */
export const branches: {
    headline: string
    items: FamilyBranch[]
} = {
    headline: "",
    items: [],
}

export interface MemoryPhoto {
    image: SiteImage
    caption: string
}

export const memories: {
    headline: string
    intro: string
    shareNote: string
    photos: MemoryPhoto[]
} = {
    headline: "Forty years of this.",
    intro: "The wall so far — pulled from Grandma Junie's albums and everyone's shoeboxes. Got scans? Send them to the address at the bottom and we'll hang them here.",
    shareNote:
        "Everyone's shoebox counts: scan them big, email them to us, and the wall grows. Print-outs of the digital ones will be on the clothesline at the potluck, pins provided.",
    photos: [
        {
            image: photo(
                "mem-bbq",
                1536,
                1024,
                "A faded 1980s snapshot of a backyard barbecue with a station wagon in the drive",
            ),
            caption: "1984 — Grandpa Cal on the grill, Junie's jello mold en route",
        },
        {
            image: photo(
                "mem-canoe",
                1536,
                1024,
                "A 1990s film photo of the whole family crammed onto a canoe on the lake beach, one cousin falling off the end",
            ),
            caption: "1992 — eleven Calloways, one canoe, zero regrets",
        },
        {
            image: photo(
                "mem-dance",
                1024,
                1536,
                "A faded 1970s photo of a young couple dancing on a cabin porch under paper lanterns",
            ),
            caption: "1977 — Cal and Junie, the first porch dance",
        },
        {
            image: photo(
                "mem-cousins",
                1536,
                1024,
                "A 1990s film photo of six cousins in pajamas eating cereal on cabin porch steps",
            ),
            caption: "1996 — the cousins' table, breakfast shift",
        },
    ],
}

export const rsvp = {
    headline: "Count your heads, then count us in.",
    body: "One reply per household — give us the full head count, tell us where you're sleeping, and claim your potluck dish before someone else brings the same beans.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-07-01",
    replyByLabel: "July 1, 2027",
    confirmation:
        "You're counted! Watch the family thread for the packing list — and if your head count changes, reply again under the same name; the newest answer wins.",
    /** The guest-facing form; delivers through the managed forms pipeline. */
    fields: [
        { name: "name", label: "Your name (one per household)", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
            name: "attending",
            label: "Are you in?",
            type: "select",
            required: true,
            options: ["Wouldn't miss it", "Sadly out this year"],
        },
        {
            name: "headcount",
            label: "Heads in your crew",
            type: "select",
            required: true,
            options: ["1", "2", "3", "4", "5", "6", "7", "8+"],
        },
        {
            name: "staying",
            label: "Where are you sleeping?",
            type: "select",
            options: ["Camping at Birch Point", "The Lakeview Motor Lodge", "Day-tripping"],
            placeholder: "Still deciding",
        },
        {
            name: "potluck",
            label: "Your potluck dish for Saturday",
            placeholder: "First come, first claimed — the beans are contested",
        },
        {
            name: "notes",
            label: "Allergies, gear you can lend, song requests for the porch dance",
            type: "textarea",
            fullWidth: true,
        },
    ] satisfies MarketingLeadFormField[],
    faqs: [
        {
            question: "Are kids and dogs invited?",
            answer: "Kids are the point, and dogs are Calloways — bring both. Dogs on leads around the fire pit, kids in life jackets off the dock, and everyone gets a name tag because the family keeps growing.",
        },
        {
            question: "What's provided and what do I bring?",
            answer: "We rent the tables, chairs, and the big tent; Friday dinner and all the pancakes are covered by the reunion fund. You bring Saturday's potluck dish, your own drinks, camp chairs for the fire, and bug spray you're willing to share.",
        },
        {
            question: "What if it rains?",
            answer: "The tent holds sixty and the lodge porch holds the rest — the tournament moves under cover, and the card table simply gets more competitive. The weekend has survived four thunderstorms and one moose; it'll survive drizzle.",
        },
        {
            question: "Where do I sleep?",
            answer: "Camping at the point is free (flush toilets, cold-water showers, unbeatable sunrise), or the Lakeview Motor Lodge holds rooms under CALLOWAY through July 15 — ten minutes away and they know our whole saga.",
        },
    ],
}

/**
 * Landing copy the family owns: the few strings the landing modules render
 * that would read wrong for a different gathering. A remix seed retrades
 * these along with the rest of the content — everything else in the
 * landing modules is reunion-neutral on purpose.
 */
export const landingCopy = {
    /** The one ask, everywhere: the shell's nav CTA and every closing banner. */
    rsvpCtaLabel: "Count us in",
    /** The closing banner's title on every page. */
    finalCtaTitle: "The table gets longer every year.",
    /** The memory-wall teaser heading on the home page. */
    memoriesTeaserTitle: "From the wall",
    /** The kicker over the memory-wall teaser. */
    memoriesKicker: "Forty years deep",
    /** The home hero's second button; a "/#…" path lands on a home section. */
    heroSecondaryCta: { label: "See the memory wall", path: "/memories" },
    /** The memory wall's closing note and the RSVP page's form and FAQ. */
    shareTitle: "The shoebox rule",
    rsvpFormCta: "Send the count",
    faqTitle: "Yes, dogs are invited",
    /** The nav's logo: the name, an optional second line, an optional mark. */
    navName: "Calloway Reunion",
    navTagline: "",
    navMarkSrc: "",
    /** The nav's own links; a "/#…" path lands on a home section. */
    navLinks: [{ label: "Memory wall", path: "/memories" }],
    /** The hero badge in the family's voice; `{days}` is the live count. */
    countdown: {
        daysOut: "{days} days till the lake",
        tomorrow: "Tomorrow!",
        dayOf: "It's reunion weekend",
        after: "Until next summer",
    },
    /** The head-count nudge; `{label}` is rsvp.replyByLabel, `{days}` the live count. */
    nudge: {
        daysOut: "Tell us by {label} — {days} days off — so we rent enough tables.",
        tomorrow: "Tell us by {label} — that's tomorrow — so we rent enough tables.",
        dayOf: "Tell us today — {label} is table-counting day.",
        after: "The head-count date ({label}) has passed — reply anyway; we'll squeeze you in, we always do.",
    },
}
