import React, { useState } from "react"
import { youtubeEmbedSrc } from "./embeds"
import type { TrackImage } from "./AudioPlayer"
import * as styles from "./VideoEmbed.styles.css"

/**
 * Click-to-load video: the pack's own poster frame with a hairline play
 * control; the YouTube iframe (privacy-enhanced host) only mounts after
 * the visitor presses play. A URL that can't be parsed falls back to a
 * poster that links out, so a pasted mystery link never breaks the page.
 */
export function VideoEmbed({
    title,
    meta,
    videoUrl,
    poster,
}: {
    title: string
    /** Small mono caption line — "OFFICIAL VIDEO · 3:42" and the like. */
    meta?: string
    videoUrl: string
    poster: TrackImage
}): React.ReactElement {
    const [loaded, setLoaded] = useState(false)
    const src = youtubeEmbedSrc(videoUrl)

    if (loaded && src !== null) {
        return (
            <div className={styles.frame} data-music-video={title} data-music-state="embed">
                <iframe
                    className={styles.iframe}
                    src={src}
                    title={title}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                />
            </div>
        )
    }

    const inner = (
        <>
            <img
                className={styles.poster}
                src={poster.src}
                srcSet={poster.srcSet?.map((entry) => `${entry.src} ${entry.width}w`).join(", ")}
                sizes="(max-width: 900px) 100vw, 900px"
                alt={poster.alt}
                loading="lazy"
            />
            <span className={styles.scrim} aria-hidden />
            <span className={styles.chrome}>
                <span className={styles.playBadge}>
                    <svg width="15" height="16" viewBox="0 0 15 16" aria-hidden>
                        <path d="M1 0 L15 8 L1 16 Z" fill="currentColor" />
                    </svg>
                </span>
                <span className={styles.caption}>
                    <span className={styles.captionTitle}>{title}</span>
                    {meta !== undefined && <span className={styles.captionMeta}>{meta}</span>}
                </span>
            </span>
        </>
    )

    if (src === null) {
        return (
            <div className={styles.frame} data-music-video={title} data-music-state="link-out">
                <a className={styles.posterButton} href={videoUrl} target="_blank" rel="noreferrer">
                    {inner}
                </a>
            </div>
        )
    }
    return (
        <div className={styles.frame} data-music-video={title} data-music-state="poster">
            <button
                type="button"
                className={styles.posterButton}
                aria-label={`Play video: ${title}`}
                onClick={() => setLoaded(true)}
            >
                {inner}
            </button>
        </div>
    )
}
