import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { org } from "./content"

/**
 * The nonprofit pack's shared chrome, split from `nonprofitLanding.ts` so
 * manifest-driven pages can wear it without pulling the pack's full page
 * content into their chunk.
 *
 * The nav is the monolith register's flush full-width band: the org's name
 * left, links and the Donate CTA right on the translucent black band — the
 * CTA a hard white plate on true black, the only filled element in the
 * chrome, so the ask still dominates without the split bar's size-up.
 * (Nav-variety audit: the old split letterhead collided with the church
 * pack's protected split venue bar inside the church-and-nonprofit
 * category.) Donate is an external link to the org's own donation page; no
 * payments run through this site.
 *
 * Links are the pack's canonical three (Programs / Impact / Volunteer)
 * plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/nonprofit`
 * preview route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Programs", path: "/programs" },
    { label: "Impact", path: "/impact" },
    { label: "Volunteer", path: "/volunteer" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/programs", "/impact", "/volunteer"]

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
 * `currentPath` is site-relative ("" for home, "/programs", …).
 */
export function nonprofitShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "full-width",
            content: {
                logo: { name: org.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                // Donate is deliberately external — the org's own giving
                // processor — and deliberately dominant: the band's one
                // filled plate, so the ask is present on every page
                // without any section shouting.
                cta: { label: "Donate", href: org.donateUrl },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${org.name} · ${org.location} · A 501(c)(3) nonprofit — ${org.email}`,
                note: `© ${new Date().getFullYear()} ${org.name}`,
            },
        },
    }
}
