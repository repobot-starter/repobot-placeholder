import { globalStyle, style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const form = style({})

// rjsf wraps everything in nested divs; keep the root fieldset invisible.
globalStyle(`${form} fieldset`, {
    border: "none",
    margin: 0,
    padding: 0,
    minWidth: 0,
})

export const field = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
    marginBottom: vars.space.md,
})

export const description = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const fieldError = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    color: vars.color.danger,
})

export const objectContainer = style({
    display: "flex",
    flexDirection: "column",
})

export const sectionTitle = style({
    margin: `0 0 ${vars.space.sm}`,
    fontSize: vars.fontSize.md,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const checkboxRow = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.sm,
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
    cursor: "pointer",
})

export const checkbox = style({
    width: "16px",
    height: "16px",
    accentColor: vars.color.accent,
    cursor: "pointer",
})
