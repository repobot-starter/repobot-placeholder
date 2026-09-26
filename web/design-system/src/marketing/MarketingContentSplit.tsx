import React from "react"
import { SectionBackdrop, type MarketingBackdrop } from "./MarketingBackdrop"
import { MarketingBrowserFrame } from "./MarketingBrowserFrame"
import { marketingHref, type MarketingCta, type MarketingMedia } from "./marketingContent"
import { marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import { MarketingReportCard } from "./MarketingReportCard"
import { MarketingContentFeature } from "./MarketingContentFeature"
import * as styles from "./MarketingContentSplit.styles.css"

export type MarketingContentSplitVariant = "media-right" | "media-left" | "report" | "feature"

/** One labeled line of a `report` card, e.g. { label: "Quoted", value: "$1,680" }. */
export interface MarketingReportRow {
    label: string
    value: string
    /** Set the value at display size in the accent (the number that matters). */
    highlight?: boolean
}

/**
 * The `report` variant's case file: the evidence card for one finished job
 * — what was found, what was quoted, what it cost, how long it took,
 * before/after photographs, and who signed it.
 */
export interface MarketingReport {
    /** Small label over the card, e.g. "Job report". */
    label?: string
    /** Who issued it, set opposite the label, e.g. "Straight Pipe · Pasadena". */
    issuer?: string
    /** The job's name, e.g. "Job 4127 — water heater swap". */
    title: string
    /** Where, e.g. "Bungalow Heaven, Pasadena". */
    location?: string
    rows: MarketingReportRow[]
    before?: MarketingMedia
    after?: MarketingMedia
    /** Photo tags; default "Before" / "After". */
    beforeLabel?: string
    afterLabel?: string
    /** The sign-off line: the tech's name and a detail such as the license. */
    signature?: { name: string; detail?: string }
    /** A rubber stamp set askew over the rows, e.g. "Quote = final". */
    stamp?: string
}

/** `feature` only: a detail photograph under the story, titled in small caps. */
export interface MarketingFeatureFigure {
    media: MarketingMedia
    title?: string
    caption?: string
}

/** `feature` only: the drawing set last (an elevation, a plan) and its caption. */
export interface MarketingFeaturePlate {
    media: MarketingMedia
    caption?: string
}

export interface MarketingContentSplitContent {
    kicker?: string
    headline: string
    body: string
    bullets?: string[]
    cta?: MarketingCta
    media?: MarketingMedia
    /** Full-bleed artwork: the split renders as an edge-to-edge band over it. */
    backdrop?: MarketingBackdrop
    /** `report` only: the case-file card rendered where the media would sit. */
    report?: MarketingReport
    /** `feature` only: the sentence lifted out of the story, set between rules. */
    pullQuote?: string
    /** `feature` only: detail photographs under the spread. */
    figures?: MarketingFeatureFigure[]
    /** `feature` only: the closing plate. */
    plate?: MarketingFeaturePlate
}

export interface MarketingContentSplitProps extends MarketingContentSplitContent {
    variant?: MarketingContentSplitVariant
    anchorId?: string
}

// Emoji and glyph media render as full-bleed generative art at this size —
// platform emoji and small centered marks both read as placeholders in a
// media slot, so the panel carries seeded artwork instead.
function SplitMedia({ media, seedHint }: { media: MarketingMedia; seedHint?: string }): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return <MarketingArtPanel seed={seed} className={styles.mediaImg} />
    }
    if (media.kind === "browser") {
        return (
            <MarketingBrowserFrame
                src={media.src}
                alt={media.alt}
                url={media.url}
                width={media.width}
                height={media.height}
                srcSet={media.srcSet}
            />
        )
    }
    return (
        <MarketingImage
            className={styles.mediaImg}
            {...marketingImageProps(media)}
            sizes="(min-width: 900px) 50vw, 100vw"
        />
    )
}

/**
 * One substantial claim, told properly: a full copy block (headline, body,
 * optional checked bullets, one CTA) beside one media panel. The variant
 * picks which side the media sits on; narrow widths stack media first.
 * `report` puts the evidence in the media's place — a case-file card for
 * one finished job (`report`: labeled rows, before/after photographs, a
 * signature) under a display-size claim; without `report` content it
 * renders as `media-right`. `feature` tells one project as a magazine
 * feature (MarketingContentFeature): the body in two columns under a drop
 * cap, the media as a spread, then the pull quote, the figures, and the
 * plate.
 */
export function MarketingContentSplit(props: MarketingContentSplitProps): React.ReactElement {
    if (props.variant === "feature") return <MarketingContentFeature {...props} />
    return <MarketingContentSplitPanel {...props} />
}

function MarketingContentSplitPanel({
    variant = "media-right",
    anchorId,
    kicker,
    headline,
    body,
    bullets,
    cta,
    media,
    backdrop,
    report,
}: MarketingContentSplitProps): React.ReactElement {
    const reportCard = variant === "report" && report !== undefined
    const mediaCell = reportCard ? (
        <MarketingReportCard report={report} />
    ) : media !== undefined ? (
        <div {...marketingMediaStamp("media", 0)}>
            <SplitMedia media={media} seedHint={headline} />
        </div>
    ) : (
        <div />
    )
    const copy = (
        <div>
            {kicker !== undefined ? (
                <span className={styles.kicker} {...marketingTextStamp("kicker")}>
                    {kicker}
                </span>
            ) : null}
            <h2
                className={reportCard ? `${styles.headline} ${styles.headlineReport}` : styles.headline}
                {...marketingTextStamp("headline")}
            >
                {headline}
            </h2>
            <p className={styles.body} {...marketingTextStamp("body")}>
                {body}
            </p>
            {bullets !== undefined && bullets.length > 0 ? (
                <ul className={styles.bullets}>
                    {bullets.map((bullet) => (
                        <li key={bullet} className={styles.bullet}>
                            <span className={styles.bulletMark} aria-hidden>
                                ✓
                            </span>
                            {bullet}
                        </li>
                    ))}
                </ul>
            ) : null}
            {cta !== undefined ? (
                <div className={styles.ctaRow}>
                    <a className={styles.cta} href={marketingHref(cta)} {...marketingTextStamp("cta.label")}>
                        {cta.label}
                    </a>
                </div>
            ) : null}
        </div>
    )

    const cells =
        variant === "media-left" ? (
            <>
                {mediaCell}
                {copy}
            </>
        ) : (
            <>
                {copy}
                {mediaCell}
            </>
        )

    if (backdrop) {
        return (
            <SectionBackdrop backdrop={backdrop} anchorId={anchorId} ariaLabel={headline}>
                <div
                    className={
                        variant === "media-left"
                            ? `${styles.grid} ${styles.gridMediaLeft}`
                            : reportCard
                              ? `${styles.grid} ${styles.gridReport}`
                              : styles.grid
                    }
                >
                    {cells}
                </div>
            </SectionBackdrop>
        )
    }
    return (
        <section
            id={anchorId}
            className={
                variant === "media-left"
                    ? `${styles.wrap} ${styles.wrapMediaLeft}`
                    : reportCard
                      ? `${styles.wrap} ${styles.gridReport}`
                      : styles.wrap
            }
            aria-label={headline}
        >
            {cells}
        </section>
    )
}
