import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const shell = style({
    display: "flex",
    minHeight: "100vh",
    backgroundColor: vars.color.background,
})

export const sidebar = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.lg,
    width: "216px",
    flexShrink: 0,
    padding: vars.space.lg,
    boxSizing: "border-box",
    backgroundColor: vars.color.surface,
    borderRight: `1px solid ${vars.color.border}`,
})

export const brand = style({
    fontSize: vars.fontSize.lg,
    fontWeight: 800,
    color: vars.color.textPrimary,
    padding: `${vars.space.xs} ${vars.space.sm}`,
})

export const nav = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
})

export const navItem = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    padding: `${vars.space.sm} ${vars.space.sm}`,
    border: "none",
    borderRadius: vars.radius.md,
    backgroundColor: "transparent",
    color: vars.color.textSecondary,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover, color: vars.color.textPrimary },
    },
})

export const navItemActive = style({
    backgroundColor: vars.color.surfaceHover,
    color: vars.color.accent,
})

export const main = style({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
})

export const header = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: vars.space.md,
    height: "52px",
    padding: `0 ${vars.space.xl}`,
    boxSizing: "border-box",
    backgroundColor: vars.color.surface,
    borderBottom: `1px solid ${vars.color.border}`,
})

export const content = style({
    flex: 1,
    padding: vars.space.xl,
    overflowY: "auto",
})
