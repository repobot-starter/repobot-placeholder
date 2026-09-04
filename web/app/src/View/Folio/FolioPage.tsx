import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { profile } from "./content"
import { folioLanding } from "./folioLanding"

/**
 * Home surface for the `folio` pack, composed on the landing kernel
 * (docs/landing.md): `content.ts` stays the single content file and
 * `folioLanding.ts` maps it into sections — edit either to change the page.
 * Document meta comes from the same content file (docs/seo.md).
 *
 * The config resolves through the landing document's per-page merge
 * (`useSitePageConfig`, page id "home" — the catalog's landing seed), so
 * the platform's structural editor can reorder, delete, and add sections
 * with a live repaint. The merge only speaks for the ACTIVE pack: on the
 * /folio preview route under another pack the document's page ids belong
 * to that pack, so the empty page id opts out.
 */
export default function FolioPage(): React.ReactElement {
    const active = activePack.key === "folio"
    const resolved = useSitePageConfig(active ? "home" : "", folioLanding(active ? "" : routes.folio.path))
    return (
        <>
            <PageMeta title={profile.name} siteName={profile.name} description={profile.statement} />
            <LandingRenderer config={resolved} />
        </>
    )
}
