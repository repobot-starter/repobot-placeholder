import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"

export const bar = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: "36px 0 0",
    fontSize: 13,
    color: marketing.color.subtle,
})

export const link = style({
    color: marketing.color.subtle,
    textDecoration: "none",
    selectors: { "&:hover": { color: marketing.color.text } },
})
