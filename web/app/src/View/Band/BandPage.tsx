import { MarketingPage, MarketingShell } from "@ui"
import React, { useState } from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useContentShows } from "../Landing/datesDocument"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer, LandingSectionView } from "../Landing/LandingRenderer"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { AudioPlayer, useStopAudioOnUnmount } from "../Music/AudioPlayer"
import { formatShowDate, splitShows, type ShowDate } from "../Music/schedule"
import { useLeadJoin } from "../Music/useLeadJoin"
import { VideoEmbed } from "../Music/VideoEmbed"
import { homeLanding } from "./bandLanding"
import { bandShell } from "./bandShell"
import { band, home, mailingList, pressKit, records, shows, videos } from "./content"
import * as styles from "./Band.styles.css"

export type BandPageKind = "home" | "tour" | "music" | "press"

/**
 * The band pack's site: four pages from one `content.ts`. Home is pure
 * kernel vocabulary (bandLanding.ts) and doc-aware through the landing
 * document's per-page merge, so the platform's structural editor owns it.
 * Tour, Music, and Press are the pack's bespoke surfaces — the category's
 * signature mechanics live there: the computed tour split, the hybrid
 * audio players, the downloadable press kit. They render
 * MarketingPage/MarketingShell themselves (same broadside register) and
 * reuse kernel sections through LandingSectionView where the vocabulary
 * fits, so the mailing-list form is one implementation everywhere.
 *
 * When the pack is active it owns /, /tour, /music, and /press; on the
 * preview route the same pages nest under /band/*.
 */
export default function BandPage({ page = "home" }: { page?: BandPageKind }): React.ReactElement {
    const basePath = activePack.key === "band" ? "" : routes.band.path
    if (page === "tour") return <TourPage basePath={basePath} />
    if (page === "music") return <MusicPage basePath={basePath} />
    if (page === "press") return <PressPage basePath={basePath} />
    return <HomePage basePath={basePath} />
}

function HomePage({ basePath }: { basePath: string }): React.ReactElement {
    // The tour the page renders: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, live-repainting on dev document edits like the landing merge.
    const tour = useContentShows(shows, "band")
    const config = homeLanding(basePath, new Date(), tour)
    // The merge only speaks for the ACTIVE pack: on the /band preview route
    // under another pack the document's page ids belong to that pack (the
    // empty page id opts out).
    const resolved = useSitePageConfig(activePack.key === "band" ? "home" : "", config)
    return (
        <>
            <PageMeta title={band.name} siteName={band.name} description={home.subheadline} />
            <LandingRenderer
                config={resolved}
                leadFormKey="mailing-list"
                leadStorageKey="band-mailing-list"
            />
        </>
    )
}

/** The bespoke pages' shared scaffold: register, chrome, lead plumbing. */
function BandShellPage({
    currentPath,
    basePath,
    children,
}: {
    currentPath: string
    basePath: string
    children: React.ReactNode
}): React.ReactElement {
    const { joined, join } = useLeadJoin("band-mailing-list", "mailing-list")
    const shell = bandShell(basePath, currentPath)
    return (
        <MarketingPage preset={PACK_REGISTERS.band}>
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

/* ----------------------------------- Tour ----------------------------------- */

function showPlace(show: ShowDate): string {
    return show.region !== undefined ? `${show.city}, ${show.region}` : show.city
}

function ShowRow({ show, past }: { show: ShowDate; past?: boolean }): React.ReactElement {
    const date = formatShowDate(show.date)
    const soldOut = show.note?.toLowerCase() === "sold out"
    return (
        <div
            className={`${styles.showRow} ${past === true ? styles.pastRow : ""}`}
            data-show-date={show.date}
        >
            <span className={styles.showDate}>
                {date.weekday} · {date.month} {date.day}
                {past === true ? ` ${date.year}` : ""}
            </span>
            <span>
                <span className={styles.showCity}>{showPlace(show)}</span>
                <span className={styles.showVenue}>{show.venue}</span>
            </span>
            {show.note !== undefined ? <span className={styles.showNote}>{show.note}</span> : <span />}
            {past !== true && show.ticketUrl !== undefined ? (
                soldOut ? (
                    <span className={`${styles.showTicketLink} ${styles.soldOut}`}>Tickets</span>
                ) : (
                    <a
                        className={styles.showTicketLink}
                        href={show.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Tickets
                    </a>
                )
            ) : (
                <span />
            )}
        </div>
    )
}

/**
 * The category's signature mechanic: the tour page splits `shows` into
 * upcoming and past at render time, highlights the next confirmed date,
 * and wears the computed badge — "Tonight — City" on show days, "On tour"
 * while dates remain. Editing the site never means moving rows between
 * lists; the archive writes itself at midnight.
 */
function TourPage({ basePath }: { basePath: string }): React.ReactElement {
    // The same contract-over-code resolve as home: the tour table renders
    // the document's dates when the pack is active, the code dates
    // otherwise, and the upcoming/past split stays computed either way.
    const tour = useContentShows(shows, "band")
    const schedule = splitShows(tour, new Date())
    const next = schedule.next
    const nextDate = next !== null ? formatShowDate(next.date) : null
    return (
        <BandShellPage currentPath="/tour" basePath={basePath}>
            <PageMeta
                title={`Tour — ${band.name}`}
                siteName={band.name}
                description={`Upcoming shows and the archive. ${home.subheadline}`}
            />
            <header className={styles.pageHeader}>
                <span className={styles.kicker}>{band.name}</span>
                <div className={styles.headlineRow}>
                    <h1 className={styles.headline}>Tour</h1>
                    {schedule.badge !== null && (
                        <span className={styles.badge} data-tour-badge>
                            {schedule.badge}
                        </span>
                    )}
                </div>
                <p className={styles.lede}>
                    Tickets through the venues — links below. For guest list and press credentials, use the
                    press page.
                </p>
            </header>

            {next !== null && nextDate !== null && (
                <section className={styles.nextShow} data-next-show aria-label="Next show">
                    <span className={styles.nextShowDate}>
                        <span className={styles.nextShowWeekday}>
                            {nextDate.weekday} · {nextDate.year}
                        </span>
                        <span className={styles.nextShowDay}>
                            {nextDate.month} {nextDate.day}
                        </span>
                    </span>
                    <span>
                        <span className={styles.nextShowCity}>{showPlace(next)}</span>
                        <span className={styles.nextShowVenue}>{next.venue}</span>
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
            <div className={styles.showTable} data-upcoming-shows>
                {schedule.upcoming.map((show) => (
                    <ShowRow key={`${show.date}-${show.city}`} show={show} />
                ))}
            </div>

            <h2 className={styles.sectionLabel}>Previously</h2>
            <div className={styles.showTable} data-past-shows>
                {schedule.past.map((show) => (
                    <ShowRow key={`${show.date}-${show.city}`} show={show} past />
                ))}
            </div>
        </BandShellPage>
    )
}

/* ---------------------------------- Music ---------------------------------- */

function MusicPage({ basePath }: { basePath: string }): React.ReactElement {
    useStopAudioOnUnmount()
    const { joined, join } = useLeadJoin("band-mailing-list", "mailing-list")
    return (
        <BandShellPage currentPath="/music" basePath={basePath}>
            <PageMeta
                title={`Music — ${band.name}`}
                siteName={band.name}
                description={`The records: ${records.map((record) => record.title).join(", ")}.`}
            />
            <header className={styles.pageHeader}>
                <span className={styles.kicker}>Discography</span>
                <div className={styles.headlineRow}>
                    <h1 className={styles.headline}>The records</h1>
                </div>
                <p className={styles.lede}>
                    Demo excerpts play right here — no app, no login. The full records live wherever you
                    already listen.
                </p>
            </header>

            {records.map((record) => (
                <article key={record.slug} className={styles.record} data-record={record.slug}>
                    <div className={styles.recordCoverWrap}>
                        <img
                            className={styles.recordCover}
                            src={record.cover.src}
                            srcSet={record.cover.srcSet
                                .map((entry) => `${entry.src} ${entry.width}w`)
                                .join(", ")}
                            sizes="(max-width: 820px) 90vw, 320px"
                            alt={record.cover.alt}
                            loading="lazy"
                        />
                    </div>
                    <div className={styles.recordBody}>
                        <h2 className={styles.recordTitle}>{record.title}</h2>
                        <span className={styles.recordMeta}>
                            {record.format} · {record.year} · {record.label}
                        </span>
                        <p className={styles.recordNotes}>{record.notes}</p>
                        <div className={styles.trackList}>
                            {record.tracks.map((track) => (
                                <AudioPlayer key={track.title} track={track} />
                            ))}
                        </div>
                    </div>
                </article>
            ))}

            <h2 className={styles.sectionLabel}>Video</h2>
            <div className={styles.videoGrid}>
                {videos.map((video) => (
                    <VideoEmbed
                        key={video.title}
                        title={video.title}
                        meta={video.meta}
                        videoUrl={video.videoUrl}
                        poster={video.poster}
                    />
                ))}
            </div>

            <LandingSectionView
                section={{
                    id: "mailing-list",
                    type: "lead-form",
                    variant: "inline-email",
                    content: {
                        kicker: mailingList.kicker,
                        title: mailingList.title,
                        body: mailingList.body,
                        cta: mailingList.cta,
                        confirmation: mailingList.confirmation,
                    },
                }}
                joined={joined}
                onJoin={join}
            />
        </BandShellPage>
    )
}

/* ---------------------------------- Press ---------------------------------- */

function BioBlock({ label, paragraphs }: { label: string; paragraphs: string[] }): React.ReactElement {
    const [copied, setCopied] = useState(false)
    return (
        <div className={styles.bioBlock}>
            <div className={styles.bioLabelCol}>
                <span className={styles.bioLabel}>{label}</span>
                <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => {
                        void navigator.clipboard.writeText(paragraphs.join("\n\n"))
                        setCopied(true)
                        window.setTimeout(() => setCopied(false), 1600)
                    }}
                >
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <div className={styles.bioText}>
                {paragraphs.map((paragraph, index) => (
                    <p key={index} style={{ margin: 0 }}>
                        {paragraph}
                    </p>
                ))}
            </div>
        </div>
    )
}

/**
 * The EPK — the vertical's underserved feature, treated as a first-class
 * page: bios in three lengths with one-click copy, approved photography
 * and logo marks as REAL downloadable files, the stage/tech rider, and
 * the people to call. Everything on the page is cleared for use.
 */
function PressPage({ basePath }: { basePath: string }): React.ReactElement {
    return (
        <BandShellPage currentPath="/press" basePath={basePath}>
            <PageMeta title={`Press kit — ${band.name}`} siteName={band.name} description={pressKit.intro} />
            <header className={styles.pageHeader}>
                <span className={styles.kicker}>Press kit · EPK</span>
                <div className={styles.headlineRow}>
                    <h1 className={styles.headline}>For promoters & press</h1>
                </div>
                <p className={styles.lede}>{pressKit.intro}</p>
            </header>

            <h2 className={styles.sectionLabel}>Bios</h2>
            <BioBlock label="Short — 40 words" paragraphs={[pressKit.bios.short]} />
            <BioBlock label="Medium — 100 words" paragraphs={[pressKit.bios.medium]} />
            <BioBlock label="Long — full" paragraphs={pressKit.bios.long} />

            <h2 className={styles.sectionLabel}>Approved photos</h2>
            <div className={styles.photoGrid}>
                {pressKit.photos.map((photo) => (
                    <figure key={photo.downloadHref} className={styles.photoCard} style={{ margin: 0 }}>
                        <img
                            className={styles.photoImage}
                            src={photo.display.src}
                            srcSet={photo.display.srcSet
                                .map((entry) => `${entry.src} ${entry.width}w`)
                                .join(", ")}
                            sizes="(max-width: 560px) 90vw, 30vw"
                            alt={photo.display.alt}
                            loading="lazy"
                        />
                        <figcaption className={styles.photoCredit}>{photo.credit}</figcaption>
                        <a className={styles.downloadLink} href={photo.downloadHref} download>
                            ↓ {photo.downloadLabel}
                        </a>
                    </figure>
                ))}
            </div>

            <h2 className={styles.sectionLabel}>Logos & marks</h2>
            <div className={styles.logoGrid}>
                {pressKit.logos.map((logo) => (
                    <div key={logo.downloadHref} className={styles.logoTile}>
                        <span
                            className={`${styles.logoTileGround} ${logo.onDark ? styles.logoTileDark : styles.logoTileLight}`}
                        >
                            <img
                                className={styles.logoImage}
                                src={logo.downloadHref}
                                alt={logo.label}
                                loading="lazy"
                            />
                        </span>
                        <span className={styles.logoLabel}>{logo.label}</span>
                        <a className={styles.downloadLink} href={logo.downloadHref} download>
                            ↓ {logo.downloadLabel}
                        </a>
                    </div>
                ))}
            </div>

            <h2 className={styles.sectionLabel}>Stage & tech</h2>
            <div className={styles.specGrid}>
                <div>
                    <ul className={styles.lineupList}>
                        {pressKit.stage.lineup.map((member) => (
                            <li key={member} className={styles.lineupItem}>
                                {member}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    {pressKit.stage.specs.map((spec) => (
                        <div key={spec.label} className={styles.specRow}>
                            <span className={styles.specLabel}>{spec.label}</span>
                            <span className={styles.specValue}>{spec.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <h2 className={styles.sectionLabel}>Contacts</h2>
            <div className={styles.contactGrid}>
                {pressKit.contacts.map((contact) => (
                    <div key={contact.role} className={styles.contactCard}>
                        <span className={styles.contactRole}>{contact.role}</span>
                        <span className={styles.contactName}>{contact.name}</span>
                        <span className={styles.contactEmail}>{contact.email}</span>
                    </div>
                ))}
            </div>
        </BandShellPage>
    )
}
