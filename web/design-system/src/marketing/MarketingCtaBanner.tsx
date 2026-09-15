import React from "react"
import { SectionBackdrop, type MarketingBackdrop } from "./MarketingBackdrop"
import { marketingHref, type MarketingCta } from "./marketingContent"
import { marketingTextStamp } from "./marketingItemStamp"
import * as styles from "./MarketingCtaBanner.styles.css"

export type MarketingCtaBannerVariant = "card" | "full-bleed" | "ticket"

export interface MarketingCtaBannerContent {
    title: string
    body?: string
    cta: MarketingCta
    /** Full-bleed artwork: the banner renders as an edge-to-edge band over it, not a card. */
    backdrop?: MarketingBackdrop
}

export interface MarketingCtaBannerProps extends MarketingCtaBannerContent {
    variant?: MarketingCtaBannerVariant
    anchorId?: string
}

/**
 * The final CTA: restate the promise, offer the one action. `card` is a
 * bordered panel in the page column; `full-bleed` is an edge-to-edge tinted
 * band — the closing statement when there's no backdrop photograph to
 * carry it; `ticket` is the card as an admission stub — perforated inner
 * rule, punched side notches — for pages where the ask is an invitation
 * ("you're on the list"), not a signup. A `backdrop` wins over any of
 * them: the banner becomes a band over the artwork.
 */
export function MarketingCtaBanner({
    variant = "card",
    anchorId,
    title,
    body,
    cta,
    backdrop,
}: MarketingCtaBannerProps): React.ReactElement {
    const inner = (
        <>
            <h2 className={styles.title} {...marketingTextStamp("title")}>
                {title}
            </h2>
            {body !== undefined ? (
                <p className={styles.body} {...marketingTextStamp("body")}>
                    {body}
                </p>
            ) : null}
            <a className={styles.cta} href={marketingHref(cta)} {...marketingTextStamp("cta.label")}>
                {cta.label}
            </a>
        </>
    )
    if (backdrop) {
        return (
            <SectionBackdrop backdrop={backdrop} anchorId={anchorId} ariaLabel={title}>
                <div className={styles.band}>{inner}</div>
            </SectionBackdrop>
        )
    }
    if (variant === "full-bleed") {
        return (
            <section id={anchorId} className={styles.fullBleed} aria-label={title}>
                {inner}
            </section>
        )
    }
    if (variant === "ticket") {
        return (
            <section id={anchorId} className={styles.ticket} aria-label={title}>
                <span className={styles.ticketNotchLeft} aria-hidden />
                <span className={styles.ticketNotchRight} aria-hidden />
                {inner}
            </section>
        )
    }
    return (
        <section id={anchorId} className={styles.card} aria-label={title}>
            {inner}
        </section>
    )
}
