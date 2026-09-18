import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { couple, landingCopy } from "./content"

/**
 * The vows pack's shared chrome (letterhead split nav + simple footer),
 * split from `vowsLanding.ts` so manifest-driven pages can wear it without
 * pulling the pack's full page content into their chunk — the estate
 * pack's pattern, on the heirloom register's stationery lean.
 *
 * The nav's link list is the pack's canonical set (Our story / Schedule /
 * Travel / Wedding party) plus any pages added through the platform's
 * Pages panel (`repobot.project.json` `marketing.pages`). Manifest extras
 * only join when the pack owns the site (`basePath === ""`); on the
 * `/vows` preview route those paths don't exist under the prefix.
 *
 * The nav CTA is the one ask a wedding site has — the RSVP. The footer
 * carries the couple, the date, and the hashtag: the lines a guest
 * screenshots.
 */

const CANONICAL_LINKS = [
    { label: "Our story", path: "/story" },
    { label: "Schedule", path: "/schedule" },
    { label: "Travel", path: "/travel" },
    { label: "Wedding party", path: "/party" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/rsvp" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/story", "/schedule", "/travel", "/party", "/rsvp"]

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
 * `currentPath` is site-relative ("" for home, "/story", …).
 */
export function vowsShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "split",
            content: {
                logo: { name: couple.names },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${couple.partnerA} & ${couple.partnerB} · ${couple.weddingDateLabel} · ${couple.hashtag}`,
                note: `With love, ${couple.names}`,
            },
        },
    }
}
