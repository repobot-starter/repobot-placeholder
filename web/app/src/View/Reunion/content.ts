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
 * computed per render by the clock engine (`countdown.ts`) — change the
 * date here and the hero badge and the RSVP nudge follow.
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
    /** ISO date the clock engine counts toward (the weekend's first day). */
    startDateIso: "2027-08-13",
    /** The weekend as the fridge magnet says it. */
    datesLabel: "August 13–15, 2027",
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

export const home = {
    welcomeTitle: "Fortieth. FORTIETH.",
    welcomeBody:
        "Forty summers since Grandma Junie first burned the burgers at Birch Point, and we're doing it the same way: everybody comes, nobody cooks alone, and the cousins' cannonball contest settles all arguments. Reply below so we rent enough tables, then start practicing your cannonball.",
}

export interface WeekendDay {
    label: string
    title: string
    description: string
}

export const weekend = {
    headline: "The shape of the weekend",
    days: [
        {
            label: "Friday, August 13",
            title: "Roll in whenever",
            description:
                "The point opens at noon; claim a campsite or check into the lodge, then find the campfire — first s'mores at dusk, no agenda, big hellos.",
        },
        {
            label: "Saturday, August 14",
            title: "The big day",
            description:
                "Pancakes at nine, the lake all day, the cannonball contest at three (defending champion: Aunt Ro, age 71), the potluck at six, and the porch dance after — bring your dish and your knees.",
        },
        {
            label: "Sunday, August 15",
            title: "One more pancake",
            description:
                "A slow breakfast, the group photo on the dock at eleven — fortieth-anniversary edition, wear whatever — and the long goodbyes until next summer.",
        },
    ] satisfies WeekendDay[],
}

export interface Activity {
    title: string
    body: string
    image: SiteImage
}

export const activities = {
    headline: "What we do all weekend",
    items: [
        {
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
            title: "The campfire",
            body: "Every night after dark: s'mores, the same six ghost stories, and whoever brought a guitar earning their dinner. Quiet hours at eleven — the loons file complaints.",
            image: photo(
                "campfire",
                1536,
                1024,
                "A family campfire on a lakeside beach at dusk, kids and grandparents toasting marshmallows",
            ),
        },
    ] satisfies Activity[],
}

export interface MemoryPhoto {
    image: SiteImage
    caption: string
}

export const memories = {
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
    ] satisfies MemoryPhoto[],
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
}
