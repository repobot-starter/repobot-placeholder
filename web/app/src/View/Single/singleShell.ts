import type { MarketingShellConfig } from "@ui"
import { releaseStatus } from "../Music/schedule"
import { artist, listenLinks, mailingList, record } from "./content"

/**
 * The release page's chrome — the monolith register's flush full-width
 * band: wordmark, no link noise (it's a one-pager), and a single CTA that
 * reads "Pre-save" before the date and "Listen" after, computed from the
 * same clock as the masthead countdown. The variant moved off `inline` in
 * the nav-variety audit — it shared the inset card with the dj pack in the
 * same category, and the edge-to-edge translucent band over the monolith
 * black is the stronger reading anyway. `logo-only` was considered and
 * rejected: it would drop the computed pre-save/listen CTA, the page's one
 * conversion.
 */
export function singleShell(now: Date = new Date()): MarketingShellConfig {
    const listenLabel = releaseStatus(record.releaseDate, now).released ? "Listen" : "Pre-save"
    // The CTA follows the first LIVE listen link (content.ts leaves them
    // empty until the record has real store pages). With none, the page's
    // one supportable conversion is the mailing list, so the CTA anchors to
    // it instead of navigating to a dead external page.
    const liveListenLink = listenLinks.find((link) => link.href !== "")
    const cta =
        liveListenLink !== undefined
            ? { label: `${listenLabel} · ${liveListenLink.label}`, href: liveListenLink.href }
            : { label: mailingList.cta, anchor: "lead-form" }
    return {
        nav: {
            variant: "full-width",
            content: {
                logo: { name: artist.name },
                links: [],
                cta,
            },
        },
        footer: {
            variant: "simple",
            content: {
                blurb: `${artist.name} · ${record.title} · ${record.label}`,
                note: `© ${new Date().getFullYear()} ${artist.name} · ${artist.email}`,
            },
        },
    }
}
