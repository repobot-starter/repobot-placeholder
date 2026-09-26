import React from "react"
import { SectionBackdrop, type MarketingBackdrop } from "./MarketingBackdrop"
import { marketingHref, type MarketingCta } from "./marketingContent"
import { marketingTextStamp } from "./marketingItemStamp"
import * as styles from "./MarketingCtaBanner.styles.css"

export type MarketingCtaBannerVariant = "card" | "full-bleed" | "ticket" | "classified" | "colophon"

export interface MarketingCtaBannerContent {
    title: string
    body?: string
    cta: MarketingCta
    /** Full-bleed artwork: the banner renders as an edge-to-edge band over it, not a card. */
    backdrop?: MarketingBackdrop
    /** `classified` only: the tab on the ad's top rule ("Classifieds · Services"). */
    kicker?: string
    /** `classified` only: the price line under the headline ("Full day from $5,800"). */
    price?: string
    /** `classified` only: the small print under the ask. */
    finePrint?: string
    /** `classified` only: the business-card box beside the ad — who placed it. */
    signoff?: { name: string; note?: string }
    /** `colophon` only: `center` (default) or `start` — the line and its link at the page column's left edge. */
    align?: "center" | "start"
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
 * ("you're on the list"), not a signup; `classified` is the boxed ad in
 * the back of the paper — double-ruled box, a kicker tab on its top rule,
 * the headline in display caps, a ruled `price` line, `finePrint` under
 * the ask, and an optional `signoff` business card beside it; `colophon`
 * is the photographer's sign-off — a full-bleed band of the page surface
 * carrying one quiet sentence (`title`, with `body` as its second line at
 * the same size) and the ask as an underlined text link, never a button. A
 * `backdrop` wins over any of them: the banner becomes a band over the
 * artwork.
 */
export function MarketingCtaBanner({
    variant = "card",
    anchorId,
    title,
    body,
    cta,
    backdrop,
    kicker,
    price,
    finePrint,
    signoff,
    align = "center",
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
    if (variant === "classified" && !backdrop) {
        return (
            <section
                id={anchorId}
                className={
                    signoff !== undefined
                        ? styles.classified
                        : `${styles.classified} ${styles.classifiedSolo}`
                }
                aria-label={title}
            >
                {kicker !== undefined ? (
                    <span className={styles.classifiedKicker} {...marketingTextStamp("kicker")}>
                        {kicker}
                    </span>
                ) : null}
                <div className={styles.classifiedMain}>
                    <h2 className={styles.classifiedTitle} {...marketingTextStamp("title")}>
                        {title}
                    </h2>
                    {price !== undefined ? (
                        <p className={styles.classifiedPrice} {...marketingTextStamp("price")}>
                            {price}
                        </p>
                    ) : null}
                    {body !== undefined ? (
                        <p className={styles.classifiedBody} {...marketingTextStamp("body")}>
                            {body}
                        </p>
                    ) : null}
                    <a
                        className={styles.classifiedCta}
                        href={marketingHref(cta)}
                        {...marketingTextStamp("cta.label")}
                    >
                        {cta.label}
                    </a>
                    {finePrint !== undefined ? (
                        <p className={styles.classifiedFinePrint} {...marketingTextStamp("finePrint")}>
                            {finePrint}
                        </p>
                    ) : null}
                </div>
                {signoff !== undefined ? (
                    <div className={styles.classifiedSignoff}>
                        <span
                            className={styles.classifiedSignoffName}
                            {...marketingTextStamp("signoff.name")}
                        >
                            {signoff.name}
                        </span>
                        {signoff.note !== undefined ? (
                            <span
                                className={styles.classifiedSignoffNote}
                                {...marketingTextStamp("signoff.note")}
                            >
                                {signoff.note}
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </section>
        )
    }
    if (variant === "colophon") {
        return (
            <section
                id={anchorId}
                className={align === "start" ? `${styles.colophon} ${styles.colophonStart}` : styles.colophon}
                aria-label={title}
            >
                <div className={styles.colophonInner}>
                    <h2 className={styles.colophonLine} {...marketingTextStamp("title")}>
                        {title}
                    </h2>
                    {body !== undefined ? (
                        <p className={styles.colophonLine} {...marketingTextStamp("body")}>
                            {body}
                        </p>
                    ) : null}
                    <a
                        className={styles.colophonLink}
                        href={marketingHref(cta)}
                        {...marketingTextStamp("cta.label")}
                    >
                        {cta.label}
                    </a>
                </div>
            </section>
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
