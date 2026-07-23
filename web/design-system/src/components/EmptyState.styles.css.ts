import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const container = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: vars.space.sm,
    padding: vars.space.xxl,
    textAlign: "center",
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.lg,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const description = style({
    margin: 0,
    maxWidth: "360px",
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const action = style({
    marginTop: vars.space.sm,
})
