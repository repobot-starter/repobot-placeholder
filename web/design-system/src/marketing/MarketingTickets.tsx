import React from "react"
import { marketingItemStamp, marketingTextStamp } from "./marketingItemStamp"
import { formatTierPrice } from "./marketingPrice"
import type { MarketingPricingProps } from "./MarketingPricing"
import * as styles from "./MarketingTickets.styles.css"

/**
 * A stub's barcode as bar widths (px) alternating bar/gap, seeded from the
 * stub text so every ticket prints its own code but a render never
 * changes. Decorative: the stub text beside it is the readable code.
 */
function barcodeBars(seed: string): number[] {
    let hash = 2166136261
    for (const char of seed) {
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
    }
    const bars: number[] = []
    for (let index = 0; index < 46; index += 1) {
        hash = Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0
        bars.push(1 + (hash % 3))
    }
    return bars
}

function Barcode({ seed }: { seed: string }): React.ReactElement {
    const bars = barcodeBars(seed)
    let x = 0
    const rects: React.ReactElement[] = []
    bars.forEach((width, index) => {
        if (index % 2 === 0) rects.push(<rect key={index} x={x} y={0} width={width} height={40} />)
        x += width
    })
    return (
        <svg className={styles.barcode} viewBox={`0 0 ${x} 40`} preserveAspectRatio="none" aria-hidden>
            {rects}
        </svg>
    )
}

/** The ballpark mark in the stub's corner: a diamond with its four bases. */
function Diamond(): React.ReactElement {
    return (
        <svg className={styles.diamond} viewBox="0 0 32 32" aria-hidden>
            <path d="M16 3 L29 16 L16 29 L3 16 Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <rect x="14" y="1" width="4" height="4" transform="rotate(45 16 3)" />
            <rect x="27" y="14" width="4" height="4" transform="rotate(45 29 16)" />
            <rect x="1" y="14" width="4" height="4" transform="rotate(45 3 16)" />
            <path d="M13.5 26.5 h5 v2.5 l-2.5 2 l-2.5 -2 Z" />
        </svg>
    )
}

/**
 * The `tickets` pricing variant: each tier printed as a season ticket —
 * a paper-stock body with the name, the big price and its unit, and the
 * features; the description on an accent band with a forward arrow (the
 * cadence: "Every week"); and a torn-off ink stub under a notched
 * perforation carrying a barcode, the tier's `stub` code ("FC-ATL-7D"),
 * and a ballpark diamond. The badge rides the ticket's top edge like a
 * sticker. A trading-card sibling of `tiers` for trades that sell a
 * season: lawn crews, pool service, club memberships, box seats. Same
 * tier content (no billing toggle — a ticket prints one price); a tier
 * without a `stub` prints its name on the stub instead; a tier's own
 * `period` overrides the section's (the season pass among per-cut tickets).
 */
export function MarketingTickets({
    anchorId,
    kicker,
    title,
    period = "/mo",
    tiers = [],
    currency,
}: MarketingPricingProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title || kicker || "Pricing"}>
            {kicker !== undefined ? (
                <span className={styles.kicker} {...marketingTextStamp("kicker")}>
                    {kicker}
                </span>
            ) : null}
            {title !== undefined && title !== "" ? (
                <h2 className={styles.title} {...marketingTextStamp("title")}>
                    {title}
                </h2>
            ) : null}
            <div className={styles.grid}>
                {tiers.map((tier, index) => {
                    const code = tier.stub ?? tier.name
                    const unit = tier.period ?? period
                    return (
                        <article
                            key={tier.name}
                            className={styles.ticket}
                            data-highlighted={tier.highlighted === true}
                            {...marketingItemStamp("tiers", index)}
                        >
                            {tier.badge !== undefined ? (
                                <span
                                    className={styles.badge}
                                    {...marketingTextStamp("badge", "tiers", index)}
                                >
                                    {tier.badge}
                                </span>
                            ) : null}
                            <div className={styles.paper}>
                                <div className={styles.body}>
                                    <h3
                                        className={styles.name}
                                        {...marketingTextStamp("name", "tiers", index)}
                                    >
                                        {tier.name}
                                    </h3>
                                    <div className={styles.price}>
                                        {tier.pricePrefix !== undefined && tier.monthly > 0 ? (
                                            <span className={styles.prefix}>
                                                <span {...marketingTextStamp("pricePrefix", "tiers", index)}>
                                                    {tier.pricePrefix}
                                                </span>{" "}
                                            </span>
                                        ) : null}
                                        {tier.monthly === 0
                                            ? "Free"
                                            : formatTierPrice(tier.monthly, currency)}
                                        {tier.monthly > 0 && unit !== "" ? (
                                            <span className={styles.period}> {unit}</span>
                                        ) : null}
                                    </div>
                                    {tier.features.length > 0 ? (
                                        <ul className={styles.features}>
                                            {tier.features.map((item, featureIndex) => (
                                                <li
                                                    key={item}
                                                    className={styles.feature}
                                                    {...marketingTextStamp(
                                                        `features.${featureIndex}`,
                                                        "tiers",
                                                        index,
                                                    )}
                                                >
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                                <p className={styles.band}>
                                    <span {...marketingTextStamp("description", "tiers", index)}>
                                        {tier.description}
                                    </span>
                                    <span className={styles.bandArrow} aria-hidden>
                                        →
                                    </span>
                                </p>
                                <div className={styles.stub}>
                                    <div className={styles.stubCode}>
                                        <Barcode seed={code} />
                                        <span
                                            className={styles.stubText}
                                            {...marketingTextStamp(
                                                tier.stub !== undefined ? "stub" : "name",
                                                "tiers",
                                                index,
                                            )}
                                        >
                                            {code}
                                        </span>
                                    </div>
                                    <Diamond />
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
