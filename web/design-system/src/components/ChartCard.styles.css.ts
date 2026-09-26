import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const card = style({
    display: "grid",
    gap: vars.space.md,
    padding: vars.space.lg,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
})

export const header = style({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: vars.space.md,
})

export const headerText = style({
    display: "grid",
    gap: vars.space.xxs,
    minWidth: 0,
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const description = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const action = style({
    flexShrink: 0,
})

export const body = style({
    // The measuring container recharts fills; position lets the donut
    // center label overlay the svg.
    position: "relative",
    width: "100%",
})

export const donutCenter = style({
    position: "absolute",
    inset: 0,
    display: "grid",
    placeContent: "center",
    justifyItems: "center",
    gap: vars.space.xxs,
    pointerEvents: "none",
})

export const donutCenterValue = style({
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
})

export const donutCenterLabel = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const tooltip = style({
    display: "grid",
    gap: vars.space.xxs,
    padding: `${vars.space.xs} ${vars.space.sm}`,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    boxShadow: vars.shadow.md,
    fontSize: vars.fontSize.xs,
})

export const tooltipLabel = style({
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const tooltipRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.xs,
    color: vars.color.textSecondary,
})

export const tooltipValue = style({
    marginLeft: "auto",
    fontWeight: 600,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
})

export const swatch = style({
    width: "8px",
    height: "8px",
    borderRadius: "2px",
    flexShrink: 0,
})

export const legend = style({
    display: "flex",
    flexWrap: "wrap",
    gap: `${vars.space.xs} ${vars.space.md}`,
})

export const legendItem = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xs,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

/* Donut `legendValues` rows: label, value, and share per segment. */
export const valueLegend = style({
    display: "grid",
    gap: vars.space.xs,
})

export const valueLegendRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.xs,
    fontSize: vars.fontSize.xs,
})

export const valueLegendLabel = style({
    color: vars.color.textSecondary,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const valueLegendValue = style({
    marginLeft: "auto",
    fontWeight: 600,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
})

export const valueLegendShare = style({
    width: "2.6rem",
    textAlign: "right",
    color: vars.color.textSecondary,
    fontVariantNumeric: "tabular-nums",
})
