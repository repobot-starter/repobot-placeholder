/**
 * The trainer pack's single content file: one coach, her training week,
 * her programs, her prices, the consult offer. Everything the site renders
 * comes from here — edit this file (not the page components) to make the
 * site yours.
 *
 * The training week is data, not markup: `trainingWeek` entries drive the
 * day-rows schedule on the home page AND the live "Next session / In
 * session" badge (web/app/src/View/Landing/schedule.ts). Changing a block
 * here changes the wall chart and the badge together.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/fitness-trainer` (see PACK.md). The art direction is one
 * continuous shoot: a nearly black gym, a single hard light, muted color —
 * the monolith register's chrome is true black and white, so the frames
 * supply all the atmosphere.
 */
import type { ClassSession } from "../Landing/schedule"

export interface TrainerImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): TrainerImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/fitness-trainer/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/fitness-trainer/${name}-${step}w.webp`, width: step })),
    }
}

export const trainer = {
    name: "Dara Quinn",
    brand: "Dara Quinn Strength",
    tagline: "Strength coaching for people with desks",
    city: "Chicago, Illinois",
    address: "Studio 3, 210 North Peoria Street, Chicago, IL 60607",
    phone: "(312) 555-0184",
    email: "coach@daraquinn.example",
    instagram: "https://instagram.com/daraquinnstrength",
}

/**
 * The training week, as data. 0 = Sunday … 6 = Saturday; times are minutes
 * since midnight. 1:1 blocks are by appointment inside the listed windows;
 * small group runs on fixed hours. Sundays and Wednesdays the book is
 * closed — recovery is programmed too.
 */
export const trainingWeek: ClassSession[] = [
    // Monday
    { day: 1, start: 6 * 60, end: 9 * 60, title: "1:1 blocks", instructor: "By appointment" },
    { day: 1, start: 12 * 60, end: 13 * 60, title: "Small group", instructor: "4 athletes, 2 spots open" },
    { day: 1, start: 17 * 60, end: 20 * 60, title: "1:1 blocks", instructor: "By appointment" },
    // Tuesday
    { day: 2, start: 6 * 60, end: 9 * 60, title: "1:1 blocks", instructor: "By appointment" },
    {
        day: 2,
        start: 18 * 60,
        end: 19 * 60,
        title: "Small group",
        instructor: "4 athletes, waitlist",
        note: "Strength focus",
    },
    // Thursday
    { day: 4, start: 6 * 60, end: 9 * 60, title: "1:1 blocks", instructor: "By appointment" },
    { day: 4, start: 12 * 60, end: 13 * 60, title: "Small group", instructor: "4 athletes, 1 spot open" },
    { day: 4, start: 17 * 60, end: 20 * 60, title: "1:1 blocks", instructor: "By appointment" },
    // Friday
    { day: 5, start: 6 * 60, end: 10 * 60, title: "1:1 blocks", instructor: "By appointment" },
    // Saturday
    {
        day: 6,
        start: 8 * 60,
        end: 9 * 60 + 30,
        title: "Team session",
        instructor: "All current clients",
        note: "Monthly testing on first Saturdays",
    },
]

export const scheduleNote =
    "1:1 blocks are booked by appointment inside the listed windows. Wednesdays and Sundays the book is closed — recovery is programmed too."

/** Home-page proof: the numbers a visitor checks before applying. */
export const stats = [
    { value: "12", label: "years coaching" },
    { value: "300+", label: "clients trained" },
    { value: "18", label: "client slots, total" },
    { value: "94%", label: "still training after a year" },
]

export const bio = {
    kicker: "The coach",
    headline: "Strength is a practice, not a punishment.",
    paragraphs: [
        "I spent eight years as a collegiate strength coach before I noticed the athletes who needed barbells most were the ones who'd stopped being athletes: people with desks, deadlines, and backs that had quietly given up. I've coached them ever since.",
        "The method is not a secret. Squat, hinge, press, carry — loaded carefully, progressed weekly, measured quarterly. What you're paying for is attention: I keep eighteen client slots, total, and I watch every rep of every session.",
    ],
    credentials: [
        "MS, Exercise Science — University of Illinois",
        "CSCS, NSCA — since 2014",
        "Former assistant S&C coach, Big Ten track & field",
        "USA Weightlifting L2 coach",
    ],
    portrait: photo("portrait", 1024, 1536, "Coach Dara Quinn, arms crossed, in a single hard rim light"),
}

export const programs = [
    {
        name: "Small group",
        monthly: 240,
        yearlyPerMonth: 220,
        description:
            "Four athletes, one coach, fixed hours. The energy of a team at a quarter of the 1:1 rate.",
        features: [
            "Two coached sessions a week",
            "Individual loads inside a shared program",
            "Quarterly testing day",
            "Capped at four — every rep watched",
        ],
    },
    {
        name: "1:1 coaching",
        monthly: 640,
        yearlyPerMonth: 580,
        description:
            "Your program, your hour, my full attention. The way strength coaching is supposed to work.",
        features: [
            "Two private sessions a week",
            "Programming written for your body and your calendar",
            "Weekly check-in between sessions",
            "Priority scheduling in the 1:1 windows",
        ],
        highlighted: true,
        badge: "Three slots open",
    },
    {
        name: "Online coaching",
        monthly: 190,
        yearlyPerMonth: 170,
        description:
            "The same programming and the same eyes, delivered through video review instead of the floor.",
        features: [
            "Four-week training blocks, updated weekly",
            "Video review of every main lift",
            "Monthly video call",
            "Move to in-person anytime a slot opens",
        ],
    },
]

export const process = [
    {
        title: "Apply",
        description: "The form below: where you are, what's hurting, what you want back. Two minutes.",
    },
    {
        title: "Consult",
        description:
            "A free thirty-minute conversation — history, injuries, schedule. No pitch; if I'm not the right coach, I'll say so.",
    },
    {
        title: "Assess",
        description:
            "One session on the floor. We find your honest starting points on the squat, hinge, press, and carry.",
    },
    {
        title: "Train",
        description:
            "Your program starts the following week. Testing every quarter, so progress is a number, not a feeling.",
    },
]

export const faq = [
    {
        question: "I haven't trained in years. Is this for me?",
        answer: "You're the exact person this is for. Most clients arrive after a long gap — the program starts from your honest assessment numbers, not from where you think you should be.",
    },
    {
        question: "What does the free consult commit me to?",
        answer: "Nothing. It's thirty minutes of conversation, no card on file and no follow-up sequence. If we're not a fit, you leave with a straight answer and a referral.",
    },
    {
        question: "Why only eighteen client slots?",
        answer: "Because coaching quality collapses quietly when a roster grows. Eighteen is the number where I can still watch every rep, review every video, and remember what your knee did in March.",
    },
    {
        question: "Do you train people with injuries?",
        answer: "Within reason, yes — most clients bring one. I coach around medical guidance, not instead of it: if your issue needs a clinician first, I'll tell you at the consult.",
    },
]

export const testimonials = [
    {
        quote: "I came in with a back that flared every March and a chair-shaped spine. Two years later I deadlift double bodyweight and the flare-ups are gone. Dara never promised either — she just wrote the next four weeks, over and over.",
        name: "Priya Raman",
        detail: "Client since 2024 · Software architect",
    },
    {
        quote: "The consult was the first honest conversation I'd had about training in a decade. No package upsell, no before-and-after photos — a whiteboard, a plan, and a coach who watches like it's her own spine under the bar.",
        name: "Tom Okonkwo",
        detail: "Client since 2023 · Attorney",
    },
]

export const home = {
    headline: "Coached strength.",
    subheadline:
        "One coach, eighteen client slots, a program written for your body and your calendar. Strength coaching in Chicago's West Loop for people with desks and deadlines.",
    hero: photo(
        "hero-coaching",
        1536,
        1024,
        "Dara Quinn coaching an athlete's back angle mid-squat under a single hard light",
    ),
}

export const gallery: TrainerImage[] = [
    photo("work-notes", 1536, 1024, "Dara writing session notes beside the platform while a client rests"),
    photo("work-group", 1536, 1024, "The small group mid-kettlebell press, Dara timing the set"),
    photo("work-deadlift", 1536, 1024, "A client locking out a heavy deadlift, chalk dust in the light"),
    photo("work-bar", 1536, 1024, "A loaded barbell on the platform in one raking light"),
]

export const consult = {
    headline: "The consult is free.",
    body: "Thirty minutes, no card, no pitch. Tell me where you're starting from and what you want back, and I'll tell you honestly whether I'm the right coach for it.",
    confirmation: "Got it. I read every application myself — you'll hear from me within two days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "program",
            label: "Which program?",
            placeholder: "1:1, small group, online — or not sure yet",
        },
        {
            name: "history",
            label: "Where are you starting from?",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
            placeholder: "Training history, injuries, what you want back",
        },
    ],
}
