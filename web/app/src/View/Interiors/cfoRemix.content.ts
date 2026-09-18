/**
 * The interiors-cfo remix's content seed (packs/README.md "Derived
 * templates"): a fractional-CFO practice worn over the interiors pack.
 * At compose time this file is copied byte-for-byte over
 * `View/Interiors/content.ts`, so it must remain a STRUCTURAL TWIN of
 * that module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Interiors/cfoRemixSeed.test.ts pins the
 * twin).
 *
 * The trade: Clearline CFO, a principal-led fractional finance-leadership
 * practice in Denver, Colorado. This is a MARKETING site for a services
 * practice — deliberately not the platform's cfo dashboard app: the
 * portfolio stays the projects domain's shape but the categories become
 * industries served (SaaS, E-commerce, Manufacturing, Healthcare,
 * Agencies, Nonprofit) and each entry is a case study with an outcome in
 * the description; the services become engagement models with honest
 * monthly pricing; and the booking books free discovery calls and paid
 * two-hour financial review sessions against the principal's actual
 * week. The inquiry form is the lead pipe: company, revenue range, what's
 * keeping you up.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/interiors-cfo` (see PACK.md). The art direction is
 * honest workplace documentary — real offices, workshops, and warehouses
 * in warm natural light; nothing stocky, nothing rendered, no readable
 * numbers anywhere.
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
        src: `/interiors-cfo/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/interiors-cfo/${name}-${step}w.webp`, width: step })),
    }
}

export const studio = {
    name: "Clearline CFO",
    /** The operator the brand is built on — bylines, bio, the about page. */
    principal: "Maya Okafor, CPA",
    tagline: "Finance leadership, sized to the company you are",
    location: "Denver, Colorado",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(720) 555-0163",
    phoneHref: "tel:+17205550163",
    email: "maya@clearlinecfo.example",
    address: "1801 Blake Street, Suite 410, Denver, CO 80202",
    /** The trust line — rendered wherever confidence is being earned. */
    credentialLine: "CPA · two-time startup CFO · $310M raised alongside clients",
}

/**
 * Landing copy the practice's discipline owns: the few strings the landing
 * modules render that would read wrong for a different portfolio practice.
 * This seed retrades them for a fractional-CFO practice — everything else
 * in the landing modules is practice-neutral on purpose (the services
 * family's `landingCopy` discipline, packs/README.md "Derived templates").
 */
export const landingCopy = {
    /** The contact ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Book a discovery call",
    /** The home page's featured-work heading. */
    featuredHeading: "Recent engagements",
    /** The home page's services-section heading. */
    servicesHeading: "Three ways to engage",
    /** The portfolio grid's "everything" filter chip. */
    allWorkLabel: "All industries",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Want a straight answer about your numbers?",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { portfolio: "Case studies", services: "Engagements", about: "About" },
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
        slug: "saas-series-a",
        title: "Runway to a Series A",
        category: "SaaS",
        location: "Boulder, CO",
        year: 2026,
        scope: "Fractional CFO — 18 months",
        description:
            "A 20-person SaaS company with real revenue and unreadable books. We rebuilt revenue recognition, put net retention and burn on one honest dashboard, and ran the financial side of the raise: $9M Series A, closed on the metrics the model promised three quarters earlier.",
        featured: true,
        image: photo(
            "project-saas",
            1152,
            864,
            "A small SaaS startup office: engineers at standing desks and a teammate sketching on a glass wall in warm afternoon light",
        ),
    },
    {
        slug: "ecommerce-margin",
        title: "The four-point margin turnaround",
        category: "E-commerce",
        location: "Denver, CO",
        year: 2025,
        scope: "Fractional CFO — 12 months",
        description:
            "An eight-figure home-goods brand growing broke: every order profitable on paper, the company not. Landed-cost accounting, SKU-level contribution margins, and two hard catalog decisions later, gross margin rose four points and the line of credit stopped being a lifestyle.",
        featured: true,
        image: photo(
            "project-ecommerce",
            1152,
            864,
            "An e-commerce fulfillment room: hands taping a kraft box at a packing bench, shelves of binned candles and ceramics behind",
        ),
    },
    {
        slug: "workshop-sba",
        title: "A workshop that financed its own growth",
        category: "Manufacturing",
        location: "Fort Collins, CO",
        year: 2025,
        scope: "Project — SBA loan package",
        description:
            "A custom furniture shop turning down orders it couldn't fund. Six weeks of work-in-progress accounting, cash conversion analysis, and lender-grade projections produced a $1.4M SBA package — approved first pass — and a second CNC line that paid for itself in eleven months.",
        image: photo(
            "project-workshop",
            1152,
            864,
            "A craft furniture workshop: a woodworker in an apron guiding a hardwood board through machinery in dusty window light",
        ),
    },
    {
        slug: "clinic-consolidation",
        title: "Three clinics, one P&L",
        category: "Healthcare",
        location: "Colorado Springs, CO",
        year: 2024,
        scope: "Interim CFO — 6 months",
        description:
            "A physician group that had acquired two practices and three bookkeeping systems. As interim CFO through the consolidation: one chart of accounts, per-clinic profitability nobody had ever seen, and a payer-mix analysis that changed which services grew. Handed off to the full-time CFO we helped hire.",
        featured: true,
        image: photo(
            "project-clinic",
            1152,
            864,
            "A calm outpatient clinic reception: light wood desk, sage chairs, and a nurse walking through with a tablet",
        ),
    },
    {
        slug: "agency-pricing",
        title: "An agency that learned its real hourly cost",
        category: "Agencies",
        location: "Denver, CO",
        year: 2024,
        scope: "Fractional CFO — 14 months",
        description:
            "A 30-person design agency billing heroically and keeping almost none of it. Utilization and loaded-cost math made the problem visible; project-level margin reporting made it fixable. Two clients repriced, one fired, and the partners took their first real distributions in three years.",
        image: photo(
            "project-agency",
            1152,
            864,
            "A design agency project meeting around a big oak table: printed layouts and sticky notes spread out, brick wall and tall windows",
        ),
    },
    {
        slug: "foodbank-audit",
        title: "A clean audit and a board that reads the numbers",
        category: "Nonprofit",
        location: "Aurora, CO",
        year: 2026,
        scope: "Project — audit readiness",
        description:
            "A regional food bank facing its first single audit after a grant-funded growth year. Restricted-fund accounting rebuilt, controls documented, and a board dashboard in plain English. The audit came back clean; the bigger win is a finance committee that now asks better questions than we do.",
        image: photo(
            "project-foodbank",
            1152,
            864,
            "A nonprofit food bank warehouse: volunteers sorting fresh produce into crates at long tables, tall shelving behind",
        ),
    },
]

export interface Service {
    slug: string
    title: string
    description: string
    /** "Retainers from $4,500/month" / "$7,500 flat" — honesty over mystery. */
    investment: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "fractional-cfo",
        title: "Fractional CFO",
        description:
            "A real CFO, one to two days a week: forecasting you can steer by, board and investor reporting, pricing and hiring math, and a monthly close that lands on time. You get the judgment of a full-time CFO at the fraction of the cost a company your size should pay — and a straight answer when those two things stop being true.",
        investment: "Retainers from $4,500/month",
        image: projects[0].image,
    },
    {
        slug: "interim-cfo",
        title: "Interim CFO",
        description:
            "Full-time presence for a defined season: a departure, an acquisition, a consolidation, a raise. We hold the seat, run the team, and fix what the urgency exposes — then help you hire the permanent CFO and hand over a function that's better than we found it.",
        investment: "From $14,000/month",
        image: projects[3].image,
    },
    {
        slug: "project-work",
        title: "Fundraise & project work",
        description:
            "Defined scope, flat price, written deliverable: the model and data room for a raise, a lender-grade loan package, pricing analysis, or audit readiness. Quoted after the discovery call, delivered on a date, and yours to keep working without us.",
        investment: "From $7,500 flat",
        image: projects[2].image,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "$310M", label: "raised alongside clients" },
    { value: "40+", label: "companies served" },
    { value: "9", label: "industries worked" },
    { value: "6", label: "full-time CFOs hired to replace us" },
]

export const testimonials = [
    {
        quote: "Maya told us in the first month that our pricing was the problem and our fundraise timeline was fantasy. She was right twice. A year later we raised on her model, at a better valuation than the fantasy one, and the board meetings run off her one-page dashboard.",
        name: "Priya Raman",
        detail: "CEO, SaaS — fractional engagement",
    },
    {
        quote: "We thought we needed a loan officer who liked us. We needed WIP accounting and projections a bank could underwrite. The SBA package was approved on the first pass, and I still use her cash model every Monday morning.",
        name: "Dale Kowalczyk",
        detail: "Owner, furniture workshop — project engagement",
    },
    {
        quote: "As interim CFO she consolidated three practices without losing a payroll, then told us to hire a full-time CFO and helped us find her. A consultant who works herself out of the job is the only kind worth paying for.",
        name: "Dr. Elena Vasquez",
        detail: "Managing partner, physician group — interim engagement",
    },
]

export const home = {
    headline: "Your numbers have a story. We make it a plan.",
    subheadline:
        "A fractional-CFO practice in Denver — forecasting, pricing, raises, and board-ready reporting for companies between their first million and their first full-time CFO.",
    heroImage: photo(
        "hero-worksession",
        1152,
        864,
        "A working finance session at a walnut table: an open laptop, printed charts, a notebook and coffee in warm morning light",
    ),
}

export const process = {
    kicker: "How an engagement runs",
    title: "Diagnose first, retain second",
    steps: [
        {
            title: "Discovery call",
            description:
                "Thirty free minutes on where the numbers stand and what's keeping you up. You'll leave with at least one useful observation and an honest answer about whether you need us — plenty of callers just need a better bookkeeper, and we say so.",
        },
        {
            title: "The diagnostic",
            description:
                "The first thirty days are a fixed-scope look under the hood: books, margins, cash runway, and the three numbers your decisions actually turn on. It ends with a written findings memo and a plan — keep working with us or take it and run.",
        },
        {
            title: "The operating rhythm",
            description:
                "A monthly close that lands by the tenth, a rolling forecast reviewed together, and one page the board can read without a translator. You always know the runway, the trend, and the next decision — no surprises, no jargon.",
        },
        {
            title: "Handoff or scale",
            description:
                "Fractional is a stage, not a subscription. When the company outgrows us, we write the job description, interview the candidates, and hand your full-time CFO a function that already works. Six of our clients' CFOs got the job that way.",
        },
    ],
}

export const about = {
    headline: "An operator who's sat in the seat.",
    photo: photo(
        "portrait-okafor",
        864,
        1152,
        "Maya Okafor in a forest-green blazer at a clean desk with a closed notebook and coffee, bookshelf softly behind",
    ),
    paragraphs: [
        "Maya Okafor was the first finance hire and eventually CFO at two venture-backed companies — one that exited well, one that taught harder lessons — before opening Clearline in 2018. Both educations show up in the work: the discipline of investor-grade reporting, and the scar tissue of knowing exactly which corners cannot be cut.",
        "The practice's conviction is that founders don't need more numbers; they need the three that matter, on time, with a straight answer attached. Every engagement runs on a monthly close that actually closes, a forecast you steer by rather than admire, and pricing math done before the hiring math.",
        "It's deliberately a small practice: Maya leads every engagement, with a senior analyst behind her. Five or six clients at a time, which is why the close lands by the tenth, the Monday cash email always arrives — and why the calendar usually books a month or two ahead.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "CPA, Colorado",
        "CFO of two venture-backed companies, seed through exit",
        "40+ engagements since 2018",
        "Guest lecturer in entrepreneurial finance, Leeds School of Business",
    ],
}

export const faq = [
    {
        question: "What does a fractional CFO cost?",
        answer: "Retainers run $4,500 to $9,000 a month depending on cadence and complexity — roughly a fifth of a full-time CFO with equity. Interim work is quoted monthly, project work flat. You'll have a written number after the discovery call, before any commitment, and the first-month diagnostic is fixed-scope so you're never buying an open meter.",
    },
    {
        question: "We have a bookkeeper. Isn't that enough?",
        answer: "Keep them — we're not that. A bookkeeper records what happened; a controller makes sure it's recorded right; a CFO decides what should happen next. If what you need is cleaner books, we'll tell you so on the discovery call and recommend someone good. We take engagements where judgment is the missing piece, not data entry.",
    },
    {
        question: "How much of your time do we actually get?",
        answer: "One to two days a week on retainer, with the close, the forecast, and a standing weekly call as the fixed spine. Board weeks and fundraise sprints get more; quiet months get less. You're buying outcomes on a rhythm, not hours on a meter — and the Monday cash email arrives every Monday either way.",
    },
    {
        question: "When should we hire a full-time CFO instead?",
        answer: "Usually somewhere past $15–20M in revenue, a serious raise on the calendar, or a finance team big enough to need a daily leader. When you get there, we'll say so first — writing the job description and interviewing your candidates is part of the engagement. Working ourselves out of the job is the exit we plan for.",
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
 * The practice books two kinds of meeting online: the free discovery call
 * and the paid two-hour financial review. One calendar — Maya takes every
 * first meeting herself; close week stays dark on purpose.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "discovery-call",
            name: "Discovery call",
            durationMinutes: 30,
            description:
                "A free call about where the numbers stand — and an honest answer about whether you need us.",
        },
        {
            typeId: "financial-review",
            name: "Financial review session",
            durationMinutes: 120,
            description:
                "Two working hours in your books: margins, runway, and the three numbers that matter, with a written summary the next day.",
        },
    ],
    providers: [
        {
            providerId: "maya-okafor",
            name: "Maya Okafor",
            windows: [
                { day: 2, start: 9 * 60, end: 13 * 60 },
                { day: 3, start: 13 * 60, end: 17 * 60 },
                { day: 4, start: 9 * 60, end: 13 * 60 },
                { day: 5, start: 9 * 60, end: 12 * 60 },
            ],
        },
    ],
}

/** The /contact page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Put a first meeting on the calendar",
    intro: "Book a free discovery call or a two-hour financial review directly — pick a time and you'll get a confirmation with a one-click reschedule link. Prefer to write first? The form below reaches Maya.",
    /** The new/returning select's practice voice (the widget's statusLabels). */
    statusLabels: { new: "New to the practice", returning: "Current client" },
}

export const contact = {
    headline: "Tell us where the numbers stand.",
    body: "A few lines about the company — what you sell, roughly the revenue range, and what's keeping you up at night — and you'll have a reply within two business days. Honest numbers get honest answers.",
    confirmation:
        "Thank you — your note is in. Every inquiry gets a reply within two business days, usually sooner.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "company",
            label: "Company & what you sell",
            placeholder: "SaaS, e-commerce, a workshop, a clinic …",
        },
        { name: "revenue", label: "Revenue range", placeholder: "$1–5M, $5–15M, pre-revenue …" },
        {
            name: "need",
            label: "What kind of help",
            placeholder: "Fractional, interim, a raise, not sure yet …",
        },
        {
            name: "timeline",
            label: "When do you need it",
            placeholder: "Yesterday, next quarter, exploring …",
        },
        {
            name: "message",
            label: "What's keeping you up",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
