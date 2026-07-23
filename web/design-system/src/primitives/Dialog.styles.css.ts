import { keyframes, style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

const popIn = keyframes({
    from: { opacity: 0, transform: "translate(-50%, -48%) scale(0.97)" },
    to: { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
})

export const overlay = style({
    position: "fixed",
    inset: 0,
    backgroundColor: vars.color.overlay,
    animation: `${fadeIn} 140ms ease`,
    zIndex: 50,
})

export const content = style({
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(560px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column",
    // Portaled outside themeRoot, so the base font must be declared here too.
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.md,
    backgroundColor: vars.color.surface,
    color: vars.color.textPrimary,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    boxShadow: vars.shadow.lg,
    animation: `${popIn} 140ms ease`,
    zIndex: 51,
})

export const header = style({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: vars.space.md,
    padding: `${vars.space.lg} ${vars.space.xl}`,
    borderBottom: `1px solid ${vars.color.border}`,
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.lg,
    fontWeight: 700,
})

export const description = style({
    margin: `${vars.space.xs} 0 0`,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
})

export const closeButton = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    border: "none",
    borderRadius: vars.radius.sm,
    backgroundColor: "transparent",
    color: vars.color.textSecondary,
    cursor: "pointer",
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover, color: vars.color.textPrimary },
    },
})

export const body = style({
    padding: `${vars.space.lg} ${vars.space.xl}`,
    overflowY: "auto",
    flex: 1,
})

export const footer = style({
    display: "flex",
    justifyContent: "flex-end",
    gap: vars.space.sm,
    padding: `${vars.space.md} ${vars.space.xl}`,
    borderTop: `1px solid ${vars.color.border}`,
})
