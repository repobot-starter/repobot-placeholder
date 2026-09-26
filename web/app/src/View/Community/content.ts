/**
 * The community pack's single content file: the association, its programs,
 * the board, membership dues, and the neighborhood calendar. Everything
 * the site renders comes from here — edit this file (not the page
 * components) to make the site yours.
 *
 * The calendar is computed: `events` are dated entries that the site
 * splits into upcoming vs. past at render time with the soonest
 * highlighted as "Next up" (pure logic in `../Landing/events.ts`). Add
 * and remove entries freely — a passed date can never show as upcoming.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/community` (see PACK.md). Never point a slot at a raw
 * original.
 */
import type { DatedEvent } from "../Landing/events"

export interface CommunityImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder this pack's images were rendered at. */
const LADDER = [640, 1024, 1536]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): CommunityImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/community/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/community/${name}-${step}w.webp`, width: step })),
    }
}

export const assoc = {
    name: "Fernhill Commons",
    fullName: "Fernhill Commons Neighborhood Association",
    tagline: "Twelve blocks, one association, since 1974",
    email: "hello@fernhillcommons.example",
    /** Where and when the association meets — printed in the chrome. */
    meetingLine: "General meetings first Tuesday, 7 PM · Fernhill Grange Hall",
}

export const home = {
    headline: "A neighborhood is a thing you do.",
    subheadline:
        "Fernhill Commons is twelve blocks of old maples and older porches, run by the neighbors who live here since 1974. Dues are twenty-four dollars a year; everything else is showing up.",
    hero: photo(
        "street",
        1536,
        1024,
        "A quiet leafy residential street in early morning light, a neighbor walking a dog in the distance",
    ),
    featuredQuote: {
        quote: "We moved here for the house and stayed for the block party. Our kids learned to ride bikes on a street the association closed for them.",
        author: "Dana Whitfield",
        title: "Member since 2011, Sycamore Street",
    },
}

/** The neighborhood in numbers — the ledger line under the hero. */
export const stats = [
    { value: "1974", label: "founded at a kitchen table" },
    { value: "340", label: "member households" },
    { value: "12", label: "blocks in the commons" },
    { value: "$24", label: "dues, per household, per year" },
]

export interface Program {
    slug: string
    title: string
    /** Small uppercase label: when the program runs. */
    eyebrow: string
    description: string
    image: CommunityImage
}

export const programs: Program[] = [
    {
        slug: "garden",
        title: "The commons garden",
        eyebrow: "Plots · Mar – Nov",
        description:
            "Forty raised beds on the old substation lot, water and compost included. Members get plot priority every spring, and the surplus table by the gate runs on the honor system all summer.",
        image: photo(
            "garden",
            1536,
            1024,
            "Two neighbors passing a basket of vegetables over a raised bed in the community garden",
        ),
    },
    {
        slug: "tool-library",
        title: "The tool library",
        eyebrow: "Saturdays · 9 – 1",
        description:
            "A garage of ladders, mowers, and every clamp you'll ever need, checked out with a paper ledger and a member card. Four hundred tools, zero rental fees, one rule: bring it back clean.",
        image: photo(
            "tools",
            1536,
            1024,
            "A volunteer checking out a hedge trimmer to a neighbor at the tool library's wooden counter",
        ),
    },
    {
        slug: "park-stewards",
        title: "Park stewards",
        eyebrow: "Workdays · Monthly",
        description:
            "The city mows Fernhill Park; we do everything else. Monthly workdays plant the trees, mulch the beds, and keep the benches worth sitting on — kids welcome, gloves provided.",
        image: photo(
            "workday",
            1536,
            1024,
            "Neighbors in work gloves spreading mulch around young trees at a park workday",
        ),
    },
    {
        slug: "porch-concerts",
        title: "Porch concerts",
        eyebrow: "Summer · Monthly",
        description:
            "One porch, two sets, whoever shows up with a lawn chair. The association books the musicians and passes the hat; the porch rotates block to block all summer.",
        image: photo(
            "porch",
            1536,
            1024,
            "Musicians playing on a porch at dusk while neighbors listen from the lawn",
        ),
    },
]

export interface CommunityEvent extends DatedEvent {
    image?: CommunityImage
}

/**
 * The neighborhood calendar — upcoming vs. past is computed at render
 * time, never curated by hand. Keep past entries around: they're the
 * scrapbook.
 */
export const events: CommunityEvent[] = [
    {
        slug: "spring-cleanup-2026",
        title: "Spring park cleanup",
        start: "2026-04-18T09:00",
        end: "2026-04-18T12:00",
        location: "Fernhill Park",
        description:
            "Sixty neighbors, forty bags of winter, and the flower beds turned before lunch. The park stewards' biggest turnout yet.",
    },
    {
        slug: "garden-opening-2026",
        title: "Garden season opening day",
        start: "2026-05-02T10:00",
        end: "2026-05-02T13:00",
        location: "The garden",
        description:
            "Plot assignments, a compost delivery to shovel, and the first seedling swap of the year. Every bed claimed by noon.",
        image: photo(
            "garden",
            1536,
            1024,
            "Two neighbors passing a basket of vegetables over a raised bed in the community garden",
        ),
    },
    {
        slug: "porch-concert-jul",
        title: "Porch concert: the Alder Street duo",
        start: "2026-07-18T19:00",
        end: "2026-07-18T21:00",
        location: "Alder Street",
        description:
            "Guitar and upright bass from the porch steps, a hundred neighbors on the lawn, and the hat came back full — the summer's high-water mark.",
        image: photo(
            "porch",
            1536,
            1024,
            "Musicians playing on a porch at dusk while neighbors listen from the lawn",
        ),
    },
    {
        slug: "block-party-2026",
        title: "The Fernhill block party",
        start: "2026-09-12T15:00",
        end: "2026-09-12T21:00",
        location: "Sycamore Street",
        description:
            "The fifty-second annual: long tables down the centerline, every household brings a dish, the association brings the permits and the string lights. Rain date the following Saturday.",
        image: photo(
            "hero",
            1536,
            1024,
            "Neighbors sharing a potluck at long tables down the middle of a closed street at golden hour",
        ),
    },
    {
        slug: "porch-concert-sep",
        title: "Porch concert: closing night",
        start: "2026-09-25T18:30",
        end: "2026-09-25T20:30",
        location: "Porch TBA",
        description:
            "The season's last sets before the weather calls it. Bring a chair and a jacket; the hat proceeds book next summer's musicians.",
    },
    {
        slug: "fall-workday-2026",
        title: "Fall planting workday",
        start: "2026-10-17T09:00",
        end: "2026-10-17T12:00",
        location: "Fernhill Park",
        description:
            "Twelve street trees and four hundred bulbs go in the ground before the frost. The city delivers the trees; we bring the shovels and the cider.",
        image: photo(
            "workday",
            1536,
            1024,
            "Neighbors in work gloves spreading mulch around young trees at a park workday",
        ),
    },
    {
        slug: "general-meeting-nov",
        title: "General meeting: budget night",
        start: "2026-11-03T19:00",
        end: "2026-11-03T20:30",
        location: "Grange Hall",
        description:
            "The year's books line by line, next year's dues vote, and the floor open to any member with two minutes and an idea. Coffee's on at 6:30.",
    },
    {
        slug: "luminaria-2026",
        title: "Luminaria night",
        start: "2026-12-19T17:00",
        end: "2026-12-19T20:00",
        location: "All twelve blocks",
        description:
            "Paper bags, sand, and a thousand candles down every sidewalk in the commons. Kits at the tool library the week before; lighting starts at dusk.",
    },
]

export const membership = {
    headline: "Dues are $24. The rest is you.",
    body: "Membership funds the garden's water bill, the tool library's insurance, the block party's permits, and the porch musicians' thank-you. It also gets you a vote — the association answers to its members and nobody else.",
    confirmation:
        "Welcome to the commons — a board member will write back within the week with your member card and the next meeting date.",
    tiers: [
        {
            name: "Household",
            price: 24,
            description: "One address, everyone in it.",
            features: [
                "A vote at every general meeting",
                "Tool library card, no rental fees",
                "Garden plot priority each spring",
                "The monthly paper newsletter",
            ],
        },
        {
            name: "Senior / student",
            price: 12,
            description: "Same commons, lighter dues.",
            features: [
                "A vote at every general meeting",
                "Tool library card, no rental fees",
                "Garden plot priority each spring",
                "The monthly paper newsletter",
            ],
        },
        {
            name: "Friend of Fernhill",
            price: 100,
            description: "For the businesses on the avenue.",
            features: [
                "A line in the newsletter, every issue",
                "A banner at the block party",
                "First call for event sponsorships",
                "Our genuine, printed gratitude",
            ],
        },
    ],
    steps: [
        {
            title: "Send the form",
            description:
                "Name, street, and whatever you'd like to be roped into. It lands with the membership chair — a neighbor, not a mailbox.",
        },
        {
            title: "Get your card",
            description:
                "A board member walks your welcome packet over within the week: member card, garden and tool library details, and the current newsletter.",
        },
        {
            title: "Show up once",
            description:
                "A meeting, a workday, a concert lawn — any one of them. That's the whole onboarding; the neighborhood does the rest.",
        },
    ],
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "street", label: "Street", placeholder: "e.g. Sycamore Street" },
        {
            name: "interests",
            label: "What would you show up for?",
            placeholder: "garden, tool library, park workdays, the block party…",
        },
        {
            name: "note",
            label: "Anything else?",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}

export interface BoardMember {
    name: string
    role: string
    bio: string
}

/** The board — six neighbors, elected every November, paid nothing. */
export const board: BoardMember[] = [
    {
        name: "Marguerite Okafor",
        role: "President",
        bio: "Thirty-one years on Alder Street; ran the garden for a decade before the gavel found her. Chairs the meetings, signs the permits, still turns her own plot.",
    },
    {
        name: "Sam Tran",
        role: "Vice president",
        bio: "The block party's logistics brain — street closure paperwork, table math, rain plans. Moved here in 2015 and was volunteered by his neighbors within the year.",
    },
    {
        name: "Ruth Castellano",
        role: "Treasurer",
        bio: "Retired school bookkeeper; publishes the association's books to every member each November, down to the last bag of bulbs.",
    },
    {
        name: "Denny Park",
        role: "Secretary",
        bio: "Takes the minutes, writes the newsletter, keeps fifty years of both in the Grange Hall filing cabinet. Knows what the association decided in 1987, and why.",
    },
    {
        name: "Alma Reyes",
        role: "Tool library steward",
        bio: "Keeper of the ledger and the four hundred tools. Can tell you which drill you want and which neighbor still has the long ladder.",
    },
    {
        name: "Joe Lindqvist",
        role: "Park stewards lead",
        bio: "Plans the monthly workdays and counts the trees — ninety-four planted on his watch. Believes every problem is improved by mulch.",
    },
]

export const about = {
    headline: "Run by neighbors since 1974.",
    body: "No staff, no office, no algorithm — a volunteer board, a filing cabinet in the Grange Hall, and fifty years of minutes that prove showing up works.",
    history: {
        kicker: "How it started",
        headline: "Four neighbors and a rezoning notice.",
        body: "In 1974 the city proposed running a four-lane arterial through Fernhill Park, and four neighbors at a kitchen table wrote the letter that stopped it. The association they founded that winter has met every month since — same park, same maples, and a street that still closes once a year so the neighborhood can eat dinner in the middle of it.",
        image: photo(
            "hero",
            1536,
            1024,
            "Neighbors sharing a potluck at long tables down the middle of a closed street at golden hour",
        ),
    },
    meetings: {
        kicker: "How it runs",
        headline: "First Tuesday, seven o'clock, all comers.",
        body: "General meetings at the Grange Hall: the board reports, the floor opens, and anything the association spends or decides gets a members' vote. Minutes are mailed in the newsletter and filed at the hall — fifty years, unbroken.",
        image: photo(
            "meeting",
            1536,
            1024,
            "Neighbors at a general meeting in the Grange Hall, one member standing to speak",
        ),
    },
}

export const eventsPage = {
    headline: "The calendar is the neighborhood.",
    body: "Workdays, concerts, meetings, and the block party — everything below is open to every neighbor, member or not. Upcoming and past sort themselves; the scrapbook keeps growing.",
}

export const joinCta = {
    title: "Twenty-four dollars, twelve blocks, one vote.",
    body: "Join the association that keeps the commons common.",
    cta: "Become a member",
}
