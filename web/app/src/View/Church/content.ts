/**
 * The church pack's single content file: congregation, service times,
 * ministries, sermons, events, and page copy. Everything the site renders
 * comes from here — edit this file (not the page components) to make the
 * site yours.
 *
 * Two computed mechanics read this file at render time (both pure, in
 * `../Landing/events.ts`):
 * - `serviceTimes` are weekly moments; the hero badge computes the next
 *   one ("Next service — Sunday 9 AM") from the visitor's clock.
 * - `events` are dated entries; the site splits them into upcoming vs.
 *   past automatically and highlights the soonest as "Next up". Add and
 *   remove entries freely — nothing else needs to change, and a passed
 *   date can never show as upcoming.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/church` (see PACK.md). Never point a slot at a raw
 * original.
 */
import type { DatedEvent, WeeklyMoment } from "../Landing/events"

export interface ChurchImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): ChurchImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/church/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/church/${name}-${step}w.webp`, width: step })),
    }
}

export const church = {
    name: "Bellwood Community Church",
    shortName: "Bellwood",
    tagline: "An old faith for a young city",
    location: "Bellingham, Washington",
    address: "1418 Bellwood Avenue, Bellingham, WA 98225",
    mapsQuery: "1418 Bellwood Avenue Bellingham WA",
    phone: "(360) 555-0147",
    email: "office@bellwoodchurch.example",
    /**
     * The Give CTA's target: an external giving page (the church's own
     * processor — no payments run through this site). Replace with your
     * real giving link.
     */
    giveUrl: "https://give.example.org/bellwood",
}

/**
 * Weekly service times — the computed "next service" badge reads these.
 * 0 = Sunday … 6 = Saturday; minutes since midnight.
 */
export const serviceTimes: WeeklyMoment[] = [
    { day: 0, minute: 9 * 60, label: "Sunday gathering" },
    { day: 0, minute: 11 * 60, label: "Sunday gathering" },
    { day: 3, minute: 19 * 60, label: "Midweek prayer" },
]

/** The week's setlist — the home page sets these between hairline rules. */
export const serviceSchedule = [
    {
        headline: "Sundays — 9 & 11 AM",
        body: "Two identical gatherings: singing, scripture, an honest sermon, and the table. About seventy-five minutes, kids welcome in both.",
    },
    {
        headline: "Wednesdays — 7 PM",
        body: "Midweek prayer in the side chapel. Quiet, unpolished, forty-five minutes. Come as you are, leave when you need to.",
    },
]

export const home = {
    headline: "Church for people who quit church.",
    subheadline:
        "Bellwood has held the same corner since 1962. The pews are original — almost nothing else is: two Sunday gatherings, an open table, and your questions taken more seriously than your outfit.",
    hero: photo(
        "hero-01",
        1536,
        1024,
        "The congregation in a haze-filled dark sanctuary, hands raised in silhouette under one amber beam",
    ),
    welcome: {
        kicker: "From the pastor",
        headline: "You don't have to have it together to come.",
        body: "Most people find us in an ordinary season or a hard one — new to town, new to faith, or coming back after a long time away. Nobody here will make a fuss. Sit where you like, sing if you want, and stay for coffee: the sermon is thirty minutes and the welcome is the whole morning. — Daniel Merritt, pastor",
        portrait: photo(
            "pastor",
            1024,
            1536,
            "Pastor Daniel Merritt against a black ground, half his face in warm rim light",
        ),
    },
}

export interface Ministry {
    slug: string
    title: string
    /** Small uppercase label: who it's for, or when it meets. */
    eyebrow: string
    description: string
    image: ChurchImage
}

export const ministries: Ministry[] = [
    {
        slug: "worship",
        title: "Music & worship",
        eyebrow: "Sundays",
        description:
            "A live band, old hymns played loud, and new songs written in this building. Rehearsal is Thursday at 7 — if you can carry a tune or a cable, there's a spot on stage.",
        image: photo(
            "worship",
            1536,
            1024,
            "The worship band mid-song in stage haze — guitarist and drummer silhouetted under an amber spotlight",
        ),
    },
    {
        slug: "kids",
        title: "Bellwood Kids",
        eyebrow: "Birth – 5th grade",
        description:
            "Checked in by name, taught by background-checked volunteers, and returned with glue on their hands. Kids join both services for the opening songs, then head to class.",
        image: photo(
            "kids",
            1536,
            1024,
            "Kids laughing and reaching up to catch drifting confetti in warm low light",
        ),
    },
    {
        slug: "youth",
        title: "Youth group",
        eyebrow: "Grades 6 – 12",
        description:
            "Sunday nights at 6: dinner, scripture, and a game that ruins someone's shirt. One service project a month — usually a neighbor's yard, sometimes the food bank.",
        image: photo(
            "youth",
            1536,
            1024,
            "The youth group around a bonfire at night, faces lit by the fire against the dark",
        ),
    },
    {
        slug: "groups",
        title: "Home groups",
        eyebrow: "Weeknights",
        description:
            "Eight to twelve people around somebody's living room: scripture, prayer, and decaf. Nine groups meet across town — we'll match you to one near your street.",
        image: photo(
            "study",
            1536,
            1024,
            "A home group in a dark living room at night, books open under one warm lamp",
        ),
    },
    {
        slug: "serve",
        title: "Food pantry",
        eyebrow: "Saturdays, 9 AM",
        description:
            "Groceries for about sixty households every week, no questions and no paperwork beyond a first name. Packing starts at 9, doors open at 10, done by noon.",
        image: photo(
            "serve",
            1536,
            1024,
            "Volunteers passing food boxes down a line under a single work light in the dark hall",
        ),
    },
    {
        slug: "table",
        title: "The common table",
        eyebrow: "First Sundays",
        description:
            "A whole-church dinner in the fellowship hall after the 11 o'clock service — casseroles, folding chairs, and the loudest hour of the month. Bring a dish or just a fork.",
        image: photo(
            "meal",
            1536,
            1024,
            "The common table at night — dishes passed under a string of bare bulbs, everything else dark",
        ),
    },
]

export interface Sermon {
    title: string
    speaker: string
    /** ISO date of the Sunday it was preached. */
    date: string
    passage: string
    series: string
    summary: string
}

/** Most recent first — the archive reads backwards, like a bulletin box. */
export const sermons: Sermon[] = [
    {
        title: "The unhurried kingdom",
        speaker: "Daniel Merritt",
        date: "2026-08-23",
        passage: "Matthew 6:25–34",
        series: "Sermon on the Mount",
        summary:
            "Worry rehearses a future without God in it. What the birds and the lilies actually teach — and what they don't.",
    },
    {
        title: "Treasure that doesn't rust",
        speaker: "Daniel Merritt",
        date: "2026-08-16",
        passage: "Matthew 6:19–24",
        series: "Sermon on the Mount",
        summary: "Two ledgers, one heart. On money as the most honest diary any of us keeps.",
    },
    {
        title: "When you pray",
        speaker: "Daniel Merritt",
        date: "2026-08-09",
        passage: "Matthew 6:5–15",
        series: "Sermon on the Mount",
        summary:
            "The Lord's Prayer as a set of walls to lean on, not a script to perform. Fifty-seven words, all of them load-bearing.",
    },
    {
        title: "Salt, light, and small doors",
        speaker: "Ruth Alvarez",
        date: "2026-08-02",
        passage: "Matthew 5:13–16",
        series: "Sermon on the Mount",
        summary:
            "Guest sermon from our partner congregation in Ferndale: what a church owes the three blocks around it.",
    },
    {
        title: "Blessed are the unimpressive",
        speaker: "Daniel Merritt",
        date: "2026-07-26",
        passage: "Matthew 5:1–12",
        series: "Sermon on the Mount",
        summary:
            "The Beatitudes read like a guest list nobody would draw up. That's the point — and the comfort.",
    },
    {
        title: "A psalm for the tired",
        speaker: "Daniel Merritt",
        date: "2026-07-19",
        passage: "Psalm 127",
        series: "Summer psalms",
        summary:
            '"He gives to his beloved sleep." A sermon in praise of rest, preached — fittingly — in July.',
    },
    {
        title: "Out of the depths",
        speaker: "Daniel Merritt",
        date: "2026-07-12",
        passage: "Psalm 130",
        series: "Summer psalms",
        summary:
            "What waiting on God looks like when the water is over your head. More watchman, less checklist.",
    },
    {
        title: "The shepherd psalm, slowly",
        speaker: "Daniel Merritt",
        date: "2026-06-28",
        passage: "Psalm 23",
        series: "Summer psalms",
        summary:
            "Six verses everyone knows and nobody has finished with. Walking the whole valley at a shepherd's pace.",
    },
]

export interface ChurchEvent extends DatedEvent {
    image?: ChurchImage
}

/**
 * Dated events — upcoming vs. past is computed at render time, never
 * curated by hand. Keep past entries around: the archive is part of the
 * record.
 */
export const events: ChurchEvent[] = [
    {
        slug: "picnic-2026",
        title: "Church picnic at Whatcom Falls",
        start: "2026-06-27T11:00",
        end: "2026-06-27T15:00",
        location: "Whatcom Falls Park",
        description:
            "Fried chicken, three-legged races, and a baptism in the creek — the whole church outdoors for an afternoon.",
    },
    {
        slug: "vbs-2026",
        title: "Vacation Bible School",
        start: "2026-07-13T09:00",
        end: "2026-07-17T12:00",
        location: "All rooms",
        description:
            "Five mornings, ninety kids, one very tired puppet team. Registration opens each spring.",
        image: photo(
            "kids",
            1536,
            1024,
            "Kids laughing and reaching up to catch drifting confetti in warm low light",
        ),
    },
    {
        slug: "pancakes-2026",
        title: "Neighborhood pancake breakfast",
        start: "2026-08-08T08:30",
        end: "2026-08-08T11:00",
        location: "Front lawn",
        description:
            "Griddles on the lawn, no program, no ask. If you smelled it from your porch, you were invited.",
    },
    {
        slug: "fall-kickoff",
        title: "Fall kickoff dinner",
        start: "2026-09-12T17:30",
        end: "2026-09-12T20:00",
        location: "Fellowship hall",
        description:
            "The common table, kickoff edition: home groups relaunch, ministries take sign-ups, and dessert outnumbers dinner. Everyone's invited, especially if you're new.",
        image: photo(
            "meal",
            1536,
            1024,
            "The common table at night — dishes passed under a string of bare bulbs, everything else dark",
        ),
    },
    {
        slug: "serve-day",
        title: "Neighborhood serve day",
        start: "2026-09-26T09:00",
        end: "2026-09-26T13:00",
        location: "Front steps",
        description:
            "Yards, gutters, and porch steps for neighbors who asked — crews of six, tools provided, lunch after. Kids welcome with a grown-up.",
        image: photo(
            "serve",
            1536,
            1024,
            "Volunteers passing food boxes down a line under a single work light in the dark hall",
        ),
    },
    {
        slug: "harvest-supper",
        title: "Harvest supper & pie auction",
        start: "2026-10-24T17:00",
        end: "2026-10-24T20:00",
        location: "Fellowship hall",
        description:
            "Soup, bread, and the annual pie auction that funds the youth group's spring trip. Bidding is friendly until the marionberry comes out.",
        image: photo(
            "building",
            1536,
            1024,
            "The brick chapel on its corner at night, floodlit amber against a black sky",
        ),
    },
    {
        slug: "thanksgiving-table",
        title: "Community Thanksgiving table",
        start: "2026-11-26T12:30",
        end: "2026-11-26T15:00",
        location: "Fellowship hall",
        description:
            "Thanksgiving dinner for anyone spending the day alone — no sign-up, no charge, seconds encouraged. Drivers deliver plates to homebound neighbors at 2.",
        image: photo(
            "meal",
            1536,
            1024,
            "The common table at night — dishes passed under a string of bare bulbs, everything else dark",
        ),
    },
    {
        slug: "candlelight-2026",
        title: "Christmas Eve candlelight service",
        start: "2026-12-24T17:00",
        end: "2026-12-24T18:15",
        location: "Sanctuary",
        description:
            "Carols, the Christmas story, and the room lit one candle at a time. Our fullest hour of the year — come early, sit close.",
        image: photo(
            "worship",
            1536,
            1024,
            "The worship band mid-song in stage haze — guitarist and drummer silhouetted under an amber spotlight",
        ),
    },
]

export const visit = {
    headline: "Plan a visit.",
    body: "Tell us the Sunday you're aiming for and who's coming, and we'll save you a parking spot, have kids' check-in ready, and introduce you to one actual human — no name tags, no stage welcome, no follow-up campaign.",
    confirmation: "Got it — we'll write back within a day or two with everything you need for Sunday.",
    photo: photo(
        "welcome",
        1536,
        1024,
        "The church doors open at night, amber light spilling onto the steps as a couple arrives",
    ),
    expectations: [
        {
            title: "Getting in the door",
            description:
                "Park in the gravel lot off Bellwood Avenue or anywhere on the street — both doors are open and somebody's at each one. Dress is whatever you wore Saturday.",
        },
        {
            title: "The service itself",
            description:
                "About seventy-five minutes: congregational singing with the piano, scripture read aloud, a thirty-minute sermon, and communion — open to all — most weeks.",
        },
        {
            title: "Kids, sorted",
            description:
                "Check-in is in the foyer from twenty minutes before each service. Kids stay for the opening songs, then head to class with teachers who know their names by week two.",
        },
        {
            title: "Afterwards",
            description:
                "Coffee and the good cookies in the fellowship hall. Stay five minutes or an hour; leave through the side door if you'd rather slip out — truly fine.",
        },
    ],
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Sunday you're planning on", type: "date" as const },
        {
            name: "party",
            label: "Who's coming",
            placeholder: "e.g. two adults, kids aged 4 and 7",
        },
        {
            name: "questions",
            label: "Anything you'd like us to know?",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}

export const give = {
    headline: "Giving keeps the pantry shelves full.",
    body: "Bellwood is congregation-funded: the food pantry, the youth trips, the building's hundred-year-old roof. Giving runs through our secure external giving page — nothing is processed on this site.",
    cta: "Give online",
}

export const sermonsPage = {
    headline: "The sermon archive.",
    body: "Every Sunday since we started keeping notes — filter by series, or just read what last week held. Audio recordings are on the table by the office; ask and we'll email one.",
}

export const eventsPage = {
    headline: "On the calendar.",
    body: "What's ahead splits itself from what's past automatically — if it's listed under upcoming, it's really happening. Everything is open to the neighborhood unless it says otherwise.",
}

export const ministriesPage = {
    headline: "Life together, all week.",
    body: "Sunday is the front door, not the house. Six ministries carry the week — find the one that fits your season, or the one that needs your hands.",
}
