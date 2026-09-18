import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const brandRow = style({
    display: "flex",
    alignItems: "flex-end",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const brandField = style({
    display: "grid",
    gap: vars.space.xs,
    minWidth: "220px",
})

export const swatchRow = style({
    display: "flex",
    gap: vars.space.sm,
})

export const swatch = style({
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: `2px solid ${vars.color.border}`,
    cursor: "pointer",
    padding: 0,
})

export const swatchActive = style({
    borderColor: vars.color.textPrimary,
})

export const chartGrid = style({
    display: "grid",
    gap: vars.space.md,
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
})

export const slideList = style({
    display: "grid",
    gap: vars.space.md,
})

export const slideItem = style({
    display: "grid",
    gap: vars.space.sm,
    padding: vars.space.md,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
})

export const slideExcluded = style({
    opacity: 0.55,
})

export const slideHead = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
})

export const slideKind = style({
    fontSize: vars.fontSize.xs,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: vars.color.textSecondary,
})

export const slideFields = style({
    display: "grid",
    gap: vars.space.sm,
})

export const slideBody = style({
    width: "100%",
    resize: "vertical",
    padding: vars.space.sm,
    fontSize: vars.fontSize.sm,
    fontFamily: "inherit",
    color: vars.color.textPrimary,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
})
