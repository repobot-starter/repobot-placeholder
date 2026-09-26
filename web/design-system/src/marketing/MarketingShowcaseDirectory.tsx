import React, { useState } from "react"
import { marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import type { MarketingShowcaseItem, MarketingShowcaseProps } from "./MarketingShowcase"
import * as styles from "./MarketingShowcaseDirectory.styles.css"

/** The directory's columns: items grouped by `eyebrow`, in first-appearance order. */
export function directoryColumns(items: MarketingShowcaseItem[]): { heading: string; indices: number[] }[] {
    const columns: { heading: string; indices: number[] }[] = []
    items.forEach((item, index) => {
        const heading = item.eyebrow ?? ""
        const column = columns.find((entry) => entry.heading === heading)
        if (column !== undefined) column.indices.push(index)
        else columns.push({ heading, indices: [index] })
    })
    return columns
}

function DirectoryPortrait({ item }: { item: MarketingShowcaseItem }): React.ReactElement {
    if (item.media === undefined || item.media.kind === "glyph" || item.media.kind === "emoji") {
        const seed =
            item.media?.kind === "glyph"
                ? item.media.seed
                : `${item.title}${item.media?.kind === "emoji" ? item.media.emoji : ""}`
        return <MarketingArtPanel seed={seed} className={styles.portraitImg} />
    }
    return (
        <MarketingImage
            className={styles.portraitImg}
            {...marketingImageProps(item.media)}
            sizes="(min-width: 980px) 18vw, (min-width: 640px) 30vw, 60vw"
        />
    )
}

/**
 * The `directory` showcase variant: the people (or places) of a practice
 * set out by rank — one column per `eyebrow` (the level: "Master",
 * "Senior", "Artisan"; the office; the department), each entry a tall
 * portrait over its name, its specialties (`tags`, set small between
 * dots), its rate (`meta`), and one line of availability
 * (`description`, e.g. "Next suite: Thursday"). Filter chips derived from
 * the tags narrow every column at once; the columns themselves stay put,
 * so the ranks never reshuffle under the visitor. Items without an
 * eyebrow share one unheaded column.
 */
export function MarketingShowcaseDirectory({
    anchorId,
    kicker,
    title,
    allLabel = "All",
    items,
}: MarketingShowcaseProps): React.ReactElement {
    const [activeTag, setActiveTag] = useState<string | null>(null)
    const tags: string[] = []
    for (const item of items) {
        for (const tag of item.tags ?? []) {
            if (!tags.includes(tag)) tags.push(tag)
        }
    }
    const columns = directoryColumns(items)
    const shown = (item: MarketingShowcaseItem) => activeTag === null || (item.tags ?? []).includes(activeTag)
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? kicker ?? "Directory"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            {tags.length > 0 ? (
                <div className={styles.chipRow} role="group" aria-label="Filter by specialty">
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
            <div className={styles.columns}>
                {columns.map((column) => (
                    <div key={column.heading} className={styles.column}>
                        {column.heading !== "" ? (
                            <h3 className={styles.columnHeading}>{column.heading}</h3>
                        ) : null}
                        <ul className={styles.entries}>
                            {column.indices.map((index) => {
                                const item = items[index]
                                return (
                                    <li
                                        key={item.title}
                                        className={styles.entry}
                                        hidden={!shown(item)}
                                        {...marketingMediaStamp("items", index)}
                                    >
                                        <div className={styles.portrait}>
                                            <DirectoryPortrait item={item} />
                                        </div>
                                        <h4 className={styles.name}>
                                            {item.url !== undefined ? (
                                                <a
                                                    className={styles.nameLink}
                                                    href={item.url}
                                                    {...marketingTextStamp("title", "items", index)}
                                                >
                                                    {item.title}
                                                </a>
                                            ) : (
                                                <span {...marketingTextStamp("title", "items", index)}>
                                                    {item.title}
                                                </span>
                                            )}
                                        </h4>
                                        {item.tags !== undefined && item.tags.length > 0 ? (
                                            <p className={styles.specialties}>{item.tags.join(" · ")}</p>
                                        ) : null}
                                        {item.meta !== undefined ? (
                                            <p
                                                className={styles.rate}
                                                {...marketingTextStamp("meta", "items", index)}
                                            >
                                                {item.meta}
                                            </p>
                                        ) : null}
                                        <p
                                            className={styles.availability}
                                            {...marketingTextStamp("description", "items", index)}
                                        >
                                            {item.description}
                                        </p>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    )
}
