import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { business, landingCopy } from "./content"

/**
 * The emergency-services pack's shared chrome (the call-first nav + simple
 * footer), split from `servicesEmergencyLanding.ts` so manifest-driven
 * pages can wear it without pulling the pack's full page content into
 * their chunk — the photography pack's pattern.
 *
 * The nav's link list is the pack's canonical trio (Services / About /
 * Request service) plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/emergency`
 * preview route those paths don't exist under the prefix.
 *
 * The nav CTA is the call — on a dispatch site the phone number never
 * leaves the viewport. `landingCopy.navTagline` letters a small line under
 * the wordmark (the restyles carry their city: brush script, tracked mono,
 * spaced caps; "" = the wordmark alone). The footer carries the license
 * line.
 *
 * Variant: `split` — the ruled editorial bar whose CTA renders a size up,
 * the bar's strongest element: the phone number. Each catalog re-pins its
 * own through `theme.navigation` (a declared theme variant outranks this
 * prop): services-electric and services-electric-techno the `full-width`
 * band, services-emergency-van the `inline` card, services-hvac-desert the
 * `centered` wordmark — the split bar is the fallback when a catalog
 * declares none (services-emergency, services-hvac).
 */

const CANONICAL_LINKS = [
    { label: "Services", path: "/services" },
    { label: "About", path: "/about" },
    { label: "Request service", path: "/request" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; the phone rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/services", "/about", "/request"]

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
 * `currentPath` is site-relative ("" for home, "/services", …).
 */
export function servicesEmergencyShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "split",
            content: {
                logo: {
                    name: business.name,
                    ...(landingCopy.navTagline !== "" ? { tagline: landingCopy.navTagline } : {}),
                },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: `Call ${business.phone}`, href: business.phoneHref },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${business.name} · ${business.location} · ${business.license}`,
                note: `© ${new Date().getFullYear()} ${business.name} · Emergency line ${business.phone}, answered 24/7`,
            },
        },
    }
}
