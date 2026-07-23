import { globalStyle, style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const wrapper = style({
    overflowX: "auto",
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    backgroundColor: vars.color.surface,
})

export const table = style({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: vars.fontSize.sm,
})

export const headerCell = style({
    padding: `${vars.space.sm} ${vars.space.md}`,
    textAlign: "left",
    fontWeight: 600,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: `1px solid ${vars.color.border}`,
    whiteSpace: "nowrap",
})

export const row = style({
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover },
    },
})

globalStyle(`${row}:not(:last-child) td`, {
    borderBottom: `1px solid ${vars.color.border}`,
})

export const cell = style({
    padding: `${vars.space.sm} ${vars.space.md}`,
    color: vars.color.textPrimary,
    verticalAlign: "middle",
})

export const actionsCell = style({
    width: "44px",
    textAlign: "right",
    padding: `${vars.space.xs} ${vars.space.sm}`,
})
