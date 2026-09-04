/**
 * The strength-club pack's single content file: the club, the weekly
 * schedule, the coaches, the prices, the free-week offer. Everything the
 * site renders comes from here — edit this file (not the page components)
 * to make the site yours.
 *
 * The schedule is data, not markup: `weeklySchedule` entries drive the
 * schedule grid on every page AND the live "Next class / In session" badge
 * (web/app/src/View/Landing/schedule.ts — the timetable sibling of the
 * hours engine). Changing a class time here changes the wall chart and the
 * badge together.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/fitness` (see PACK.md). The art direction is strict
 * black-and-white photography — the chalk register's chrome is monochrome,
 * so the frames carry all the drama.
 */
import type { ClassSession } from "../Landing/schedule"

export interface GymImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): GymImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/fitness/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/fitness/${name}-${step}w.webp`, width: step })),
    }
}

export const gym = {
    name: "Foundry Strength Club",
    tagline: "Coached strength training",
    city: "Detroit, Michigan",
    address: "2418 Rivard Street, Detroit, MI 48207",
    phone: "(313) 555-0147",
    email: "frontdesk@foundrystrength.example",
    instagram: "https://instagram.com/foundrystrength",
    mapsQuery: "2418 Rivard Street Detroit MI",
}

/**
 * The week, as data. 0 = Sunday … 6 = Saturday; times are minutes since
 * midnight. Sundays the floor rests — no entries, and the engine rolls the
 * badge to Monday.
 */
export const weeklySchedule: ClassSession[] = [
    // Monday
    {
        day: 1,
        start: 6 * 60,
        end: 7 * 60,
        title: "Strength 101",
        instructor: "Mara Reyes",
        note: "All levels",
    },
    { day: 1, start: 12 * 60, end: 12 * 60 + 45, title: "Lunch Express", instructor: "Dom Cole" },
    { day: 1, start: 17 * 60 + 30, end: 18 * 60 + 30, title: "Barbell Club", instructor: "Mara Reyes" },
    { day: 1, start: 18 * 60 + 30, end: 19 * 60 + 30, title: "Conditioning", instructor: "Whit Okafor" },
    // Tuesday
    { day: 2, start: 6 * 60, end: 7 * 60, title: "Conditioning", instructor: "Whit Okafor" },
    {
        day: 2,
        start: 17 * 60 + 30,
        end: 18 * 60 + 30,
        title: "Olympic Lifting",
        instructor: "Ken Ito",
        note: "Intermediate",
    },
    {
        day: 2,
        start: 18 * 60 + 30,
        end: 19 * 60 + 30,
        title: "Strength 101",
        instructor: "Dom Cole",
        note: "All levels",
    },
    // Wednesday
    {
        day: 3,
        start: 6 * 60,
        end: 7 * 60,
        title: "Strength 101",
        instructor: "Mara Reyes",
        note: "All levels",
    },
    { day: 3, start: 12 * 60, end: 12 * 60 + 45, title: "Lunch Express", instructor: "Dom Cole" },
    { day: 3, start: 17 * 60 + 30, end: 18 * 60 + 30, title: "Barbell Club", instructor: "Mara Reyes" },
    // Thursday
    { day: 4, start: 6 * 60, end: 7 * 60, title: "Conditioning", instructor: "Whit Okafor" },
    {
        day: 4,
        start: 17 * 60 + 30,
        end: 18 * 60 + 30,
        title: "Olympic Lifting",
        instructor: "Ken Ito",
        note: "Intermediate",
    },
    {
        day: 4,
        start: 18 * 60 + 30,
        end: 19 * 60 + 30,
        title: "Mobility",
        instructor: "Whit Okafor",
        note: "All levels",
    },
    // Friday
    {
        day: 5,
        start: 6 * 60,
        end: 7 * 60,
        title: "Strength 101",
        instructor: "Mara Reyes",
        note: "All levels",
    },
    { day: 5, start: 12 * 60, end: 12 * 60 + 45, title: "Lunch Express", instructor: "Dom Cole" },
    { day: 5, start: 17 * 60 + 30, end: 19 * 60, title: "Open Floor", instructor: "Staffed floor" },
    // Saturday
    {
        day: 6,
        start: 9 * 60,
        end: 10 * 60,
        title: "Team Session",
        instructor: "All coaches",
        note: "All levels",
    },
    { day: 6, start: 10 * 60 + 30, end: 12 * 60, title: "Open Floor", instructor: "Staffed floor" },
]

export const scheduleNote =
    "Reserve a spot up to seven days out; unreserved spots open at the whistle. The floor rests Sundays."

export interface Coach {
    name: string
    role: string
    bio: string
    photo: GymImage
}

export const coaches: Coach[] = [
    {
        name: "Mara Reyes",
        role: "Head coach · Strength",
        bio: "Fifteen years under the bar, ten of them coaching it. Nationally ranked powerlifter; she will fix your deadlift by watching you walk to the rack.",
        photo: photo("coach-reyes", 1024, 1536, "Coach Mara Reyes leaning on a loaded barbell, arms crossed"),
    },
    {
        name: "Dom Cole",
        role: "Strength coach",
        bio: "Former college thrower who found the quiet end of the gym. Runs Strength 101 and the lunch hour — patient with beginners, merciless with excuses.",
        photo: photo("coach-cole", 1024, 1536, "Coach Dom Cole chalking his hands beside a squat rack"),
    },
    {
        name: "Whit Okafor",
        role: "Conditioning · Mobility",
        bio: "Built the conditioning program around one idea: capacity you can use. Rowing, sleds, carries — and the mobility hour that makes Monday possible.",
        photo: photo("coach-whit", 1024, 1536, "Coach Whit Okafor seated on a plyo box holding a rope"),
    },
    {
        name: "Ken Ito",
        role: "Olympic lifting",
        bio: "Twenty years of snatch and clean & jerk, half of them on a competition platform. Teaches the lifts slowly, because that is the only way they arrive.",
        photo: photo(
            "coach-ito",
            1024,
            1536,
            "Coach Ken Ito standing on the lifting platform, bar at his feet",
        ),
    },
]

/** Home-page proof: the numbers a visitor checks before the tour. */
export const stats = [
    { value: "38", label: "coached classes a week" },
    { value: "4", label: "coaches on the floor" },
    { value: "9", label: "lifting platforms" },
    { value: "2016", label: "on Rivard Street since" },
]

export const memberships = [
    {
        name: "Open Floor",
        monthly: 79,
        yearlyPerMonth: 69,
        description: "The room, the racks, the platforms — train your own program on a staffed floor.",
        features: [
            "Full floor access, 5 AM – 10 PM",
            "Staffed open-floor hours",
            "Programming board access",
            "No initiation fee",
        ],
    },
    {
        name: "Unlimited",
        monthly: 149,
        yearlyPerMonth: 129,
        description: "Every coached class on the schedule, plus the open floor between them.",
        features: [
            "All 38 coached classes a week",
            "Open floor included",
            "Free guest pass every month",
            "Pause anytime, twice a year",
        ],
        highlighted: true,
        badge: "Most of the club",
    },
    {
        name: "Coached",
        monthly: 249,
        yearlyPerMonth: 219,
        description: "Unlimited, plus a coach who knows your name and your numbers.",
        features: [
            "Everything in Unlimited",
            "Personal programming, reviewed weekly",
            "Monthly 1:1 session",
            "Quarterly testing day",
        ],
    },
]

export const classPacks = [
    { name: "Drop-in", price: "$25", detail: "One class or one open-floor session. Chalk included." },
    { name: "10-class pack", price: "$220", detail: "Any coached class, six months to use them." },
    { name: "The free week", price: "$0", detail: "Seven days, every class, the whole floor. Start below." },
]

export const faq = [
    {
        question: "I've never touched a barbell. Which class do I start with?",
        answer: "Strength 101. It runs five times a week and assumes nothing — the first session is learning to hinge, brace, and squat with an empty bar. Most members live there for two months before branching out.",
    },
    {
        question: "Is there a contract?",
        answer: "No. Memberships are month to month, and you can pause twice a year without losing your rate. The yearly rate saves you about a month and a half.",
    },
    {
        question: "What does the free week actually include?",
        answer: "Everything a member gets: every coached class, the open floor, and a coach checking your lifts. No card required to start, no awkward conversation to leave.",
    },
    {
        question: "Do you do personal training?",
        answer: "The Coached membership is our version of it: your own programming, a monthly 1:1, and a coach reading your numbers every week — inside the club, not instead of it.",
    },
]

export const testimonials = [
    {
        quote: "I came for the free week two years ago with a bad back and a worse squat. The back is fine. The squat is 315. Nobody here sells you anything — they just expect you back Tuesday.",
        name: "Renee Alvarez",
        detail: "Member since 2023",
    },
    {
        quote: "It's the least flashy gym I've ever trained in and the only one I've kept paying for. Chalk, coaches, and a whiteboard that doesn't lie.",
        name: "Marcus Webb",
        detail: "Member since 2019",
    },
]

export const home = {
    headline: "Get under the bar.",
    subheadline:
        "A coached strength club in Eastern Market — barbells, conditioning, and a floor that expects you back.",
    hero: photo(
        "hero-floor",
        1536,
        1024,
        "A lifter setting up a heavy deadlift under a single hard light, chalk dust in the air",
    ),
}

export const gallery: GymImage[] = [
    photo("floor-rack", 1536, 1024, "A row of loaded squat racks in low side light"),
    photo("floor-class", 1536, 1024, "A conditioning class mid-kettlebell swing, motion blurred"),
    photo("floor-chalk", 1024, 1536, "Chalked hands gripping a knurled barbell, close up"),
    photo("floor-sled", 1536, 1024, "A member driving a weighted sled across the floor"),
]

export const story = {
    kicker: "The room",
    headline: "Built in a stamping plant. Still stamping.",
    paragraphs: [
        "The building pressed door panels for forty years before it pressed people. We kept the floor, the light, and the habit of doing one thing properly.",
        "There are no mirrors, no machines with televisions, and no music you'd hear in a juice bar. There are nine platforms, a wall of racks, and coaches who watch every rep like it's the only one.",
    ],
    image: photo(
        "story-room",
        1536,
        1024,
        "The club's main floor from the mezzanine: platforms, racks, and one wide shaft of window light",
    ),
}

export const trial = {
    headline: "The first week is free.",
    body: "Seven days, every class, the whole floor. Tell us where you're starting from and we'll have a coach and a program waiting at the door.",
    confirmation: "You're in. A coach will reply within one day to set your first session.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "start",
            label: "When do you want to start?",
            placeholder: "This week, next Monday, someday soon",
        },
        {
            name: "goal",
            label: "Where are you starting from?",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
            placeholder: "Training history, goals, anything a coach should know",
        },
    ],
}
