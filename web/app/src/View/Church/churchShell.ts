import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { church } from "./content"

/**
 * The church pack's shared chrome (split venue bar + simple footer),
 * split from `churchLanding.ts` so manifest-driven pages can wear it
 * without pulling the pack's full page content into their chunk.
 *
 * The nav is the hymnal register's split bar: a squared band ruled
 * underneath — the venue's marquee rail, not a parish program — with the
 * congregation's wordmark on the left and the Give CTA a size up on the
 * right, the one place the candle-amber accent lives in the chrome. Give
 * is an external link to the church's own giving page; no payments run
 * through this site.
 *
 * Links are the pack's canonical four (Visit / Ministries / Sermons /
 * Events) plus any pages added through the platform's Pages panel
 * (`repobot.project.json` `marketing.pages`) — the same "adding a page
 * rewires every nav" contract the manifest blueprints follow. Manifest
 * extras only join when the pack owns the site (`basePath === ""`); on
 * the `/church` preview route those paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Visit", path: "/visit" },
    { label: "Ministries", path: "/ministries" },
    { label: "Sermons", path: "/sermons" },
    { label: "Events", path: "/events" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo. */
const PACK_OWNED_PATHS: readonly string[] = ["/", "/visit", "/ministries", "/sermons", "/events"]

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
 * `currentPath` is site-relative ("" for home, "/visit", "/events", …).
 */
export function churchShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "split",
            content: {
                logo: { name: church.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                // The Give CTA is deliberately external — the church's own
                // giving processor — and deliberately in the chrome: every
                // page carries it without the sections having to shout.
                cta: { label: "Give", href: church.giveUrl },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${church.name} · ${church.address} · Sundays 9 & 11 AM`,
                note: `© ${new Date().getFullYear()} ${church.name}`,
            },
        },
    }
}
