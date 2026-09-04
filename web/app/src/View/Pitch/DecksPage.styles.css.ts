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
    minWidth: "220px",
})

export const deckGrid = style({
    display: "grid",
    gap: vars.space.md,
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
})

export const accentDot = style({
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: `1px solid ${vars.color.border}`,
})
