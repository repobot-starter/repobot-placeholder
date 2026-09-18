import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const requiredList = style({
    margin: 0,
    paddingLeft: vars.space.lg,
    display: "grid",
    gap: vars.space.xxs,
})

export const documentList = style({
    display: "grid",
    gap: vars.space.sm,
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const documentItem = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
    padding: vars.space.md,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
})
