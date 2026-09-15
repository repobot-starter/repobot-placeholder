import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const label = style({
    display: "inline-block",
    color: vars.color.textPrimary,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    lineHeight: 1.4,
})

export const requiredMark = style({
    color: vars.color.danger,
    marginLeft: vars.space.xxs,
})
