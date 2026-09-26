import React from "react"
import { marketingHref } from "./marketingContent"
import { marketingItemStamp, marketingTextStamp } from "./marketingItemStamp"
import { formatTierPrice } from "./marketingPrice"
import type { MarketingPriceListGroup, MarketingPricingProps } from "./MarketingPricing"
import * as styles from "./MarketingPriceList.styles.css"

/**
 * Tiers become menu lines when a section rolls onto the board without
 * `groups` (a composer re-rolling a tiers section, or a placeholder): the
 * tier name is the line, its description the note, the monthly price the
 * printed price (formatted like the tiers), its `pricePrefix` the qualifier.
 */
export function tiersAsGroup({
    tiers = [],
    period = "/mo",
    currency,
}: MarketingPricingProps): MarketingPriceListGroup[] {
    if (tiers.length === 0) return []
    return [
        {
            items: tiers.map((tier) => ({
                name: tier.name,
                note: tier.description,
                price: tier.monthly === 0 ? "Free" : `${formatTierPrice(tier.monthly, currency)}${period}`,
                qualifier: tier.monthly === 0 ? undefined : tier.pricePrefix,
            })),
        },
    ]
}

/**
 * The `price-list` pricing variant: a flat-rate menu board. An ink header
 * band carries the kicker, title, and intro; each line is the item (with
 * optional small print), a dotted leader, and the printed price at display
 * size in the accent, with an optional honesty qualifier ("from") set small
 * before it. Several `groups` flow into columns on wide screens; the
 * footnote (and optional CTA) close the board on a second band. Reusable
 * for any trade that sells by the job — the plumber's price book, the
 * detailer's menu, the tailor's alterations card.
 */
export function MarketingPriceList(props: MarketingPricingProps): React.ReactElement {
    const { anchorId, kicker, title, intro, footnote, cta } = props
    const groups = props.groups !== undefined && props.groups.length > 0 ? props.groups : tiersAsGroup(props)
    const columns = groups.length > 1
    // Lines derived from tiers aren't authored `groups` copy.
    const stampsLines = props.groups !== undefined && props.groups.length > 0
    const line = (groupIndex: number, itemIndex: number, field: string): Record<string, string | number> =>
        stampsLines ? marketingTextStamp(`items.${itemIndex}.${field}`, "groups", groupIndex) : {}
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Prices"}>
            <div className={styles.board}>
                {kicker !== undefined || title !== undefined || intro !== undefined ? (
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
                <div className={columns ? `${styles.groups} ${styles.groupsColumns}` : styles.groups}>
                    {groups.map((group, groupIndex) => (
                        <div
                            key={group.heading ?? groupIndex}
                            className={styles.group}
                            {...marketingItemStamp("groups", groupIndex)}
                        >
                            {group.heading !== undefined ? (
                                <h3
                                    className={styles.groupHeading}
                                    {...(stampsLines
                                        ? marketingTextStamp("heading", "groups", groupIndex)
                                        : {})}
                                >
                                    {group.heading}
                                </h3>
                            ) : null}
                            <ul className={styles.lines}>
                                {group.items.map((item, itemIndex) => (
                                    <li key={item.name} className={styles.line}>
                                        <span className={styles.item}>
                                            <span
                                                className={styles.name}
                                                {...line(groupIndex, itemIndex, "name")}
                                            >
                                                {item.name}
                                            </span>
                                            {item.note !== undefined ? (
                                                <span
                                                    className={styles.note}
                                                    {...line(groupIndex, itemIndex, "note")}
                                                >
                                                    {item.note}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className={styles.leader} aria-hidden />
                                        <span className={styles.price}>
                                            {item.qualifier !== undefined ? (
                                                <span className={styles.qualifier}>
                                                    <span {...line(groupIndex, itemIndex, "qualifier")}>
                                                        {item.qualifier}
                                                    </span>{" "}
                                                </span>
                                            ) : null}
                                            <span {...line(groupIndex, itemIndex, "price")}>
                                                {item.price}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
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
            </div>
        </section>
    )
}
