import { MarketingPage, MarketingShell } from "@ui"
import React, { useEffect, useState } from "react"
import { activePack } from "../../Config/activePack"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingSectionView } from "../Landing/LandingRenderer"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { AudioPlayer, useStopAudioOnUnmount } from "../Music/AudioPlayer"
import { releaseStatus } from "../Music/schedule"
import { useLeadJoin } from "../Music/useLeadJoin"
import { VideoEmbed } from "../Music/VideoEmbed"
import { artist, listenLinks, record, tracklist, video } from "./content"
import { tailLanding } from "./singleLanding"
import { singleShell } from "./singleShell"
import * as styles from "./Single.styles.css"

/**
 * The release one-pager: one record, one page, monolith register (true
 * black and white, monumental type, zero accent hue). The masthead is the
 * pack's signature mechanic — a countdown computed from the content
 * file's release date (View/Music/schedule.ts): days/hours/minutes under
 * an "Out Friday" label with pre-save links, flipping to "OUT NOW" with
 * listen links at local midnight on the date. The clock re-renders every
 * half minute; no edits on release day.
 *
 * Below the fold: the title-track excerpt through the native waveform
 * player, the tracklist, the click-to-load visual, then the doc-aware
 * kernel tail (about + mailing list) merged through the landing document
 * so the platform's structural editor owns it.
 */
export default function SinglePage(): React.ReactElement {
    useStopAudioOnUnmount()
    const { joined, join } = useLeadJoin("single-mailing-list", "mailing-list")
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30_000)
        return () => window.clearInterval(timer)
    }, [])
    const status = releaseStatus(record.releaseDate, now)

    // The doc-aware tail: the kernel sections the structural editor can
    // reorder/extend, seeded in the catalog under page id "home".
    const resolvedTail = useSitePageConfig(activePack.key === "single" ? "home" : "", tailLanding())

    const listenLabel = status.released ? "Listen" : "Pre-save"
    const shell = singleShell(now)
    return (
        <MarketingPage preset={PACK_REGISTERS.single}>
            <PageMeta
                title={`${record.title} — ${artist.name}`}
                siteName={artist.name}
                description={record.statement}
            />
            <MarketingShell
                nav={shell.nav}
                footer={shell.footer}
                newsletterJoined={joined}
                onNewsletterSubmit={join}
            >
                <main className={styles.main}>
                    <header className={styles.masthead}>
                        <div className={styles.mastheadText}>
                            <span className={styles.kicker}>{artist.name} — the new record</span>
                            <h1 className={styles.title}>{record.title}</h1>
                            <p className={styles.statement}>{record.statement}</p>
                            <span className={styles.recordMeta}>
                                {record.format} · {record.label}
                            </span>

                            <div
                                className={styles.countdown}
                                data-release-countdown
                                data-released={status.released}
                            >
                                <span className={styles.countdownLabel} data-release-label>
                                    <span className={styles.countdownLabelRule} aria-hidden />
                                    {status.label}
                                </span>
                                {!status.released && (
                                    <div className={styles.countdownDigits} data-release-digits>
                                        <span className={styles.countdownCell}>
                                            <span className={styles.countdownNumber} data-release-days>
                                                {String(status.days).padStart(2, "0")}
                                            </span>
                                            <span className={styles.countdownUnit}>Days</span>
                                        </span>
                                        <span className={styles.countdownCell}>
                                            <span className={styles.countdownNumber} data-release-hours>
                                                {String(status.hours).padStart(2, "0")}
                                            </span>
                                            <span className={styles.countdownUnit}>Hours</span>
                                        </span>
                                        <span className={styles.countdownCell}>
                                            <span className={styles.countdownNumber} data-release-minutes>
                                                {String(status.minutes).padStart(2, "0")}
                                            </span>
                                            <span className={styles.countdownUnit}>Minutes</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.listenRail} data-listen-links>
                                {/* Slots without an href (the shipped state — see
                                    content.ts `listenLinks`) render as inert platform
                                    badges instead of dead links; pasting a real
                                    streaming URL into content.ts makes one live. */}
                                {listenLinks.map((link, index) =>
                                    link.href !== "" ? (
                                        <a
                                            key={link.label}
                                            className={`${styles.listenButton} ${index > 0 ? styles.listenButtonGhost : ""}`}
                                            href={link.href}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {listenLabel} · {link.label}
                                        </a>
                                    ) : (
                                        <span
                                            key={link.label}
                                            className={`${styles.listenButton} ${index > 0 ? styles.listenButtonGhost : ""}`}
                                        >
                                            {listenLabel} · {link.label}
                                        </span>
                                    ),
                                )}
                            </div>
                        </div>
                        <img
                            className={styles.cover}
                            src={record.cover.src}
                            srcSet={record.cover.srcSet
                                .map((entry) => `${entry.src} ${entry.width}w`)
                                .join(", ")}
                            sizes="(max-width: 880px) 90vw, 40vw"
                            alt={record.cover.alt}
                        />
                    </header>

                    <h2 className={styles.sectionLabel}>Hear it</h2>
                    <div className={styles.excerptWrap}>
                        <AudioPlayer track={record.excerpt} />
                    </div>

                    <h2 className={styles.sectionLabel}>Tracklist</h2>
                    <div className={styles.trackTable}>
                        {tracklist.map((track, index) => (
                            <div key={track.title} className={styles.trackRow}>
                                <span className={styles.trackNumber}>
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className={styles.trackTitle}>{track.title}</span>
                                <span className={styles.trackDuration}>{track.duration}</span>
                            </div>
                        ))}
                    </div>

                    <h2 className={styles.sectionLabel}>The visual</h2>
                    <div className={styles.videoWrap}>
                        <VideoEmbed
                            title={video.title}
                            meta={video.meta}
                            videoUrl={video.videoUrl}
                            poster={video.poster}
                        />
                    </div>
                </main>

                {resolvedTail.sections.map((section, index) => (
                    <div
                        key={`${section.type}-${index}`}
                        style={{ display: "contents" }}
                        data-rb-section={section.id ?? section.type}
                        data-rb-section-type={section.type}
                        data-rb-section-index={index}
                    >
                        <LandingSectionView section={section} joined={joined} onJoin={join} />
                    </div>
                ))}
            </MarketingShell>
        </MarketingPage>
    )
}
