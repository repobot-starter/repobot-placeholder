/**
 * The interiors-wedding remix's content seed (packs/README.md "Derived
 * templates"): a wedding planning studio worn over the interiors pack.
 * At compose time this file is copied byte-for-byte over
 * `View/Interiors/content.ts`, so it must remain a STRUCTURAL TWIN of
 * that module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Interiors/weddingRemixSeed.test.ts pins the
 * twin).
 *
 * The trade: Laurel & Pine Events, a principal-led wedding planning
 * studio in Charleston, South Carolina. This is the PLANNER'S business
 * site, not a couple's wedding site (that's the wedding pack): the
 * portfolio stays the projects domain's shape — slug, title, category,
 * location, year, scope, description — but the categories become the
 * studio's shelves of real weddings (Estate, Coastal, Garden, City,
 * Destination), the services become the three planning tiers with
 * honest starting prices, and the booking books free consultations and
 * 90-minute planning sessions against the principal's actual week. The
 * inquiry form is the studio's lead pipe: date, venue, guest count,
 * budget.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/interiors-wedding` (see PACK.md). The art direction is
 * fine-art wedding photography in warm golden light — candlelit tables,
 * real venues, abundant but unfussy florals; nothing staged-stiff,
 * nothing stocky.
 */

import type { AppointmentsContent } from "../Landing/practiceDocument"
import type { ContentProject } from "../Landing/projectsDocument"

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
        src: `/interiors-wedding/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/interiors-wedding/${name}-${step}w.webp`, width: step })),
    }
}

export const studio = {
    name: "Laurel & Pine Events",
    /** The planner the brand is built on — bylines, bio, the about page. */
    principal: "Nora Bennett",
    tagline: "Weddings planned like they matter",
    location: "Charleston, South Carolina",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(843) 555-0136",
    phoneHref: "tel:+18435550136",
    email: "hello@laurelandpine.example",
    address: "68 Queen Street, Studio B, Charleston, SC 29401",
    /** The trust line — rendered wherever confidence is being earned. */
    credentialLine: "92 weddings produced · one wedding per weekend, always",
}

/**
 * Landing copy the studio's discipline owns: the few strings the landing
 * modules render that would read wrong for a different portfolio practice.
 * This seed retrades them for a wedding planning studio — everything else
 * in the landing modules is practice-neutral on purpose (the services
 * family's `landingCopy` discipline, packs/README.md "Derived templates").
 */
export const landingCopy = {
    /** The contact ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Inquire about a date",
    /** The home page's featured-work heading. */
    featuredHeading: "Recent celebrations",
    /** The home page's services-section heading. */
    servicesHeading: "Three ways to plan together",
    /** The portfolio grid's "everything" filter chip. */
    allWorkLabel: "All weddings",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Have a date in mind?",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { portfolio: "Weddings", services: "Services", about: "About" },
}

/**
 * One portfolio project: the contract's owner facts (the `projects`
 * domain shape) plus the code-owned photograph. `inventory.ts` lifts
 * these into contract shape and joins document edits back by slug.
 */
export interface StudioProject extends ContentProject {
    image: SiteImage
}

export const projects: StudioProject[] = [
    {
        slug: "amara-james-oakleigh",
        title: "Amara & James at Oakleigh Point",
        category: "Estate",
        location: "Wadmalaw Island",
        year: 2026,
        scope: "Full planning & design — 140 guests",
        description:
            "A sailcloth tent on the river lawn, a live band that never let the floor empty, and eleven vendors run off one master timeline. Fourteen months of planning; the couple's only job on the day was to be in it.",
        featured: true,
        image: photo(
            "project-tent",
            1152,
            864,
            "A sailcloth tent reception at golden hour on a waterfront lawn: round tables, garden-rose centerpieces, and a live band",
        ),
    },
    {
        slug: "quinn-soomin-bluffs",
        title: "Quinn & Soo-Min on the Bluffs",
        category: "Coastal",
        location: "Kiawah River bluffs",
        year: 2025,
        scope: "Full planning & design — 80 guests",
        description:
            "A ceremony at the bluff edge with the tide on cue, pampas and garden roses against all that blue, and a contingency plan for wind we never had to open. The forecast held; the plan meant it didn't have to.",
        featured: true,
        image: photo(
            "project-coast",
            1152,
            864,
            "A cliff-top wedding ceremony site: a blush floral arch with pampas grass at the bluff edge, white chairs, ocean beyond",
        ),
    },
    {
        slug: "dana-marcus-ropeworks",
        title: "Dana & Marcus at the Rope Works",
        category: "City",
        location: "Downtown Charleston",
        year: 2025,
        scope: "Partial planning — 110 guests",
        description:
            "The couple had the venue and the band; we brought the rest. Long walnut tables under the old trusses, black candlesticks and white garden roses, and a load-in schedule that got a bare warehouse dinner-ready in six hours.",
        featured: true,
        image: photo(
            "project-loft",
            1152,
            864,
            "An industrial loft wedding reception: long walnut farm tables, black taper candlesticks, white florals, festoon lights under timber beams",
        ),
    },
    {
        slug: "elena-priya-walled-garden",
        title: "Elena & Priya in the Walled Garden",
        category: "Garden",
        location: "Summerville",
        year: 2024,
        scope: "Full planning & design — 95 guests",
        description:
            "A spring ceremony inside old brick walls: a petal-lined aisle, a circular floral installation instead of an arch, and a rain date we planned as carefully as the real one. The roses on the walls did half the decorating.",
        image: photo(
            "project-garden",
            1152,
            864,
            "A walled-garden ceremony: a petal-lined grass aisle between wooden chairs leading to a circular white floral installation",
        ),
    },
    {
        slug: "caroline-whit-ballroom",
        title: "Caroline & Whit at the Alcott Ballroom",
        category: "Estate",
        location: "South of Broad",
        year: 2024,
        scope: "Wedding management — 180 guests",
        description:
            "Eighteen months of the couple's own planning, handed to us six weeks out and produced without a dropped cue: chandeliers, a champagne palette, a 22-minute room flip between ceremony and dinner that guests never saw.",
        image: photo(
            "project-ballroom",
            1152,
            864,
            "A grand historic ballroom reception: crystal chandeliers, champagne linens, towering white centerpieces around a parquet dance floor",
        ),
    },
    {
        slug: "lena-tom-umbria",
        title: "Lena & Tom above the Umbrian Hills",
        category: "Destination",
        location: "Umbria, Italy",
        year: 2026,
        scope: "Destination planning — 8 guests",
        description:
            "An elopement dinner for eight on a villa terrace at sunset, planned across an ocean and two languages: local florist, local kitchen, one table, no compromises. Small is not the same as simple — it's why they hired a planner.",
        image: photo(
            "project-villa",
            1152,
            864,
            "An intimate dinner for eight on a stone villa terrace at sunset, low florals and taper candles, Umbrian hills beyond",
        ),
    },
]

export interface Service {
    slug: string
    title: string
    description: string
    /** "From $9,500" / "$2,400 flat" — honesty over mystery. */
    investment: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "full-planning",
        title: "Full planning & design",
        description:
            "The whole arc, one studio: venue search, budget stewardship, design direction, every vendor contract, and a wedding-day team that runs the timeline so no one in your family has to. Twelve to eighteen months, one wedding per weekend — yours.",
        investment: "From $9,500",
        image: projects[0].image,
    },
    {
        slug: "partial-planning",
        title: "Partial planning",
        description:
            "You've started; we finish it with you. We join six to nine months out, take over vendor wrangling and design cohesion, keep the budget honest, and produce the day itself. The most popular tier for couples who like planning but not logistics.",
        investment: "From $4,800",
        image: projects[2].image,
    },
    {
        slug: "wedding-management",
        title: "Wedding management",
        description:
            "Day-of coordination, done the honest way: we onboard six weeks out, pressure-test your plan, build the master timeline, confirm every vendor, and run the wedding — so the planning you did actually happens the way you planned it.",
        investment: "From $2,400",
        image: projects[4].image,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "92", label: "weddings produced" },
    { value: "11", label: "years planning" },
    { value: "46", label: "venues worked" },
    { value: "1", label: "wedding per weekend — yours" },
]

export const testimonials = [
    {
        quote: "Nora ran a 140-person tented wedding through a heat advisory and none of our guests ever knew there was a plan B, C, and D. My mother — who planned her own wedding and doubts everyone — called her the best money we spent.",
        name: "Amara & James Okafor-Reid",
        detail: "Full planning, Wadmalaw Island",
    },
    {
        quote: "We hired her for management only, and she found two contract problems our venue never mentioned and a timeline gap that would have cost us our sunset photos. Six weeks of her was worth more than a year of our spreadsheets.",
        name: "Caroline Whitaker",
        detail: "Wedding management, South of Broad",
    },
    {
        quote: "Planning an Italian elopement from South Carolina felt impossible until the first call, when Nora already had the florist, the kitchen, and the light figured out. Eight guests, zero stress, and the dinner of our lives.",
        name: "Lena & Tom Marsh",
        detail: "Destination planning, Umbria",
    },
]

export const home = {
    headline: "Your only job is to be there.",
    subheadline:
        "A wedding planning studio in Charleston — full planning, partial planning, and day-of management for couples who want the day they imagined, run by people who've produced ninety-two of them.",
    heroImage: photo(
        "hero-courtyard",
        1152,
        864,
        "A candlelit reception table for forty under string lights in a historic estate courtyard at dusk, live oaks overhead",
    ),
}

export const process = {
    kicker: "How planning runs",
    title: "A production, not a Pinterest board",
    steps: [
        {
            title: "Inquiry & fit",
            description:
                "A free consultation about your date, your people, and your budget — real numbers, kindly delivered. If we're not the right studio, we'll say so and suggest who is. We take one wedding per weekend, so dates go early.",
        },
        {
            title: "Design & budget",
            description:
                "A design direction built from how you two actually are — not a trend board — and a budget with every line named before a single contract is signed. You'll always know what's spent, what's held, and what's next.",
        },
        {
            title: "The build",
            description:
                "Venue, vendors, contracts, tastings, and a master timeline that accounts for the photographer's light and your grandmother's knees. One weekly note tells you exactly where things stand — no surprises, no radio silence.",
        },
        {
            title: "Wedding week",
            description:
                "We confirm every vendor, run the rehearsal, and produce the day from first delivery to last-dance send-off. Questions come to us, not to you — your only job is in the vows.",
        },
    ],
}

export const about = {
    headline: "A planner who reads the couple first.",
    photo: photo(
        "portrait-bennett",
        864,
        1152,
        "Nora Bennett in a cream silk blouse holding a leather portfolio, standing in a venue doorway with garden light behind her",
    ),
    paragraphs: [
        "Nora Bennett planned her first wedding in 2015 after seven years producing corporate events, where she learned the skills a beautiful wedding actually runs on: load-in schedules, vendor contracts read to the last line, and the calm that comes from having already thought about the rain.",
        "The studio's work starts with the two of you — how you host, what your families are like, which traditions you're keeping and which you're gladly leaving — and builds the design from that, not from whatever this year's weddings look like. The flowers should smell like your wedding, not like the algorithm.",
        "It's deliberately a small studio: Nora leads every wedding, with a producer and two day-of leads behind her. One wedding per weekend is the founding rule — it's why timelines hold, why texts get answered, and why the calendar books out a year ahead.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "92 weddings produced since 2015",
        "Preferred planner at 8 Lowcountry venues",
        "Featured in Southern Living Weddings & The Knot",
        "Trained day-of team of three, every wedding",
    ],
}

export const faq = [
    {
        question: "What does a wedding planner cost?",
        answer: "Full planning starts at $9,500, partial at $4,800, and wedding management at $2,400 — and you'll have a written proposal with a real number after the consultation, before any commitment. On full-planning weddings we routinely save couples more than our fee in vendor negotiation and budget discipline, but we'd never promise that; we promise the number up front.",
    },
    {
        question: "Isn't the venue coordinator enough?",
        answer: "Venue coordinators are wonderful and they work for the venue: their job ends at the property line and the catering contract. Ours is the whole wedding — your budget, your eleven other vendors, your timeline, your family dynamics. The venues we work with most are the ones who recommend hiring us; they know the difference better than anyone.",
    },
    {
        question: "How far out should we book?",
        answer: "Full planning couples book twelve to eighteen months ahead; we take one wedding per weekend, so popular dates go first. Wedding management can land as late as ten weeks out. If your date is closer than that, write to us anyway — honest answer either way, and a referral if we can't do it justice.",
    },
    {
        question: "Do you plan destination weddings?",
        answer: "Yes — recent work includes Umbria, and we'll travel anywhere the two of you have a reason to be. Destination planning is quoted per project after the consultation: local vendor sourcing, travel logistics for your guests, and at least one site visit before the wedding week.",
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
 * The studio books two kinds of meeting online: the free consultation and
 * the 90-minute planning session. One calendar — Nora takes every first
 * meeting herself; weekends belong to weddings.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "consultation",
            name: "Consultation",
            durationMinutes: 30,
            description:
                "A free call about your date, venue thoughts, and budget — and whether we're the right studio.",
        },
        {
            typeId: "planning-session",
            name: "Planning session",
            durationMinutes: 90,
            description:
                "A 90-minute working session at the studio or your venue: decisions made, notes the next morning.",
        },
    ],
    providers: [
        {
            providerId: "nora-bennett",
            name: "Nora Bennett",
            windows: [
                { day: 2, start: 10 * 60, end: 16 * 60 },
                { day: 3, start: 10 * 60, end: 16 * 60 },
                { day: 4, start: 12 * 60, end: 18 * 60 },
                { day: 5, start: 9 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/** The /contact page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Put a first meeting on the calendar",
    intro: "Book a free consultation or a 90-minute planning session directly — pick a time and you'll get a confirmation with a one-click reschedule link. Prefer to write first? The form below reaches the studio.",
    /** The new/returning select's studio voice (the widget's statusLabels). */
    statusLabels: { new: "Newly inquiring", returning: "Current client" },
}

export const contact = {
    headline: "Tell us about the day.",
    body: "A few lines about the two of you — the date or season, the venue if you have one, roughly how many guests, and the budget range you're working with — and the studio will reply within two business days. Honest numbers get honest answers.",
    confirmation:
        "Thank you — your inquiry is in. The studio replies to every note within two business days, usually sooner.",
    fields: [
        { name: "name", label: "Your names", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "date",
            label: "Wedding date or season",
            placeholder: "October 2027, next spring, still deciding …",
        },
        {
            name: "venue",
            label: "Venue, if you have one",
            placeholder: "Booked, shortlisted, or wide open …",
        },
        { name: "guests", label: "Guest count", placeholder: "80, 150, just the two of us …" },
        { name: "budget", label: "Budget range", placeholder: "$40–60k, $60–100k, still figuring it out …" },
        {
            name: "message",
            label: "About the two of you",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
