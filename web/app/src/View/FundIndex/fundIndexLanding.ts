import type { LandingConfig, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    companies,
    contact,
    disclosures,
    firm,
    focusAreas,
    home,
    log,
    logPage,
    portfolioPage,
    principles,
    statedMetrics,
    team,
    teamPage,
    type Company,
} from "./content"
import {
    companyBadge,
    countsLine,
    exitsCount,
    indexNumber,
    investmentYear,
    newestFirst,
    portfolioCount,
} from "./portfolio"
import { fundIndexShell } from "./fundIndexShell"

/**
 * The fund-index pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders only
 * map it into sections, and the portfolio arithmetic (`portfolio.ts`)
 * supplies every count, badge, sort — and every index numeral: the
 * 001/002/003 eyebrows over the focus areas are computed from array
 * position, never typed.
 *
 * The register is mono-utility in its dark reading, worn ACHROMATIC: the
 * style overrides pin the accent to the register's own text ink, so the
 * page reads pure paper-on-ink in dark and ink-on-paper in light — near
 * true-black ground (the blackout pin), monospace display type, graph-paper hairlines,
 * no color anywhere. The home page is the pack's signature — the fund as a
 * numbered index: focus areas 001–006, the underwriting identity rendered
 * at display scale, a metrics band mixing stated figures with computed
 * counts, three numbered principles.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /portfolio, /team, …) and "/fund-index" on the preview route — same
 * pages, both wirings.
 *
 * Every section carries a stable `id`: FundIndexPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections and
 * the ids are what the document's skeleton binds to. The pack's catalog
 * maps the routes (`landing.routes` in catalog.json).
 */

/**
 * Mono-utility worn achromatic (the dj pack's move): accent resolves to
 * the text ink, its washes to a quiet ink mix, and CTA labels to the page
 * ground — the green never reaches the page. Rides every page's document
 * style so the platform's Look panel sees the same surface.
 */
export const FUND_INDEX_STYLE_OVERRIDES: Record<string, string> = {
    "--marketing-color-accent": "var(--marketing-color-text)",
    "--marketing-color-accentSoft": "color-mix(in srgb, var(--marketing-color-text) 14%, transparent)",
    "--marketing-color-onAccent": "var(--marketing-color-pageBg)",
}

// The shared chrome lives in fundIndexShell.ts (manifest pages wear it
// too); this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/portfolio" | "/team" | "/log" | "/contact" | "/disclosures",
): MarketingShellConfig {
    return fundIndexShell(basePath, currentPath)
}

/** One company as a spec-sheet row: no media, the type is the card. */
const companyItem = (company: Company, now: Date) => ({
    title: company.name,
    description: company.oneLiner,
    eyebrow: investmentYear(company),
    tags: company.sectors,
    url: company.url,
    badge: companyBadge(company, now),
})

export function homeLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fund-index"], overrides: FUND_INDEX_STYLE_OVERRIDES },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The index opens bare: mono display type, no accent word
                // — the spec-sheet register reads cleaner unadorned.
                variant: "statement",
                content: {
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "The portfolio", href: `${basePath}/portfolio` },
                    secondaryCta: { label: home.deckAsk.ctaLabel, href: `${basePath}/contact` },
                },
            },
            {
                id: "focus",
                type: "showcase",
                // The numbered index: 001–006 as computed eyebrows over the
                // sector vignettes — reorder the content array and every
                // numeral follows.
                variant: "card-grid",
                content: {
                    kicker: home.focusKicker,
                    items: focusAreas.map((area, position) => ({
                        eyebrow: indexNumber(position),
                        title: area.title,
                        description: area.body,
                    })),
                },
            },
            {
                id: "formula",
                type: "testimonials",
                // The underwriting identity at display scale — the rendered
                // formula as a typographic set piece (the quantitative
                // school's one flourish).
                variant: "single-featured",
                content: {
                    quotes: [{ quote: home.formula.expression, author: home.formula.caption }],
                },
            },
            {
                id: "metrics",
                type: "social-proof",
                // The metrics band: stated figures ride from content (funds
                // state AUM however they like); the counted ones are
                // arithmetic over the portfolio list, never hand-written.
                variant: "metrics-row",
                content: {
                    label: home.metricsKicker,
                    metrics: [
                        ...statedMetrics,
                        { value: `${portfolioCount(companies)}`, label: "portfolio companies" },
                        { value: `${exitsCount(companies)}`, label: "exits" },
                    ],
                },
            },
            {
                id: "principles",
                type: "steps",
                // Three numbered principles down the accent rail — the
                // numerals computed by position, like everything else here.
                variant: "timeline",
                content: {
                    kicker: home.principlesKicker,
                    steps: principles.map((principle, position) => ({
                        title: `${indexNumber(position, 2)} — ${principle.title}`,
                        description: principle.body,
                    })),
                },
            },
            {
                id: "deck-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: home.deckAsk.title,
                    body: home.deckAsk.body,
                    cta: { label: home.deckAsk.ctaLabel, href: `${basePath}/contact` },
                },
            },
        ],
    }
}

export function portfolioLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fund-index"], overrides: FUND_INDEX_STYLE_OVERRIDES },
        shell: shell(basePath, "/portfolio"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: portfolioPage.headline,
                    accent: "none",
                    subheadline: `${countsLine(companies)}. ${portfolioPage.note}`,
                },
            },
            {
                id: "companies",
                type: "showcase",
                // The spec sheet: company / one-liner / year / sector chips
                // / computed status pill — filter chips derived from the
                // tags, no media anywhere.
                variant: "filterable-grid",
                content: {
                    allLabel: portfolioPage.allLabel,
                    items: companies.map((company) => companyItem(company, now)),
                },
            },
        ],
    }
}

export function teamLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fund-index"], overrides: FUND_INDEX_STYLE_OVERRIDES },
        shell: shell(basePath, "/team"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: teamPage.headline,
                    accent: "none",
                    subheadline: teamPage.note,
                },
            },
            {
                id: "people",
                type: "team",
                // The compact list: names, roles, technical briefs — no
                // headshots in this register.
                variant: "list",
                content: {
                    members: team.map((member) => ({
                        name: member.name,
                        role: member.role,
                        bio: member.bio,
                    })),
                },
            },
        ],
    }
}

export function logLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fund-index"], overrides: FUND_INDEX_STYLE_OVERRIDES },
        shell: shell(basePath, "/log"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: logPage.headline,
                    accent: "none",
                    subheadline: logPage.note,
                },
            },
            {
                id: "entries",
                type: "blog-list",
                // Newest-first is computed from the dates, never hand-kept.
                variant: "list",
                content: {
                    posts: newestFirst(log).map((entry) => ({
                        title: entry.title,
                        date: entry.date,
                        excerpt: entry.excerpt,
                        href: entry.href,
                    })),
                },
            },
        ],
    }
}

export function contactLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fund-index"], overrides: FUND_INDEX_STYLE_OVERRIDES },
        shell: shell(basePath, "/contact"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: contact.headline,
                    accent: "none",
                    subheadline: contact.body,
                },
            },
            {
                id: "channels",
                type: "lead-form",
                // The deck ask as direct channels: the email is
                // deliberately plain text (no mailto:), selectable for
                // whatever mail client the founder actually uses.
                variant: "contact-block",
                content: {
                    kicker: contact.kicker,
                    title: `Reach ${firm.name}`,
                    channels: [
                        { label: "Decks", value: firm.email },
                        { label: "Office", value: firm.location },
                    ],
                },
            },
        ],
    }
}

export function disclosuresLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fund-index"], overrides: FUND_INDEX_STYLE_OVERRIDES },
        shell: shell(basePath, "/disclosures"),
        sections: [
            {
                id: "disclosures",
                type: "rich-prose",
                // The vertical's signature afterthought, typeset like it
                // matters: compliance prose on the same phosphor ground.
                variant: "narrow",
                content: {
                    kicker: disclosures.kicker,
                    title: disclosures.headline,
                    paragraphs: [...disclosures.paragraphs, `Last updated ${disclosures.updated}.`],
                },
            },
        ],
    }
}
