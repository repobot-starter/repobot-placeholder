import React from "react"
import { type MarketingMedia } from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingGlyph } from "./MarketingGlyph"
import * as styles from "./MarketingLogos.styles.css"

export type MarketingLogosVariant = "strip" | "grid"

export interface MarketingLogo {
    name: string
    media?: MarketingMedia
}

export interface MarketingLogosContent {
    /** Optional lead-in, e.g. "Trusted by teams at". */
    kicker?: string
    logos: MarketingLogo[]
}

export interface MarketingLogosProps extends MarketingLogosContent {
    variant?: MarketingLogosVariant
    anchorId?: string
}

/** A logo without media falls back to a muted wordmark of its name. */
function LogoMark({ logo }: { logo: MarketingLogo }): React.ReactElement {
    if (logo.media?.kind === "image") {
        return <MarketingImage className={styles.image} {...marketingImageProps(logo.media)} sizes="160px" />
    }
    return (
        <span className={styles.wordmark}>
            {logo.media?.kind === "glyph" || logo.media?.kind === "emoji" ? (
                // Emoji marks render as seeded glyphs too — platform emoji
                // read as template filler next to a wordmark.
                <span className={styles.emoji} aria-hidden>
                    <MarketingGlyph
                        seed={
                            logo.media.kind === "glyph" ? logo.media.seed : `${logo.name}${logo.media.emoji}`
                        }
                        size={20}
                    />
                </span>
            ) : null}
            {logo.name}
        </span>
    )
}

/**
 * The logo wall: "which names back this?" — a quieter, denser cousin of
 * `social-proof`. `strip` is one centered row; `grid` gives each logo a
 * bordered cell.
 */
export function MarketingLogos({
    variant = "strip",
    anchorId,
    kicker,
    logos,
}: MarketingLogosProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={kicker ?? "Logos"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {variant === "grid" ? (
                <div className={styles.grid}>
                    {logos.map((logo) => (
                        <div key={logo.name} className={styles.cell}>
                            <LogoMark logo={logo} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.strip}>
                    {logos.map((logo) => (
                        <LogoMark key={logo.name} logo={logo} />
                    ))}
                </div>
            )}
        </section>
    )
}
