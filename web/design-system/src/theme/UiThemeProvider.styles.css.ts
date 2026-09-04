import { style } from "@vanilla-extract/css"
import { vars } from "./tokens.css"

export const themeRoot = style({
    minHeight: "100vh",
    backgroundColor: vars.color.background,
    color: vars.color.textPrimary,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.md,
    WebkitFontSmoothing: "antialiased",
})
