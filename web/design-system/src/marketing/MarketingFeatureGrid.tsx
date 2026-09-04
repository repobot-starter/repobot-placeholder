import React from "react"
import * as styles from "./MarketingFeatureGrid.styles.css"
import type { MarketingMedia } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { marketingItemStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingGlyph } from "./MarketingGlyph"
import { MarketingIcon, isMarketingIconName, type MarketingIconName } from "./marketingIcons"

export type MarketingFeatureGridVariant = "cards-3up" | "icon-list" | "bento"

export interface MarketingFeature {
    /** Named icon (see marketingIcons) rendered in an accent-tinted tile; wins over emoji. */
    icon?: MarketingIconName
    /** Emoji glyph — the fallback when no named icon is given. */
    emoji?: string
    title: string
    description: string
    /**
     * `bento` only: a product crop rendered inside the cell under the copy —
     * the "features shown, not told" treatment. Image media only; other
     * kinds are ignored.
     */
    media?: MarketingMedia
}

/**
 * Icon tile when the feature names a known icon; a seeded generative glyph
 * (the house mark, MarketingGlyph) for everything else. Emoji content is
 * deliberately retired as an icon treatment — platform emoji read as
 * template filler and cheapen the layout — so an `emoji` field now feeds
 * the glyph seed instead of rendering the raw character, upgrading every
 * existing site without a content migration. Manifest data is unchecked
 * JSON, so an unknown icon name takes the glyph path too rather than
 * rendering a hole.
 */
function FeatureGlyph({
    feature,
    variant,
}: {
    feature: MarketingFeature
    variant: MarketingFeatureGridVariant
}): React.ReactElement | null {
    const list = variant === "icon-list"
    if (feature.icon !== undefined && isMarketingIconName(feature.icon)) {
        return (
            <span className={list ? styles.listIconTile : styles.iconTile} aria-hidden>
                <MarketingIcon name={feature.icon} />
            </span>
        )
    }
    return (
        <span aria-hidden>
            <MarketingGlyph seed={`${feature.title}${feature.emoji ?? ""}`} size={list ? 34 : 44} />
        </span>
    )
}

export interface MarketingFeatureGridContent {
    kicker?: string
    title?: string
    features: MarketingFeature[]
}

export interface MarketingFeatureGridProps extends MarketingFeatureGridContent {
    variant?: MarketingFeatureGridVariant
    anchorId?: string
}

/**
 * `bento` cell spans over a 4-column grid, by cell count. Exactly enough
 * cells go wide (span 2) to make the total span a multiple of 4, so the
 * grid packs hole-free (the grid uses dense flow to backfill wraps).
 * Deterministic: the same content always lands the same layout. Wide slots
 * favor the first, last, and middle cells — where product crops land.
 */
function bentoSpan(index: number, count: number): boolean {
    if (count <= 2) {
        return true
    }
    let wide = (4 - (count % 4)) % 4
    if (wide === 0 && count >= 4) {
        // Already a multiple of 4 — widen four cells anyway; an all-narrow
        // grid is just cards-4up, not a bento.
        wide = 4
    }
    const preference = [0, count - 1, Math.floor(count / 2), 1, count - 2]
    const chosen = new Set<number>()
    for (const candidate of preference) {
        if (chosen.size >= wide) {
            break
        }
        chosen.add(candidate)
    }
    return chosen.has(index)
}

/**
 * Parallel-feature section. `cards-3up`: emoji cards on surfaces (6+
 * features). `icon-list`: compact two-column rows (quieter pages).
 * `bento`: mixed-size cells over a 4-column grid, with optional product
 * crops inside — the launch-page "shown, not told" treatment.
 */
export function MarketingFeatureGrid({
    variant = "cards-3up",
    anchorId,
    kicker,
    title,
    features,
}: MarketingFeatureGridProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Features"}>
            {kicker !== undefined ? (
                <span className={styles.kicker} {...marketingTextStamp("kicker")}>
                    {kicker}
                </span>
            ) : null}
            {title !== undefined ? (
                <h2 className={styles.title} {...marketingTextStamp("title")}>
                    {title}
                </h2>
            ) : null}
            {variant === "icon-list" ? (
                <div className={styles.listGrid}>
                    {features.map((feature, index) => (
                        <article
                            key={feature.title}
                            className={styles.listRow}
                            {...marketingItemStamp("features", index)}
                        >
                            <FeatureGlyph feature={feature} variant="icon-list" />
                            <div>
                                <h3
                                    className={styles.featureTitle}
                                    {...marketingTextStamp("title", "features", index)}
                                >
                                    {feature.title}
                                </h3>
                                <p
                                    className={styles.featureDescription}
                                    {...marketingTextStamp("description", "features", index)}
                                >
                                    {feature.description}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            ) : variant === "bento" ? (
                <div className={styles.bentoGrid}>
                    {features.map((feature, index) => {
                        const wide = bentoSpan(index, features.length)
                        const media =
                            feature.media !== undefined &&
                            (feature.media.kind === "image" || feature.media.kind === "browser")
                                ? feature.media
                                : undefined
                        return (
                            <article
                                key={feature.title}
                                className={
                                    wide ? `${styles.bentoCell} ${styles.bentoCellWide}` : styles.bentoCell
                                }
                                {...marketingItemStamp("features", index)}
                            >
                                <FeatureGlyph feature={feature} variant="cards-3up" />
                                <h3
                                    className={styles.featureTitle}
                                    {...marketingTextStamp("title", "features", index)}
                                >
                                    {feature.title}
                                </h3>
                                <p
                                    className={styles.featureDescription}
                                    {...marketingTextStamp("description", "features", index)}
                                >
                                    {feature.description}
                                </p>
                                {media !== undefined ? (
                                    <div className={styles.bentoMedia}>
                                        <MarketingImage
                                            className={styles.bentoMediaImg}
                                            {...marketingImageProps(media)}
                                        />
                                    </div>
                                ) : null}
                            </article>
                        )
                    })}
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {features.map((feature, index) => (
                        <article
                            key={feature.title}
                            className={styles.card}
                            {...marketingItemStamp("features", index)}
                        >
                            <FeatureGlyph feature={feature} variant="cards-3up" />
                            <h3
                                className={styles.featureTitle}
                                {...marketingTextStamp("title", "features", index)}
                            >
                                {feature.title}
                            </h3>
                            <p
                                className={styles.featureDescription}
                                {...marketingTextStamp("description", "features", index)}
                            >
                                {feature.description}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}
