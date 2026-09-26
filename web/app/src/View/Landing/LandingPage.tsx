import React from "react"
import { PageMeta } from "../../Seo/PageMeta"
import { landing, landingMeta } from "./landing"
import { useLandingConfig } from "./landingDocument"
import { LandingRenderer } from "./LandingRenderer"

/**
 * Kernel exemplar for the landing component (`/landing`): an editorial
 * studio page composed from `landing.ts`. Content — copy, media, CTAs, the
 * document meta — lives in that one file; the layout skeleton (style
 * preset, section order and variants) comes from the root
 * `repobot.landing.json` contract when this is the active landing surface
 * (`landingDocument.ts`). The launch pack shows the same kernel as a SaaS
 * page.
 */
export default function LandingPage(): React.ReactElement {
    const config = useLandingConfig(landing, "kernel")
    return (
        <>
            <PageMeta
                title={landingMeta.title}
                siteName={landingMeta.title}
                description={landingMeta.description}
            />
            <LandingRenderer config={config} />
        </>
    )
}
