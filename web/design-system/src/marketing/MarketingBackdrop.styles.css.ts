import { style, styleVariants } from "@vanilla-extract/css"
import { grainTile, marketing } from "./theme/marketingTheme.css"

/**
 * The full-bleed breakout: sections render inside MarketingPage's centered
 * frame, so backdrop art escapes it to the viewport edges and the inner
 * column re-applies the frame's geometry to keep content aligned with the
 * rest of the page.
 */
export const bleed = style({
    position: "relative",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    overflow: "hidden",
})

export const image = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
})

/**
 * Generated CSS artwork — zero-asset art direction. Every piece derives
 * from the theme's accent (`--marketing-color-accent`), so the art follows
 * the preset AND the customer brand automatically, with no image to
 * commission or commit. Geometry is percentage-based: backdrops wrap
 * hero-scale sections, not whole pages.
 */
export const art = styleVariants({
    // Blooms of accent, cyan, and pink under film grain — the flagship
    // treatment behind dark heroes.
    aurora: {
        backgroundImage:
            `${grainTile}, ` +
            `radial-gradient(52% 78% at 16% 8%, color-mix(in srgb, ${marketing.color.accent} 34%, transparent), transparent 68%), ` +
            "radial-gradient(46% 70% at 62% -10%, rgba(56, 189, 248, 0.22), transparent 64%), " +
            "radial-gradient(44% 66% at 92% 26%, rgba(244, 114, 182, 0.20), transparent 60%)",
    },
    // A diagonal band of iridescent blooms grazing the section's top edge —
    // the light-ground ribbon treatment.
    beams: {
        backgroundImage:
            `radial-gradient(46% 62% at 4% -6%, color-mix(in srgb, ${marketing.color.accent} 26%, transparent), transparent 64%), ` +
            "radial-gradient(44% 58% at 36% -18%, rgba(139, 92, 246, 0.20), transparent 62%), " +
            "radial-gradient(42% 54% at 66% -28%, rgba(244, 114, 182, 0.16), transparent 60%), " +
            "radial-gradient(40% 50% at 94% -36%, rgba(255, 184, 108, 0.16), transparent 58%)",
    },
    // Dusk grade rising from the section's foot — accent glow low, page
    // color high. The closing-band treatment for cta-banner and rich-prose.
    horizon: {
        backgroundImage:
            `${grainTile}, ` +
            `radial-gradient(120% 90% at 50% 112%, color-mix(in srgb, ${marketing.color.accent} 30%, transparent), transparent 70%), ` +
            "radial-gradient(80% 60% at 50% 118%, rgba(56, 189, 248, 0.10), transparent 64%)",
    },
})

export const artLayer = style({
    position: "absolute",
    inset: 0,
})

/**
 * The theme's page background as a veil: copy keeps its normal theme
 * colors (works in light and dark mode alike), while the art reads through
 * — strongest at the edges so the section blends into the page around it.
 */
export const overlaySoft = style({
    position: "absolute",
    inset: 0,
    background: `linear-gradient(180deg,
        color-mix(in srgb, ${marketing.color.pageBg} 78%, transparent) 0%,
        color-mix(in srgb, ${marketing.color.pageBg} 42%, transparent) 50%,
        color-mix(in srgb, ${marketing.color.pageBg} 88%, transparent) 100%)`,
})

/** For light-on-image treatments; pair with light text via style.overrides. */
export const overlayDark = style({
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(8, 10, 14, 0.45) 0%, rgba(8, 10, 14, 0.65) 100%)",
})

/** Mirrors MarketingPage's frame so content lines up with the page column. */
export const inner = style({
    position: "relative",
    width: `min(${marketing.layout.maxWidth}, 100%)`,
    margin: "0 auto",
    padding: "0 24px",
})
