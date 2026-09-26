import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { event, homeAnchors, landingCopy } from "./content"

/**
 * The gala pack's shared chrome (masthead nav + simple footer), split from
 * `galaLanding.ts` so manifest-driven pages can wear it without pulling
 * the pack's full page content into their chunk — the estate pack's
 * pattern.
 *
 * A one-page evening needs almost no nav: the program and details live on
 * the home scroll, so the masthead carries the name, the one ask, and any
 * anchors the content names into that scroll (`homeAnchors` — on-page
 * from home, back to home from the RSVP page) — plus any pages added
 * through the platform's Pages panel (`repobot.project.json`
 * `marketing.pages`). With no anchors the name centers over the ask; with
 * them the nav splits the name from its links. Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/gala` preview
 * route those paths don't exist under the prefix.
 */

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/rsvp" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/rsvp"]

function manifestLinks(basePath: string): { label: string; href: string }[] {
    if (basePath !== "") {
        return []
    }
    return projectManifest.marketing.pages
        .filter((page) => !PACK_OWNED_PATHS.includes(page.path))
        .map((page) => ({ label: page.title, href: page.path }))
}

/**
 * The shell for one page. `currentPath` is site-relative ("" for home,
 * "/rsvp"); the anchors point on-page from home and back to home elsewhere.
 */
export function galaShell(basePath: string, currentPath: string): MarketingShellConfig {
    const home = currentPath === "" ? "" : `${basePath}/`
    return {
        nav: {
            variant: homeAnchors.length > 0 ? "split" : "centered",
            content: {
                logo: { name: event.title },
                links: [
                    ...homeAnchors.map((link) => ({ label: link.label, href: `${home}#${link.anchor}` })),
                    ...manifestLinks(basePath).filter((link) => link.href !== currentPath),
                ],
                cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${event.dateLabel} · ${event.venueShort} · ${event.dressLabel}`,
                note: `With love, ${event.host}`,
            },
        },
    }
}
