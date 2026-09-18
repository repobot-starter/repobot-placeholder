import React from "react"
import { SectionBackdrop, type MarketingBackdrop } from "./MarketingBackdrop"
import * as styles from "./MarketingRichProse.styles.css"

export type MarketingRichProseVariant = "narrow" | "two-column"

export interface MarketingRichProseContent {
    kicker?: string
    title?: string
    paragraphs: string[]
    /** Full-bleed artwork behind the prose — the editorial "misty band" treatment. */
    backdrop?: MarketingBackdrop
}

export interface MarketingRichProseProps extends MarketingRichProseContent {
    variant?: MarketingRichProseVariant
    anchorId?: string
}

/**
 * Long-form trust: the story, manifesto, or method, set for actual reading.
 * `narrow` limits the measure (~65ch); `two-column` flows the same text
 * through CSS columns for editorial pages with room to spare.
 */
export function MarketingRichProse({
    variant = "narrow",
    anchorId,
    kicker,
    title,
    paragraphs,
    backdrop,
}: MarketingRichProseProps): React.ReactElement {
    const inner = (
        <div className={variant === "two-column" ? styles.frameWide : styles.frame}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            <div className={variant === "two-column" ? styles.columns : undefined}>
                {paragraphs.map((paragraph) => (
                    <p key={paragraph} className={styles.paragraph}>
                        {paragraph}
                    </p>
                ))}
            </div>
        </div>
    )
    if (backdrop) {
        return (
            <SectionBackdrop backdrop={backdrop} anchorId={anchorId} ariaLabel={title ?? "About"}>
                <div className={styles.wrap}>{inner}</div>
            </SectionBackdrop>
        )
    }
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "About"}>
            {inner}
        </section>
    )
}
