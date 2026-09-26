import React from "react"
import * as styles from "./MarketingFeatureGrid.styles.css"
import type { MarketingMedia } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { marketingItemStamp, marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingGlyph } from "./MarketingGlyph"
import { MarketingIcon, isMarketingIconName, type MarketingIconName } from "./marketingIcons"

export type MarketingFeatureGridVariant = "cards-3up" | "icon-list" | "bento" | "checklist"

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
    /**
     * `checklist` only: whether the item is ticked (default true). An
     * unticked item renders an open box — a checklist can show what is
     * still to come, not just what is done.
     */
    checked?: boolean
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
    /** `checklist` only: the card's own heading, printed on it ("Room ready"). */
    cardTitle?: string
    /** `checklist` only: one line under the card heading. */
    body?: string
    /**
     * `checklist` only: a photograph the card hangs beside (the finished
     * room, the treated yard). Image media only; other kinds are ignored.
     */
    media?: MarketingMedia
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
 * `checklist`: the features as a ticked list on one door-hanger card — the
 * thoroughness proof a service leaves behind (a turnover's "room ready",
 * a lawn visit's walk-through, a pest treatment's report). Items read as
 * checklist rows (title + optional one-line note); the card may hang
 * beside a photograph of the finished job.
 */
function FeatureChecklist({
    features,
    cardTitle,
    body,
    media,
}: Pick<MarketingFeatureGridContent, "features" | "cardTitle" | "body" | "media">): React.ReactElement {
    const photo =
        media !== undefined && (media.kind === "image" || media.kind === "browser") ? media : undefined
    return (
        <div
            className={
                photo !== undefined
                    ? `${styles.checklistLayout} ${styles.checklistLayoutMedia}`
                    : styles.checklistLayout
            }
        >
            {photo !== undefined ? (
                <div className={styles.checklistMedia} {...marketingMediaStamp("media", 0)}>
                    <MarketingImage className={styles.checklistMediaImg} {...marketingImageProps(photo)} />
                </div>
            ) : null}
            <div className={styles.checklistHanger}>
                <article className={styles.checklistCard}>
                    {cardTitle !== undefined ? (
                        <h3 className={styles.checklistCardTitle} {...marketingTextStamp("cardTitle")}>
                            {cardTitle}
                        </h3>
                    ) : null}
                    {body !== undefined ? (
                        <p className={styles.checklistBody} {...marketingTextStamp("body")}>
                            {body}
                        </p>
                    ) : null}
                    <ul className={styles.checklistItems}>
                        {features.map((feature, index) => {
                            const checked = feature.checked !== false
                            return (
                                <li
                                    key={feature.title}
                                    className={styles.checklistItem}
                                    data-checked={checked}
                                    {...marketingItemStamp("features", index)}
                                >
                                    <span
                                        className={styles.checklistBox}
                                        role="img"
                                        aria-label={checked ? "Done" : "Not yet"}
                                    >
                                        {checked ? (
                                            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
                                                <path
                                                    d="M4 10.5 L8.2 14.5 L16 5.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3.2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        ) : null}
                                    </span>
                                    <span className={styles.checklistText}>
                                        <span
                                            className={styles.checklistItemTitle}
                                            {...marketingTextStamp("title", "features", index)}
                                        >
                                            {feature.title}
                                        </span>
                                        {feature.description !== "" ? (
                                            <span
                                                className={styles.checklistItemNote}
                                                {...marketingTextStamp("description", "features", index)}
                                            >
                                                {feature.description}
                                            </span>
                                        ) : null}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </article>
            </div>
        </div>
    )
}

/**
 * Parallel-feature section. `cards-3up`: emoji cards on surfaces (6+
 * features). `icon-list`: compact two-column rows (quieter pages).
 * `bento`: mixed-size cells over a 4-column grid, with optional product
 * crops inside — the launch-page "shown, not told" treatment. `checklist`:
 * ticked rows on one door-hanger card, optionally beside a photograph —
 * the thoroughness proof.
 */
export function MarketingFeatureGrid({
    variant = "cards-3up",
    anchorId,
    kicker,
    title,
    features,
    cardTitle,
    body,
    media,
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
            {variant === "checklist" ? (
                <FeatureChecklist features={features} cardTitle={cardTitle} body={body} media={media} />
            ) : variant === "icon-list" ? (
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
