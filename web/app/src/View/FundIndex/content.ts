/**
 * The fund-index pack's single content file: the firm, the numbered focus
 * areas, the principles, the metrics, the portfolio, the team, the log,
 * and the disclosures. Everything the site renders comes from here — edit
 * this file (not the page components) to make the site yours. There is no
 * backend and no CMS.
 *
 * The register is an index: focus areas and principles are stored as plain
 * ordered arrays, and their 001/002/003 numerals are computed from array
 * position at render time (`portfolio.ts` `indexNumber`) — reorder the
 * array and the numbering follows. Portfolio facts are data (`sectors`,
 * `investedAt`, `status`); the counts, exits, sector filter chips, status
 * pills, and the "New" badge are computed per render. Metrics the fund
 * states however it likes (AUM, fund number) live here as strings; metrics
 * that can be counted are never written by hand.
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
    name: "Ordinal Capital",
    tagline: "Complex sectors",
    location: "Boston, Massachusetts",
    email: "deck@ordinal.example",
    founded: 2020,
}

export const home = {
    headline: "Capital for sectors that resist simplification.",
    subheadline:
        "Seed and Series A checks into compute, energy, biology, space, autonomy, and risk — the markets where the diligence is the moat.",
    focusKicker: "Focus areas",
    principlesKicker: "Principles",
    metricsKicker: "The fund, in numbers",
    deckAsk: {
        title: "Working on something with a hard part?",
        body: "Send the deck. The harder your sector is to underwrite, the more interested we are.",
        ctaLabel: "Send your deck",
    },
    /**
     * The rendered formula — the index register's one set piece, typeset
     * at display scale as a typographic design element (the 1Sharpe move).
     */
    formula: {
        expression: "EV = p(it works) × value(if it works) − cost(finding out)",
        caption: "The underwriting identity — every check prices all three terms.",
    },
}

/** Ordered: the 001/002/003 numerals are computed from position. */
export const focusAreas: FocusArea[] = [
    {
        title: "Compute",
        body: "The substrate is the bottleneck again: advanced packaging, photonic interconnect, and the tooling that keeps fabs yielding. We underwrite physics first, roadmaps second.",
    },
    {
        title: "Energy",
        body: "Load growth broke the planning models. Storage arbitrage, grid market software, and next-generation generation — priced against interconnection reality, not policy hope.",
    },
    {
        title: "Biology",
        body: "Biology is becoming an engineering discipline with unit economics. Computational design, biomanufacturing scale-up, and the instruments that make wet labs legible to software.",
    },
    {
        title: "Space",
        body: "Launch got cheap; everything above it is still artisanal. Orbital logistics, earth observation with a real buyer, and the ground segment nobody glamorizes.",
    },
    {
        title: "Autonomy",
        body: "Machines that operate where people shouldn't have to: contested environments, deep water, high voltage. Reliability engineering as the product, not a feature.",
    },
    {
        title: "Risk",
        body: "Catastrophe is repricing faster than the instruments that carry it. Underwriting software, parametric structures, and data vendors the reinsurance stack can't unsee.",
    },
]

/** Ordered: the 01/02/03 numerals are computed from position. */
export const principles: Principle[] = [
    {
        title: "Price complexity, don't avoid it",
        body: "Hard sectors scare off exactly the capital that would compress returns. We do the six months of diligence the market won't, and we get paid for it in entry price.",
    },
    {
        title: "The bottleneck is the business",
        body: "In every complex sector one constraint governs the system — the interconnect, the interconnection queue, the assay, the launch slot. We back the company that owns it.",
    },
    {
        title: "Hold through the valley",
        body: "Complex companies compound on engineering time, not news cycles. We reserve deep, follow on through the unfashionable middle, and let the curve do the arguing.",
    },
]

/** Stated metrics live here as strings — funds state AUM however they like.
 * Counted metrics (companies, exits, sectors) are computed, never listed. */
export const statedMetrics = [
    { value: "$310M", label: "assets under management" },
    { value: "Fund III", label: "currently deploying" },
    { value: "$1.5–6M", label: "first check" },
]

export const portfolioPage = {
    headline: "The index, in production.",
    note: "Every company owns a bottleneck in its sector.",
    allLabel: "All sectors",
}

export const companies: Company[] = [
    {
        name: "Interposer",
        oneLiner: "Advanced packaging design tools for the chiplet era.",
        sectors: ["Compute"],
        investedAt: "2026-07-02",
        status: "active",
        url: "https://interposer.example",
    },
    {
        name: "Lumen Fabric",
        oneLiner: "Photonic interconnect for rack-scale AI clusters.",
        sectors: ["Compute"],
        investedAt: "2026-02-17",
        status: "active",
        url: "https://lumenfabric.example",
    },
    {
        name: "Queueclear",
        oneLiner: "Interconnection studies as software, not consultants.",
        sectors: ["Energy"],
        investedAt: "2025-11-04",
        status: "active",
        url: "https://queueclear.example",
    },
    {
        name: "Nightload",
        oneLiner: "Storage dispatch optimization for merchant batteries.",
        sectors: ["Energy"],
        investedAt: "2025-05-21",
        status: "active",
        url: "https://nightload.example",
    },
    {
        name: "Plasmid Works",
        oneLiner: "Biomanufacturing scale-up runs designed like chip tape-outs.",
        sectors: ["Biology"],
        investedAt: "2025-01-13",
        status: "active",
        url: "https://plasmidworks.example",
    },
    {
        name: "Assayline",
        oneLiner: "Lab instruments that stream structured data, not PDFs.",
        sectors: ["Biology"],
        investedAt: "2024-08-26",
        status: "acquired",
        url: "https://assayline.example",
    },
    {
        name: "Apogee Ground",
        oneLiner: "Ground-segment automation for smallsat constellations.",
        sectors: ["Space"],
        investedAt: "2024-04-09",
        status: "active",
        url: "https://apogeeground.example",
    },
    {
        name: "Downmass",
        oneLiner: "Orbital return logistics for in-space manufacturing.",
        sectors: ["Space"],
        investedAt: "2023-10-30",
        status: "active",
        url: "https://downmass.example",
    },
    {
        name: "Tidewalker",
        oneLiner: "Autonomous inspection for offshore energy infrastructure.",
        sectors: ["Autonomy", "Energy"],
        investedAt: "2023-06-14",
        status: "active",
        url: "https://tidewalker.example",
    },
    {
        name: "Linewatch",
        oneLiner: "Live-line robotics for transmission maintenance.",
        sectors: ["Autonomy", "Energy"],
        investedAt: "2022-12-05",
        status: "public",
        url: "https://linewatch.example",
    },
    {
        name: "Stormbasis",
        oneLiner: "Parametric catastrophe structures priced from sensor data.",
        sectors: ["Risk"],
        investedAt: "2022-07-19",
        status: "active",
        url: "https://stormbasis.example",
    },
    {
        name: "Cedent",
        oneLiner: "Underwriting workbench for specialty reinsurance.",
        sectors: ["Risk"],
        investedAt: "2021-09-08",
        status: "acquired",
        url: "https://cedent.example",
    },
]

export const teamPage = {
    headline: "The underwriters.",
    note: "Small by design: every partner carries a technical brief and a spreadsheet.",
}

export const team: TeamMember[] = [
    {
        name: "Ilse Vandermeer",
        role: "Managing partner",
        bio: "Semiconductor process engineer turned allocator: eight years in yield engineering, six on a sovereign fund's hard-tech desk. Wrote the firm's underwriting identity on a whiteboard in 2020 and has been arguing with it since. Leads compute and energy.",
    },
    {
        name: "Dmitri Okafor",
        role: "Partner",
        bio: "Ran flight software for two smallsat programs, then priced launch insurance long enough to know where the loss tables lie. Leads space and autonomy, and keeps the firm's reliability-engineering bar where founders can't talk it down.",
    },
    {
        name: "Priya Ramanathan",
        role: "Partner",
        bio: "Computational biologist with a reinsurance detour — built cat models at a Bermuda syndicate between a PhD and a biomanufacturing startup's founding team. Leads biology and risk, the two sectors where the tails are fattest.",
    },
    {
        name: "August Lindqvist",
        role: "Head of research",
        bio: "The firm's diligence engine: a former national-lab staff scientist who turns six-month technical questions into two-page memos with error bars. Every check the fund writes carries his signature on the physics.",
    },
]

export const logPage = {
    headline: "The log.",
    note: "Research notes and position papers, appended as we learn. Entries are dated; the order computes itself.",
}

export const log: LogEntry[] = [
    {
        title: "Interconnection is the new interconnect",
        date: "2026-06-30",
        excerpt:
            "The same queueing pathology governs chip packaging and grid interconnection: a shared substrate, a backlog nobody owns, and fortunes for whoever meters it.",
        href: "https://ordinal.example/log/interconnection",
    },
    {
        title: "Pricing the cost of finding out",
        date: "2026-03-12",
        excerpt:
            "The third term of the underwriting identity is the one venture ignores: what it costs to learn whether the thing works. In complex sectors, that term dominates.",
        href: "https://ordinal.example/log/cost-of-finding-out",
    },
    {
        title: "Reliability curves beat demo days",
        date: "2025-09-24",
        excerpt:
            "A field-hours chart with a narrowing confidence band is the only pitch slide autonomy companies need. Most bring renders instead.",
        href: "https://ordinal.example/log/reliability-curves",
    },
    {
        title: "Fund II letter: the unfashionable middle",
        date: "2025-02-06",
        excerpt:
            "Three of our companies spent the year between milestones the market pays for. All three compounded on engineering time. The letter, published in full.",
        href: "https://ordinal.example/log/fund-ii-letter",
    },
    {
        title: "Catastrophe is a data business now",
        date: "2024-07-17",
        excerpt:
            "Sensor-priced parametrics settle in days, not adjuster-years. The reinsurance stack knows; the software hasn't caught up. A position paper on 006.",
        href: "https://ordinal.example/log/catastrophe-data",
    },
]

export const contact = {
    kicker: "Contact",
    headline: "Send the deck.",
    body: "One line on what you're building, one on the hard part, and the deck. A partner reads everything in our sectors within a week; if it prices, we do the work.",
}

export const disclosures = {
    kicker: "Disclosures",
    headline: "The fine print, set in full.",
    updated: "2026-06-15",
    paragraphs: [
        "Ordinal Capital Management LLC is an exempt reporting adviser. Nothing on this site is an offer to sell, or a solicitation of an offer to buy, an interest in any fund managed by Ordinal Capital, nor investment, legal, or tax advice. Any offering of fund interests is made only through a fund's confidential private placement memorandum and related subscription documents, to investors meeting applicable eligibility requirements.",
        "Portfolio companies identified on this site were selected to illustrate the firm's focus areas, not its performance, and do not represent all investments made by Ordinal funds. It should not be assumed that any investment identified was or will be profitable, or that future investments will be comparable. A complete list of investments is available on request, subject to confidentiality obligations.",
        "Company counts, exit counts, sector groupings, and index numerals on this site are computed from the underlying content at the time each page renders and are unaudited. Stated figures such as assets under management are approximations as of the last update date below and may change without notice. Research notes and log entries reflect the opinions of the firm's partners as of their publication dates and may prove wrong.",
        "Venture capital investments involve substantial risk, including illiquidity, concentration, and the total loss of capital. The sectors this firm invests in carry additional technical, regulatory, and market risks. Past performance is not indicative of future results, and no representation is made that any fund will achieve its objectives.",
    ],
}
