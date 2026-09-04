import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const clientGrid = style({
    display: "grid",
    gap: vars.space.lg,
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
})

export const clientMeta = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const clientStats = style({
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: vars.space.sm,
    margin: 0,
})

export const clientStat = style({
    display: "grid",
    gap: "2px",
})

export const clientStatLabel = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const clientStatValue = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
})
