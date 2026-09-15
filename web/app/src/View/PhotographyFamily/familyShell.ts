import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { photographer } from "./content"

/**
 * The family-photography pack's shared chrome (centered masthead + simple
 * footer), split from `familyLanding.ts` so manifest-driven pages can wear
 * it without pulling the pack's full page content into their chunk.
 *
 * The nav's link list is the pack's canonical set (Work / Galleries /
 * Investment / About / Inquire, with Book riding the CTA) plus any pages
 * added through
 * the platform's Pages panel (`repobot.project.json` `marketing.pages`) —
 * the same "adding a page rewires every nav" contract the manifest
 * blueprints follow. Manifest extras only join when the pack owns the site
 * (`basePath === ""`); on the `/photography-family` preview route those
 * paths don't exist under the prefix.
 */

const CANONICAL_LINKS = [
    { label: "Work", path: "/work" },
    // Galleries is the client-facing proofing page: photography templates
    // must allude to proofing from the shell itself, or nobody — client or
    // photographer evaluating the template — ever finds the /proof flow.
    { label: "Galleries", path: "/galleries" },
    { label: "Investment", path: "/investment" },
    { label: "About", path: "/about" },
    { label: "Inquire", path: "/inquire" },
] as const

/** Paths the pack itself owns — never duplicated from the manifest.
 * "/" rides the logo; "/book" rides the CTA; "/proof" is the client
 * proofing room itself, reached from the Galleries page, never the nav. */
const PACK_OWNED_PATHS: readonly string[] = [
    "/",
    "/work",
    "/galleries",
    "/investment",
    "/about",
    "/book",
    "/inquire",
    "/proof",
]

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
 * `currentPath` is site-relative ("" for home, "/work", "/book", …).
 */
export function familyShell(basePath: string, currentPath: string): MarketingShellConfig {
    return {
        nav: {
            variant: "centered",
            content: {
                logo: { name: photographer.name },
                links: siteLinks(basePath)
                    .filter((link) => link.path !== currentPath)
                    .map((link) => ({ label: link.label, href: `${basePath}${link.path}` })),
                cta: { label: "Book a session", href: `${basePath}/book` },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${photographer.name} · ${photographer.tagline} · ${photographer.location}`,
                note: `© ${new Date().getFullYear()} ${photographer.name}`,
            },
        },
    }
}
