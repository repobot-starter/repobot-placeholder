import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const container = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
    marginTop: vars.space.md,
    padding: vars.space.md,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    backgroundColor: vars.color.surface,
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const description = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const table = style({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: vars.fontSize.sm,
    fontVariantNumeric: "tabular-nums",
})

export const headerCell = style({
    textAlign: "left",
    padding: `${vars.space.xs} ${vars.space.sm}`,
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: vars.color.textSecondary,
    borderBottom: `1px solid ${vars.color.border}`,
})

export const cell = style({
    padding: `${vars.space.xs} ${vars.space.sm}`,
    color: vars.color.textPrimary,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "tr:last-child &": { borderBottom: "none" },
    },
})

export const cellRight = style({
    textAlign: "right",
})

export const cellEmphasis = style({
    fontWeight: 700,
})
