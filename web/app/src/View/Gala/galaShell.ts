import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { event, landingCopy } from "./content"

/**
 * The gala pack's shared chrome (centered masthead nav + simple footer),
 * split from `galaLanding.ts` so manifest-driven pages can wear it without
 * pulling the pack's full page content into their chunk — the estate
 * pack's pattern, on the ballroom register's program-at-the-door lean.
 *
 * A one-page evening needs almost no nav: the program and details live on
 * the home scroll, so the masthead carries only the name and the one ask —
 * plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/gala` preview
 * route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS: readonly { label: string; path: string }[] = []

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/rsvp" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/rsvp"]

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
 * The shell for one page: the current page drops out of its own links
 * (anchor links always stay — they point into the home scroll).
 * `currentPath` is site-relative ("" for home, "/rsvp").
 */
export function galaShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "centered",
            content: {
                logo: { name: event.title },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${event.dateLabel} · ${event.venueShort} · Black tie`,
                note: `With love, ${event.host}`,
            },
        },
    }
}
