import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const gate = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40vh",
    padding: vars.space.xl,
})
