import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { creator, landingCopy } from "./content"

/**
 * The influencer pack's shared chrome (centered masthead nav + simple
 * footer), split from `influencerLanding.ts` so manifest-driven pages can
 * wear it without pulling the pack's full page content into their chunk —
 * the photography pack's pattern (interiorsShell.ts is the model).
 *
 * The nav's link list is the pack's canonical trio (Looks / Links /
 * About) plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/influencer`
 * preview route those paths don't exist under the prefix.
 *
 * The nav CTA is the partnership ask; the footer carries the handle and
 * the audience line — the quiet trust chrome a creator signs their
 * pages with.
 */

const CANONICAL_LINKS = [
    { label: landingCopy.nav.looks, path: "/looks" },
    { label: landingCopy.nav.links, path: "/links" },
    { label: landingCopy.nav.about, path: "/about" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/contact" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/looks", "/links", "/about", "/contact"]

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
 * `currentPath` is site-relative ("" for home, "/looks", …).
 */
export function influencerShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "centered",
            content: {
                logo: { name: creator.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${creator.name} · ${creator.handle} · ${creator.location} · ${creator.credentialLine}`,
                note: `© ${new Date().getFullYear()} ${creator.name}`,
            },
        },
    }
}
