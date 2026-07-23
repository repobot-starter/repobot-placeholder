import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const loadingBody = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.md,
})

export const submitError = style({
    margin: `${vars.space.sm} 0 0`,
    padding: vars.space.sm,
    backgroundColor: vars.color.dangerSurface,
    borderRadius: vars.radius.sm,
    color: vars.color.danger,
    fontSize: vars.fontSize.sm,
})
