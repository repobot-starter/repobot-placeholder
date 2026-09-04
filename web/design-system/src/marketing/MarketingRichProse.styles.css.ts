import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { section, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, { textAlign: "left" }])

export const frame = style({
    maxWidth: "65ch",
    margin: "0 auto",
})

export const frameWide = style({
    margin: "0 auto",
})

export const kicker = sectionKicker

export const title = sectionTitle

export const columns = style({
    columnCount: 2,
    columnGap: 48,
    "@media": {
        "(max-width: 860px)": { columnCount: 1 },
    },
})

export const paragraph = style({
    fontSize: 16.5,
    lineHeight: 1.75,
    color: marketing.color.text,
    margin: "0 0 20px",
    selectors: {
        "&:last-child": { marginBottom: 0 },
    },
})
