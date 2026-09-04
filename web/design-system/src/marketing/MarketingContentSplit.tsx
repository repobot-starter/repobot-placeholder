import React from "react"
import { SectionBackdrop, type MarketingBackdrop } from "./MarketingBackdrop"
import { MarketingBrowserFrame } from "./MarketingBrowserFrame"
import { marketingHref, type MarketingCta, type MarketingMedia } from "./marketingContent"
import { marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingContentSplit.styles.css"

export type MarketingContentSplitVariant = "media-right" | "media-left"

export interface MarketingContentSplitContent {
    kicker?: string
    headline: string
    body: string
    bullets?: string[]
    cta?: MarketingCta
    media?: MarketingMedia
    /** Full-bleed artwork: the split renders as an edge-to-edge band over it. */
    backdrop?: MarketingBackdrop
}

export interface MarketingContentSplitProps extends MarketingContentSplitContent {
    variant?: MarketingContentSplitVariant
    anchorId?: string
}

// Emoji and glyph media render as full-bleed generative art at this size —
// platform emoji and small centered marks both read as placeholders in a
// media slot, so the panel carries seeded artwork instead.
function SplitMedia({ media, seedHint }: { media: MarketingMedia; seedHint?: string }): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return <MarketingArtPanel seed={seed} className={styles.mediaImg} />
    }
    if (media.kind === "browser") {
        return (
            <MarketingBrowserFrame
                src={media.src}
                alt={media.alt}
                url={media.url}
                width={media.width}
                height={media.height}
                srcSet={media.srcSet}
            />
        )
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
 * One substantial claim, told properly: a full copy block (headline, body,
 * optional checked bullets, one CTA) beside one media panel. The variant
 * picks which side the media sits on; narrow widths stack media first.
 */
export function MarketingContentSplit({
    variant = "media-right",
    anchorId,
    kicker,
    headline,
    body,
    bullets,
    cta,
    media,
    backdrop,
}: MarketingContentSplitProps): React.ReactElement {
    const mediaCell =
        media !== undefined ? (
            <div {...marketingMediaStamp("media", 0)}>
                <SplitMedia media={media} seedHint={headline} />
            </div>
        ) : (
            <div />
        )
    const copy = (
        <div>
            {kicker !== undefined ? (
                <span className={styles.kicker} {...marketingTextStamp("kicker")}>
                    {kicker}
                </span>
            ) : null}
            <h2 className={styles.headline} {...marketingTextStamp("headline")}>
                {headline}
            </h2>
            <p className={styles.body} {...marketingTextStamp("body")}>
                {body}
            </p>
            {bullets !== undefined && bullets.length > 0 ? (
                <ul className={styles.bullets}>
                    {bullets.map((bullet) => (
                        <li key={bullet} className={styles.bullet}>
                            <span className={styles.bulletMark} aria-hidden>
                                ✓
                            </span>
                            {bullet}
                        </li>
                    ))}
                </ul>
            ) : null}
            {cta !== undefined ? (
                <div className={styles.ctaRow}>
                    <a className={styles.cta} href={marketingHref(cta)} {...marketingTextStamp("cta.label")}>
                        {cta.label}
                    </a>
                </div>
            ) : null}
        </div>
    )

    const cells =
        variant === "media-left" ? (
            <>
                {mediaCell}
                {copy}
            </>
        ) : (
            <>
                {copy}
                {mediaCell}
            </>
        )

    if (backdrop) {
        return (
            <SectionBackdrop backdrop={backdrop} anchorId={anchorId} ariaLabel={headline}>
                <div
                    className={
                        variant === "media-left" ? `${styles.grid} ${styles.gridMediaLeft}` : styles.grid
                    }
                >
                    {cells}
                </div>
            </SectionBackdrop>
        )
    }
    return (
        <section
            id={anchorId}
            className={variant === "media-left" ? `${styles.wrap} ${styles.wrapMediaLeft}` : styles.wrap}
            aria-label={headline}
        >
            {cells}
        </section>
    )
}
