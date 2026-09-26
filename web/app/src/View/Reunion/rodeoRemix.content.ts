/**
 * The reunion-rodeo remix's content seed (packs/README.md "Derived
 * templates"): the Calloways riding again at a desert guest ranch outside
 * Wickenburg, Arizona, worn over the reunion pack on the rodeo-poster
 * register. At compose time this file is copied byte-for-byte over
 * `View/Reunion/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Reunion/rodeoRemixSeed.test.ts pins the twin).
 *
 * The weekend: the family, the stops, the full schedule, the ranch,
 * getting there, the family tree, the photo wall, and the head-count ask.
 * `home.layout: "poster"` opens on the rodeo bill (see the base module's
 * header for the layouts), and every content-driven section is filled.
 *
 * The countdown is data (`reunion.startDateIso`); the labels the site
 * renders from it ("414 days till we ride", "Reunion weekend — saddle up")
 * are computed per render by the clock engine (`countdown.ts`) — change the
 * date here and the hero badge and the RSVP nudge follow.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/reunion-rodeo` (see PACK.md). Never point a slot at a raw
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
        src: `/reunion-rodeo/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/reunion-rodeo/${name}-${step}w.webp`, width: step })),
    }
}

export const reunion = {
    /** The masthead: what the family calls it. Line breaks are kept. */
    title: "The Calloways\nride again.",
    subtitle:
        "Three days at a desert guest ranch outside Wickenburg — trail rides, Vulture Peak, a long table under the stars, and every branch of the family in one place.",
    familyName: "Calloway",
    /** The ribbon under the headline. */
    ribbon: "A Calloway Ranch Gathering",
    /** ISO date the clock engine counts toward (the weekend's first day). */
    startDateIso: "2027-10-15",
    /** The weekend as the save-the-date says it. */
    datesLabel: "October 15–17, 2027",
    /** The seal on the hero photograph: first line small, then the dates. */
    seal: "Join us\nOct 15–17",
    venueShort: "Sombra Wells Guest Ranch · Wickenburg, Arizona",
    /** Reaching the organizers. */
    email: "calloway.reunion@example.com",
    /** Who's herding this year. */
    organizers: "Aunt June and Uncle Ray",
    heroImage: photo(
        "hero-ride",
        2400,
        1350,
        "Three generations of a Black family on horseback riding through the Sonoran desert at sunset, saguaros and mountains behind them",
    ),
}

/** The home page's composition — see the base module's header. */
export type HomeLayout = "lawn" | "poster"

export const home: {
    layout: HomeLayout
    welcomeTitle: string
    welcomeBody: string
} = {
    layout: "poster",
    welcomeTitle: "Pop always said we'd ride out here together.",
    welcomeBody:
        "It's been six years since all four branches sat at one table, and Grandma Odessa has made it plain she is not waiting another six. So we found a ranch with enough horses for the cousins, enough casitas for the aunties, a golf course for Uncle Ray, and a mountain for anybody who needs to walk off Saturday's brisket. Reply below, pick your rides, and start breaking in your boots.",
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
    /** The day's program, in order, for the full schedule. */
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
    headline: "The whole program",
    intro: "Times are ranch time — give or take a story. Everything's optional except Saturday dinner.",
    days: [
        {
            label: "Friday, October 15",
            title: "Roll in and ride out",
            description:
                "Check in from two, a sunset trail ride for everyone who wants a horse, then the cookout by the corral.",
            items: [
                {
                    time: "2:00 PM",
                    title: "Check-in opens",
                    detail: "Keys and name tags at the lodge — find your branch's table",
                },
                {
                    time: "4:30 PM",
                    title: "Sunset trail ride",
                    detail: "Wranglers match every rider to a horse; little ones ride the ponies in the arena",
                },
                {
                    time: "6:30 PM",
                    title: "Cookout by the corral",
                    detail: "Brisket, elote, Aunt Loretta's peach cobbler",
                },
                { time: "8:30 PM", title: "Fire pit and dominoes", detail: "Bring your trash talk" },
            ],
        },
        {
            label: "Saturday, October 16",
            title: "Tee off or climb",
            description:
                "Golf in the morning or the Vulture Peak hike, the pool all afternoon, then the family dinner and the toasts.",
            items: [
                {
                    time: "7:00 AM",
                    title: "Vulture Peak hike",
                    detail: "Vans leave the lodge at seven; back by noon",
                },
                {
                    time: "8:30 AM",
                    title: "Golf outing",
                    detail: "Tee times in town, carts held under CALLOWAY",
                },
                {
                    time: "1:00 PM",
                    title: "Pool, porch, and naps",
                    detail: "The cousins' cannonball contest runs at three",
                },
                {
                    time: "5:30 PM",
                    title: "Family photo",
                    detail: "Everybody in the turquoise shirts, on the lawn by the barn",
                },
                {
                    time: "6:30 PM",
                    title: "Family dinner and toasts",
                    detail: "One long table under the lights; one toast per branch, three minutes, Uncle Ray is timing",
                },
                {
                    time: "9:00 PM",
                    title: "Dancing on the deck",
                    detail: "The DJ has been warned about the Electric Slide",
                },
            ],
        },
        {
            label: "Sunday, October 17",
            title: "One more biscuit",
            description:
                "A slow farewell brunch on the patio, the next reunion's host announced, and the long goodbyes.",
            items: [
                {
                    time: "9:30 AM",
                    title: "Farewell brunch",
                    detail: "Biscuits, chilaquiles, and the next host branch announced",
                },
                {
                    time: "11:00 AM",
                    title: "Checkout",
                    detail: "Leftover cobbler goes home with whoever's driving farthest",
                },
            ],
        },
    ],
}

export interface Activity {
    /** The stop on the weekend strip: day and part of day. */
    when: string
    title: string
    body: string
    image: SiteImage
}

export const activities: {
    headline: string
    items: Activity[]
} = {
    headline: "Four stops, one family",
    items: [
        {
            when: "Fri",
            title: "Trail ride & cookout",
            body: "Saddle up at golden hour, then brisket by the corral.",
            image: photo(
                "trail-ride",
                1152,
                864,
                "A family trail ride through desert brush with a wrangler leading a young girl on a pinto horse",
            ),
        },
        {
            when: "Sat",
            title: "Golf or Vulture Peak",
            body: "Tee times in town, or the climb south of town at sunrise.",
            image: photo(
                "vulture-peak",
                1152,
                864,
                "Family members hiking a rocky desert trail toward a jagged peak among saguaro cactus",
            ),
        },
        {
            when: "Sat night",
            title: "Family dinner & toasts",
            body: "One long table under the lights, one toast per branch.",
            image: photo(
                "dinner-toast",
                1280,
                720,
                "A long outdoor dinner table under string lights at dusk, an older man standing to give a toast",
            ),
        },
        {
            when: "Sun",
            title: "Farewell brunch",
            body: "Biscuits on the patio and the long goodbyes.",
            image: photo(
                "brunch",
                1152,
                864,
                "Grandparents and grandchildren sharing brunch at a patio table spread with biscuits and fruit",
            ),
        },
    ],
}

export interface RoomBlock {
    branch: string
    where: string
}

/** The ranch and who sleeps where — rooms are held by family branch. */
export const lodging: {
    headline: string
    body: string
    rooms: RoomBlock[]
    image: SiteImage | null
} = {
    headline: "Casitas for every branch.",
    body: "Sombra Wells is ours for the weekend: adobe casitas around the corral and the pool, rooms in the main lodge, and a bunkhouse the cousins have already claimed. Rooms are held under CALLOWAY until the reply-by date — book through the ranch and tell them your branch.",
    rooms: [
        { branch: "Walter Jr.'s branch", where: "Casitas 1–5, by the corral" },
        { branch: "Loretta's branch", where: "Main lodge, upstairs rooms" },
        { branch: "Marcus's branch", where: "Casitas 6–9, by the pool" },
        { branch: "June's branch", where: "The bunkhouse and Casita 10" },
        { branch: "Grandma Odessa", where: "The garden suite, ground floor, closest to the coffee" },
    ],
    image: photo(
        "casitas",
        1152,
        864,
        "Adobe casitas with red tile roofs along a flagstone path, children running toward a porch where elders sit",
    ),
}

export interface TravelStep {
    title: string
    body: string
}

export const gettingThere: {
    headline: string
    steps: TravelStep[]
} = {
    headline: "Getting to Wickenburg",
    steps: [
        {
            title: "Fly into PHX",
            body: "Phoenix Sky Harbor is the closest big airport. Aim to land by noon Friday if you want a horse at 4:30.",
        },
        {
            title: "Drive about an hour",
            body: "Wickenburg sits about an hour northwest of Phoenix on US-60. The ranch is ten minutes past town — turn at the ranch sign and follow the cattle guard.",
        },
        {
            title: "Or ride with family",
            body: "Tell us your flight on the RSVP and we'll match you to a cousin with a rental car. The Tucson branch runs a van up Friday morning.",
        },
    ],
}

export interface PackItem {
    title: string
    note: string
}

export const packing: {
    headline: string
    cardTitle: string
    body: string
    items: PackItem[]
    image: SiteImage | null
} = {
    headline: "Pack like you mean it",
    cardTitle: "Pack list",
    body: "October in the desert: days in the mid-80s, nights down near 50.",
    items: [
        {
            title: "Boots with a heel",
            note: "Closed-toe for the trail ride; sneakers are fine for the hike.",
        },
        { title: "A hat and real sunscreen", note: "The desert sun doesn't care that it's fall." },
        { title: "A warm layer", note: "The fire pit gets cold fast once the sun drops." },
        {
            title: "Something sharp for Saturday",
            note: "Dinner's outdoors, but Grandma is dressing up, so you are too.",
        },
        {
            title: "Your turquoise shirt",
            note: "Family photo at 5:30 Saturday. We'll have extras in every size.",
        },
    ],
    image: photo(
        "cookout",
        1152,
        864,
        "A man in a cowboy hat grilling over mesquite at an outdoor cookout while kids line up with plates",
    ),
}

export interface FamilyBranch {
    /** How many are coming from this branch (the running count). */
    count: string
    name: string
    home: string
}

export const branches: {
    headline: string
    items: FamilyBranch[]
} = {
    headline: "Four branches, 74 Calloways.",
    items: [
        { count: "22", name: "Walter Jr.'s branch", home: "Houston, Texas" },
        { count: "18", name: "Loretta's branch", home: "Atlanta, Georgia" },
        { count: "15", name: "Marcus's branch", home: "Oakland, California" },
        { count: "19", name: "June's branch", home: "Tucson, Arizona — the home team" },
    ],
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
    headline: "The Calloways, over the years.",
    intro: "The wall so far — pulled from Grandma Odessa's albums and everybody's phones. Got pictures from past reunions? Send them to the address at the bottom and we'll hang them here.",
    shareNote:
        "Send the good ones and the blurry ones to the reunion address, and the wall grows. Prints of the best will hang in the lodge Saturday night.",
    photos: [
        {
            image: photo(
                "group",
                1280,
                720,
                "A big family in matching turquoise shirts posed in front of a red barn, kids in front and elders seated",
            ),
            caption: "2021 — the whole crew, Tucson, turquoise shirts year one",
        },
        {
            image: photo(
                "dominoes",
                1152,
                864,
                "An uncle in a cowboy hat slamming a domino down at a folding table while family members laugh",
            ),
            caption: "2021 — Uncle Ray, undefeated, unbearable",
        },
        {
            image: photo(
                "dance",
                1152,
                864,
                "An older couple dancing on a wooden deck at dusk under string lights while family claps",
            ),
            caption: "2018 — Pop and Grandma Odessa, the last dance of the night",
        },
        {
            image: photo(
                "campfire",
                1152,
                864,
                "A family gathered around a campfire at night in the desert, faces lit orange, saguaros silhouetted",
            ),
            caption: "2018 — ghost stories, Houston cousins losing it",
        },
        {
            image: photo(
                "golf",
                1152,
                864,
                "Four family members celebrating a putt on a desert golf course, one with arms raised",
            ),
            caption: "2021 — the putt Marcus still talks about",
        },
    ],
}

export const rsvp = {
    headline: "Saddle up. Tell us who's riding.",
    body: "We need your head count, your branch (that's how we hold rooms), and which rides you want — the wranglers need numbers for horses and the golf course needs names for carts.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-08-15",
    replyByLabel: "August 15, 2027",
    confirmation:
        "You're on the list! Watch the family group chat for room confirmations — and if your head count changes, reply again under the same name; the newest answer wins.",
    /** The guest-facing form; delivers through the managed forms pipeline. */
    fields: [
        { name: "name", label: "Your name (one per household)", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
            name: "attending",
            label: "Are you riding with us?",
            type: "select",
            required: true,
            options: ["Wouldn't miss it", "Sadly out this time"],
        },
        {
            name: "headcount",
            label: "Party size",
            type: "select",
            required: true,
            options: ["1", "2", "3", "4", "5", "6", "7", "8+"],
        },
        {
            name: "branch",
            label: "Your branch",
            type: "select",
            options: ["Walter Jr.'s", "Loretta's", "Marcus's", "June's", "Married in — welcome!"],
            placeholder: "Pick your branch",
        },
        {
            name: "trailRide",
            label: "Friday trail ride",
            type: "select",
            options: ["Saddle me up", "The kids ride, I'll watch", "I'll wave from the fence"],
            placeholder: "Riding?",
        },
        {
            name: "saturday",
            label: "Saturday morning",
            type: "select",
            options: ["Golf outing", "Vulture Peak hike", "Pool and porch, thank you"],
            placeholder: "Golf or hike?",
        },
        {
            name: "flight",
            label: "Flying in? Your PHX arrival",
            placeholder: "Airline and time — we'll match rides",
        },
        {
            name: "notes",
            label: "Allergies, mobility needs, song requests for Saturday",
            type: "textarea",
            fullWidth: true,
        },
    ] satisfies MarketingLeadFormField[],
    faqs: [
        {
            question: "I've never been on a horse. Can I still ride?",
            answer: "Yes — the wranglers match every rider to a horse, walk-only groups go out first, and the little ones ride ponies in the arena with a grown-up leading. Closed-toe shoes and long pants, and you're set.",
        },
        {
            question: "What's covered and what do I pay?",
            answer: "The reunion fund covers Friday's cookout, Saturday's dinner, and Sunday brunch. You book your own room (held under CALLOWAY), and golf and horses are paid at the ranch desk — ask Aunt June if cost is a worry; nobody stays home over money.",
        },
        {
            question: "Is it hot in October?",
            answer: "Warm days, cool nights: expect the mid-80s by afternoon and near 50 after dark. The hike leaves early for a reason, and the fire pit is lit every night.",
        },
        {
            question: "Can we come just for Saturday?",
            answer: "Of course. Day guests are welcome at everything — just tell us on the form so we set enough places at the dinner table.",
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
    rsvpCtaLabel: "RSVP",
    /** The closing banner's title on every page. */
    finalCtaTitle: "Good food. Good rides. Great family.",
    /** The memory-wall teaser heading on the home page. */
    memoriesTeaserTitle: "From the last roundups",
    /** The kicker over the memory-wall teaser. */
    memoriesKicker: "Photos",
    /** The home hero's second button; a "/#…" path lands on a home section. */
    heroSecondaryCta: { label: "See the schedule", path: "/#schedule" },
    /** The memory wall's closing note and the RSVP page's form and FAQ. */
    shareTitle: "Every phone counts",
    rsvpFormCta: "Count us in",
    faqTitle: "Yes, you can ride",
    /** The nav's logo: the name, an optional second line, an optional mark. */
    navName: "The Calloway Family Reunion",
    navTagline: "Wickenburg, Arizona",
    navMarkSrc: "/reunion-rodeo/brand-c.svg",
    /** The nav's own links; a "/#…" path lands on a home section. */
    navLinks: [
        { label: "Schedule", path: "/#schedule" },
        { label: "Lodging", path: "/#content-split" },
        { label: "Photos", path: "/memories" },
    ],
    /** The hero badge in the family's voice; `{days}` is the live count. */
    countdown: {
        daysOut: "{days} days till we ride",
        tomorrow: "Tomorrow!",
        dayOf: "Reunion weekend — saddle up",
        after: "Until the next roundup",
    },
    /** The head-count nudge; `{label}` is rsvp.replyByLabel, `{days}` the live count. */
    nudge: {
        daysOut: "Tell us by {label} — {days} days off — so we hold enough casitas.",
        tomorrow: "Tell us by {label} — that's tomorrow — so we hold enough casitas.",
        dayOf: "Tell us today — {label} is head-count day.",
        after: "The head-count date ({label}) has passed — reply anyway; there's always room at the table.",
    },
}
