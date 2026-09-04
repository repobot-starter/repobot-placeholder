import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const NARROW = "screen and (max-width: 860px)"

export const container = style({
    display: "grid",
    gap: vars.space.lg,
    alignItems: "start",
    "@media": {
        [NARROW]: {
            // One pane at a time on narrow screens; gridTemplateColumns from
            // the inline style is overridden here.
            gridTemplateColumns: "minmax(0, 1fr) !important",
        },
    },
})

export const listPane = style({
    minWidth: 0,
})

export const detailPane = style({
    minWidth: 0,
    display: "grid",
    gap: vars.space.md,
    alignContent: "start",
})

/** Applied to the pane that should give way on narrow screens. */
export const paneHiddenNarrow = style({
    "@media": {
        [NARROW]: {
            display: "none",
        },
    },
})

export const backRow = style({
    display: "none",
    "@media": {
        [NARROW]: {
            display: "block",
        },
    },
})
