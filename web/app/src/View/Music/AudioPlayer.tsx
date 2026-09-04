import React, { useEffect, useRef, useState } from "react"
import { detectProvider, embedSrc, providerLabel } from "./embeds"
import { formatTimecode } from "./schedule"
import * as styles from "./AudioPlayer.styles.css"

/**
 * The category's hybrid audio system (PACK.md "paste your streaming
 * links"): a track whose content entry carries an `embedUrl` renders a
 * click-to-load provider embed behind the pack's own frame; otherwise the
 * native player plays the bundled original demo loop — hairline waveform
 * from precomputed peaks, mono timecode, no third-party chrome anywhere.
 */

export interface TrackImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet?: { src: string; width: number }[]
}

export interface PlayableTrack {
    title: string
    /** Small mono line beside the title — the year, the BPM, the room. */
    meta?: string
    /** Demo loop length in seconds (shown before the file ever loads). */
    seconds: number
    /** Bundled original demo loop. */
    audioSrc: string
    /** Precomputed waveform peaks, 0..1 (see .dev/audio/compose.mjs). */
    peaks: number[]
    /** External stream URL — when present the embed replaces the player. */
    embedUrl?: string
    cover?: TrackImage
}

function srcSetAttr(image: TrackImage): string | undefined {
    return image.srcSet?.map((entry) => `${entry.src} ${entry.width}w`).join(", ")
}

/** Pause every other bundled player — one song at a time, like a stage. */
function pauseOthers(current: HTMLAudioElement): void {
    for (const audio of document.querySelectorAll<HTMLAudioElement>("audio[data-music-audio]")) {
        if (audio !== current) audio.pause()
    }
}

function Waveform({
    peaks,
    progress,
    onSeek,
}: {
    peaks: number[]
    progress: number
    onSeek: (fraction: number) => void
}): React.ReactElement {
    const bars = peaks.length > 0 ? peaks : new Array<number>(96).fill(0.4)
    const seekFromPointer = (event: React.PointerEvent<HTMLDivElement>): void => {
        const rect = event.currentTarget.getBoundingClientRect()
        onSeek(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)))
    }
    const rects = bars.map((peak, index) => {
        const height = Math.max(6, peak * 96)
        return (
            <rect
                key={index}
                x={index + 0.18}
                y={(100 - height) / 2}
                width={0.64}
                height={height}
                fill="currentColor"
            />
        )
    })
    return (
        <div
            className={styles.wave}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
                seekFromPointer(event)
            }}
            onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFromPointer(event)
            }}
        >
            <svg
                className={styles.waveLayer}
                viewBox={`0 0 ${bars.length} 100`}
                preserveAspectRatio="none"
                aria-hidden
            >
                {rects}
            </svg>
            <svg
                className={`${styles.waveLayer} ${styles.waveProgress}`}
                viewBox={`0 0 ${bars.length} 100`}
                preserveAspectRatio="none"
                aria-hidden
                style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}
            >
                {rects}
            </svg>
        </div>
    )
}

function NativePlayer({ track }: { track: PlayableTrack }): React.ReactElement {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)
    const [time, setTime] = useState(0)
    const duration = audioRef.current?.duration || track.seconds

    const toggle = (): void => {
        const audio = audioRef.current
        if (audio === null) return
        if (audio.paused) {
            pauseOthers(audio)
            void audio.play()
        } else {
            audio.pause()
        }
    }

    return (
        <div
            className={`${styles.player} ${track.cover === undefined ? styles.playerNoCover : ""}`}
            data-music-player={track.title}
            data-music-state={playing ? "playing" : "paused"}
        >
            {track.cover !== undefined && (
                <img
                    className={styles.cover}
                    src={track.cover.src}
                    srcSet={srcSetAttr(track.cover)}
                    sizes="84px"
                    alt={track.cover.alt}
                    loading="lazy"
                />
            )}
            <div className={styles.body}>
                <div className={styles.titleRow}>
                    <span className={styles.title}>{track.title}</span>
                    {track.meta !== undefined && <span className={styles.meta}>{track.meta}</span>}
                </div>
                <div className={styles.controls}>
                    <button
                        type="button"
                        className={styles.playButton}
                        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
                        onClick={toggle}
                    >
                        {playing ? (
                            <svg width="13" height="14" viewBox="0 0 13 14" aria-hidden>
                                <rect x="1" y="0" width="4" height="14" fill="currentColor" />
                                <rect x="8" y="0" width="4" height="14" fill="currentColor" />
                            </svg>
                        ) : (
                            <svg width="13" height="14" viewBox="0 0 13 14" aria-hidden>
                                <path d="M1 0 L13 7 L1 14 Z" fill="currentColor" />
                            </svg>
                        )}
                    </button>
                    <Waveform
                        peaks={track.peaks}
                        progress={duration > 0 ? time / duration : 0}
                        onSeek={(fraction) => {
                            const audio = audioRef.current
                            if (audio === null) return
                            audio.currentTime = fraction * duration
                            setTime(fraction * duration)
                        }}
                    />
                    <span className={styles.timecode}>
                        <span className={styles.timecodeCurrent}>{formatTimecode(time)}</span>
                        {" / "}
                        {formatTimecode(duration)}
                    </span>
                </div>
            </div>
            <audio
                ref={audioRef}
                data-music-audio
                src={track.audioSrc}
                preload="none"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setTime(0)}
                onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
            />
        </div>
    )
}

/**
 * External stream behind the pack's own frame: nothing third-party renders
 * until the visitor presses play. Providers whose iframes can't be built
 * from a share URL (plain Bandcamp pages) link out instead.
 */
function StreamFrame({ track, embedUrl }: { track: PlayableTrack; embedUrl: string }): React.ReactElement {
    const [loaded, setLoaded] = useState(false)
    const provider = detectProvider(embedUrl)
    const src = embedSrc(embedUrl)
    const label = providerLabel(provider)

    if (loaded && src !== null) {
        return (
            <div className={styles.frame} data-music-player={track.title} data-music-state="embed">
                <iframe
                    className={styles.frameIframeWrap}
                    src={src}
                    title={`${track.title} — ${label}`}
                    height={provider === "soundcloud" ? 166 : provider === "spotify" ? 152 : 120}
                    allow="autoplay; encrypted-media; clipboard-write"
                    loading="lazy"
                />
            </div>
        )
    }

    const inner = (
        <>
            {track.cover !== undefined ? (
                <img
                    className={styles.cover}
                    src={track.cover.src}
                    srcSet={srcSetAttr(track.cover)}
                    sizes="84px"
                    alt={track.cover.alt}
                    loading="lazy"
                />
            ) : (
                <span />
            )}
            <span className={styles.body}>
                <span className={styles.titleRow}>
                    <span className={styles.title}>{track.title}</span>
                    {track.meta !== undefined && <span className={styles.meta}>{track.meta}</span>}
                </span>
                <span className={styles.frameHint}>
                    <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden>
                        <path d="M1 0 L11 6 L1 12 Z" fill="currentColor" />
                    </svg>
                    {src !== null ? `Play on ${label}` : `Listen on ${label} ↗`}
                </span>
            </span>
        </>
    )

    if (src === null) {
        return (
            <div className={styles.frame} data-music-player={track.title} data-music-state="link-out">
                <a
                    className={`${styles.frameButton} ${styles.linkOut}`}
                    href={embedUrl}
                    target="_blank"
                    rel="noreferrer"
                >
                    {inner}
                </a>
            </div>
        )
    }
    return (
        <div className={styles.frame} data-music-player={track.title} data-music-state="poster">
            <button type="button" className={styles.frameButton} onClick={() => setLoaded(true)}>
                {inner}
            </button>
        </div>
    )
}

export function AudioPlayer({ track }: { track: PlayableTrack }): React.ReactElement {
    if (track.embedUrl !== undefined && track.embedUrl !== "") {
        return <StreamFrame track={track} embedUrl={track.embedUrl} />
    }
    return <NativePlayer track={track} />
}

/** Stop demo playback on unmount-ish navigation — pack pages call this on
 * route changes so a loop never plays under another page. */
export function useStopAudioOnUnmount(): void {
    useEffect(() => {
        return () => {
            for (const audio of document.querySelectorAll<HTMLAudioElement>("audio[data-music-audio]")) {
                audio.pause()
            }
        }
    }, [])
}
