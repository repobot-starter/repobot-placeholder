import React from "react"
import { marketingHref, type MarketingCta, type MarketingMedia } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingHighlights.styles.css"

export type MarketingHighlightsVariant = "alternating" | "stacked" | "setlist"

export interface MarketingHighlight {
    media?: MarketingMedia
    headline: string
    body: string
    cta?: MarketingCta
}

export interface MarketingHighlightsContent {
    kicker?: string
    title?: string
    highlights: MarketingHighlight[]
}

export interface MarketingHighlightsProps extends MarketingHighlightsContent {
    variant?: MarketingHighlightsVariant
    anchorId?: string
}

// Emoji and glyph media render as full-bleed generative art at this size —
// platform emoji and small centered marks both read as placeholders in a
// media slot, so the panel carries seeded artwork instead.
function HighlightMedia({
    media,
    seedHint,
}: {
    media: MarketingMedia
    seedHint?: string
}): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return <MarketingArtPanel seed={seed} className={styles.mediaImg} />
    }
    return (
        <MarketingImage
            className={styles.mediaImg}
            {...marketingImageProps(media)}
            sizes="(min-width: 900px) 50vw, 100vw"
        />
    )
}

/**
 * "Show me, one feature at a time": the feature deep-dive for a few features
 * that each deserve a full row. `alternating` swaps the media side every row;
 * `stacked` keeps media above the copy in one narrow column; `setlist` sets
 * each row as a show-poster line — the headline at display scale between
 * thin rules, the body as its small annotation — for pages whose program IS
 * the content (a wedding night's running order, a tour's dates). Type-only:
 * media stays out of the poster.
 */
export function MarketingHighlights({
    variant = "alternating",
    anchorId,
    kicker,
    title,
    highlights,
}: MarketingHighlightsProps): React.ReactElement {
    const kickerClass = title === undefined ? styles.kickerSolo : styles.kicker
    if (variant === "setlist") {
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Highlights"}>
                {kicker !== undefined ? <span className={kickerClass}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={styles.setlist}>
                    {highlights.map((highlight) => (
                        <article key={highlight.headline} className={styles.setlistRow}>
                            <h3 className={styles.setlistHeadline}>{highlight.headline}</h3>
                            <p className={styles.setlistBody}>{highlight.body}</p>
                            {highlight.cta !== undefined ? (
                                <a className={styles.cta} href={marketingHref(highlight.cta)}>
                                    {highlight.cta.label}
                                </a>
                            ) : null}
                        </article>
                    ))}
                </div>
            </section>
        )
    }
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Highlights"}>
            {kicker !== undefined ? <span className={kickerClass}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            <div className={variant === "stacked" ? styles.stack : styles.rows}>
                {highlights.map((highlight, index) => (
                    <article
                        key={highlight.headline}
                        className={variant === "stacked" ? styles.stackItem : styles.row}
                    >
                        {highlight.media !== undefined ? (
                            <div
                                className={
                                    variant === "alternating" && index % 2 === 1
                                        ? styles.mediaFlipped
                                        : undefined
                                }
                            >
                                <HighlightMedia media={highlight.media} seedHint={highlight.headline} />
                            </div>
                        ) : null}
                        <div
                            className={
                                highlight.media === undefined
                                    ? `${styles.copy} ${styles.copyFull}`
                                    : styles.copy
                            }
                        >
                            <h3 className={styles.headline}>{highlight.headline}</h3>
                            <p className={styles.body}>{highlight.body}</p>
                            {highlight.cta !== undefined ? (
                                <a className={styles.cta} href={marketingHref(highlight.cta)}>
                                    {highlight.cta.label}
                                </a>
                            ) : null}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
