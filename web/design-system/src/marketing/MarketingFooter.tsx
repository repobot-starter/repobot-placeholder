import React from "react"
import { marketingHref, type MarketingCta } from "./marketingContent"
import * as styles from "./MarketingFooter.styles.css"

export type MarketingFooterVariant = "single-row"

export interface MarketingFooterContent {
    blurb?: string
    links?: MarketingCta[]
    /** Trailing note, e.g. attribution or copyright. */
    note?: string
}

export interface MarketingFooterProps extends MarketingFooterContent {
    variant?: MarketingFooterVariant
    anchorId?: string
}

/** Single-row footer: blurb, links, trailing note. */
export function MarketingFooter({ anchorId, blurb, links, note }: MarketingFooterProps): React.ReactElement {
    return (
        <footer id={anchorId} className={styles.bar}>
            {blurb !== undefined ? <span>{blurb}</span> : null}
            {(links ?? []).map((link) => (
                <a key={link.label} className={styles.link} href={marketingHref(link)}>
                    {link.label}
                </a>
            ))}
            {note !== undefined ? <span>{note}</span> : null}
        </footer>
    )
}
