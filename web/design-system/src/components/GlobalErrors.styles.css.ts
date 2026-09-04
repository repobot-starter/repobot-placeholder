import { keyframes, style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

const slideIn = keyframes({
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

/* Above toasts (1000) — an unhandled failure outranks an outcome notice. */
const ERROR_Z_INDEX = 1100

/* ------------------------------- modal -------------------------------- */

export const overlay = style({
    position: "fixed",
    inset: 0,
    background: vars.color.overlay,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: vars.space.lg,
    zIndex: ERROR_Z_INDEX,
    animation: `${fadeIn} 120ms ease-out`,
})

export const modal = style({
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderTop: `3px solid ${vars.color.danger}`,
    borderRadius: vars.radius.lg,
    boxShadow: vars.shadow.lg,
    width: "min(28rem, 100%)",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
    padding: vars.space.lg,
    animation: `${slideIn} 160ms ease-out`,
})

export const modalHeader = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
})

export const modalTitle = style({
    fontSize: vars.fontSize.lg,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const pager = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xs,
    flexShrink: 0,
})

export const pagerButton = style({
    border: `1px solid ${vars.color.border}`,
    background: "transparent",
    color: vars.color.textPrimary,
    borderRadius: vars.radius.sm,
    width: "24px",
    height: "24px",
    lineHeight: 1,
    fontSize: vars.fontSize.md,
    cursor: "pointer",
    selectors: {
        "&:hover:not(:disabled)": { backgroundColor: vars.color.surfaceHover },
        "&:disabled": { opacity: 0.4, cursor: "default" },
    },
})

export const pagerLabel = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    whiteSpace: "nowrap",
})

export const message = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    color: vars.color.textPrimary,
    lineHeight: 1.5,
})

export const detail = style({
    margin: 0,
    padding: vars.space.sm,
    background: vars.color.background,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    fontFamily: vars.fontFamily.mono,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    overflow: "auto",
    maxHeight: "12rem",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
})

export const modalFooter = style({
    display: "flex",
    justifyContent: "flex-end",
    gap: vars.space.sm,
    marginTop: vars.space.xs,
})

/* ------------------------------- corner ------------------------------- */

export const cornerViewport = style({
    position: "fixed",
    bottom: vars.space.lg,
    right: vars.space.lg,
    display: "grid",
    gap: vars.space.sm,
    justifyItems: "end",
    zIndex: ERROR_Z_INDEX,
    maxWidth: "24rem",
    width: "calc(100vw - 2 * 16px)",
    "@media": {
        "screen and (min-width: 480px)": {
            width: "auto",
            minWidth: "20rem",
        },
    },
})

export const cornerDismissAll = style({
    border: "none",
    background: "transparent",
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.xs,
    cursor: "pointer",
    padding: vars.space.xxs,
    selectors: {
        "&:hover": { color: vars.color.textPrimary },
    },
})

export const cornerCard = style({
    display: "flex",
    alignItems: "flex-start",
    gap: vars.space.sm,
    width: "100%",
    padding: `${vars.space.sm} ${vars.space.md}`,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderLeft: `3px solid ${vars.color.danger}`,
    borderRadius: vars.radius.md,
    boxShadow: vars.shadow.md,
    animation: `${slideIn} 160ms ease-out`,
})

export const cornerBody = style({
    display: "grid",
    gap: "2px",
    flex: 1,
    minWidth: 0,
})

export const cornerTitle = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const cornerMessage = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const cornerDismiss = style({
    flexShrink: 0,
    border: "none",
    background: "transparent",
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.md,
    lineHeight: 1,
    padding: vars.space.xxs,
    cursor: "pointer",
    borderRadius: vars.radius.sm,
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover, color: vars.color.textPrimary },
    },
})
