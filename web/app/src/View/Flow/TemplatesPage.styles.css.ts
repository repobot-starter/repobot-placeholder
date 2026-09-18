import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const createRow = style({
    display: "flex",
    alignItems: "flex-end",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const createField = style({
    display: "grid",
    gap: vars.space.xs,
    minWidth: "180px",
})

export const templateGrid = style({
    display: "grid",
    gap: vars.space.lg,
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
})
