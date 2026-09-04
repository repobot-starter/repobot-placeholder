import type { MarketingShellConfig } from "@ui"
import { projectManifest } from "../../Config/projectManifest"
import { landingCopy, person } from "./content"

/**
 * The résumé pack's shared chrome (split nav + simple footer), split from
 * `resumeLanding.ts` so manifest-driven pages can wear it without pulling
 * the résumé's full content into their chunk (`packShell.ts`).
 *
 * The nav is the split treatment — a squared bar ruled underneath — pared
 * to the wordmark and the page's one conversion: the Download résumé
 * button (`#print`, intercepted by ResumePage into `window.print()`).
 * A résumé is one page; it navigates by scrolling, not by links. Manifest
 * extras only join when the pack owns the site (`basePath === ""`) and the
 * owner has actually added pages.
 */

/** Paths the pack itself owns — never duplicated from the manifest ("/" rides the logo). */
const PACK_OWNED_PATHS: readonly string[] = ["/"]

/**
 * The shell for one page. `basePath` is "" when the pack owns the site;
 * `currentPath` is site-relative ("" or "/" for home).
 */
export function resumeShell(basePath: string, currentPath: string): MarketingShellConfig {
    const extras =
        basePath === ""
            ? projectManifest.marketing.pages
                  .filter((page) => !PACK_OWNED_PATHS.includes(page.path))
                  .filter((page) => page.path !== currentPath)
                  .map((page) => ({ label: page.title, href: page.path }))
            : []
    return {
        nav: {
            variant: "split",
            content: {
                logo: { name: person.name },
                links: extras,
                // The one conversion this page has: the same page typeset
                // to paper. ResumePage intercepts the #print anchor.
                cta: { label: landingCopy.printCta, anchor: "print" },
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${person.name} · ${person.title} · ${person.location}`,
                note: `© ${new Date().getFullYear()} ${person.name}`,
            },
        },
    }
}
