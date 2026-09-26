import React from "react"
import { Navigate } from "react-router-dom"
import { projectManifest } from "../../Config/projectManifest"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { landingConfigForPage } from "./blueprints"

export interface SitePageProps {
    /** `id` of a page in `repobot.project.json`'s `marketing.pages`. */
    pageId: string
}

/**
 * A manifest-driven marketing page (docs/project-ia.md): looks its entry up
 * in `repobot.project.json` and renders the resolved `LandingConfig` — the
 * page's inline config when present, its blueprint default otherwise. No
 * per-page component files; the manifest is the source of truth.
 *
 * Document meta rides the same entry (docs/seo.md): the page's `title` and
 * `description` become the title/description/OG tags, its seeded hero image
 * (else the brand social asset) the share image. The home page collapses to
 * the site name alone instead of "Home — Site".
 */
export default function SitePage({ pageId }: SitePageProps): React.ReactElement {
    const page = projectManifest.marketing.pages.find((entry) => entry.id === pageId)
    // The layout document's per-page skeleton (repobot.landing.json
    // `pages["<id>"]`) rides over the resolved config, live-editable from
    // the platform's preview editor; a page the document doesn't mention
    // renders its config untouched. Hook order: the page lookup can't be
    // conditional-returned before this, so the hook takes the fallbacks.
    const resolved = useSitePageConfig(
        page?.id ?? pageId,
        page !== undefined
            ? landingConfigForPage(page)
            : { style: { preset: projectManifest.marketing.preset }, sections: [] },
    )
    if (page === undefined) {
        return <Navigate to="/" replace />
    }
    return (
        <>
            <PageMeta
                title={page.path === "/" ? undefined : page.title}
                description={page.description}
                path={page.path}
                image={page.seed?.heroImage}
            />
            <LandingRenderer config={resolved} leadStorageKey={`site-lead-${page.id}`} />
        </>
    )
}
