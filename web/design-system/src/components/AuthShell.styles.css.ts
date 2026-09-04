import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const NARROW = "screen and (max-width: 900px)"

export const shell = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 5fr) minmax(0, 6fr)",
    minHeight: "100vh",
    fontFamily: vars.fontFamily.body,
    backgroundColor: vars.color.background,
    // The injected brand slot renders text/currentColor marks; without an
    // ink here it inherits the page outside the theme scope (black on dark).
    color: vars.color.textPrimary,
    "@media": {
        [NARROW]: {
            gridTemplateColumns: "minmax(0, 1fr)",
        },
    },
})

export const panel = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xl,
    padding: vars.space.xxl,
    boxSizing: "border-box",
    borderRight: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surface,
    // The character's brand-panel artwork; `plain` reproduces the original
    // two-bloom accent wash, richer characters layer more color here.
    backgroundImage: vars.treatment.panelWash,
    "@media": {
        [NARROW]: {
            display: "none",
        },
    },
})

export const panelBrand = style({
    display: "flex",
    alignItems: "center",
})

export const panelBody = style({
    display: "grid",
    gap: vars.space.md,
    maxWidth: "26rem",
    // Center between the brand row and the footer (or the panel bottom).
    marginBlock: "auto",
})

export const panelHeadline = style({
    margin: 0,
    fontFamily: vars.fontFamily.display,
    fontSize: "clamp(1.7rem, 2.8vw, 2.3rem)",
    lineHeight: 1.16,
    fontWeight: 800,
    letterSpacing: "-0.025em",
    color: vars.color.textPrimary,
})

export const panelSubheadline = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    lineHeight: 1.55,
    color: vars.color.textSecondary,
})

export const panelHighlights = style({
    display: "grid",
    gap: vars.space.sm,
    margin: `${vars.space.sm} 0 0`,
    padding: 0,
    listStyle: "none",
})

export const panelHighlight = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
})

export const checkIcon = style({
    flexShrink: 0,
    color: vars.color.accent,
})

/* Product fragments rendered as panel art — slight lift off the wash. */
export const panelSlot = style({
    display: "grid",
    gap: vars.space.sm,
    marginTop: vars.space.md,
})

export const panelFooter = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const content = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: vars.space.lg,
    padding: vars.space.xl,
    boxSizing: "border-box",
    backgroundImage: `radial-gradient(1100px 500px at 85% -10%, color-mix(in srgb, ${vars.color.accent} 10%, transparent), transparent 60%)`,
})

export const contentBrand = style({
    display: "none",
    "@media": {
        [NARROW]: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
    },
})
