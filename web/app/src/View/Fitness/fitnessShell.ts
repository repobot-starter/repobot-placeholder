import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { gym } from "./content"

/**
 * The strength-club pack's shared chrome (pill-links nav + simple footer),
 * split from `fitnessLanding.ts` so manifest-driven pages can wear it
 * without pulling the pack's full page content into their chunk.
 *
 * The nav is the pill-links cluster — the wordmark left, links centered in
 * a bordered cluster that follows chalk's tight control radius (so it
 * reads as a squared badge rack, not a soft pill), the free-week CTA
 * right. Picked in the nav-variety audit: the review called out the old
 * split bar as "the same centered / squared / inset nav" it shared with
 * the rest of the shelf, and the clustered links read like gym wristbands
 * — chrome with some athletic identity. Links are the pack's canonical
 * trio (Schedule / Coaches / Pricing)
 * plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/fitness`
 * preview route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Schedule", path: "/schedule" },
    { label: "Coaches", path: "/coaches" },
    { label: "Pricing", path: "/pricing" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/schedule", "/coaches", "/pricing", "/trial"]

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
 * `currentPath` is site-relative ("" for home, "/schedule", "/trial", …).
 */
export function fitnessShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "pill-links",
            content: {
                logo: { name: gym.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Free week", href: `${basePath}/trial` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${gym.name} · ${gym.tagline} · ${gym.city}`,
                note: `© ${new Date().getFullYear()} ${gym.name}`,
            },
        },
    }
}
