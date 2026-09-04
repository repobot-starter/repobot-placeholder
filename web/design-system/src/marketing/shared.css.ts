import { keyframes, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"

/**
 * Shared style vocabulary for marketing sections: the section rhythm, the
 * kicker/title header pattern, and the CTA button pair. Internal to the
 * marketing family — not exported from the package.
 */

export const rise = keyframes({
    from: { opacity: 0, transform: "translateY(16px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

export const section = style({
    // The section rhythm follows the theme contract's density through the
    // Feel bridge (MarketingPage sets the scale var; 1 when absent).
    padding: `${scaledSpace(64)} 0 0`,
})

export const sectionKicker = style({
    display: "block",
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    marginBottom: 8,
})

export const sectionTitle = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(26px, 4vw, 36px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    // The contract emits plain var strings; the token is "none" | "uppercase".
    textTransform: marketing.display.transform as "none",
    color: marketing.color.text,
    margin: `0 0 ${scaledSpace(36)}`,
})

/** Center-aligned header block (most sections). */
export const sectionHeaderCentered = style({
    textAlign: "center",
})

export const ctaPrimary = style({
    display: "inline-block",
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 700,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    border: "none",
    borderRadius: marketing.shape.radiusControl,
    boxShadow: marketing.shape.shadowCta,
    padding: "13px 24px",
    textDecoration: "none",
    cursor: "pointer",
    transition: "transform 140ms ease",
    selectors: {
        "&:hover": { transform: "translateY(-1px)" },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            transition: "none",
            selectors: { "&:hover": { transform: "none" } },
        },
    },
})

export const ctaSecondary = style({
    display: "inline-block",
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 600,
    color: marketing.color.text,
    background: "transparent",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "12px 22px",
    textDecoration: "none",
    cursor: "pointer",
    selectors: {
        "&:hover": { borderColor: marketing.color.subtle },
    },
})

/** Emoji on an accent-tinted panel — the zero-asset media default. */
export const emojiPanel = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: marketing.color.accentSoft,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    fontSize: 72,
    minHeight: 260,
    width: "100%",
})

export const mediaImage = style({
    width: "100%",
    // Images now carry intrinsic width/height attributes (MarketingImage);
    // auto height keeps the rendered box following the CSS width while the
    // attributes still reserve the aspect ratio before the file arrives.
    height: "auto",
    borderRadius: marketing.shape.radiusCard,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    display: "block",
})
