import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import * as styles from "./FundIndexPage.styles.css"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { contact, disclosures, firm, home, logPage, portfolioPage, teamPage } from "./content"
import {
    contactLanding,
    disclosuresLanding,
    homeLanding,
    logLanding,
    portfolioLanding,
    teamLanding,
} from "./fundIndexLanding"

export type FundIndexPageKind = "home" | "portfolio" | "team" | "log" | "contact" | "disclosures"

/**
 * The fund-index pack's site (docs/landing.md): six kernel-composed pages
 * from one `content.ts`, in the mono-utility register's dark reading — a
 * venture fund as a numbered index, paper-on-ink, with every numeral
 * computed from array position. When the pack is active it owns /,
 * /portfolio, /team, /log, /contact, and /disclosures; on the preview
 * route the same pages nest under /fund-index/*.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function FundIndexPage({ page = "home" }: { page?: FundIndexPageKind }): React.ReactElement {
    const basePath = activePack.key === "fund-index" ? "" : routes.fundIndex.path

    const config =
        page === "portfolio"
            ? portfolioLanding(basePath, new Date())
            : page === "team"
              ? teamLanding(basePath)
              : page === "log"
                ? logLanding(basePath)
                : page === "contact"
                  ? contactLanding(basePath)
                  : page === "disclosures"
                    ? disclosuresLanding(basePath)
                    : homeLanding(basePath)
    // The merge only speaks for the ACTIVE pack: on the /fund-index preview
    // route under another pack, the document's page ids belong to that pack
    // and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "fund-index" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    const meta =
        page === "portfolio"
            ? { title: `Portfolio — ${firm.name}`, description: portfolioPage.note }
            : page === "team"
              ? { title: `Team — ${firm.name}`, description: teamPage.note }
              : page === "log"
                ? { title: `Log — ${firm.name}`, description: logPage.note }
                : page === "contact"
                  ? { title: `Contact — ${firm.name}`, description: contact.body }
                  : page === "disclosures"
                    ? { title: `Disclosures — ${firm.name}`, description: disclosures.paragraphs[0] }
                    : {
                          title: `${firm.name} — ${firm.tagline}`,
                          description: `${home.headline} ${home.subheadline}`,
                      }

    return (
        // The blackout wrapper pins the dark appearance's ground to neutral
        // true black (FundIndexPage.styles.css.ts) — the pack-level answer
        // to mono-utility's phosphor-green terminal ground, which belongs
        // to the dj pack and read as "dark green" here.
        <div className={styles.blackout}>
            <PageMeta title={meta.title} siteName={firm.name} description={meta.description} />
            <LandingRenderer config={resolved} />
        </div>
    )
}
