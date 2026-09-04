import React from "react"
import { marketingHref, type MarketingCta, type MarketingMedia } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingCardGrid.styles.css"

export type MarketingCardGridVariant = "3up" | "2up" | "4up"

export interface MarketingCardGridItem {
    media?: MarketingMedia
    title: string
    body: string
    cta?: MarketingCta
}

export interface MarketingCardGridContent {
    kicker?: string
    title?: string
    cards: MarketingCardGridItem[]
}

export interface MarketingCardGridProps extends MarketingCardGridContent {
    variant?: MarketingCardGridVariant
    anchorId?: string
}

const GRID_CLASSES: Record<MarketingCardGridVariant, string> = {
    "3up": styles.grid3,
    "2up": styles.grid2,
    "4up": styles.grid4,
}

// Emoji and glyph media render as full-bleed generative art at this size —
// platform emoji and small centered marks both read as placeholders in a
// media slot, so the panel carries seeded artwork instead.
function CardMedia({ media, seedHint }: { media: MarketingMedia; seedHint?: string }): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return <MarketingArtPanel seed={seed} className={styles.mediaImg} />
    }
    return (
        <MarketingImage
            className={styles.mediaImg}
            {...marketingImageProps(media)}
            sizes="(min-width: 980px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
    )
}

/**
 * The general-purpose card grid — services, use cases, resources: anything
 * parallel that deserves more room than a `feature-grid` cell. The variant
 * fixes the column count; narrow widths collapse gracefully.
 */
export function MarketingCardGrid({
    variant = "3up",
    anchorId,
    kicker,
    title,
    cards,
}: MarketingCardGridProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Cards"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            <div className={GRID_CLASSES[variant]}>
                {cards.map((card) => (
                    <article key={card.title} className={styles.card}>
                        {card.media !== undefined ? (
                            <CardMedia media={card.media} seedHint={card.title} />
                        ) : null}
                        <h3 className={styles.cardTitle}>{card.title}</h3>
                        <p className={styles.cardBody}>{card.body}</p>
                        {card.cta !== undefined ? (
                            <a className={styles.cardCta} href={marketingHref(card.cta)}>
                                {card.cta.label}
                            </a>
                        ) : null}
                    </article>
                ))}
            </div>
        </section>
    )
}
