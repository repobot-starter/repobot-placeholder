import React from "react"
import { marketingItemStamp, marketingTextStamp } from "./marketingItemStamp"
import * as styles from "./MarketingFaq.styles.css"

export type MarketingFaqVariant = "accordion"

export interface MarketingFaqItem {
    question: string
    answer: string
}

export interface MarketingFaqContent {
    kicker?: string
    title?: string
    items: MarketingFaqItem[]
}

export interface MarketingFaqProps extends MarketingFaqContent {
    variant?: MarketingFaqVariant
    anchorId?: string
}

/** FAQ accordion (native `<details>`) — answers the residual objections. */
export function MarketingFaq({ anchorId, kicker, title, items }: MarketingFaqProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "FAQ"}>
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
            <div className={styles.list}>
                {items.map((item, index) => (
                    <details
                        key={item.question}
                        className={styles.item}
                        {...marketingItemStamp("items", index)}
                    >
                        <summary
                            className={styles.question}
                            {...marketingTextStamp("question", "items", index)}
                        >
                            {item.question}
                        </summary>
                        <p className={styles.answer} {...marketingTextStamp("answer", "items", index)}>
                            {item.answer}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    )
}
