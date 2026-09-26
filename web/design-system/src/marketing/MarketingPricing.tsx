import React, { useState } from "react"
import type { MarketingCta, MarketingMedia } from "./marketingContent"
import { marketingItemStamp, marketingTextStamp } from "./marketingItemStamp"
import { formatTierPrice } from "./marketingPrice"
import { MarketingPackageBuilder } from "./MarketingPackageBuilder"
import { MarketingPriceList } from "./MarketingPriceList"
import { MarketingPriceTags } from "./MarketingPriceTags"
import * as styles from "./MarketingPricing.styles.css"
import { MarketingTickets } from "./MarketingTickets"

export type MarketingPricingVariant = "tiers" | "price-list" | "tickets" | "price-tags" | "builder"

/** One line of a `price-list` menu board (or one `price-tags` tag). */
export interface MarketingPriceListItem {
    /** What the customer is buying, e.g. "Clear a drain". */
    name: string
    /** Optional small print under the name, e.g. "Sink, tub, or shower line". */
    note?: string
    /** The printed price as displayed, e.g. "$189" or "$1,850". */
    price: string
    /** Optional honesty word set small before the price, e.g. "from". */
    qualifier?: string
    /** `builder` tiles only: the line's photograph on its tile. */
    media?: MarketingMedia
    /**
     * `builder` only: the line starts ticked. Once any line on the board
     * says so, only those lines start ticked; otherwise every line does.
     */
    selected?: boolean
}

/** A headed run of `price-list` lines (a menu board's "Drains", "Water heaters"). */
export interface MarketingPriceListGroup {
    heading?: string
    items: MarketingPriceListItem[]
    /** `builder` only: `one` makes the group a pick-one choice (radio) — the session among sessions. */
    choose?: "one" | "many"
}

export interface MarketingPricingTier {
    name: string
    /** Monthly price in dollars; 0 renders "Free", others en-US ("$5,800", "$29", "$9.50"). */
    monthly: number
    /** Yearly price per month in dollars (the discount price). */
    yearlyPerMonth: number
    description: string
    features: string[]
    /**
     * A word set before the price — "From" for a starting price (a deep
     * clean quoted by size, a project minimum). Omit for a flat price.
     */
    pricePrefix?: string
    /** The recommended tier: accent border and the badge treatment. */
    highlighted?: boolean
    badge?: string
    /**
     * `tickets` only: the code printed on the ticket's stub under the
     * barcode ("FC-ATL-7D"). Omit to print the tier name there.
     */
    stub?: string
    /**
     * `tickets` only: this tier's unit, over the section's `period` — a
     * season pass among per-cut tickets ("/season").
     */
    period?: string
}

export interface MarketingPricingContent {
    kicker?: string
    title?: string
    /**
     * Unit suffix rendered after each price (default "/mo"). Set "" for
     * one-off prices — service packages, flat fees, session rates — where
     * a monthly reading would be wrong.
     */
    period?: string
    /** `tiers` only (a `price-list` board may print them as lines when it has no `groups`). */
    tiers?: MarketingPricingTier[]
    /**
     * The ISO 4217 currency the tiers' prices are in (default "usd"): a
     * destination studio quoting in euros sets "eur" and every tier price
     * prints "€9,000". Authored `price-list` lines carry their own printed
     * prices and ignore it.
     */
    currency?: string
    /** `price-list`/`price-tags`/`builder` only: a line under the board's title, e.g. "Flat rate, parts and labor". */
    intro?: string
    /** `price-list`/`price-tags`/`builder` only: the menu board's lines, optionally in headed groups. */
    groups?: MarketingPriceListGroup[]
    /** `price-list`/`price-tags`/`builder` only: the board's closing line, e.g. "The quote is the price." */
    footnote?: string
    /** `price-list`/`price-tags`/`builder` only: one ask on the board's foot, e.g. an exact-quote link. */
    cta?: MarketingCta
    /** `builder` only: the label beside the running total (default "Running total"). */
    totalLabel?: string
    /**
     * `builder` only: `board` (default) sets the lines as ticked rows over
     * the total; `tiles` sets each group as a row of photograph tiles
     * beside a summary card of the ticked lines, the total, and the ask.
     */
    builderLayout?: "board" | "tiles"
    /** `builder` tiles only: the summary card's heading, e.g. "Your session". */
    summaryTitle?: string
}

export interface MarketingPricingProps extends MarketingPricingContent {
    variant?: MarketingPricingVariant
    anchorId?: string
}

/**
 * `tiers`: pricing tiers with a monthly/yearly toggle. The toggle renders
 * only when some tier actually discounts yearly. Under the `pop` treatment
 * (memphis) the same tiers print as trading cards: spot-ink frames in
 * rotation, the badge a sticker on the corner, the price on an ink banner.
 * Content tests should enforce that yearly never exceeds monthly (see the
 * launch pack's content test). `price-list`: a flat-rate menu board — item,
 * optional note, dotted leader, big printed price — for trades and counters
 * that sell by the job (MarketingPriceList). `tickets`: the same tiers
 * printed as season tickets — paper stock, the price big, the description
 * on an accent band, a notched tear-off stub with a barcode and the tier's
 * `stub` code (MarketingTickets). `price-tags`: the same lines hung as a
 * row of big colored swing tags — three or four headline prices
 * (MarketingPriceTags). `builder`: the same lines as a package the visitor
 * assembles — a checkbox per line over a running total of the ticked
 * prices, or photograph tiles beside a summary card
 * (MarketingPackageBuilder).
 */
export function MarketingPricing(props: MarketingPricingProps): React.ReactElement {
    if (props.variant === "price-list") {
        return <MarketingPriceList {...props} />
    }
    if (props.variant === "tickets") {
        return <MarketingTickets {...props} />
    }
    if (props.variant === "price-tags") {
        return <MarketingPriceTags {...props} />
    }
    if (props.variant === "builder") {
        return <MarketingPackageBuilder {...props} />
    }
    return <MarketingPricingTiers {...props} />
}

function MarketingPricingTiers({
    anchorId,
    kicker,
    title,
    period = "/mo",
    tiers = [],
    currency,
}: MarketingPricingProps): React.ReactElement {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
    const hasYearlyDiscount = tiers.some((tier) => tier.yearlyPerMonth !== tier.monthly)

    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Pricing"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}

            {hasYearlyDiscount ? (
                <div className={styles.billingToggle} role="group" aria-label="Billing period">
                    <button
                        type="button"
                        className={styles.billingOption}
                        aria-pressed={billing === "monthly"}
                        onClick={() => setBilling("monthly")}
                    >
                        Monthly
                    </button>
                    <button
                        type="button"
                        className={styles.billingOption}
                        aria-pressed={billing === "yearly"}
                        onClick={() => setBilling("yearly")}
                    >
                        Yearly
                    </button>
                </div>
            ) : null}

            <div className={styles.grid}>
                {tiers.map((tier, index) => {
                    const price = billing === "monthly" ? tier.monthly : tier.yearlyPerMonth
                    return (
                        <article
                            key={tier.name}
                            className={styles.tierCard}
                            data-highlighted={tier.highlighted === true}
                            {...marketingItemStamp("tiers", index)}
                        >
                            {tier.badge !== undefined ? (
                                <span
                                    className={styles.tierBadge}
                                    {...marketingTextStamp("badge", "tiers", index)}
                                >
                                    {tier.badge}
                                </span>
                            ) : null}
                            <h3 className={styles.tierName} {...marketingTextStamp("name", "tiers", index)}>
                                {tier.name}
                            </h3>
                            <div className={styles.tierPrice}>
                                {tier.pricePrefix !== undefined && price > 0 ? (
                                    <span className={styles.tierPrefix}>
                                        <span {...marketingTextStamp("pricePrefix", "tiers", index)}>
                                            {tier.pricePrefix}
                                        </span>{" "}
                                    </span>
                                ) : null}
                                {price === 0 ? "Free" : formatTierPrice(price, currency)}
                                {price > 0 && period !== "" ? (
                                    <span className={styles.tierPeriod}> {period}</span>
                                ) : null}
                            </div>
                            <p
                                className={styles.tierDescription}
                                {...marketingTextStamp("description", "tiers", index)}
                            >
                                {tier.description}
                            </p>
                            <ul className={styles.tierFeatures}>
                                {tier.features.map((item, featureIndex) => (
                                    <li
                                        key={item}
                                        className={styles.tierFeatureItem}
                                        {...marketingTextStamp(`features.${featureIndex}`, "tiers", index)}
                                    >
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}
