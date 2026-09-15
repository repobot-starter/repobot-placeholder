import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const NARROW = "screen and (max-width: 860px)"

export const container = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.lg,
    minWidth: 0,
})

export const header = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
})

export const titleRow = style({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const titleBlock = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
    minWidth: 0,
})

export const titleLine = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    flexWrap: "wrap",
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const subtitle = style({
    margin: 0,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
})

export const actions = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    flexWrap: "wrap",
})

export const metaRow = style({
    display: "flex",
    gap: vars.space.xl,
    flexWrap: "wrap",
    margin: 0,
    padding: `${vars.space.md} 0 0`,
    "@media": {
        [NARROW]: {
            gap: vars.space.md,
        },
    },
})

export const metaItem = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
})

export const metaLabel = style({
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
    color: vars.color.textSecondary,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
})

export const metaValue = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
})
