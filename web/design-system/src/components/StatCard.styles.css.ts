import { style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const row = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
    gap: vars.space.md,
})

export const card = style({
    display: "grid",
    gap: vars.space.xs,
    padding: vars.space.md,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
})

/* Colored top-border accents (the `tone` prop). */
export const cardTone = styleVariants({
    accent: { borderTop: `3px solid ${vars.color.accent}` },
    success: { borderTop: `3px solid ${vars.color.success}` },
    danger: { borderTop: `3px solid ${vars.color.danger}` },
    warning: { borderTop: `3px solid ${vars.color.warning}` },
    info: { borderTop: `3px solid ${vars.color.info}` },
})

export const label = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const valueRow = style({
    display: "flex",
    alignItems: "baseline",
    gap: vars.space.sm,
})

export const value = style({
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
})

/* Delta reads as a small tinted chip — the fintech-dashboard register. */
export const delta = style({
    display: "inline-flex",
    alignItems: "baseline",
    gap: "2px",
    padding: `1px ${vars.space.xs}`,
    borderRadius: vars.radius.pill,
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
})

export const deltaPositive = style({
    color: vars.color.success,
    backgroundColor: vars.color.successSurface,
})

export const deltaNegative = style({
    color: vars.color.danger,
    backgroundColor: vars.color.dangerSurface,
})

export const deltaNeutral = style({
    color: vars.color.textSecondary,
    backgroundColor: vars.color.muted,
})

export const hint = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

/* The trend sparkline hugs the card's bottom edge, colored by tone. */
export const spark = style({
    width: "100%",
    height: "32px",
    marginTop: vars.space.xs,
    display: "block",
    color: vars.color.accent,
})

export const sparkTone = styleVariants({
    accent: { color: vars.color.accent },
    success: { color: vars.color.success },
    danger: { color: vars.color.danger },
    warning: { color: vars.color.warning },
    info: { color: vars.color.info },
})
