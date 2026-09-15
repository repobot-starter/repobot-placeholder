/**
 * The services-hair remix's content seed (packs/README.md "Derived
 * templates"): an independent hair stylist worn over the services pack.
 * At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/hairRemixSeed.test.ts pins the twin).
 *
 * The trade: Copper & Ash, a one-chair hair studio in Asheville, North
 * Carolina. Services become the priced menu, before/after projects become
 * color transformations (shot from behind — the salon convention, and the
 * comparison stays honest), the quote form becomes the new-guest inquiry,
 * and the booking strip books consultations and appointments against the
 * stylist's actual week.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-hair` (see PACK.md). The art direction is warm
 * salon light — brass, walnut, and afternoon sun; transformations from
 * the same angle so the slider reads as one head of hair.
 */

import type { DayHours } from "../Landing/hours"
import type { AppointmentsContent } from "../Landing/practiceDocument"

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
        src: `/services-hair/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-hair/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Copper & Ash",
    tagline: "Color-first hair studio",
    location: "Asheville, North Carolina",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(828) 555-0163",
    phoneHref: "tel:+18285550163",
    email: "hello@copperandash.example",
    address: "27 Lexington Avenue, Studio 3, Asheville, NC 28801",
    /** The license line — rendered wherever trust is being earned. */
    license: "NC licensed cosmetologist #C-118427 · Solo studio, by appointment", // theme-exempt: license number, not a color
}

/**
 * Weekly hours drive the live "Open now — closes 7 PM" hero badge (the
 * shared hours engine, `View/Landing/hours.ts`). Minutes since midnight;
 * a day may have several intervals. Tuesday–Saturday — a stylist's week.
 */
export const weeklyHours: DayHours[] = [
    { day: 2, intervals: [[600, 1140]] }, // Tue 10 AM – 7 PM
    { day: 3, intervals: [[600, 1140]] },
    { day: 4, intervals: [[600, 1140]] },
    { day: 5, intervals: [[540, 1080]] }, // Fri 9 AM – 6 PM
    { day: 6, intervals: [[540, 960]] }, // Sat 9 AM – 4 PM
]

export const hoursNote =
    "Tuesday–Thursday 10 AM–7 PM · Friday 9 AM–6 PM · Saturday 9 AM–4 PM · By appointment"

/** The neighborhoods guests actually come from — the home page's quiet strip. */
export const serviceArea = [
    "Downtown",
    "West Asheville",
    "Montford",
    "River Arts District",
    "Biltmore Village",
    "Weaverville",
]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "The service menu",
}

export interface Service {
    slug: string
    title: string
    /** Small uppercase label on the card, e.g. the room or trade. */
    eyebrow: string
    description: string
    /** "From $12,000" / "By consultation" — honest ballparks build trust. */
    priceNote: string
    image: SiteImage
}

export interface Project {
    slug: string
    title: string
    /** The town — the eyebrow on the comparison caption. */
    location: string
    /** One line of scope and duration, e.g. "Full gut remodel — 6 weeks". */
    scope: string
    description: string
    before: SiteImage
    after: SiteImage
}

export const projects: Project[] = [
    {
        slug: "brass-to-beige",
        title: "Brass to lived-in blonde",
        location: "Downtown",
        scope: "Color correction — 4.5 hours",
        description:
            "Two years of box dye lifted in one careful session: a gloss to kill the brass, a hand-painted balayage over it, and a bond treatment so it all still moves like hair.",
        before: photo(
            "transform-blonde-before",
            1152,
            864,
            "The back of a client's hair before correction: brassy, uneven box-dye orange with grown-out roots",
        ),
        after: photo(
            "transform-blonde-after",
            1152,
            864,
            "The same hair after correction: dimensional lived-in blonde with soft, blended roots",
        ),
    },
    {
        slug: "grown-out-balayage",
        title: "The grow-out rescue",
        location: "West Asheville",
        scope: "Balayage refresh & cut — 3 hours",
        description:
            "Eighteen months of grow-out turned into the style: the old line softened with a root melt, fresh face-framing money pieces, and four inches of dead weight gone.",
        before: photo(
            "transform-balayage-before",
            1152,
            864,
            "The back of a client's hair before the refresh: a hard grow-out line and faded, heavy ends",
        ),
        after: photo(
            "transform-balayage-after",
            1152,
            864,
            "The same hair after the refresh: seamless caramel balayage with a soft, layered cut",
        ),
    },
    {
        slug: "copper-gloss",
        title: "The copper gloss",
        location: "Montford",
        scope: "All-over color & gloss — 2.5 hours",
        description:
            "Faded, flat brown re-lit as a rich copper: an all-over color, a shine gloss on top, and a dusting of the ends — the studio's namesake service.",
        before: photo(
            "transform-copper-before",
            1152,
            864,
            "The back of a client's hair before color: flat, faded brown with dull mid-lengths",
        ),
        after: photo(
            "transform-copper-after",
            1152,
            864,
            "The same hair after color: glossy dimensional copper catching warm salon light",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "cut-style",
        title: "Cut & style",
        eyebrow: "The chair",
        description:
            "A precision cut built around your hair's texture and your actual mornings — consultation, shampoo, cut, and a finish you can repeat at home.",
        priceNote: "From $75",
        image: projects[1].after,
    },
    {
        slug: "balayage",
        title: "Balayage & lived-in color",
        eyebrow: "Color",
        description:
            "Hand-painted dimension that grows out soft — no hard lines, no six-week panic. Includes a gloss, a bond treatment, and a styled finish.",
        priceNote: "From $220",
        image: projects[0].after,
    },
    {
        slug: "all-over-color",
        title: "All-over color & gloss",
        eyebrow: "Color",
        description:
            "Single-process color, root retouches, and shine glosses — rich, glossy, and matched to your skin tone, not a swatch book.",
        priceNote: "From $110",
        image: projects[2].after,
    },
    {
        slug: "color-correction",
        title: "Color correction",
        eyebrow: "The rescue",
        description:
            "Box dye, brass, banding, or a color you just can't live with — corrected in as many careful sessions as your hair's integrity allows.",
        priceNote: "By consultation",
        image: photo(
            "service-correction",
            1152,
            864,
            "A stylist hand-painting lightener onto sectioned hair with a color brush",
        ),
    },
    {
        slug: "blowout",
        title: "Blowout & styling",
        eyebrow: "The finish",
        description:
            "A shampoo, a proper blowout, and hot-tool finishing that survives the evening — for the days that matter.",
        priceNote: "From $55",
        image: photo(
            "service-blowout",
            1152,
            864,
            "A stylist finishing a glossy round-brush blowout in warm salon light",
        ),
    },
    {
        slug: "occasion",
        title: "Bridal & occasion hair",
        eyebrow: "Events",
        description:
            "Trials, updos, and morning-of styling for weddings and big days — in the studio or on location, timed to the minute.",
        priceNote: "From $95",
        image: photo(
            "service-occasion",
            1152,
            864,
            "An elegant loose bridal updo with soft face-framing strands, seen from behind",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "12", label: "years behind the chair" },
    { value: "2,300+", label: "guests styled" },
    { value: "4.9★", label: "average of 340 reviews" },
    { value: "92%", label: "of guests rebook" },
]

export const testimonials = [
    {
        quote: "I brought Jules a photo and two years of box-dye damage. She told me honestly it would take two sessions, not one — and the day it was done, three coworkers asked for her number.",
        name: "Dana M.",
        detail: "Color correction, Downtown",
    },
    {
        quote: "First stylist who measured how much time I actually spend on my hair (eight minutes) and cut for that. It looks salon-finished out of a towel. I've rebooked before leaving every visit since.",
        name: "Priya S.",
        detail: "Cut & style, West Asheville",
    },
    {
        quote: "She did my wedding trial, kept notes, and on the morning-of my updo was pinned and photographed by 9 AM sharp. It survived the rain, the dancing, and my mother's hugs.",
        name: "Kelsey R.",
        detail: "Bridal styling, Biltmore Village",
    },
]

export const home = {
    headline: "Hair that looks like you, lit well.",
    subheadline:
        "Color-first, one-chair hair studio on Lexington Avenue — lived-in balayage, honest corrections, and cuts built for your actual mornings.",
    heroImage: photo(
        "hero-studio",
        1152,
        864,
        "The studio's single styling chair before a brass-framed mirror, walnut shelves and afternoon light",
    ),
    /** The before/after teaser: which projects lead on the home page. */
    featuredProjects: [projects[0], projects[2]],
}

export const about = {
    headline: "One chair, on purpose.",
    photo: photo(
        "stylist",
        864,
        1152,
        "Jules Farrow in a black apron leaning against the studio's walnut counter, shears in the pocket",
    ),
    paragraphs: [
        "Copper & Ash is Jules Farrow — twelve years behind the chair, the last five in a one-chair studio she built out herself on Lexington Avenue. She trained in Charlotte, apprenticed under a Redken master colorist, and still takes a color class every season, because the chemistry keeps moving.",
        "The studio is one chair on purpose: no double-booking, no handing you to an assistant mid-foil, no blow-dry bar hum. Your appointment starts when it's booked and ends when the mirror spin is earned. Consultations are built into every service, and the first fifteen minutes are always about how you actually live with your hair.",
        "Pricing is posted, honest, and quoted before the cape goes on. If your hair needs two sessions, you'll hear it at the consultation — never at the register.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "NC cosmetology license #C-118427",
        "Redken certified colorist",
        "Lived-in color specialist",
        "Cruelty-free products only",
    ], // theme-exempt: license number, not a color
}

export const process = {
    kicker: "How an appointment runs",
    title: "No surprises, mirror to mirror",
    steps: [
        {
            title: "Consultation",
            description:
                "Fifteen unhurried minutes, included in every service: your hair's history, your mornings, and photos — yours and hers — until the plan is one you both believe.",
        },
        {
            title: "The quote",
            description:
                "A price and a timeline before the cape goes on. Corrections that need two sessions are quoted as two sessions — never a surprise at checkout.",
        },
        {
            title: "The service",
            description:
                "One guest at a time, start to finish. Color processes are timed, not guessed, and every color service ends with a gloss and a bond treatment.",
        },
        {
            title: "The send-off",
            description:
                "A finish you can repeat at home, the products used written down, and your formula kept on file for next time — rebook before you leave and the time is yours.",
        },
    ],
}

export const faq = [
    {
        question: "Do I need a consultation first?",
        answer: "For cuts and standard color, the consultation is built into your appointment. For corrections and major changes, book the free 15-minute consult first — it's how the price and the plan get honest before any chemistry happens.",
    },
    {
        question: "Why do prices say 'from'?",
        answer: "Hair length, density, and history change the time and product a service takes. The 'from' price is the real starting point, and you'll have your exact quote at the consultation — before the cape goes on, never at the register.",
    },
    {
        question: "What if I'm not sure what I want?",
        answer: "That's what the first fifteen minutes are for. Bring photos of hair you love (and hair you've hated), and be honest about your morning routine. The best result is the one you can live with on a Tuesday.",
    },
    {
        question: "What's your cancellation policy?",
        answer: "Life happens — 48 hours' notice moves your appointment free, no questions. Inside 48 hours a rebooking fee applies, because one chair means a missed slot can't be absorbed. Confirmation emails carry a one-click reschedule link.",
    },
    {
        question: "What products do you use?",
        answer: "Redken color and K18 bond care in the bowl; cruelty-free styling lines on the shelf. Everything used in your service is written on your send-off card, and nothing is pushed at checkout.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the remix-seed tests pin the twin), so
 * an owner's Manage edit and this file walk the same rendering path.
 *
 * The studio books two kinds of visit online: the free consultation (the
 * honest start for color work) and a chair appointment. One provider —
 * it's a one-chair studio — with windows inside the posted hours.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "consultation",
            name: "Free 15-minute consultation",
            durationMinutes: 15,
            description: "For corrections and big changes — photos, honest talk, and your exact quote.",
        },
        {
            typeId: "chair-appointment",
            name: "Chair appointment",
            durationMinutes: 90,
            description: "A cut, color, or blowout block — the exact service is confirmed at the chair.",
        },
    ],
    providers: [
        {
            providerId: "jules-farrow",
            name: "Jules Farrow",
            windows: [
                { day: 2, start: 10 * 60, end: 18 * 60 },
                { day: 3, start: 10 * 60, end: 18 * 60 },
                { day: 4, start: 10 * 60, end: 18 * 60 },
                { day: 5, start: 9 * 60, end: 17 * 60 },
                { day: 6, start: 9 * 60, end: 15 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Get in the chair",
    intro: "Book a free consultation or a chair appointment directly — pick a time and you'll get a confirmation with a one-click reschedule link. Not sure what to book? The form below reaches Jules herself.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First visit to the studio", returning: "Returning guest" },
}

export const quote = {
    headline: "Tell me about your hair.",
    body: "A few lines — your hair now, what you're dreaming about, and anything it's been through (box dye counts, no judgment) — and you'll hear back within one business day.",
    confirmation:
        "Thank you — your note is in. I answer every inquiry personally within one business day, usually between clients the same afternoon.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "service", label: "What you're after", placeholder: "Balayage, cut, correction, bridal …" },
        {
            name: "history",
            label: "Your hair's history",
            placeholder: "Box dye, last salon color, virgin hair …",
        },
        {
            name: "timeline",
            label: "Ideal timing",
            placeholder: "This month, before the wedding, flexible …",
        },
        {
            name: "message",
            label: "About your hair",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
