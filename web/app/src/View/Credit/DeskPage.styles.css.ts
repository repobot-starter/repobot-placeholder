import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const lcGrid = style({
    display: "grid",
    gap: vars.space.lg,
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
})

export const lcStats = style({
    display: "grid",
    gap: vars.space.md,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
})
