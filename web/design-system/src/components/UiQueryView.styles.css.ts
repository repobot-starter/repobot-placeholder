import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const container = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.lg,
})

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.xl,
    fontWeight: 800,
    color: vars.color.textPrimary,
})

export const toolbarActions = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
})

export const searchBox = style({
    width: "260px",
})

export const skeletonTable = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
    padding: vars.space.lg,
    backgroundColor: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
})

export const footer = style({
    display: "flex",
    justifyContent: "center",
    padding: `${vars.space.sm} 0`,
})
