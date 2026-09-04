import React from "react"
import { marketingItemStamp } from "./marketingItemStamp"
import * as styles from "./MarketingTestimonials.styles.css"

export type MarketingTestimonialsVariant = "quote-grid" | "single-featured"

export interface MarketingQuote {
    quote: string
    author: string
    /** Role/company line under the author, e.g. "CTO, Northwind". */
    title?: string
}

export interface MarketingTestimonialsContent {
    kicker?: string
    title?: string
    quotes: MarketingQuote[]
}

export interface MarketingTestimonialsProps extends MarketingTestimonialsContent {
    variant?: MarketingTestimonialsVariant
    anchorId?: string
}

/**
 * "Do real people vouch for it?" — `quote-grid` is a grid of quote cards
 * with attribution; `single-featured` gives one voice the whole room:
 * a display-type quote, centered, no card chrome. It features the first
 * quote, so order the strongest one first.
 */
export function MarketingTestimonials({
    variant = "quote-grid",
    anchorId,
    kicker,
    title,
    quotes,
}: MarketingTestimonialsProps): React.ReactElement {
    const featured = quotes[0]
    if (variant === "single-featured" && featured !== undefined) {
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Testimonials"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <figure className={styles.featured} {...marketingItemStamp("quotes", 0)}>
                    <blockquote className={styles.featuredQuote}>“{featured.quote}”</blockquote>
                    <figcaption className={styles.featuredAttribution}>
                        <span className={styles.author}>{featured.author}</span>
                        {featured.title !== undefined ? (
                            <span className={styles.authorTitle}>{featured.title}</span>
                        ) : null}
                    </figcaption>
                </figure>
            </section>
        )
    }
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Testimonials"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            <div className={quotes.length === 2 ? styles.gridPair : styles.grid}>
                {quotes.map((entry, index) => (
                    <figure
                        key={entry.author}
                        className={styles.card}
                        {...marketingItemStamp("quotes", index)}
                    >
                        <blockquote className={styles.quote}>“{entry.quote}”</blockquote>
                        <figcaption className={styles.attribution}>
                            <span className={styles.author}>{entry.author}</span>
                            {entry.title !== undefined ? (
                                <span className={styles.authorTitle}>{entry.title}</span>
                            ) : null}
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    )
}
