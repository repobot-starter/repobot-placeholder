import { keyframes, style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const footer = style({
    padding: "8px",
    borderTop: `1px solid ${vars.color.border}`,
})

/** Top-bar variant: hugs its content instead of filling a sidebar row. */
export const footerInline = style({
    display: "flex",
    alignItems: "center",
})

export const trigger = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    width: "100%",
    // Fixed geometry so the avatar shares the icon rail's column and does
    // not move when the sidebar collapses (see AppShell.styles.css.ts).
    padding: "6px",
    border: "none",
    borderRadius: vars.radius.md,
    backgroundColor: "transparent",
    cursor: "pointer",
    textAlign: "left",
    overflow: "hidden",
    transition: `background-color ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        "&:hover": { backgroundColor: vars.navigation.itemHoverBg },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

/** Top-bar variant of the trigger: avatar only, hugging its content. */
export const triggerInline = style({
    width: "auto",
    padding: vars.space.xs,
})

export const avatar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    flexShrink: 0,
    borderRadius: vars.radius.pill,
    backgroundColor: vars.navigation.itemActiveBg,
    color: vars.navigation.itemActiveText,
    fontSize: vars.fontSize.xs,
    fontWeight: 700,
    textTransform: "uppercase",
})

export const avatarImage = style({
    width: "100%",
    height: "100%",
    borderRadius: vars.radius.pill,
    objectFit: "cover",
})

export const labels = style({
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: 1,
})

export const label = style({
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const sublabel = style({
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

/** Labels fade and give up their width when the rail collapses; the avatar stays put. */
export const labelsCollapsed = style({
    opacity: 0,
    flex: "0 0 0px",
    minWidth: 0,
    width: 0,
    transition: `opacity ${vars.motion.durationFast} ${vars.motion.easing}`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

const overlayIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

export const overlay = style({
    position: "fixed",
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
    minWidth: "240px",
    maxWidth: "300px",
    padding: vars.space.xs,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surface,
    boxShadow: vars.shadow.lg,
    zIndex: 60,
    animation: `${overlayIn} 140ms ease`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
})

export const overlayHeader = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    minWidth: 0,
    padding: `${vars.space.xs} ${vars.space.sm}`,
})

export const overlayHeaderLabels = style({
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
})

export const separator = style({
    height: "1px",
    margin: `${vars.space.xxs} 0`,
    backgroundColor: vars.color.border,
})

export const sectionLabel = style({
    padding: `${vars.space.xxs} ${vars.space.sm}`,
    fontSize: vars.fontSize.xs,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: vars.color.textSecondary,
})

export const row = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    width: "100%",
    padding: `${vars.space.xs} ${vars.space.sm}`,
    border: "none",
    borderRadius: vars.radius.md,
    backgroundColor: "transparent",
    color: vars.color.textPrimary,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    transition: `background-color ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

export const rowIcon = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    flexShrink: 0,
    color: vars.color.textSecondary,
    selectors: {
        [`${row}:hover &`]: { color: vars.color.textPrimary },
    },
})

export const rowLabel = style({
    flex: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
})

export const rowCheck = style({
    display: "inline-flex",
    flexShrink: 0,
    color: vars.color.accent,
})
