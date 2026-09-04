import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { business, landingCopy } from "./content"

/**
 * The recurring-services pack's shared chrome (pill-links nav + simple
 * footer), split from `servicesRecurringLanding.ts` so manifest-driven
 * pages can wear it without pulling the pack's full page content into
 * their chunk — the photography pack's pattern.
 *
 * The nav's link list is the pack's canonical pair (Plans & pricing /
 * About) plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/cleaning`
 * preview route those paths don't exist under the prefix.
 *
 * The nav CTA is the booking ask; the footer carries the trust line —
 * chrome a home-services site should never render without.
 *
 * Variant: `pill-links` — the centered bordered link cluster. The friendly,
 * casual treatment suits a neighborly home-cleaning brand, and the pill
 * follows the register's control radius so it stays soft. (Nav-variety
 * audit: was the inset `inline` card, like the rest of the services
 * family; the lawncare and pest remixes re-pin `inline` and `centered`
 * via their catalog theme blocks.)
 */

const CANONICAL_LINKS = [
    { label: "Plans & pricing", path: "/plans" },
    { label: "About", path: "/about" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/book" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/plans", "/about", "/book"]

function siteLinks(basePath: string): { label: string; path: string }[] {
    if (basePath !== "") {
        return [...CANONICAL_LINKS]
    }
    const extras = projectManifest.marketing.pages
        .filter((page) => !PACK_OWNED_PATHS.includes(page.path))
        .map((page) => ({ label: page.title, path: page.path }))
    return [...CANONICAL_LINKS, ...extras]
}

/**
 * The shell for one page: the current page drops out of its own links.
 * `currentPath` is site-relative ("" for home, "/plans", …).
 */
export function servicesRecurringShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "pill-links",
            content: {
                logo: { name: business.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${business.name} · ${business.location} · ${business.license}`,
                note: `© ${new Date().getFullYear()} ${business.name}`,
            },
        },
    }
}
