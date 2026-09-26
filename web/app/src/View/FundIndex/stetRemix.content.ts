/**
 * The fund-index-stet remix's content seed (packs/README.md "Derived
 * templates"): a structural twin of `content.ts`, copied over it when the
 * derived template composes. Stet is a two-partner pre-seed fund in New
 * York, and its home is one line: `home.line` switches the fund-index
 * builders to the one-line home (the headline alone on the first screen,
 * the portfolio as a run of names, the pitch ask as one closing line).
 * The inner pages — the portfolio spec sheet, the team, the letters, the
 * form, the fine print — are the base pack's, computed the same way.
 *
 * The register is `galleyproof` (`proofmark`): there is no photography; the
 * type is the image.
 */

export interface FocusArea {
    /** The area's name, e.g. "Compute" — the numeral is computed from order. */
    title: string
    /** The vignette: two or three technical sentences on the opportunity. */
    body: string
}

export interface Principle {
    title: string
    body: string
}

export interface Company {
    name: string
    oneLiner: string
    sectors: string[]
    /** ISO date of the investment — drives the "New" badge. */
    investedAt: string
    status: "active" | "acquired" | "public"
    url?: string
}

export interface TeamMember {
    name: string
    role: string
    bio: string
}

export interface LogEntry {
    title: string
    /** ISO date; the log renders newest-first, computed. */
    date: string
    excerpt: string
    href: string
}

export const firm = {
    name: "Stet",
    tagline: "Pre-seed",
    location: "New York",
    email: "paragraph@stet.example",
    founded: 2021,
}

export const home = {
    headline: "Consensus is a lagging indicator.",
    subheadline:
        "Stet is a $60M pre-seed fund. We write first checks of $250K to $1M, decide inside a week, and back founders before the room agrees with them.",
    focusKicker: "What we back",
    principlesKicker: "How we decide",
    metricsKicker: "Fund II",
    deckAsk: {
        title: "Pitch us in one paragraph.",
        body: "paragraph@stet.example, or the form. A partner answers every one within a week — yes or no, and why.",
        ctaLabel: "Write the paragraph",
    },
    /**
     * The rendered formula — the index register's one set piece, typeset
     * at display scale as a typographic design element (the 1Sharpe move).
     */
    formula: {
        expression: "edge = conviction − agreement",
        caption: "The only arithmetic we do before a first meeting.",
    },
    /** The one-line home (fundIndexLanding.ts `FundIndexLine`). */
    line: {
        badge: "Pre-seed. First checks $250K–$1M. New York, since 2021.",
        portfolioLabel: "Backed, 2021–2026",
    },
}

/** Ordered: the 001/002/003 numerals are computed from position. */
export const focusAreas: FocusArea[] = [
    {
        title: "Infrastructure",
        body: "The unglamorous layer: billing, identity, the queue in front of the model. Founders who have carried the pager and hated it, building what they wished they could have bought.",
    },
    {
        title: "Regulated markets",
        body: "Insurance, lending, clinical operations — markets where the licence is the moat and the incumbents move at the speed of their compliance calendar. We like the paperwork.",
    },
    {
        title: "Trades",
        body: "Software for the people who build, fix and deliver things: electricians, freight brokers, commercial kitchens. They pay for tools that pay back inside a month.",
    },
    {
        title: "Money",
        body: "Treasury, payroll and the plumbing under both. The next decade of fintech is boring on purpose, and it compounds quietly for the companies that own a ledger.",
    },
]

/** Ordered: the 01/02/03 numerals are computed from position. */
export const principles: Principle[] = [
    {
        title: "The first check decides",
        body: "At pre-seed the price is set by whoever believes first. We would rather be early and alone than late and in good company; the room catches up, or it doesn't.",
    },
    {
        title: "A week, yes or no",
        body: "Founders shouldn't spend a quarter on us. One call, one working session, an answer inside seven days — and a reason with every no.",
    },
    {
        title: "Stay out of the way",
        body: "We take no board seats at pre-seed. We answer the phone, make two introductions a month, and write the second check when the numbers ask for it.",
    },
]

/** Stated metrics live here as strings — funds state AUM however they like.
 * Counted metrics (companies, exits, sectors) are computed, never listed. */
export const statedMetrics = [
    { value: "$60M", label: "Fund II" },
    { value: "$250K–$1M", label: "first check" },
    { value: "7 days", label: "to a yes or a no" },
]

export const portfolioPage = {
    headline: "Backed early.",
    note: "Every one of these was a pass somewhere else first.",
    allLabel: "Everything",
}

export const companies: Company[] = [
    {
        name: "Halyard",
        oneLiner: "Billing for usage-priced software, reconciled to the cent.",
        sectors: ["Infrastructure", "Money"],
        investedAt: "2026-06-18",
        status: "active",
        url: "https://halyard.example",
    },
    {
        name: "Pellucid",
        oneLiner: "Claims review for specialty insurers, audited line by line.",
        sectors: ["Regulated markets"],
        investedAt: "2026-01-27",
        status: "active",
        url: "https://pellucid.example",
    },
    {
        name: "Understory",
        oneLiner: "Job costing for commercial electricians, from the bid to the punch list.",
        sectors: ["Trades"],
        investedAt: "2025-09-09",
        status: "active",
        url: "https://understory.example",
    },
    {
        name: "Offcut",
        oneLiner: "Surplus building materials, resold within twenty miles of the site.",
        sectors: ["Trades"],
        investedAt: "2025-04-14",
        status: "active",
        url: "https://offcut.example",
    },
    {
        name: "Tallow",
        oneLiner: "Payroll for restaurant groups with tipped staff in five states.",
        sectors: ["Money", "Trades"],
        investedAt: "2024-11-02",
        status: "active",
        url: "https://tallow.example",
    },
    {
        name: "Sumpter",
        oneLiner: "An on-call rota that learns who actually fixes what.",
        sectors: ["Infrastructure"],
        investedAt: "2024-03-21",
        status: "acquired",
        url: "https://sumpter.example",
    },
    {
        name: "Fieldnote",
        oneLiner: "Site monitoring for clinical trials run outside hospitals.",
        sectors: ["Regulated markets"],
        investedAt: "2023-08-30",
        status: "active",
        url: "https://fieldnote.example",
    },
    {
        name: "Kiln Street",
        oneLiner: "Treasury for companies that hold inventory, not just cash.",
        sectors: ["Money"],
        investedAt: "2023-02-06",
        status: "active",
        url: "https://kilnstreet.example",
    },
    {
        name: "Marginalia",
        oneLiner: "Document diffing for contracts that change after signature.",
        sectors: ["Infrastructure", "Regulated markets"],
        investedAt: "2022-06-15",
        status: "acquired",
        url: "https://marginalia.example",
    },
    {
        name: "Quire",
        oneLiner: "Licensing for independent insurance agents, in all fifty states.",
        sectors: ["Regulated markets"],
        investedAt: "2021-10-11",
        status: "active",
        url: "https://quire.example",
    },
]

export const teamPage = {
    headline: "Two partners and a principal.",
    note: "Every paragraph that comes in is read by one of the three of us.",
}

export const team: TeamMember[] = [
    {
        name: "Noor Castellanos",
        role: "Founding partner",
        bio: "Ran payments at a lending startup through two regulators and one near-death, then wrote Stet's first check in 2021 from a kitchen table in Carroll Gardens. Leads money and regulated markets.",
    },
    {
        name: "Teodor Whitlock",
        role: "Partner",
        bio: "Twelve years on call at infrastructure companies, the last four as the engineer founders phoned before they phoned their board. Leads infrastructure; the fund's technical diligence is a two-hour working session with him.",
    },
    {
        name: "Adaeze Morrow",
        role: "Principal",
        bio: "Came up through her family's electrical contracting firm in Newark before running operations at a construction-software company. Leads trades, sources from job sites rather than demo days, and keeps every diligence note to one page.",
    },
]

export const logPage = {
    headline: "Letters.",
    note: "Written when there is something to say. Dated; the order keeps itself.",
}

export const log: LogEntry[] = [
    {
        title: "Fund II, first close",
        date: "2026-05-12",
        excerpt:
            "Sixty million from forty-one limited partners, and no change to the check size. Why we kept the fund small when we could have doubled it.",
        href: "https://stet.example/letters/fund-ii-first-close",
    },
    {
        title: "The one-paragraph pitch",
        date: "2025-10-03",
        excerpt:
            "What a paragraph shows that a forty-slide deck hides: whether the founder knows which sentence matters.",
        href: "https://stet.example/letters/one-paragraph",
    },
    {
        title: "Against the warm introduction",
        date: "2025-02-20",
        excerpt:
            "Two thirds of the portfolio came in cold. A warm introduction measures the network a founder already has, and that is the one thing we never needed them to bring.",
        href: "https://stet.example/letters/warm-introductions",
    },
    {
        title: "Why we don't take board seats",
        date: "2024-06-07",
        excerpt:
            "At pre-seed a board is a meeting the founder prepares for instead of shipping. Our reasoning, and the one exception we make.",
        href: "https://stet.example/letters/board-seats",
    },
]

export const contact = {
    kicker: "Contact",
    /** The email channel's label on the form (fundIndexLanding.ts reads it structurally). */
    emailLabel: "Paragraphs",
    headline: "One paragraph.",
    body: "What you are building, why now, and why you — five sentences, maybe six. A partner reads every one and answers within a week, yes or no, with a reason.",
    /** The inquiry form's sent state — same register: terse, factual. */
    confirmation: "Received. A partner reads it this week and writes back either way.",
    /**
     * The deck ask as a form (the managed forms pipeline; the plain-text
     * email stays alongside as a channel). Fields hold the register's
     * discipline: the paragraph, a link if there is one, nothing else.
     */
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "company", label: "Company", required: true },
        { name: "deck", label: "Deck link, if you have one", placeholder: "https://…" },
        {
            name: "message",
            label: "The paragraph",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}

export const disclosures = {
    kicker: "Disclosures",
    headline: "The fine print.",
    updated: "2026-08-31",
    paragraphs: [
        "Stet Capital Management LLC is an exempt reporting adviser. Nothing on this site is an offer to sell, or a solicitation of an offer to buy, an interest in any fund managed by Stet, nor investment, legal, or tax advice. Any offering of fund interests is made only through a fund's confidential private placement memorandum and related subscription documents, to investors meeting applicable eligibility requirements.",
        "Portfolio companies named on this site are listed to show the kinds of companies the firm backs, not its performance, and do not represent all investments made by Stet funds. It should not be assumed that any investment named was or will be profitable, or that future investments will be comparable. A complete list of investments is available on request, subject to confidentiality obligations.",
        "Company counts, exit counts and sector groupings on this site are computed from the underlying content at the time each page renders and are unaudited. Stated figures such as fund size are approximations as of the last update date below and may change without notice. Letters reflect the opinions of the firm's partners as of their publication dates and may prove wrong.",
        "Venture capital investments involve substantial risk, including illiquidity, concentration, and the total loss of capital. Pre-seed companies carry more of each. Past performance is not indicative of future results, and no representation is made that any fund will achieve its objectives.",
    ],
}
