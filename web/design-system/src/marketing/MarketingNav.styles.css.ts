import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { ctaPrimary } from "./shared.css"

export const nav = style({
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "20px 0",
    // Anchors the mobile disclosure panel.
    position: "relative",
})

export const logo = style({
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontFamily: marketing.font.display,
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: "-0.01em",
    color: marketing.color.text,
})

/** The logo's home link — visually silent, the mark carries the weight. */
export const logoLink = style({
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
})

/** The committed brand logo, capped to the nav's wordmark height. */
export const logoImage = style({
    display: "block",
    height: 30,
    width: "auto",
    maxWidth: 220,
    objectFit: "contain",
})

/** Two-line brand wordmark: name above, tagline as a small caps line. */
export const logoStack = style({
    display: "inline-flex",
    flexDirection: "column",
    gap: 2,
})

export const logoTagline = style({
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const links = style({
    display: "flex",
    gap: 18,
    marginLeft: "auto",
    fontSize: 14,
    color: marketing.color.subtle,
    "@media": {
        "(max-width: 640px)": { display: "none" },
    },
})

export const link = style({
    color: "inherit",
    textDecoration: "none",
    selectors: { "&:hover": { color: marketing.color.text } },
})

/**
 * Mobile: the link row collapses behind a hamburger. The button and panel
 * only exist below the same breakpoint that hides `links`, so desktop
 * markup is unchanged.
 */
export const menuButton = style({
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    marginLeft: "auto",
    flexShrink: 0,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    backgroundColor: "transparent",
    color: marketing.color.text,
    cursor: "pointer",
    "@media": {
        "(max-width: 640px)": { display: "flex" },
    },
})

export const menuPanel = style({
    display: "none",
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: "column",
    gap: 2,
    padding: 8,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    backgroundColor: marketing.color.surface,
    boxShadow: marketing.shape.shadowCard,
    "@media": {
        "(max-width: 640px)": { display: "flex" },
    },
})

export const menuLink = style({
    padding: "12px 14px",
    borderRadius: marketing.shape.radiusControl,
    color: marketing.color.text,
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
    selectors: { "&:hover": { backgroundColor: marketing.color.accentSoft } },
})

/** Pushes the CTA to the far edge when there is no link row (minimal variant). */
export const ctaSlot = style({
    marginLeft: "auto",
})

export const cta = style([
    ctaPrimary,
    {
        fontSize: 14,
        padding: "9px 16px",
    },
])
