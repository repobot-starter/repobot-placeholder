import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { profile } from "./content"

/**
 * The folio pack's shared chrome (inline nav + simple footer), split from
 * `folioLanding.ts` so manifest-driven pages can wear it without pulling
 * the portfolio's full page content into their chunk (`packShell.ts`).
 *
 * The home links are scroll anchors into the one-page portfolio; on a
 * manifest subpage the same anchors become home-rooted hrefs so they
 * navigate back and land on the section. Manifest extras only join when
 * the pack owns the site (`basePath === ""`); on the `/folio` preview
 * route those paths don't exist.
 */

const ANCHOR_LINKS = [
    { label: "Work", anchor: "work" },
    { label: "About", anchor: "contact" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest ("/" rides the logo). */
const PACK_OWNED_PATHS: readonly string[] = ["/"]

/**
 * The shell for one page. `basePath` is "" when the pack owns the site;
 * `currentPath` is site-relative ("" or "/" for home).
 */
export function folioShell(basePath: string, currentPath: string): MarketingShellConfig {
    const home = currentPath === "" || currentPath === "/"
    const anchorLink = (link: { label: string; anchor: string }) =>
        home
            ? { label: link.label, anchor: link.anchor }
            : { label: link.label, href: `${basePath}/#${link.anchor}` }
    const extras =
        basePath === ""
            ? projectManifest.marketing.pages
                  .filter((page) => !PACK_OWNED_PATHS.includes(page.path))
                  .filter((page) => page.path !== currentPath)
                  .map((page) => ({ label: page.title, href: page.path }))
            : []
    return {
        nav: {
            variant: "inline",
            content: {
                logo: { name: profile.name },
                links: [...ANCHOR_LINKS.map(anchorLink), ...extras],
                cta: { label: "Get in touch", href: `mailto:${profile.email}` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${profile.name} · ${profile.location}`,
                note: `© ${new Date().getFullYear()} ${profile.name}`,
            },
        },
    }
}
