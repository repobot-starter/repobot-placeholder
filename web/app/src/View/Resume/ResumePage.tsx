import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { person } from "./content"
import { resumeLanding } from "./resumeLanding"
import "./ResumePage.print.css"

/**
 * Home surface for the `resume` pack: the CV one-pager a job seeker sends
 * instead of a PDF (docs/landing.md; `content.ts` is the single content
 * file, `resumeLanding.ts` maps it into sections and computes every
 * duration from the role dates at render time).
 *
 * Print IS the feature: ResumePage.print.css typesets the same page to a
 * one-page Letter/A4 résumé (chrome hidden, rhythm tightened, paper-white
 * ground), and the "Download résumé" CTAs are plain `#print` anchors that the
 * capture-phase click handler below turns into `window.print()` — the
 * browser is the PDF pipeline, so there is nothing to provision.
 *
 * The config resolves through the landing document's per-page merge
 * (`useSitePageConfig`, page id "home" — the catalog's landing seed). The
 * merge only speaks for the ACTIVE pack: on the /resume preview route
 * under another pack the empty page id opts out.
 */
export default function ResumePage(): React.ReactElement {
    const active = activePack.key === "resume"
    // A fresh `now` per mount: durations and ordering are computed, never
    // stored — the résumé that says "6 yrs" today says "7 yrs" next year.
    const [now] = React.useState(() => new Date())
    const resolved = useSitePageConfig(
        active ? "home" : "",
        resumeLanding(active ? "" : routes.resume.path, now),
    )

    React.useEffect(() => {
        // Capture phase, so the SPA link interceptor never sees the click.
        const onClick = (event: MouseEvent): void => {
            const target = event.target as Element | null
            const anchor = target?.closest?.('a[href$="#print"]')
            if (!(anchor instanceof HTMLAnchorElement)) return
            event.preventDefault()
            event.stopPropagation()
            window.print()
        }
        document.addEventListener("click", onClick, true)
        return () => document.removeEventListener("click", onClick, true)
    }, [])

    return (
        <div className="resume-print">
            <PageMeta
                title={`${person.name} — ${person.title}`}
                siteName={person.name}
                description={person.summary[0]}
            />
            <LandingRenderer config={resolved} />
        </div>
    )
}
