import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const container = style({
    position: "relative",
    display: "grid",
    gap: vars.space.xxs,
})

export const dropdown = style({
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "2px",
    maxHeight: "15rem",
    overflowY: "auto",
    backgroundColor: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.sm,
    boxShadow: vars.shadow.md,
    zIndex: 40,
    padding: vars.space.xxs,
})

export const dropdownStatus = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.xs,
    padding: `${vars.space.xs} ${vars.space.sm}`,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
})

export const option = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "1px",
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    padding: `${vars.space.xs} ${vars.space.sm}`,
    borderRadius: vars.radius.sm,
    cursor: "pointer",
    fontFamily: vars.fontFamily.body,
})

export const optionActive = style({
    backgroundColor: vars.color.surfaceHover,
})

export const optionLabel = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
})

export const optionDescription = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const createRow = style({
    display: "flex",
    justifyContent: "flex-end",
})

export const createLink = style({
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: vars.fontSize.xs,
    fontFamily: vars.fontFamily.body,
    color: vars.color.accent,
    cursor: "pointer",
    selectors: {
        "&:hover": { textDecoration: "underline" },
        "&:disabled": { color: vars.color.muted, cursor: "default" },
    },
})
