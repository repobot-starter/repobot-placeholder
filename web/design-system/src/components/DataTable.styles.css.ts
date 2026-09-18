import { globalStyle, style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

/* ------------------------------ container ----------------------------- */

export const container = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
    minWidth: 0,
})

/* Fullscreen (focus mode): the table takes over the viewport. */
export const containerFullscreen = style({
    position: "fixed",
    inset: 0,
    zIndex: 60,
    backgroundColor: vars.color.background,
    padding: vars.space.lg,
    overflow: "hidden",
})

export const wrapper = style({
    overflowX: "auto",
    minWidth: 0,
})

/* In fullscreen the scroll area takes the remaining height. */
export const wrapperFullscreen = style({
    flex: 1,
    overflowY: "auto",
})

export const wrapperStyle = styleVariants({
    minimalist: {
        border: "none",
        backgroundColor: "transparent",
    },
    standard: {
        border: `1px solid ${vars.color.border}`,
        borderRadius: vars.radius.md,
        backgroundColor: vars.color.surface,
    },
    detailed: {
        border: `1px solid ${vars.color.border}`,
        borderRadius: vars.radius.sm,
        backgroundColor: vars.color.surface,
    },
})

/* ------------------------------- toolbar ------------------------------ */

export const toolbar = style({
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: vars.space.xs,
})

export const toolbarButton = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xxs,
    border: `1px solid ${vars.color.border}`,
    background: vars.color.surface,
    color: vars.color.textSecondary,
    borderRadius: vars.radius.sm,
    padding: `${vars.space.xxs} ${vars.space.sm}`,
    fontSize: vars.fontSize.xs,
    fontFamily: vars.fontFamily.body,
    cursor: "pointer",
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover, color: vars.color.textPrimary },
    },
})

/* -------------------------------- table ------------------------------- */

export const table = style({
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: vars.fontSize.sm,
})

export const tableStyle = styleVariants({
    minimalist: {},
    standard: {},
    detailed: { fontSize: vars.fontSize.xs },
})

export const headerCell = style({
    textAlign: "left",
    fontWeight: 600,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: `1px solid ${vars.color.border}`,
    whiteSpace: "nowrap",
    backgroundColor: "inherit",
})

export const headerCellStyle = styleVariants({
    minimalist: {
        padding: `${vars.space.sm} ${vars.space.md}`,
        textTransform: "none",
        letterSpacing: "normal",
        fontSize: vars.fontSize.sm,
        fontWeight: 500,
    },
    standard: {
        padding: `${vars.space.sm} ${vars.space.md}`,
    },
    detailed: {
        padding: `${vars.space.xs} ${vars.space.sm}`,
        position: "sticky",
        top: 0,
        zIndex: 2,
        backgroundColor: vars.color.surface,
    },
})

export const headerSortButton = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xxs,
    border: "none",
    background: "transparent",
    padding: 0,
    font: "inherit",
    color: "inherit",
    textTransform: "inherit",
    letterSpacing: "inherit",
    cursor: "pointer",
    selectors: {
        "&:hover": { color: vars.color.textPrimary },
    },
})

export const sortIndicator = style({
    fontSize: vars.fontSize.xs,
    opacity: 0.7,
})

/* ----------------------------- filter row ----------------------------- */

export const filterCell = style({
    padding: `${vars.space.xxs} ${vars.space.sm}`,
    borderBottom: `1px solid ${vars.color.border}`,
    backgroundColor: "inherit",
})

export const filterInput = style({
    width: "100%",
    minWidth: "5rem",
    boxSizing: "border-box",
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.sm,
    backgroundColor: vars.color.background,
    color: vars.color.textPrimary,
    fontSize: vars.fontSize.xs,
    fontFamily: vars.fontFamily.body,
    padding: `${vars.space.xxs} ${vars.space.xs}`,
    selectors: {
        "&:focus": { outline: `1px solid ${vars.color.accent}`, outlineOffset: "-1px" },
    },
})

/* -------------------------------- rows --------------------------------- */

export const row = style({
    backgroundColor: "inherit",
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover },
    },
})

export const cell = style({
    color: vars.color.textPrimary,
    verticalAlign: "middle",
    backgroundColor: "inherit",
})

export const cellStyle = styleVariants({
    minimalist: { padding: `${vars.space.sm} ${vars.space.md}` },
    standard: { padding: `${vars.space.sm} ${vars.space.md}` },
    detailed: {
        padding: `${vars.space.xxs} ${vars.space.sm}`,
        whiteSpace: "nowrap",
        borderRight: `1px solid ${vars.color.border}`,
    },
})

globalStyle(`${row}:not(:last-child) td`, {
    borderBottom: `1px solid ${vars.color.border}`,
})

/* Detailed keeps hairlines on every row (the last row too, against the pager). */
globalStyle(`${tableStyle.detailed} ${row}:last-child td`, {
    borderBottom: `1px solid ${vars.color.border}`,
})

/* Minimalist rows divide with hairlines only (no outer chrome). */
globalStyle(`${tableStyle.minimalist} ${row}:hover`, {
    backgroundColor: "transparent",
})

export const actionsCell = style({
    width: "44px",
    textAlign: "right",
    padding: `${vars.space.xs} ${vars.space.sm}`,
})

/* --------------------------- expandable rows -------------------------- */

export const expanderCell = style({
    width: "36px",
    minWidth: "36px",
    boxSizing: "border-box",
    padding: `0 ${vars.space.xs}`,
    textAlign: "center",
})

export const expanderButton = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    border: "none",
    background: "transparent",
    color: vars.color.textSecondary,
    borderRadius: vars.radius.sm,
    cursor: "pointer",
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover, color: vars.color.textPrimary },
    },
})

export const expandedRow = style({
    backgroundColor: "inherit",
})

export const expandedCell = style({
    padding: `${vars.space.sm} ${vars.space.md} ${vars.space.md}`,
    backgroundColor: vars.color.background,
    borderBottom: `1px solid ${vars.color.border}`,
})

/* Pinned (sticky-left) columns keep an opaque background and a divider. */
export const pinnedCell = style({
    position: "sticky",
    zIndex: 1,
    backgroundColor: vars.color.surface,
    boxShadow: `inset -1px 0 0 ${vars.color.border}`,
})

export const emptyCell = style({
    padding: vars.space.lg,
    textAlign: "center",
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
})

/* ----------------------------- inline edit ---------------------------- */

export const editableCellButton = style({
    display: "block",
    width: "100%",
    border: "none",
    background: "transparent",
    font: "inherit",
    color: "inherit",
    textAlign: "inherit",
    padding: 0,
    cursor: "text",
    borderRadius: vars.radius.sm,
    selectors: {
        "&:hover": { outline: `1px dashed ${vars.color.border}`, outlineOffset: "2px" },
    },
})

export const editableCellInput = style({
    width: "100%",
    minWidth: "4rem",
    boxSizing: "border-box",
    border: `1px solid ${vars.color.accent}`,
    borderRadius: vars.radius.sm,
    backgroundColor: vars.color.background,
    color: vars.color.textPrimary,
    font: "inherit",
    fontFamily: vars.fontFamily.body,
    padding: `${vars.space.xxs} ${vars.space.xs}`,
    selectors: {
        "&:focus": { outline: "none" },
    },
})

/* -------------------------------- footer ------------------------------ */

export const footer = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
})

export const footerStatus = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const footerControls = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
})

export const loadMoreFooter = style({
    display: "flex",
    justifyContent: "center",
})
