import React from "react"
import { marketingHref, type MarketingMedia } from "./marketingContent"
import { marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import type { MarketingContentSplitProps } from "./MarketingContentSplit"
import * as styles from "./MarketingContentFeature.styles.css"

function FeatureImage({
    media,
    seedHint,
    className,
    sizes,
}: {
    media: MarketingMedia
    seedHint: string
    className: string
    sizes: string
}): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint}${media.emoji}`
        return <MarketingArtPanel seed={seed} className={className} />
    }
    return <MarketingImage className={className} {...marketingImageProps(media)} sizes={sizes} />
}

/**
 * The `feature` content-split variant: one project told as a magazine
 * feature. A centered kicker ("The Estates · No. 41") and headline over a
 * rule, the body set in two columns with a drop cap (paragraphs split on
 * blank lines; the last reads as the closing line), the `media` as a
 * full-width spread, the `pullQuote` centered between rules, the
 * `figures` — detail photographs with a small-caps title and a caption —
 * side by side, and the `plate` (a drawing: the elevation, the plan) set
 * last with its caption, then the optional ask. Every part past the
 * headline and body is optional, so a plain split's content still reads
 * as a feature opening.
 */
export function MarketingContentFeature({
    anchorId,
    kicker,
    headline,
    body,
    cta,
    media,
    pullQuote,
    figures,
    plate,
}: MarketingContentSplitProps): React.ReactElement {
    const paragraphs = body
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter((paragraph) => paragraph !== "")
    return (
        <section id={anchorId} className={styles.wrap} aria-label={headline}>
            <header className={styles.head}>
                {kicker !== undefined ? (
                    <span className={styles.kicker} {...marketingTextStamp("kicker")}>
                        {kicker}
                    </span>
                ) : null}
                <h2 className={styles.headline} {...marketingTextStamp("headline")}>
                    {headline}
                </h2>
                <span className={styles.rule} aria-hidden />
            </header>
            <div
                className={paragraphs.length > 1 ? `${styles.body} ${styles.bodyColumns}` : styles.body}
                {...(paragraphs.length === 1 ? marketingTextStamp("body") : {})}
            >
                {paragraphs.map((paragraph) => (
                    <p key={paragraph} className={styles.paragraph}>
                        {paragraph}
                    </p>
                ))}
            </div>
            {media !== undefined ? (
                <figure className={styles.spread} {...marketingMediaStamp("media", 0)}>
                    <FeatureImage
                        media={media}
                        seedHint={headline}
                        className={styles.spreadImg}
                        sizes="(min-width: 1200px) 1200px, 100vw"
                    />
                </figure>
            ) : null}
            {pullQuote !== undefined ? (
                <blockquote className={styles.pullQuote}>
                    <p className={styles.pullQuoteText} {...marketingTextStamp("pullQuote")}>
                        {pullQuote}
                    </p>
                </blockquote>
            ) : null}
            {figures !== undefined && figures.length > 0 ? (
                <div className={styles.figures}>
                    {figures.map((figure, index) => (
                        <figure key={figure.title ?? index} className={styles.figure}>
                            <div className={styles.figureFrame} {...marketingMediaStamp("figures", index)}>
                                <FeatureImage
                                    media={figure.media}
                                    seedHint={figure.title ?? headline}
                                    className={styles.figureImg}
                                    sizes="(min-width: 900px) 50vw, 100vw"
                                />
                            </div>
                            {figure.title !== undefined || figure.caption !== undefined ? (
                                <figcaption className={styles.figureCaption}>
                                    {figure.title !== undefined ? (
                                        <span
                                            className={styles.figureTitle}
                                            {...marketingTextStamp("title", "figures", index)}
                                        >
                                            {figure.title}
                                        </span>
                                    ) : null}
                                    {figure.caption !== undefined ? (
                                        <span
                                            className={styles.figureText}
                                            {...marketingTextStamp("caption", "figures", index)}
                                        >
                                            {figure.caption}
                                        </span>
                                    ) : null}
                                </figcaption>
                            ) : null}
                        </figure>
                    ))}
                </div>
            ) : null}
            {plate !== undefined ? (
                <figure className={styles.plate}>
                    <div className={styles.plateFrame} {...marketingMediaStamp("plate.media", 0)}>
                        <FeatureImage
                            media={plate.media}
                            seedHint={headline}
                            className={styles.plateImg}
                            sizes="(min-width: 900px) 900px, 100vw"
                        />
                    </div>
                    {plate.caption !== undefined ? (
                        <figcaption className={styles.plateCaption} {...marketingTextStamp("plate.caption")}>
                            {plate.caption}
                        </figcaption>
                    ) : null}
                </figure>
            ) : null}
            {cta !== undefined ? (
                <div className={styles.ctaRow}>
                    <a className={styles.cta} href={marketingHref(cta)} {...marketingTextStamp("cta.label")}>
                        {cta.label}
                    </a>
                </div>
            ) : null}
        </section>
    )
}
