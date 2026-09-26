import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { footer, product } from "./content"

/**
 * The launch pack's shared chrome. The nav and footer used to be landing
 * SECTIONS, which put them outside the shell system: the platform's Site
 * navigation control (theme contract `navigation`) had nothing to bind to,
 * and pages added from the Pages panel never joined the home nav. As shell
 * chrome, both map through — the declared contract variant outranks the
 * pack's `inline` pin, and manifest pages ride the link row.
 *
 * The home links are scroll anchors into the one-page story; on a manifest
 * subpage the same anchors become home-rooted hrefs so they navigate back
 * and land on the section.
 */

const ANCHOR_LINKS = [
    { label: "Features", anchor: "feature-grid" },
    { label: "Reviews", anchor: "testimonials" },
    { label: "Pricing", anchor: "pricing" },
    { label: "FAQ", anchor: "faq" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest ("/" rides the logo). */
const PACK_OWNED_PATHS: readonly string[] = ["/"]

/**
 * The shell for one page. `basePath` is "" when the pack owns the site
 * (manifest extras only exist there; on the /launch preview route those
 * paths don't resolve). `currentPath` is site-relative ("" or "/" for
 * home); the current page drops out of its own links.
 */
export function launchShell(basePath: string, currentPath: string): MarketingShellConfig {
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
                logo: { emoji: product.logoEmoji, name: product.name },
                links: [...ANCHOR_LINKS.map(anchorLink), ...extras],
                cta: anchorLink({ label: "Say hello", anchor: "lead-form" }),
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: footer.blurb,
                links: footer.links.map((link) => ({ label: link.label, href: link.url })),
                note: "· Made with LaunchBot",
            },
        },
    }
}
