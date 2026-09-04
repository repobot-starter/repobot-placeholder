import { MarketingPage, MarketingShell } from "@ui"
import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useContentShows } from "../Landing/datesDocument"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { AudioPlayer, useStopAudioOnUnmount } from "../Music/AudioPlayer"
import { formatShowDate, splitShows, type ShowDate } from "../Music/schedule"
import { useLeadJoin } from "../Music/useLeadJoin"
import { bookLanding, DJ_STYLE_OVERRIDES, homeLanding } from "./djLanding"
import { djShell } from "./djShell"
import { artist, booking, home, mixes, sets } from "./content"
import * as styles from "./Dj.styles.css"

export type DjPageKind = "home" | "mixes" | "dates" | "book"

/**
 * The dj pack's site: four pages from one `content.ts`. Home and Book are
 * pure kernel vocabulary (djLanding.ts) and doc-aware through the landing
 * document's per-page merge. Mixes and Dates are the bespoke surfaces —
 * the hybrid mix players and the computed set-dates table — rendering
 * MarketingPage/MarketingShell themselves in the same achromatic
 * mono-utility register (paper-on-ink, grid-and-mono, no hue anywhere).
 *
 * When the pack is active it owns /, /mixes, /dates, and /book; on the
 * preview route the same pages nest under /dj/*.
 */
export default function DjPage({ page = "home" }: { page?: DjPageKind }): React.ReactElement {
    const basePath = activePack.key === "dj" ? "" : routes.dj.path
    if (page === "mixes") return <MixesPage basePath={basePath} />
    if (page === "dates") return <DatesPage basePath={basePath} />
    if (page === "book") return <BookPage basePath={basePath} />
    return <HomePage basePath={basePath} />
}

function HomePage({ basePath }: { basePath: string }): React.ReactElement {
    // The dates the page renders: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, live-repainting on dev document edits like the landing merge.
    const tour = useContentShows(sets, "dj")
    const config = homeLanding(basePath, new Date(), tour)
    const resolved = useSitePageConfig(activePack.key === "dj" ? "home" : "", config)
    return (
        <>
            <PageMeta title={artist.alias} siteName={artist.alias} description={home.subheadline} />
            <LandingRenderer config={resolved} leadFormKey="mailing-list" leadStorageKey="dj-mailing-list" />
        </>
    )
}

function BookPage({ basePath }: { basePath: string }): React.ReactElement {
    const config = bookLanding(basePath)
    const resolved = useSitePageConfig(activePack.key === "dj" ? "book" : "", config)
    return (
        <>
            <PageMeta title={`Book — ${artist.alias}`} siteName={artist.alias} description={booking.body} />
            {/* Booking posts formKey "booking" through the managed forms
                pipeline — email + dashboard entry, zero setup. */}
            <LandingRenderer config={resolved} leadFormKey="booking" leadStorageKey="dj-booking" />
        </>
    )
}

/** The bespoke pages' shared scaffold: register, chrome, lead plumbing. */
function DjShellPage({
    currentPath,
    basePath,
    children,
}: {
    currentPath: string
    basePath: string
    children: React.ReactNode
}): React.ReactElement {
    const { joined, join } = useLeadJoin("dj-mailing-list", "mailing-list")
    const shell = djShell(basePath, currentPath)
    return (
        <MarketingPage preset={PACK_REGISTERS.dj} overrides={DJ_STYLE_OVERRIDES}>
            <MarketingShell
                nav={shell.nav}
                footer={shell.footer}
                newsletterJoined={joined}
                onNewsletterSubmit={join}
            >
                <main className={styles.main}>{children}</main>
            </MarketingShell>
        </MarketingPage>
    )
}

/* ----------------------------------- Mixes ----------------------------------- */

function MixesPage({ basePath }: { basePath: string }): React.ReactElement {
    useStopAudioOnUnmount()
    return (
        <DjShellPage currentPath="/mixes" basePath={basePath}>
            <PageMeta
                title={`Mixes — ${artist.alias}`}
                siteName={artist.alias}
                description={`${artist.series}: ${mixes.map((mix) => mix.title).join(", ")}.`}
            />
            <header className={styles.pageHeader}>
                <span className={styles.kicker}>{artist.series}</span>
                <div className={styles.headlineRow}>
                    <h1 className={styles.headline}>Mixes</h1>
                </div>
                <p className={styles.lede}>
                    Excerpts play right here. Full transmissions live on the usual platforms — paste a link,
                    press play, close the laptop.
                </p>
            </header>

            {mixes.map((mix) => (
                <article key={mix.index} className={styles.mix} data-mix={mix.index}>
                    <span className={styles.mixIndex}>{mix.index}</span>
                    <img
                        className={styles.mixCover}
                        src={mix.cover.src}
                        srcSet={mix.cover.srcSet.map((entry) => `${entry.src} ${entry.width}w`).join(", ")}
                        sizes="(max-width: 820px) 240px, 240px"
                        alt={mix.cover.alt}
                        loading="lazy"
                    />
                    <div className={styles.mixBody}>
                        <h2 className={styles.mixTitle}>{mix.title}</h2>
                        <span className={styles.mixMeta}>
                            {mix.bpm} BPM · {mix.style}
                        </span>
                        <p className={styles.mixNotes}>{mix.notes}</p>
                        <AudioPlayer track={mix} />
                    </div>
                </article>
            ))}
        </DjShellPage>
    )
}

/* ----------------------------------- Dates ----------------------------------- */

function SetRow({ set, past }: { set: ShowDate; past?: boolean }): React.ReactElement {
    const date = formatShowDate(set.date)
    return (
        <div className={`${styles.setRow} ${past === true ? styles.pastRow : ""}`} data-set-date={set.date}>
            <span className={styles.setDate}>
                {date.weekday} {date.month} {date.day}
                {past === true ? ` ${date.year}` : ""}
            </span>
            <span>
                <span className={styles.setCity}>
                    {set.city}
                    {set.region !== undefined ? ` — ${set.region}` : ""}
                </span>
                <span className={styles.setVenue}>{set.venue}</span>
            </span>
            {set.note !== undefined ? <span className={styles.setNote}>{set.note}</span> : <span />}
            {past !== true && set.ticketUrl !== undefined ? (
                <a className={styles.setLink} href={set.ticketUrl} target="_blank" rel="noreferrer">
                    Tickets
                </a>
            ) : (
                <span />
            )}
        </div>
    )
}

/**
 * The computed dates mechanic, worn grid-and-mono: `sets` split
 * upcoming/past at render time, next set framed, badge computed —
 * "Tonight — City" on set days.
 */
function DatesPage({ basePath }: { basePath: string }): React.ReactElement {
    // The same contract-over-code resolve as home: the dates table renders
    // the document's sets when the pack is active, the code sets
    // otherwise, and the upcoming/past split stays computed either way.
    const tour = useContentShows(sets, "dj")
    const schedule = splitShows(tour, new Date())
    const next = schedule.next
    const nextDate = next !== null ? formatShowDate(next.date) : null
    return (
        <DjShellPage currentPath="/dates" basePath={basePath}>
            <PageMeta
                title={`Dates — ${artist.alias}`}
                siteName={artist.alias}
                description={`Upcoming sets and the archive. ${home.subheadline}`}
            />
            <header className={styles.pageHeader}>
                <span className={styles.kicker}>{artist.alias}</span>
                <div className={styles.headlineRow}>
                    <h1 className={styles.headline}>Dates</h1>
                    {schedule.badge !== null && (
                        <span className={styles.badge} data-tour-badge>
                            {schedule.badge}
                        </span>
                    )}
                </div>
                <p className={styles.lede}>
                    Tickets and door policy through the venues. For bookings, the form has everything the
                    agency needs.
                </p>
            </header>

            {next !== null && nextDate !== null && (
                <section className={styles.nextSet} data-next-show aria-label="Next set">
                    <span className={styles.nextSetDate}>
                        <span className={styles.nextSetWeekday}>
                            {nextDate.weekday} · {nextDate.year}
                        </span>
                        <span className={styles.nextSetDay}>
                            {nextDate.month} {nextDate.day}
                        </span>
                    </span>
                    <span>
                        <span className={styles.nextSetCity}>
                            {next.venue} — {next.city}
                        </span>
                        {next.note !== undefined && <span className={styles.nextSetVenue}>{next.note}</span>}
                    </span>
                    {next.ticketUrl !== undefined && (
                        <a
                            className={styles.ticketButton}
                            href={next.ticketUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Tickets
                        </a>
                    )}
                </section>
            )}

            <h2 className={styles.sectionLabel}>Upcoming</h2>
            <div className={styles.setTable} data-upcoming-shows>
                {schedule.upcoming.map((set) => (
                    <SetRow key={`${set.date}-${set.venue}`} set={set} />
                ))}
            </div>

            <h2 className={styles.sectionLabel}>Archive</h2>
            <div className={styles.setTable} data-past-shows>
                {schedule.past.map((set) => (
                    <SetRow key={`${set.date}-${set.venue}`} set={set} past />
                ))}
            </div>
        </DjShellPage>
    )
}
