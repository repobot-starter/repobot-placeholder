import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { landingCopy, reunion } from "./content"

/**
 * The reunion pack's shared chrome (pill-link nav + simple footer),
 * split from `reunionLanding.ts` so manifest-driven pages can wear it
 * without pulling the pack's full page content into their chunk — the
 * estate pack's pattern, on the picnic register's sign-in-table lean (a
 * catalog's theme `navigation.variant` outranks it: reunion-rodeo hangs
 * the inline ranch sign).
 *
 * The logo and the nav's own links are the family's (`landingCopy`
 * navName / navTagline / navMarkSrc / navLinks — the Memory wall, the
 * page relatives actually revisit, or anchors into home sections), plus
 * whatever the platform's Pages panel adds through `repobot.project.json`
 * `marketing.pages`. Manifest extras only join when the pack owns the
 * site (`basePath === ""`); on the `/reunion` preview route those paths
 * don't exist under the prefix.
 *
 * The nav CTA is the one ask a reunion has — the head count.
 */

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/rsvp" rides the nav CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/memories", "/rsvp"]

function siteLinks(basePath: string): { label: string; path: string }[] {
    if (basePath !== "") {
        return [...landingCopy.navLinks]
    }
    const extras = projectManifest.marketing.pages
        .filter((page) => !PACK_OWNED_PATHS.includes(page.path))
        .map((page) => ({ label: page.title, path: page.path }))
    return [...landingCopy.navLinks, ...extras]
}

/** Home-section anchors ("/#schedule") resolve under the preview prefix as "/reunion#schedule". */
function linkHref(basePath: string, path: string): string {
    if (path.startsWith("/#")) {
        return `${basePath === "" ? "/" : basePath}${path.slice(1)}`
    }
    return `${basePath}${path}`
}

/**
 * The shell for one page: the current page drops out of its own links.
 * `currentPath` is site-relative ("" for home, "/memories", "/rsvp").
 */
export function reunionShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            // The pill cluster: name tags on a string, the picnic's lean —
            // not the contained card half the registers already wear.
            variant: "pill-links",
            content: {
                logo: {
                    name: landingCopy.navName,
                    ...(landingCopy.navTagline !== "" ? { tagline: landingCopy.navTagline } : {}),
                    ...(landingCopy.navMarkSrc !== "" ? { markSrc: landingCopy.navMarkSrc } : {}),
                },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: linkHref(basePath, link.path) })),
                cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${reunion.datesLabel} · ${reunion.venueShort}`,
                note: `Herded with love by ${reunion.organizers}`,
            },
        },
    }
}
