import React from "react"
import { marketingHref } from "./marketingContent"
import { marketingTextStamp } from "./marketingItemStamp"
import type { MarketingPriceListItem, MarketingPricingProps } from "./MarketingPricing"
import * as styles from "./MarketingPriceTags.styles.css"

/**
 * The `price-tags` pricing variant: the same content as `price-list` (the
 * lines of every group, in order) hung as a row of big swing tags — each a
 * card in the next of three tones (the first spot ink, the accent faded to
 * the ground, the second spot ink), an eyelet punched at its left, the
 * item's name in tracked caps over the price at display size, the honesty
 * qualifier set small before it and the note under it. Three to four
 * headline prices read best ("Tune-up $89", "Diagnostic $0 with repair",
 * "New system from $6,900"); longer books belong on the `price-list` board.
 */
export function MarketingPriceTags(props: MarketingPricingProps): React.ReactElement {
    const { anchorId, kicker, title, intro, footnote, cta, groups = [] } = props
    const items: (MarketingPriceListItem & { at: [number, number] })[] = groups.flatMap((group, groupIndex) =>
        group.items.map((item, itemIndex) => ({ ...item, at: [groupIndex, itemIndex] as [number, number] })),
    )
    const line = (at: [number, number], field: string): Record<string, string | number> =>
        marketingTextStamp(`items.${at[1]}.${field}`, "groups", at[0])
    const hasHeader = kicker !== undefined || title !== undefined || intro !== undefined
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Prices"}>
            {hasHeader ? (
                <header className={styles.head}>
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
                    {intro !== undefined ? (
                        <p className={styles.intro} {...marketingTextStamp("intro")}>
                            {intro}
                        </p>
                    ) : null}
                </header>
            ) : null}
            <ul className={styles.tags}>
                {items.map((item, index) => (
                    <li key={item.name} className={styles.tag} data-tone={index % 3}>
                        <span className={styles.eyelet} aria-hidden />
                        <span className={styles.name} {...line(item.at, "name")}>
                            {item.name}
                        </span>
                        <span className={styles.price}>
                            {item.qualifier !== undefined ? (
                                <span className={styles.qualifier}>
                                    <span {...line(item.at, "qualifier")}>{item.qualifier}</span>{" "}
                                </span>
                            ) : null}
                            <span {...line(item.at, "price")}>{item.price}</span>
                        </span>
                        {item.note !== undefined ? (
                            <span className={styles.note} {...line(item.at, "note")}>
                                {item.note}
                            </span>
                        ) : null}
                    </li>
                ))}
            </ul>
            {footnote !== undefined || cta !== undefined ? (
                <footer className={styles.foot}>
                    {footnote !== undefined ? (
                        <p className={styles.footnote} {...marketingTextStamp("footnote")}>
                            {footnote}
                        </p>
                    ) : null}
                    {cta !== undefined ? (
                        <a
                            className={styles.cta}
                            href={marketingHref(cta)}
                            {...marketingTextStamp("cta.label")}
                        >
                            {cta.label}
                        </a>
                    ) : null}
                </footer>
            ) : null}
        </section>
    )
}
