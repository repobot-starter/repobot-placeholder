import React, { useState } from "react"
import { type MarketingMedia } from "./marketingContent"
import { marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import { MarketingShowcaseDirectory } from "./MarketingShowcaseDirectory"
import { MarketingIcon, isMarketingIconName, type MarketingIconName } from "./marketingIcons"
import * as styles from "./MarketingShowcase.styles.css"
import { relativeLuminance } from "../theme/themeConfig"

export type MarketingShowcaseVariant =
    | "card-grid"
    | "filterable-grid"
    | "collections"
    | "media-rail"
    | "specimens"
    | "stories"
    | "swatches"
    | "directory"

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
    /**
     * Trailing detail beside the title, e.g. a price ("$4.50"). `specimens`
     * reads it as the item's use, set under the name after a slash
     * ("framing, beams" renders "/ framing, beams").
     */
    meta?: string
    /** `filterable-grid` derives its filter chips from these. */
    tags?: string[]
    /**
     * The item's picture. `swatches` sets an image as a small texture chip
     * beside the name — the shade itself, swatched — over the `color` field.
     */
    media?: MarketingMedia
    /** Makes the item title a link (project page, order link, ...). */
    url?: string
    /** Status pill over the media (or leading the card when there is none). */
    badge?: MarketingShowcaseBadge
    /**
     * `stories` only: the jump line under the story ("Full story & video →",
     * "Continued on page 7 →"). Defaults to "Continued →" when `url` is set.
     */
    linkLabel?: string
    /**
     * `swatches` only: the chip's flat color, a six-digit `#rrggbb` hex. The field
     * fills with it and sets its type in whichever ink reads best on it;
     * without one the chip takes the accent.
     */
    color?: string
    /**
     * `card-grid`/`filterable-grid` only: a named line icon (see
     * marketingIcons) set above the title, the card's emblem.
     */
    icon?: MarketingIconName
    /**
     * `card-grid`/`filterable-grid` only: a short list under the
     * description, what the card covers ("Prenatal visits", "Birth
     * planning"), a few words each.
     */
    points?: string[]
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
 * A specimen card: a tall portrait of the material itself, its name, its
 * use after a slash, one line of description. The wood-species board, the
 * stone yard, the tile library, the fabric book.
 */
function SpecimenCard({ item, index }: { item: MarketingShowcaseItem; index: number }): React.ReactElement {
    return (
        <article className={styles.specimen} {...marketingMediaStamp("items", index)}>
            <div className={styles.specimenPlate}>
                {item.media === undefined ? (
                    <MarketingArtPanel seed={item.title} className={styles.specimenImg} />
                ) : item.media.kind === "glyph" || item.media.kind === "emoji" ? (
                    <MarketingArtPanel
                        seed={
                            item.media.kind === "glyph" ? item.media.seed : `${item.title}${item.media.emoji}`
                        }
                        className={styles.specimenImg}
                    />
                ) : (
                    <MarketingImage
                        className={styles.specimenImg}
                        {...marketingImageProps(item.media)}
                        sizes="(min-width: 980px) 25vw, 50vw"
                    />
                )}
                {item.badge !== undefined ? <ShowcaseBadge badge={item.badge} overlay /> : null}
            </div>
            {item.eyebrow !== undefined ? (
                <span className={styles.specimenIndex} {...marketingTextStamp("eyebrow", "items", index)}>
                    {item.eyebrow}
                </span>
            ) : null}
            <h3 className={styles.specimenName}>
                {item.url !== undefined ? (
                    <a
                        className={styles.itemLink}
                        href={item.url}
                        {...marketingTextStamp("title", "items", index)}
                    >
                        {item.title}
                    </a>
                ) : (
                    <span {...marketingTextStamp("title", "items", index)}>{item.title}</span>
                )}
            </h3>
            {item.meta !== undefined ? (
                <span className={styles.specimenUse}>
                    <span aria-hidden>/ </span>
                    <span {...marketingTextStamp("meta", "items", index)}>{item.meta}</span>
                </span>
            ) : null}
            <p className={styles.specimenDescription} {...marketingTextStamp("description", "items", index)}>
                {item.description}
            </p>
        </article>
    )
}

/**
 * The ink a swatch sets its type in: dark on light chips, white on dark
 * ones, split where the two contrasts cross (luminance ~0.19) — the fan-
 * deck rule, which keeps small notes legible on mid-tone chips that a
 * white-by-default rule would fail.
 */
const SWATCH_INK_DARK = "#141414" // theme-exempt: type printed on a literal paint chip follows the chip, not the theme
const SWATCH_INK_LIGHT = "#ffffff" // theme-exempt: type printed on a literal paint chip follows the chip, not the theme

/** A six-digit hex — the only chip color the luminance split can read. */
const SWATCH_COLOR = /^#[0-9a-f]{6}$/i

function swatchInk(color: string): string {
    return relativeLuminance(color) > 0.19 ? SWATCH_INK_DARK : SWATCH_INK_LIGHT
}

function SwatchField({ item, index }: { item: MarketingShowcaseItem; index: number }): React.ReactElement {
    const color = item.color !== undefined && SWATCH_COLOR.test(item.color) ? item.color : undefined
    const fill = color !== undefined ? { background: color, color: swatchInk(color) } : undefined
    const texture = item.media?.kind === "image" ? item.media : undefined
    return (
        <article
            className={color !== undefined ? styles.swatch : `${styles.swatch} ${styles.swatchAccent}`}
            style={fill}
        >
            {texture !== undefined ? (
                <div className={styles.swatchMedia} {...marketingMediaStamp("items", index)}>
                    <MarketingImage className={styles.swatchMediaImg} {...marketingImageProps(texture)} />
                </div>
            ) : null}
            <h3 className={styles.swatchName}>
                {item.url !== undefined ? (
                    <a
                        className={styles.swatchLink}
                        href={item.url}
                        {...marketingTextStamp("title", "items", index)}
                    >
                        {item.title}
                    </a>
                ) : (
                    <span {...marketingTextStamp("title", "items", index)}>{item.title}</span>
                )}
            </h3>
            {item.meta !== undefined ? (
                <span className={styles.swatchCode} {...marketingTextStamp("meta", "items", index)}>
                    {item.meta}
                </span>
            ) : null}
            <span className={styles.swatchRule} aria-hidden />
            <p className={styles.swatchNote} {...marketingTextStamp("description", "items", index)}>
                {item.description}
            </p>
        </article>
    )
}

/**
 * A story's column span on the six-track stories grid, by rendered
 * position: three stories share a row as thirds; a count one past a
 * multiple of three opens on a full-width lead story, two past opens on
 * two halves — so every row fills and the page varies its story sizes the
 * way a front page does, with no orphaned column.
 */
function storySpan(index: number, count: number): "lead" | "half" | "third" {
    const remainder = count % 3
    if (remainder === 1 && index === 0) return "lead"
    if (remainder === 2 && index < 2) return "half"
    return "third"
}

const STORY_TRACKS = { lead: 6, half: 3, third: 2 } as const

/** Which stories open a row — the column rules run only between stories. */
function storyRowStarts(count: number): boolean[] {
    let used = 0
    return Array.from({ length: count }, (_, index) => {
        const start = used === 0
        used += STORY_TRACKS[storySpan(index, count)]
        if (used >= 6) used = 0
        return start
    })
}

/** One newspaper story: kicker, headline, photo, dateline'd body, jump. */
function StoryArticle({
    item,
    index,
    span,
    rowStart,
}: {
    item: MarketingShowcaseItem
    index: number
    span: "lead" | "half" | "third"
    rowStart: boolean
}): React.ReactElement {
    const spanClass = [
        span === "lead" ? styles.storyLead : span === "half" ? styles.storyHalf : styles.storyThird,
        rowStart ? styles.storyRowStart : "",
    ]
        .filter(Boolean)
        .join(" ")
    const headline = (
        <h3
            className={
                span === "lead"
                    ? styles.storyHeadlineLead
                    : span === "half"
                      ? styles.storyHeadlineHalf
                      : styles.storyHeadline
            }
        >
            {item.url !== undefined ? (
                <a className={styles.storyHeadlineLink} href={item.url}>
                    {item.title}
                </a>
            ) : (
                item.title
            )}
        </h3>
    )
    const photo =
        item.media !== undefined ? (
            <div className={span === "lead" ? styles.storyPhotoLead : styles.storyPhoto}>
                {item.media.kind === "glyph" || item.media.kind === "emoji" ? (
                    <MarketingArtPanel
                        seed={
                            item.media.kind === "glyph" ? item.media.seed : `${item.title}${item.media.emoji}`
                        }
                        className={styles.storyImg}
                    />
                ) : (
                    <MarketingImage
                        className={styles.storyImg}
                        {...marketingImageProps(item.media)}
                        sizes={
                            span === "lead"
                                ? "(min-width: 900px) 60vw, 100vw"
                                : span === "half"
                                  ? "(min-width: 900px) 50vw, 100vw"
                                  : "(min-width: 900px) 33vw, 100vw"
                        }
                    />
                )}
                {item.badge !== undefined ? <ShowcaseBadge badge={item.badge} overlay /> : null}
            </div>
        ) : null
    const text = (
        <>
            <p className={span === "lead" ? `${styles.storyBody} ${styles.storyBodyLead}` : styles.storyBody}>
                {item.meta !== undefined ? (
                    <span className={styles.storyDateline}>{item.meta} — </span>
                ) : null}
                {item.description}
            </p>
            {item.url !== undefined ? (
                <a className={styles.storyJump} href={item.url}>
                    {item.linkLabel ?? "Continued →"}
                </a>
            ) : null}
        </>
    )
    return (
        <article className={`${styles.story} ${spanClass}`} {...marketingMediaStamp("items", index)}>
            {span === "lead" ? (
                <div className={styles.storyLeadGrid}>
                    {photo}
                    <div className={styles.storyLeadText}>
                        {item.eyebrow !== undefined ? (
                            <span className={styles.storyKicker}>{item.eyebrow}</span>
                        ) : null}
                        {headline}
                        {text}
                    </div>
                </div>
            ) : (
                <>
                    {item.eyebrow !== undefined ? (
                        <span className={styles.storyKicker}>{item.eyebrow}</span>
                    ) : null}
                    {headline}
                    {photo}
                    {text}
                </>
            )}
        </article>
    )
}

/**
 * "Show me the work / the goods": a grid of items for portfolios, menus,
 * and galleries. `card-grid` renders the items plainly (an item's `icon`
 * and `points` add an emblem over the title and a short list under the
 * description, the practice's stage cards); `filterable-grid`
 * adds tag filter chips derived from the items' tags (folio lineage);
 * `collections` renders large cover tiles whose whole card links out —
 * the album index for photography-shaped sites; `media-rail` runs the same
 * cover tiles along a scroll-snapped horizontal rail; `specimens` is the
 * materials board — tall portrait plates, each named with its use;
 * `stories` sets the items as newspaper stories between column rules —
 * kicker, headline, photo, a body led by the item's `meta` as its
 * dateline, and a jump line (`linkLabel`) — with story sizes varied by
 * count (a full-width lead or two halves open the grid so every row fills);
 * `swatches` is the paint-chip row — flat fields of each item's `color`
 * run wall to wall, each printed with its name, its code (`meta`), a rule,
 * and a one-line note (`description`); a `url` makes the whole chip a link.
 * An item's image `media` is its texture chip (the smear, the stain
 * sample), set on the field above the name.
 * Phones stack the chips as strips.
 *
 * `directory` sets the items out by rank (MarketingShowcaseDirectory): one
 * column per `eyebrow`, each entry an arched portrait over its name, its
 * specialties (`tags`), its rate (`meta`) and its availability
 * (`description`), with tag filters that narrow every column at once.
 */
export function MarketingShowcase(props: MarketingShowcaseProps): React.ReactElement {
    if (props.variant === "directory") return <MarketingShowcaseDirectory {...props} />
    return <MarketingShowcaseLayouts {...props} />
}

function MarketingShowcaseLayouts({
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

    if (variant === "swatches") {
        return (
            <section id={anchorId} className={styles.swatchesWrap} aria-label={title ?? kicker ?? "Swatches"}>
                {kicker !== undefined || title !== undefined ? (
                    <div className={styles.swatchesHeader}>
                        {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                        {title !== undefined ? <h2 className={styles.swatchesTitle}>{title}</h2> : null}
                    </div>
                ) : null}
                <div className={styles.swatches}>
                    {items.map((item, index) => (
                        <SwatchField key={item.title} item={item} index={index} />
                    ))}
                </div>
            </section>
        )
    }

    if (variant === "specimens") {
        return (
            <section id={anchorId} className={styles.wrapSpecimens} aria-label={title ?? "Specimens"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.titleSpecimens}>{title}</h2> : null}
                <div className={styles.specimens}>
                    {items.map((item, index) => (
                        <SpecimenCard key={item.title} item={item} index={index} />
                    ))}
                </div>
            </section>
        )
    }

    if (variant === "stories") {
        const rowStarts = storyRowStarts(items.length)
        return (
            <section id={anchorId} className={styles.storiesWrap} aria-label={title ?? "Stories"}>
                {kicker !== undefined || title !== undefined ? (
                    <div className={styles.storiesFlag}>
                        {title !== undefined ? <h2 className={styles.storiesTitle}>{title}</h2> : null}
                        {kicker !== undefined ? <span className={styles.storiesKicker}>{kicker}</span> : null}
                    </div>
                ) : null}
                <div className={styles.storiesGrid}>
                    {items.map((item, index) => (
                        <StoryArticle
                            key={item.title}
                            item={item}
                            index={index}
                            span={storySpan(index, items.length)}
                            rowStart={rowStarts[index] ?? false}
                        />
                    ))}
                </div>
            </section>
        )
    }

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
                            {item.icon !== undefined && isMarketingIconName(item.icon) ? (
                                <span className={styles.itemIcon}>
                                    <MarketingIcon name={item.icon} size={22} />
                                </span>
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
                            {item.points !== undefined && item.points.length > 0 ? (
                                <ul className={styles.pointList}>
                                    {item.points.map((point) => (
                                        <li key={point} className={styles.point}>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
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
