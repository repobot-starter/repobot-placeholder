import React, { useState } from "react"
import { type MarketingMedia } from "./marketingContent"
import { marketingMediaStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingShowcase.styles.css"

export type MarketingShowcaseVariant = "card-grid" | "filterable-grid" | "collections" | "media-rail"

/**
 * A status pill on the item's media — inventory state a visitor scans
 * before reading anything ("Sold", "Sale pending", "New this week").
 * `accent` (the default) pops in the brand color for live states;
 * `neutral` is the quiet ink pill for settled ones (sold, archived).
 */
export interface MarketingShowcaseBadge {
    label: string
    tone?: "accent" | "neutral"
}

export interface MarketingShowcaseItem {
    title: string
    description: string
    /** Small uppercase label above the title, e.g. a category or year. */
    eyebrow?: string
    /** Trailing detail beside the title, e.g. a price ("$4.50"). */
    meta?: string
    /** `filterable-grid` derives its filter chips from these. */
    tags?: string[]
    media?: MarketingMedia
    /** Makes the item title a link (project page, order link, ...). */
    url?: string
    /** Status pill over the media (or leading the card when there is none). */
    badge?: MarketingShowcaseBadge
}

export interface MarketingShowcaseContent {
    kicker?: string
    title?: string
    /** `filterable-grid` only: label of the show-everything chip. */
    allLabel?: string
    items: MarketingShowcaseItem[]
}

export interface MarketingShowcaseProps extends MarketingShowcaseContent {
    variant?: MarketingShowcaseVariant
    anchorId?: string
}

/** Filter chips derived from item tags, in first-appearance order. */
function collectTags(items: MarketingShowcaseItem[]): string[] {
    const tags: string[] = []
    for (const item of items) {
        for (const tag of item.tags ?? []) {
            if (!tags.includes(tag)) tags.push(tag)
        }
    }
    return tags
}

/** The status pill; `overlay` floats it on the media's top-left corner. */
function ShowcaseBadge({
    badge,
    overlay,
}: {
    badge: MarketingShowcaseBadge
    overlay: boolean
}): React.ReactElement {
    const tone = badge.tone === "neutral" ? styles.badgeNeutral : styles.badgeAccent
    const placement = overlay ? ` ${styles.badgeOverlay}` : ""
    return <span className={`${styles.badge} ${tone}${placement}`}>{badge.label}</span>
}

// Emoji and glyph media render as full-bleed generative art at this size —
// platform emoji and small centered marks both read as placeholders in a
// media slot, so the panel carries seeded artwork instead.
function ShowcaseMedia({
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
            sizes="(min-width: 980px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
    )
}

/**
 * A collection cover: media-dominant tile, whole card a link when `url`
 * is set. Built for albums/collections — the text sits quietly beneath a
 * large cover photograph.
 */
function CollectionTile({
    item,
    index,
    cellClass,
}: {
    item: MarketingShowcaseItem
    index: number
    /** Extra layout class for the card (the rail's flex/snap cell). */
    cellClass?: string
}): React.ReactElement {
    const cardClass =
        cellClass !== undefined ? `${styles.collectionCard} ${cellClass}` : styles.collectionCard
    const cover =
        item.media !== undefined ? (
            <div className={styles.collectionCover}>
                {item.media.kind === "glyph" || item.media.kind === "emoji" ? (
                    <MarketingArtPanel
                        seed={
                            item.media.kind === "glyph" ? item.media.seed : `${item.title}${item.media.emoji}`
                        }
                        className={styles.collectionImg}
                    />
                ) : (
                    <MarketingImage
                        className={styles.collectionImg}
                        {...marketingImageProps(item.media)}
                        sizes="(min-width: 760px) 50vw, 100vw"
                    />
                )}
                {item.badge !== undefined ? <ShowcaseBadge badge={item.badge} overlay /> : null}
            </div>
        ) : item.badge !== undefined ? (
            <ShowcaseBadge badge={item.badge} overlay={false} />
        ) : null
    const body = (
        <>
            {cover}
            {item.eyebrow !== undefined ? <span className={styles.eyebrow}>{item.eyebrow}</span> : null}
            <div className={styles.titleRow}>
                <h3 className={styles.collectionTitle}>{item.title}</h3>
                {item.meta !== undefined ? <span className={styles.meta}>{item.meta}</span> : null}
            </div>
            <p className={styles.itemDescription}>{item.description}</p>
        </>
    )
    if (item.url !== undefined) {
        return (
            <a
                className={cardClass}
                href={item.url}
                aria-label={item.title}
                {...marketingMediaStamp("items", index)}
            >
                {body}
            </a>
        )
    }
    return (
        <article className={cardClass} {...marketingMediaStamp("items", index)}>
            {body}
        </article>
    )
}

/**
 * "Show me the work / the goods": a grid of items for portfolios, menus,
 * and galleries. `card-grid` renders the items plainly; `filterable-grid`
 * adds tag filter chips derived from the items' tags (folio lineage);
 * `collections` renders large cover tiles whose whole card links out —
 * the album index for photography-shaped sites; `media-rail` runs the same
 * cover tiles along a scroll-snapped horizontal rail.
 */
export function MarketingShowcase({
    variant = "card-grid",
    anchorId,
    kicker,
    title,
    allLabel = "All",
    items,
}: MarketingShowcaseProps): React.ReactElement {
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const tags = variant === "filterable-grid" ? collectTags(items) : []
    const visible = activeTag === null ? items : items.filter((item) => (item.tags ?? []).includes(activeTag))

    if (variant === "collections" || variant === "media-rail") {
        const rail = variant === "media-rail"
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Collections"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={rail ? styles.rail : styles.collectionsGrid}>
                    {items.map((item, index) => (
                        <CollectionTile
                            key={item.title}
                            item={item}
                            index={index}
                            cellClass={rail ? styles.railCell : undefined}
                        />
                    ))}
                </div>
            </section>
        )
    }

    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Showcase"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}

            {tags.length > 0 ? (
                <div className={styles.chipRow} role="group" aria-label="Filter by tag">
                    <button
                        type="button"
                        className={styles.chip}
                        aria-pressed={activeTag === null}
                        onClick={() => setActiveTag(null)}
                    >
                        {allLabel}
                    </button>
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className={styles.chip}
                            aria-pressed={activeTag === tag}
                            onClick={() => setActiveTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className={styles.grid}>
                {visible.map((item) => {
                    const index = items.indexOf(item)
                    return (
                        <article
                            key={item.title}
                            className={styles.card}
                            {...marketingMediaStamp("items", index)}
                        >
                            {item.media !== undefined ? (
                                item.badge !== undefined ? (
                                    <div className={styles.mediaWrap}>
                                        <ShowcaseMedia media={item.media} seedHint={item.title} />
                                        <ShowcaseBadge badge={item.badge} overlay />
                                    </div>
                                ) : (
                                    <ShowcaseMedia media={item.media} seedHint={item.title} />
                                )
                            ) : item.badge !== undefined ? (
                                <ShowcaseBadge badge={item.badge} overlay={false} />
                            ) : null}
                            {item.eyebrow !== undefined ? (
                                <span className={styles.eyebrow}>{item.eyebrow}</span>
                            ) : null}
                            <div className={styles.titleRow}>
                                <h3 className={styles.itemTitle}>
                                    {item.url !== undefined ? (
                                        <a className={styles.itemLink} href={item.url}>
                                            {item.title}
                                        </a>
                                    ) : (
                                        item.title
                                    )}
                                </h3>
                                {item.meta !== undefined ? (
                                    <span className={styles.meta}>{item.meta}</span>
                                ) : null}
                            </div>
                            <p className={styles.itemDescription}>{item.description}</p>
                            {item.tags !== undefined && item.tags.length > 0 ? (
                                <div className={styles.tagRow}>
                                    {item.tags.map((tag) => (
                                        <span key={tag} className={styles.tag}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
