import React, { useState } from "react"
import { marketingItemStamp } from "./marketingItemStamp"
import * as styles from "./MarketingPricing.styles.css"

export type MarketingPricingVariant = "tiers"

export interface MarketingPricingTier {
    name: string
    /** Monthly price in dollars; 0 renders "Free". */
    monthly: number
    /** Yearly price per month in dollars (the discount price). */
    yearlyPerMonth: number
    description: string
    features: string[]
    /** The recommended tier: accent border and the badge treatment. */
    highlighted?: boolean
    badge?: string
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
    tiers: MarketingPricingTier[]
}

export interface MarketingPricingProps extends MarketingPricingContent {
    variant?: MarketingPricingVariant
    anchorId?: string
}

/**
 * Pricing tiers with a monthly/yearly toggle. The toggle renders only when
 * some tier actually discounts yearly. Content tests should enforce that
 * yearly never exceeds monthly (see the launch pack's content test).
 */
export function MarketingPricing({
    anchorId,
    kicker,
    title,
    period = "/mo",
    tiers,
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
                                <span className={styles.tierBadge}>{tier.badge}</span>
                            ) : null}
                            <h3 className={styles.tierName}>{tier.name}</h3>
                            <div className={styles.tierPrice}>
                                {price === 0 ? "Free" : `$${price}`}
                                {price > 0 && period !== "" ? (
                                    <span className={styles.tierPeriod}> {period}</span>
                                ) : null}
                            </div>
                            <p className={styles.tierDescription}>{tier.description}</p>
                            <ul className={styles.tierFeatures}>
                                {tier.features.map((item) => (
                                    <li key={item} className={styles.tierFeatureItem}>
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
