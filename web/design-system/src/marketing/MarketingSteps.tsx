import React from "react"
import { marketingItemStamp } from "./marketingItemStamp"
import * as styles from "./MarketingSteps.styles.css"

export type MarketingStepsVariant = "numbered-cards" | "timeline"

export interface MarketingStep {
    title: string
    description: string
}

export interface MarketingStepsContent {
    kicker?: string
    title?: string
    steps: MarketingStep[]
}

export interface MarketingStepsProps extends MarketingStepsContent {
    variant?: MarketingStepsVariant
    anchorId?: string
}

/**
 * How-it-works section ("is it hard to start?"). `numbered-cards` is a row
 * of step cards; `timeline` runs the same steps down a vertical accent rail.
 */
export function MarketingSteps({
    variant = "numbered-cards",
    anchorId,
    kicker,
    title,
    steps,
}: MarketingStepsProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "How it works"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            {variant === "timeline" ? (
                <ol className={styles.timeline}>
                    {steps.map((step, index) => (
                        <li
                            key={step.title}
                            className={styles.timelineItem}
                            {...marketingItemStamp("steps", index)}
                        >
                            <span className={styles.timelineDot} aria-hidden>
                                {index + 1}
                            </span>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDescription}>{step.description}</p>
                        </li>
                    ))}
                </ol>
            ) : (
                <div className={styles.row}>
                    {steps.map((step, index) => (
                        <article
                            key={step.title}
                            className={styles.card}
                            {...marketingItemStamp("steps", index)}
                        >
                            <span className={styles.number}>{index + 1}</span>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDescription}>{step.description}</p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    )
}
