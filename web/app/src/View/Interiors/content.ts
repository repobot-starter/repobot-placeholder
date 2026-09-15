/**
 * The interiors pack's single content file: the studio, the portfolio,
 * the services, and the pages. Everything the site renders comes from
 * here — edit this file (not the page components) to make the site
 * yours. The demo studio is a Portland interior designer, but the shape
 * fits any portfolio-led practice: swap the projects, services, and copy
 * and the site follows.
 *
 * The portfolio is contract-shaped on purpose: `projects` mirrors the
 * business-content contract's `projects` domain
 * (web/app/src/View/Landing/projectsDocument.ts) — slug, title,
 * category, location, year, scope, description, featured — so an owner's
 * Manage edit and this file walk the same rendering path. The taxonomy
 * is the `category` field: the portfolio grid derives its filter chips
 * from whatever categories the entries carry (`projectCategories`), so
 * minting a new shelf is adding a word, never touching a component.
 * Photographs stay code-owned and join back in BY REFERENCE via `slug`
 * (`inventory.ts`) — the contract moves words, never bytes.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/interiors` (see PACK.md). The art direction is warm
 * natural light on real materials — plaster, walnut, linen, stone;
 * nothing showroom-flat, nothing staged-empty.
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
        src: `/interiors/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/interiors/${name}-${step}w.webp`, width: step })),
    }
}

export const studio = {
    name: "Elin Marsh Interiors",
    /** The designer the brand is built on — bylines, bio, the about page. */
    principal: "Elin Marsh",
    tagline: "Interiors with a point of view",
    location: "Portland, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(503) 555-0129",
    phoneHref: "tel:+15035550129",
    email: "studio@elinmarshinteriors.example",
    address: "1523 NE Alberta Street, Studio 2, Portland, OR 97211",
    /** The trust line — rendered wherever confidence is being earned. */
    credentialLine: "NCIDQ certified · ASID professional member",
}

/**
 * Landing copy the studio's discipline owns: the few strings the landing
 * modules render that would read wrong for a different portfolio practice
 * (an architect, a landscape studio). A remix seed retrades these along
 * with the rest of the content — everything else in the landing modules
 * is practice-neutral on purpose (the services family's `landingCopy`
 * discipline, packs/README.md "Derived templates").
 */
export const landingCopy = {
    /** The contact ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Start a project",
    /** The home page's featured-work heading. */
    featuredHeading: "Selected work",
    /** The home page's services-section heading. */
    servicesHeading: "Three ways to work together",
    /** The portfolio grid's "everything" filter chip. */
    allWorkLabel: "All work",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Have a space in mind?",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { portfolio: "Portfolio", services: "Services", about: "About" },
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
        slug: "laurelhurst-craftsman",
        title: "Laurelhurst Craftsman",
        category: "Full home",
        location: "Laurelhurst",
        year: 2026,
        scope: "Whole-house renovation — 3,400 sq ft",
        description:
            "A 1912 craftsman opened up without losing its bones: original fir trim restored, a new kitchen that defers to it, and a palette of plaster, walnut, and moss drawn from the garden it faces.",
        featured: true,
        image: photo(
            "project-laurelhurst",
            1152,
            864,
            "A renovated craftsman living room: restored fir trim, plaster walls, walnut built-ins, and moss-green wool armchairs",
        ),
    },
    {
        slug: "pearl-loft",
        title: "Pearl District Loft",
        category: "Full home",
        location: "Pearl District",
        year: 2025,
        scope: "Full interior — 1,800 sq ft",
        description:
            "A concrete shell warmed into a home: white-oak millwork wrapping the sleeping mezzanine, a travertine island under the old crane rail, and linen everywhere the concrete isn't.",
        featured: true,
        image: photo(
            "project-pearl",
            1152,
            864,
            "A warehouse loft interior: concrete columns, white-oak millwork, a travertine kitchen island, and tall factory windows",
        ),
    },
    {
        slug: "alberta-kitchen",
        title: "Alberta Arts Kitchen",
        category: "Kitchens & baths",
        location: "Alberta Arts District",
        year: 2025,
        scope: "Kitchen — 14 weeks",
        description:
            "A galley kitchen rebuilt around one long sightline: sage-painted cabinetry to the ceiling, unlacquered brass that will earn its patina, and a soapstone counter meant for flour and lemon juice.",
        featured: true,
        image: photo(
            "project-alberta",
            1152,
            864,
            "A sage-green kitchen with cabinetry to the ceiling, soapstone counters, unlacquered brass hardware, and morning light",
        ),
    },
    {
        slug: "sellwood-bath",
        title: "Sellwood Primary Bath",
        category: "Kitchens & baths",
        location: "Sellwood",
        year: 2024,
        scope: "Primary bath — 8 weeks",
        description:
            "A cramped 1970s bath turned quiet and stone-heavy: zellige to the ceiling, a carved travertine basin, and a skylight where the fan used to be.",
        image: photo(
            "project-sellwood",
            1152,
            864,
            "A serene bathroom with handmade white zellige tile, a carved travertine basin, and soft light from a skylight",
        ),
    },
    {
        slug: "harlow-cafe",
        title: "Café Harlow",
        category: "Commercial",
        location: "Division Street",
        year: 2024,
        scope: "Café build-out — 2,100 sq ft",
        description:
            "A neighborhood café that seats forty without shouting: oxblood banquettes, a walnut service bar, and acoustic plaster doing quiet work overhead. Designed to be photographed, built to be wiped down.",
        image: photo(
            "project-harlow",
            1152,
            864,
            "A café interior with oxblood leather banquettes, a walnut service bar, globe pendants, and plants in the window",
        ),
    },
    {
        slug: "irvington-styling",
        title: "Irvington Styling",
        category: "Styling",
        location: "Irvington",
        year: 2026,
        scope: "Furnishing & styling — 5 rooms",
        description:
            "The house was finished; it just didn't feel lived-in. Five rooms furnished and styled in six weeks — vintage pieces, commissioned ceramics, and the client's own books finally given shelves worth their spines.",
        image: photo(
            "project-irvington",
            1152,
            864,
            "A styled living room with a vintage leather sofa, layered rugs, full bookshelves, and collected ceramics on a credenza",
        ),
    },
]

export interface Service {
    slug: string
    title: string
    description: string
    /** "Investments from $25,000" / "$450 flat" — honesty over mystery. */
    investment: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "full-service",
        title: "Full-service design",
        description:
            "The whole arc, one studio: concept, drawings, contractor coordination, procurement, and the final styling day. You approve decisions; we carry them through walls, lead times, and the last cushion.",
        investment: "Investments from $25,000",
        image: projects[0].image,
    },
    {
        slug: "kitchens-baths",
        title: "Kitchen & bath design",
        description:
            "The two rooms that repay design most: full drawing sets, cabinetry and stone specification, and site visits at the moments that decide whether it comes out as drawn.",
        investment: "Design fees from $8,500",
        image: projects[2].image,
    },
    {
        slug: "furnishing-styling",
        title: "Furnishing & styling",
        description:
            "For finished spaces that don't feel finished: a furnishing plan, procurement at trade pricing, and an installation week that ends with your books on the shelves and art on the walls.",
        investment: "Projects from $3,500",
        image: projects[5].image,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "14", label: "years of practice" },
    { value: "120+", label: "projects delivered" },
    { value: "38", label: "trade partners on call" },
    { value: "5", label: "publications featured in" },
]

export const testimonials = [
    {
        quote: "Elin listened to how we actually live — two kids, one dog, zero patience for precious furniture — and gave us rooms that look like a magazine but survive a Tuesday. The craftsman feels more itself than the day it was built.",
        name: "Claire & Tomás Herrera",
        detail: "Whole-house renovation, Laurelhurst",
    },
    {
        quote: "She managed our contractor, caught two expensive mistakes in the framing week, and still came in under the furnishing budget. I didn't know a designer could be the calmest person on a job site.",
        name: "Dana Whitcomb",
        detail: "Loft interior, Pearl District",
    },
    {
        quote: "Our café had to open in ten weeks and look like it had been there for decades. It did, and it does — customers photograph the banquettes daily and the finishes still wipe clean at midnight.",
        name: "Marcus Oyelaran",
        detail: "Café Harlow, Division Street",
    },
]

export const home = {
    headline: "Rooms that hold up to real life.",
    subheadline:
        "An interior design studio in Portland — whole homes, kitchens and baths, and the styling week that makes a finished house feel inhabited.",
    heroImage: photo(
        "hero-living",
        1152,
        864,
        "A sunlit living room with plaster walls, a walnut credenza, a bouclé sofa, and tall windows onto green trees",
    ),
}

export const process = {
    kicker: "How a project runs",
    title: "A studio process, not a mood board",
    steps: [
        {
            title: "Discovery",
            description:
                "A walkthrough of the space and an honest conversation about budget, timeline, and how you live. You'll get a written scope within a week — and a no if the fit isn't right.",
        },
        {
            title: "Concept & drawings",
            description:
                "Two directions, presented in the space: plans, palettes, and real material samples on the actual floor. We refine one until you'd defend it yourself.",
        },
        {
            title: "The build",
            description:
                "Drawings the trades respect, site visits at the decisive moments, and one weekly note that tells you exactly where things stand — no surprises, no radio silence.",
        },
        {
            title: "Install & reveal",
            description:
                "Furniture lands in one choreographed week, art gets hung, shelves get styled — and you come home to a finished room, not a punch list.",
        },
    ],
}

export const about = {
    headline: "A designer who reads the house first.",
    photo: photo(
        "portrait-elin",
        864,
        1152,
        "Elin Marsh in a rust linen shirt, seated on a walnut stool in her studio, fabric samples on the wall behind",
    ),
    paragraphs: [
        "Elin Marsh opened the studio in 2012 after seven years in commercial architecture, where she learned the unglamorous skills that make residential work land on time: drawing sets trades can build from, schedules with float in them, and the nerve to say no to a beautiful thing that won't survive a family.",
        "The studio's work starts with what a house is already trying to be — a craftsman's fir trim, a loft's crane rail — and builds the client's life into it with real materials: plaster, stone, wood, wool. Trend pieces have to earn their way in; most don't.",
        "It's deliberately a small studio: Elin leads every project, with a senior designer and a procurement manager behind her. Three or four projects run at a time, which is why the work gets finished — and why the calendar books out a season ahead.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "NCIDQ certificate No. 31184",
        "ASID professional member",
        "Featured in Dwell & Portland Monthly",
        "Gray Awards finalist, 2025",
    ],
}

export const faq = [
    {
        question: "What does full-service design cost?",
        answer: "Most whole-home projects land between $25,000 and $80,000 in design fees, with furnishings and construction on top — and you'll have a written number after the discovery visit, before any commitment. We'd rather lose a project to honesty than start one on a fantasy budget.",
    },
    {
        question: "Do you work with our contractor?",
        answer: "Happily, if they're good — and we'll tell you if we think they're not. We also keep a bench of 38 trade partners we've built with for years, from framers to plaster specialists, and we make introductions to fit the project.",
    },
    {
        question: "How far out are you booking?",
        answer: "Full-service projects typically start one season out; styling projects can usually land within six weeks. The discovery call is the fastest way to get a real date on the calendar.",
    },
    {
        question: "Can we just get a few hours of advice?",
        answer: "Yes — that's the design consultation: two hours in your space, decisions made in the room, and a written summary the next day. Many consultations become full projects; plenty happily don't.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin), so an
 * owner's Manage edit and this file walk the same rendering path.
 *
 * The studio books two kinds of visit online: the free discovery call and
 * the paid two-hour design consultation. One calendar — Elin takes every
 * first meeting herself.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "discovery-call",
            name: "Discovery call",
            durationMinutes: 20,
            description:
                "A free call about your space, budget, and timeline — and whether we're the right studio.",
        },
        {
            typeId: "design-consultation",
            name: "Design consultation",
            durationMinutes: 120,
            description:
                "Two working hours in your space: decisions in the room, a written summary the next day.",
        },
    ],
    providers: [
        {
            providerId: "elin-marsh",
            name: "Elin Marsh",
            windows: [
                { day: 2, start: 9 * 60, end: 13 * 60 },
                { day: 3, start: 13 * 60, end: 17 * 60 },
                { day: 4, start: 9 * 60, end: 13 * 60 },
                { day: 5, start: 9 * 60, end: 15 * 60 },
            ],
        },
    ],
}

/** The /contact page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Put a first meeting on the calendar",
    intro: "Book a free discovery call or a two-hour design consultation directly — pick a time and you'll get a confirmation with a one-click reschedule link. Prefer to write first? The form below reaches the studio.",
    /** The new/returning select's studio voice (the widget's statusLabels). */
    statusLabels: { new: "New to the studio", returning: "Returning client" },
}

export const contact = {
    headline: "Tell us about the space.",
    body: "A few lines about the project — the rooms, the timeline, and the budget range you're working with — and the studio will reply within two business days. Honest numbers get honest answers.",
    confirmation:
        "Thank you — your note is in. The studio replies to every inquiry within two business days, usually sooner.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "project",
            label: "Type of project",
            placeholder: "Whole home, kitchen, styling …",
        },
        { name: "neighborhood", label: "Neighborhood", placeholder: "Laurelhurst, Sellwood, elsewhere …" },
        { name: "budget", label: "Budget range", placeholder: "$25–50k, $50–100k, still figuring it out …" },
        { name: "timeline", label: "Ideal timing", placeholder: "This year, next spring, flexible …" },
        {
            name: "message",
            label: "About the space",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
