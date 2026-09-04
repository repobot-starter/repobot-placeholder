/**
 * The yoga & pilates pack's single content file: the studio, the weekly
 * schedule, the teachers, the prices, the two-week introduction.
 * Everything the site renders comes from here — edit this file (not the
 * page components) to make the site yours.
 *
 * The schedule is data, not markup: `weeklySchedule` entries drive the
 * schedule grid AND the live "Next class / In session" badge
 * (web/app/src/View/Landing/schedule.ts). Changing a class time here
 * changes the wall chart and the badge together.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/fitness-yoga` (see PACK.md). The art direction is warm
 * and sunlit — bone, sand, and linen tones on paper-white rooms; the
 * atelier register's chrome stays neutral so the photography carries all
 * the warmth.
 */
import type { ClassSession } from "../Landing/schedule"

export interface StudioImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): StudioImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/fitness-yoga/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/fitness-yoga/${name}-${step}w.webp`, width: step })),
    }
}

export const studio = {
    name: "Stillwater",
    tagline: "Yoga & pilates studio",
    city: "Santa Fe, New Mexico",
    address: "127 Camino de la Luz, Santa Fe, NM 87501",
    phone: "(505) 555-0173",
    email: "hello@stillwatersantafe.example",
    instagram: "https://instagram.com/stillwater.santafe",
}

/**
 * The week, as data. 0 = Sunday … 6 = Saturday; times are minutes since
 * midnight. The room holds practice every day of the week.
 */
export const weeklySchedule: ClassSession[] = [
    // Sunday
    {
        day: 0,
        start: 9 * 60,
        end: 10 * 60 + 15,
        title: "Slow Flow",
        instructor: "Noa Lim",
        note: "All levels",
    },
    {
        day: 0,
        start: 18 * 60,
        end: 19 * 60 + 15,
        title: "Restorative",
        instructor: "Priya Nair",
        note: "Candlelit",
    },
    // Monday
    { day: 1, start: 6 * 60 + 30, end: 7 * 60 + 30, title: "Sunrise Vinyasa", instructor: "Maren Kols" },
    { day: 1, start: 12 * 60, end: 12 * 60 + 50, title: "Mat Pilates", instructor: "Sol Andrada" },
    {
        day: 1,
        start: 18 * 60 + 30,
        end: 19 * 60 + 30,
        title: "Yin",
        instructor: "Priya Nair",
        note: "All levels",
    },
    // Tuesday
    {
        day: 2,
        start: 7 * 60,
        end: 7 * 60 + 50,
        title: "Reformer",
        instructor: "Sol Andrada",
        note: "Four beds — reserve",
    },
    {
        day: 2,
        start: 9 * 60 + 30,
        end: 10 * 60 + 30,
        title: "Slow Flow",
        instructor: "Noa Lim",
        note: "All levels",
    },
    {
        day: 2,
        start: 17 * 60 + 30,
        end: 18 * 60 + 30,
        title: "Vinyasa II",
        instructor: "Maren Kols",
        note: "Experienced",
    },
    // Wednesday
    { day: 3, start: 6 * 60 + 30, end: 7 * 60 + 30, title: "Sunrise Vinyasa", instructor: "Maren Kols" },
    { day: 3, start: 12 * 60, end: 12 * 60 + 50, title: "Mat Pilates", instructor: "Sol Andrada" },
    {
        day: 3,
        start: 18 * 60 + 30,
        end: 19 * 60 + 30,
        title: "Yin",
        instructor: "Priya Nair",
        note: "All levels",
    },
    // Thursday
    {
        day: 4,
        start: 7 * 60,
        end: 7 * 60 + 50,
        title: "Reformer",
        instructor: "Sol Andrada",
        note: "Four beds — reserve",
    },
    { day: 4, start: 9 * 60 + 30, end: 10 * 60 + 30, title: "Prenatal", instructor: "Noa Lim" },
    {
        day: 4,
        start: 17 * 60 + 30,
        end: 18 * 60 + 30,
        title: "Vinyasa II",
        instructor: "Maren Kols",
        note: "Experienced",
    },
    // Friday
    { day: 5, start: 6 * 60 + 30, end: 7 * 60 + 30, title: "Sunrise Vinyasa", instructor: "Maren Kols" },
    { day: 5, start: 12 * 60, end: 12 * 60 + 50, title: "Mat Pilates", instructor: "Sol Andrada" },
    // Saturday
    {
        day: 6,
        start: 9 * 60,
        end: 10 * 60 + 15,
        title: "Slow Flow",
        instructor: "Noa Lim",
        note: "All levels",
    },
    { day: 6, start: 11 * 60, end: 12 * 60, title: "Prenatal", instructor: "Noa Lim" },
    { day: 6, start: 16 * 60, end: 17 * 60, title: "Yin", instructor: "Priya Nair" },
]

export const scheduleNote =
    "Mat classes seat sixteen; the reformer room seats four. Reserve up to a week ahead — unclaimed spots open ten minutes before practice."

export interface Teacher {
    name: string
    role: string
    bio: string
    photo: StudioImage
}

export const teachers: Teacher[] = [
    {
        name: "Maren Kols",
        role: "Founder · Vinyasa",
        bio: "Opened Stillwater after fifteen years of teaching in borrowed rooms. Her vinyasa is unhurried and precise — she'd rather you hold one honest pose than rush through five.",
        photo: photo(
            "inst-maren",
            1024,
            1536,
            "Maren Kols seated cross-legged on the studio floor in linen, morning light behind her",
        ),
    },
    {
        name: "Priya Nair",
        role: "Yin · Restorative",
        bio: "Teaches the slow end of the practice: long holds, props, and the Sunday candlelit hour people plan their weekends around. Trained in Mysore and Kerala.",
        photo: photo(
            "inst-priya",
            1024,
            1536,
            "Priya Nair seated on a linen bolster wrapped in a sand-colored shawl",
        ),
    },
    {
        name: "Sol Andrada",
        role: "Pilates · Reformer",
        bio: "A former dancer who rebuilt his own back on a reformer and has been teaching the method since. Runs the mat hour at noon and the four-bed reformer room.",
        photo: photo(
            "inst-sol",
            1024,
            1536,
            "Sol Andrada standing beside a wooden reformer machine in the sunlit studio",
        ),
    },
    {
        name: "Noa Lim",
        role: "Slow Flow · Prenatal",
        bio: "Keeps the gentlest corner of the schedule: weekend slow flow and the prenatal hour. Every class ends with ten unhurried minutes of rest.",
        photo: photo("inst-noa", 1024, 1536, "Noa Lim holding a folded linen blanket in warm window light"),
    },
]

export const memberships = [
    {
        name: "Eight",
        monthly: 88,
        yearlyPerMonth: 76,
        description: "Eight mat classes a month — the twice-a-week practice.",
        features: [
            "Any mat class on the schedule",
            "Unused classes roll one month",
            "Mat, props, and tea included",
            "Pause anytime",
        ],
    },
    {
        name: "Unlimited",
        monthly: 128,
        yearlyPerMonth: 112,
        description: "Every mat class, every day, plus first claim on workshops.",
        features: [
            "Unlimited mat classes",
            "Workshop pre-sale access",
            "Two guest passes a year",
            "Mat, props, and tea included",
        ],
        highlighted: true,
        badge: "The daily practice",
    },
    {
        name: "Reformer",
        monthly: 189,
        yearlyPerMonth: 169,
        description: "Unlimited mats plus the reformer room's four quiet beds.",
        features: [
            "Everything in Unlimited",
            "All reformer sessions",
            "Priority reformer reservations",
            "One private session a quarter",
        ],
    },
]

export const singleVisits = [
    {
        name: "Drop-in",
        price: "$24",
        detail: "One mat class. Arrive ten minutes early; everything you need is here.",
    },
    {
        name: "Reformer drop-in",
        price: "$38",
        detail: "One reformer session, when a bed is open. Reserve ahead.",
    },
    {
        name: "The introduction",
        price: "$39",
        detail: "Two weeks of unlimited mat classes for newcomers. Begin below.",
    },
]

export const faq = [
    {
        question: "I'm brand new to yoga. Where do I start?",
        answer: "Slow Flow — Saturday or Sunday morning, or Tuesday at 9:30. It assumes nothing and moves at a speaking pace. The introduction gives you two weeks to try every corner of the schedule and find the classes that fit.",
    },
    {
        question: "What's the difference between the mat and reformer memberships?",
        answer: "Mat classes — vinyasa, yin, slow flow, mat pilates — happen in the big room and are covered by Eight and Unlimited. The reformer room is a separate four-bed studio; its sessions are covered by the Reformer membership or a reformer drop-in.",
    },
    {
        question: "Do I need to bring anything?",
        answer: "No. Mats, blocks, bolsters, blankets, and tea afterward are all here. Wear something you can move in; we practice barefoot.",
    },
    {
        question: "Is there somewhere to be pregnant and practice?",
        answer: "Yes — Noa's prenatal classes run Thursday and Saturday mornings, and she can suggest adjustments for any slow flow class. Tell your teacher; that's what we're here for.",
    },
]

export const testimonials = [
    {
        quote: "I've practiced in studios on three continents and this is the one I miss when I travel. Nobody performs. The light does half the teaching.",
        name: "Camille Duran",
        detail: "Practicing since 2022",
    },
    {
        quote: "I came for my back and stayed for the Sunday restorative hour. It's the quietest ninety minutes in Santa Fe.",
        name: "Theo Marsh",
        detail: "Practicing since 2024",
    },
]

export const home = {
    headline: "Practice, quietly.",
    subheadline:
        "A yoga and pilates studio in a sunlit adobe on Camino de la Luz — daily classes, four reformer beds, and ten unhurried minutes of rest at the end of everything.",
    hero: photo(
        "hero-studio",
        1536,
        1024,
        "A morning class holding warrior two in the sunlit studio, golden light across the oak floor",
    ),
}

export const practice = {
    kicker: "The room",
    headline: "Sixteen mats, four beds, one long shaft of light",
    body: "The studio keeps its mornings slow on purpose: sunrise vinyasa as the sun clears the ridge, a noon pilates hour, and the day closing in yin. Everything you need is already here — cork blocks, linen blankets, tea after practice — so you arrive with nothing and leave the same way.",
    image: photo(
        "intro-props",
        1536,
        1024,
        "Folded linen blankets, cork blocks, and rolled mats on an oak bench",
    ),
}

export const gallery: StudioImage[] = [
    photo("reformer", 1536, 1024, "The reformer room: wooden-framed beds in warm morning light"),
    photo(
        "door-light",
        1024,
        1536,
        "The studio's arched doorway with afternoon light and an olive branch shadow",
    ),
    photo("savasana", 1536, 1024, "A class resting in savasana under linen blankets in golden light"),
]

export const founder = {
    kicker: "Why Stillwater",
    headline: "A studio that keeps its voice down",
    paragraphs: [
        "Maren opened Stillwater with one conviction: a practice space should ask less of you, not more. No leaderboards, no heated rooms, no playlist louder than your own breathing.",
        "What's left is the practice itself — strong teaching, honest pacing, and a room whose light was worth building a schedule around.",
    ],
    image: photo(
        "inst-maren",
        1024,
        1536,
        "Maren Kols, Stillwater's founder, seated in the studio she built",
    ),
}

export const intro = {
    headline: "Two weeks, thirty-nine dollars.",
    body: "The introduction: fourteen days of unlimited mat classes for newcomers. Come to one class or come to twelve — find the corner of the schedule that fits your life before you commit to anything.",
    confirmation: "Welcome in. We'll reply within a day with everything you need for your first class.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "experience",
            label: "Have you practiced before?",
            placeholder: "Brand new, a little, years ago, every day",
        },
        {
            name: "interests",
            label: "What are you curious about?",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Yoga, pilates, the reformer room, just the quiet",
        },
    ],
}
