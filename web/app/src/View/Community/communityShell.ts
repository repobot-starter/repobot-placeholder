import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { assoc } from "./content"

/**
 * The community pack's shared chrome (centered masthead + simple footer),
 * split from `communityLanding.ts` so manifest-driven pages can wear it
 * without pulling the pack's full page content into their chunk.
 *
 * The nav is the atelier register's centered masthead: the association's
 * name set like a newsletter nameplate, links either side, and the Join
 * CTA on the right — membership is the pack's one ask, so it rides the
 * chrome onto every page instead of shouting from sections.
 *
 * Links are the pack's canonical three (Events / About / Join is the CTA)
 * plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`). Manifest extras only join
 * when the pack owns the site (`basePath === ""`); on the `/community`
 * preview route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Events", path: "/events" },
    { label: "About", path: "/about" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/join" rides the CTA. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/events", "/join", "/about"]

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
 * `currentPath` is site-relative ("" for home, "/events", "/join", …).
 */
export function communityShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "centered",
            content: {
                logo: { name: assoc.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                // Membership is the association's one ask, so Join is the
                // chrome's CTA on every page — a quiet ink button in the
                // atelier register, not a color shout.
                cta: { label: "Join", href: `${basePath}/join` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${assoc.fullName} · ${assoc.meetingLine}`,
                note: `© ${new Date().getFullYear()} ${assoc.fullName}`,
            },
        },
    }
}
