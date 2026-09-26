import { keyframes, style, styleVariants } from "@vanilla-extract/css"
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
    // The character's floating-surface elevation; `plain` is shadow.lg.
    boxShadow: vars.treatment.cardShadow,
    animation: `${popIn} 140ms ease`,
    zIndex: 51,
})

export const size = styleVariants({
    skinny: { width: "min(400px, calc(100vw - 32px))" },
    normal: {},
    wide: { width: "min(820px, calc(100vw - 32px))" },
})

/* Sheet chrome: the modal presentation as a right-edge, full-height panel
 * that slides in — the drawer read for workflow-heavy identities. Same
 * header/body/footer anatomy as the centered card, so consumers never fork. */
const slideInRight = keyframes({
    from: { opacity: 0, transform: "translateX(24px)" },
    to: { opacity: 1, transform: "translateX(0)" },
})

export const sheetContent = style({
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.md,
    backgroundColor: vars.color.surface,
    color: vars.color.textPrimary,
    borderLeft: `1px solid ${vars.color.border}`,
    // Only the outward corners round: the panel is attached to the edge.
    borderRadius: `${vars.radius.lg} 0 0 ${vars.radius.lg}`,
    boxShadow: vars.treatment.cardShadow,
    animation: `${slideInRight} 160ms ease-out`,
    zIndex: 51,
})

export const sheetSize = styleVariants({
    skinny: { width: "min(400px, calc(100vw - 24px))" },
    normal: { width: "min(480px, calc(100vw - 24px))" },
    wide: { width: "min(680px, calc(100vw - 24px))" },
})

/* Takeover chrome: the modal presentation filling the viewport — the
 * standard dialog header (title left, close right) over a centered content
 * column, distinct from the "page" presentation's upper-left X banner. */
export const takeoverContent = style({
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.md,
    backgroundColor: vars.color.surface,
    color: vars.color.textPrimary,
    animation: `${fadeIn} 140ms ease`,
    zIndex: 51,
})

/* Full-page presentation: the dialog fills the viewport (no floating card),
 * with the close X in the upper left and the content in a centered column. */
export const pageContent = style({
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.md,
    backgroundColor: vars.color.background,
    color: vars.color.textPrimary,
    animation: `${fadeIn} 140ms ease`,
    zIndex: 51,
})

export const pageHeader = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    padding: `${vars.space.md} ${vars.space.lg}`,
    borderBottom: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surface,
})

/* The centered content column; width follows the form-width preset. */
export const pageColumn = styleVariants({
    skinny: { width: "min(400px, 100%)", margin: "0 auto" },
    normal: { width: "min(560px, 100%)", margin: "0 auto" },
    wide: { width: "min(820px, 100%)", margin: "0 auto" },
})

export const pageFooter = style({
    display: "flex",
    justifyContent: "flex-end",
    gap: vars.space.sm,
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
