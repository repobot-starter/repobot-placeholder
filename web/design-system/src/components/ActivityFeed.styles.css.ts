import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const list = style({
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const row = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    padding: `${vars.space.sm} 0`,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "&:last-child": { borderBottom: "none", paddingBottom: 0 },
        "&:first-child": { paddingTop: 0 },
    },
})

export const icon = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: vars.color.textSecondary,
})

export const body = style({
    display: "grid",
    gap: "2px",
    flex: 1,
    minWidth: 0,
})

export const title = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const meta = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const timestamp = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    whiteSpace: "nowrap",
})
