import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { landingCopy, studio } from "./content"

/**
 * The interiors pack's shared chrome (centered masthead nav + simple
 * footer; a catalog's theme `navigation.variant` outranks the masthead), split from `interiorsLanding.ts` so manifest-driven pages can
 * wear it without pulling the pack's full page content into their chunk —
 * the photography pack's pattern.
 *
 * The nav's link list is the pack's canonical trio (Portfolio / Services
 * / About) plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/interiors`
 * preview route those paths don't exist under the prefix.
 *
 * The nav CTA is the project ask; the footer carries the studio's
 * credential line — the quiet trust chrome a design practice signs its
 * pages with.
 */

const CANONICAL_LINKS = [
    { label: landingCopy.nav.portfolio, path: "/portfolio" },
    { label: landingCopy.nav.services, path: "/offerings" },
    { label: landingCopy.nav.about, path: "/about" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/contact" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/portfolio", "/offerings", "/about", "/contact"]

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
 * `currentPath` is site-relative ("" for home, "/portfolio", …).
 */
export function interiorsShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "centered",
            content: {
                logo: {
                    name: studio.name,
                    ...(landingCopy.navTagline !== "" ? { tagline: landingCopy.navTagline } : {}),
                },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${studio.name} · ${studio.location} · ${studio.credentialLine}`,
                note: `© ${new Date().getFullYear()} ${studio.name}`,
            },
        },
    }
}
