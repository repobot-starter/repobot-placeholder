import React from "react"
import * as styles from "./MarketingSocialProof.styles.css"

export type MarketingSocialProofVariant = "text-logos" | "metrics-row" | "marquee" | "ticker"

export interface MarketingMetric {
    /** The big number, e.g. "1,200+" or "4.9★". */
    value: string
    /** What it counts, e.g. "jobs completed". */
    label: string
}

export interface MarketingSocialProofContent {
    /** Optional lead-in, e.g. "Trusted by". */
    label?: string
    /** `text-logos`: company names rendered as a text-logo strip. */
    items?: string[]
    /** `metrics-row`: KPI pairs rendered as a big-numbers strip. */
    metrics?: MarketingMetric[]
}

export interface MarketingSocialProofProps extends MarketingSocialProofContent {
    variant?: MarketingSocialProofVariant
    anchorId?: string
}

/**
 * "Who else trusts this?" with zero image assets. `text-logos` is an
 * uppercase name strip; `metrics-row` is a KPI strip of value/label pairs;
 * `marquee` scrolls the name strip continuously behind edge-fade masks
 * (pauses on hover, static wrap under reduced-motion); `ticker` is the
 * marquee at display scale — the items as monumental stroke-only
 * letterforms rolling across the full width (the severe registers' moving
 * set piece; here the words are usually capabilities, not customers).
 * Empty content hides the section.
 */
export function MarketingSocialProof({
    variant = "text-logos",
    anchorId,
    label,
    items,
    metrics,
}: MarketingSocialProofProps): React.ReactElement | null {
    if (variant === "marquee" || variant === "ticker") {
        if (items === undefined || items.length === 0) {
            return null
        }
        const ticker = variant === "ticker"
        return (
            <div
                id={anchorId}
                className={ticker ? styles.tickerWrap : styles.marqueeWrap}
                aria-label={label ?? "Trusted by"}
            >
                {label !== undefined ? <span className={styles.label}>{label}</span> : null}
                <div className={styles.marqueeViewport}>
                    <div className={ticker ? styles.tickerTrack : styles.marqueeTrack}>
                        {/* Two copies back-to-back; the track slides one copy's
                            width, so the loop point is invisible. */}
                        {[0, 1].map((copy) => (
                            <div
                                key={copy}
                                className={styles.marqueeGroup}
                                aria-hidden={copy === 1 ? true : undefined}
                            >
                                {items.map((item) => (
                                    <React.Fragment key={item}>
                                        <span className={ticker ? styles.tickerItem : styles.item}>
                                            {item}
                                        </span>
                                        {ticker ? (
                                            <span className={styles.tickerSeparator} aria-hidden>
                                                —
                                            </span>
                                        ) : null}
                                    </React.Fragment>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (variant === "metrics-row") {
        if (metrics === undefined || metrics.length === 0) {
            return null
        }
        return (
            <div id={anchorId} className={styles.metricsRow} aria-label={label ?? "Key metrics"}>
                {label !== undefined ? <span className={styles.label}>{label}</span> : null}
                {metrics.map((metric) => (
                    <div key={metric.label} className={styles.metric}>
                        <span className={styles.metricValue}>{metric.value}</span>
                        <span className={styles.metricLabel}>{metric.label}</span>
                    </div>
                ))}
            </div>
        )
    }

    if (items === undefined || items.length === 0) {
        return null
    }
    return (
        <div id={anchorId} className={styles.strip} aria-label={label ?? "Trusted by"}>
            {label !== undefined ? <span className={styles.label}>{label}</span> : null}
            {items.map((item) => (
                <span key={item} className={styles.item}>
                    {item}
                </span>
            ))}
        </div>
    )
}
