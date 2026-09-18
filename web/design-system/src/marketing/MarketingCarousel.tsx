import React from "react"
import { marketingHref, type MarketingCta, type MarketingMedia } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingCarousel.styles.css"

export type MarketingCarouselVariant = "cards" | "spotlight"

export interface MarketingCarouselSlide {
    media?: MarketingMedia
    title: string
    body?: string
    cta?: MarketingCta
}

export interface MarketingCarouselContent {
    kicker?: string
    title?: string
    slides: MarketingCarouselSlide[]
}

export interface MarketingCarouselProps extends MarketingCarouselContent {
    variant?: MarketingCarouselVariant
    anchorId?: string
}

// Emoji and glyph media render as full-bleed generative art at this size —
// platform emoji and small centered marks both read as placeholders in a
// media slot, so the panel carries seeded artwork instead.
function SlideMedia({
    media,
    seedHint,
}: {
    media: MarketingMedia
    spotlight: boolean
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
            sizes="(min-width: 900px) 45vw, 90vw"
        />
    )
}

/**
 * A browsable lineup without the page length: a scroll-snapped strip (pure
 * CSS, no carousel machinery). `cards` fits a few slides per viewport;
 * `spotlight` makes each slide near-full-width for one-at-a-time reading.
 */
export function MarketingCarousel({
    variant = "cards",
    anchorId,
    kicker,
    title,
    slides,
}: MarketingCarouselProps): React.ReactElement {
    const spotlight = variant === "spotlight"
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Carousel"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            <div className={styles.track}>
                {slides.map((slide) => (
                    <article
                        key={slide.title}
                        className={spotlight ? `${styles.slide} ${styles.slideSpotlight}` : styles.slide}
                    >
                        {slide.media !== undefined ? (
                            <SlideMedia media={slide.media} spotlight={spotlight} seedHint={slide.title} />
                        ) : null}
                        <h3 className={styles.slideTitle}>{slide.title}</h3>
                        {slide.body !== undefined ? <p className={styles.slideBody}>{slide.body}</p> : null}
                        {slide.cta !== undefined ? (
                            <a className={styles.slideCta} href={marketingHref(slide.cta)}>
                                {slide.cta.label}
                            </a>
                        ) : null}
                    </article>
                ))}
            </div>
        </section>
    )
}
