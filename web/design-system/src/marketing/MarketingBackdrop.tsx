import React from "react"
import type { MarketingImageSource } from "./marketingContent"
import { MarketingImage } from "./MarketingImage"
import * as styles from "./MarketingBackdrop.styles.css"

/**
 * Full-bleed artwork behind a section's content — the treatment editorial
 * and brand-led designs lead with (a hero headline over a painted scene, a
 * closing band over a misty landscape). Plain data, like every other
 * marketing content shape, so a whole art-directed page still lives in one
 * typed config file and never needs an ejected component.
 */
/**
 * Generated CSS artwork, keyed to the theme's accent — zero-asset art
 * direction that follows the preset and the customer brand automatically.
 * Append-only vocabulary, like section types:
 * - `aurora` — accent/cyan/pink blooms under film grain; dark heroes.
 * - `beams` — an iridescent diagonal band grazing the top edge; light heroes.
 * - `horizon` — a dusk grade rising from the foot; closing bands.
 */
export type MarketingBackdropArt = "aurora" | "beams" | "horizon"

export interface MarketingBackdrop {
    /** The artwork, e.g. "/brand/home-hero.png". Rendered `object-fit: cover`. */
    src?: string
    /** Generated CSS artwork; no asset needed. Wins over `src` when both are set. */
    art?: MarketingBackdropArt
    /** Meaningful description when the artwork carries content; omit for pure decoration. */
    alt?: string
    /** Pre-generated size variants (`npm run image -- responsive`). */
    srcSet?: MarketingImageSource[]
    /**
     * The scrim that keeps copy legible over arbitrary art. `soft` (default
     * for image art) veils the art with the theme's page background, so
     * text keeps its normal theme colors in both modes; `dark` is a black
     * gradient for light-on-image treatments (pair it with light text via
     * style.overrides); `none` trusts the art to carry the copy — the
     * default for generated `art`, which is theme-derived and already
     * legible.
     */
    overlay?: "soft" | "dark" | "none"
    /** CSS object-position for the art's focal point, e.g. "center top". */
    position?: string
}

/**
 * The shared backdrop wrapper: breaks out of the page frame to the viewport
 * edges, paints the art + scrim, and re-aligns `children` with the page's
 * content column. Sections opt in by accepting a `backdrop` content field
 * and wrapping their normal markup with this.
 */
export function SectionBackdrop({
    backdrop,
    anchorId,
    ariaLabel,
    priority = false,
    children,
}: {
    backdrop: MarketingBackdrop
    anchorId?: string
    ariaLabel?: string
    /** Above-the-fold backdrops (the hero) load eagerly at high priority. */
    priority?: boolean
    children: React.ReactNode
}): React.ReactElement {
    const overlay = backdrop.overlay ?? (backdrop.art !== undefined ? "none" : "soft")
    return (
        <section id={anchorId} className={styles.bleed} aria-label={ariaLabel}>
            {backdrop.art !== undefined ? (
                <div className={`${styles.artLayer} ${styles.art[backdrop.art]}`} aria-hidden />
            ) : backdrop.src !== undefined ? (
                <MarketingImage
                    className={styles.image}
                    src={backdrop.src}
                    alt={backdrop.alt ?? ""}
                    srcSet={backdrop.srcSet}
                    priority={priority}
                    style={
                        backdrop.position !== undefined ? { objectPosition: backdrop.position } : undefined
                    }
                    ariaHidden={backdrop.alt === undefined}
                />
            ) : null}
            {overlay !== "none" ? (
                <div className={overlay === "soft" ? styles.overlaySoft : styles.overlayDark} aria-hidden />
            ) : null}
            <div className={styles.inner}>{children}</div>
        </section>
    )
}
