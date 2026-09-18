import { vars } from "@base/design-system/tokens"
import { globalStyle, style } from "@vanilla-extract/css"

/**
 * The Locker register: mono-utility worn as an application — the fund-index /
 * dj spec-sheet content (graph-paper working surface, hairline rules, IBM
 * Plex Mono labels, one restrained accent) rendered inside the kernel
 * AppShell chrome. The dark spec-sheet ground lives in the pack's seeded
 * repobot.theme.json palette (mode: dark, true-black darkroom family — same
 * as the images pack), so every neutral here reads the theme contract's
 * tokens and a palette/mode roll re-papers the whole page; the accent routes
 * through the pack overlay so a brand edit re-inks live.
 */
const ground = vars.color.background
const surface = vars.color.surface
const line = vars.color.border
const ink = vars.color.textPrimary
const subtle = vars.color.textSecondary
const accent = "var(--pack-accent, #e8e8e4)"
const accentText = "var(--pack-accent-text, #050505)"

const mono = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
const body = 'var(--pack-font, "Inter", system-ui, sans-serif)'

export const page = style({
    minHeight: "100%",
    boxSizing: "border-box",
    color: ink,
    fontFamily: body,
    fontSize: "0.875rem",
    // The spec sheet's graph paper, drawn in the mode's ink over the shell
    // canvas (transparent base — the ground itself is the theme's).
    background:
        `repeating-linear-gradient(0deg, color-mix(in srgb, ${ink} 3%, transparent) 0 1px, transparent 1px 28px), ` +
        `repeating-linear-gradient(90deg, color-mix(in srgb, ${ink} 3%, transparent) 0 1px, transparent 1px 28px)`,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

//
// Page toolbar (search + list controls) — lives in the page so every shell
// variant keeps it, including the ones without a top bar.
//

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
})

export const searchInput = style({
    fontFamily: mono,
    fontSize: "0.8rem",
    color: ink,
    background: ground,
    border: `1px solid ${line}`,
    borderRadius: "4px",
    padding: "0.45rem 0.7rem",
    width: "min(20rem, 100%)",
    outline: "none",
    ":focus": {
        borderColor: ink,
    },
    "::placeholder": {
        color: subtle,
    },
})

export const toolbarActions = style({
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginLeft: "auto",
    flexWrap: "wrap",
})

//
// Buttons: spec-sheet controls (hairline plates, mono labels).
//

const buttonBase = {
    fontFamily: mono,
    fontSize: "0.72rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    borderRadius: "4px",
    padding: "0.45rem 0.8rem",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    ":disabled": {
        opacity: 0.45,
        cursor: "default",
    },
}

export const buttonPrimary = style({
    ...buttonBase,
    background: accent,
    color: accentText,
    border: `1px solid ${accent}`,
})

export const buttonGhost = style({
    ...buttonBase,
    background: "transparent",
    color: ink,
    border: `1px solid ${line}`,
    ":hover": {
        borderColor: ink,
    },
})

export const buttonDanger = style({
    ...buttonBase,
    background: "transparent",
    color: vars.color.danger,
    border: `1px solid ${line}`,
    ":hover": {
        borderColor: vars.color.danger,
    },
})

export const segmented = style({
    display: "inline-flex",
    border: `1px solid ${line}`,
    borderRadius: "4px",
    overflow: "hidden",
})

export const segmentButton = style({
    fontFamily: mono,
    fontSize: "0.72rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    background: "transparent",
    color: subtle,
    border: "none",
    padding: "0.45rem 0.7rem",
    cursor: "pointer",
    selectors: {
        "& + &": {
            borderLeft: `1px solid ${line}`,
        },
    },
})

export const segmentButtonActive = style({
    background: ink,
    color: ground,
})

//
// Nav glyphs (the AppShell rail's spec-sheet marks)
//

export const navGlyph = style({
    fontFamily: mono,
    fontSize: "0.7rem",
    lineHeight: 1,
})

export const crumbs = style({
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontFamily: mono,
    fontSize: "0.75rem",
    color: subtle,
    flexWrap: "wrap",
})

export const crumbButton = style({
    fontFamily: mono,
    fontSize: "0.75rem",
    background: "transparent",
    border: "none",
    color: ink,
    cursor: "pointer",
    padding: "0.15rem 0.2rem",
    borderRadius: "3px",
    ":hover": {
        background: surface,
    },
})

export const statusLine = style({
    fontFamily: mono,
    fontSize: "0.68rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: subtle,
})

//
// List layout: the spec-sheet table.
//

export const listTable = style({
    width: "100%",
    borderCollapse: "collapse",
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: "4px",
})

export const listHeadCell = style({
    fontFamily: mono,
    fontSize: "0.62rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: subtle,
    textAlign: "left",
    fontWeight: 400,
    padding: "0.55rem 0.75rem",
    borderBottom: `1px solid ${line}`,
})

export const listRow = style({
    cursor: "pointer",
    selectors: {
        "&:hover": {
            background: ground,
        },
    },
})

export const listCell = style({
    padding: "0.5rem 0.75rem",
    borderBottom: `1px solid ${line}`,
    fontSize: "0.82rem",
    verticalAlign: "middle",
})

export const listCellMuted = style([
    listCell,
    {
        color: subtle,
        fontFamily: mono,
        fontSize: "0.72rem",
        whiteSpace: "nowrap",
    },
])

export const nameCell = style({
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    minWidth: 0,
})

export const entryName = style({
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const typeTag = style({
    fontFamily: mono,
    fontSize: "0.58rem",
    letterSpacing: "0.08em",
    color: subtle,
    border: `1px solid ${line}`,
    borderRadius: "3px",
    padding: "0.1rem 0.3rem",
    flexShrink: 0,
    background: ground,
    minWidth: "2.6rem",
    textAlign: "center",
})

export const starButton = style({
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: subtle,
    padding: "0.15rem",
    lineHeight: 1,
})

export const starButtonOn = style({
    color: accent,
})

export const sharedBadge = style({
    fontFamily: mono,
    fontSize: "0.58rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: accent,
    border: `1px solid ${accent}`,
    borderRadius: "3px",
    padding: "0.1rem 0.3rem",
})

//
// Grid layout
//

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
    gap: "0.75rem",
})

export const gridCard = style({
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: "4px",
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
    padding: 0,
    ":hover": {
        borderColor: ink,
    },
})

export const gridThumb = style({
    height: "7.5rem",
    width: "100%",
    objectFit: "cover",
    display: "block",
    borderBottom: `1px solid ${line}`,
    background: ground,
})

export const gridThumbFallback = style({
    height: "7.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: mono,
    fontSize: "0.8rem",
    letterSpacing: "0.1em",
    color: subtle,
    borderBottom: `1px solid ${line}`,
    background: ground,
})

export const gridMeta = style({
    padding: "0.5rem 0.6rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
})

export const gridName = style({
    fontSize: "0.78rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const gridSub = style({
    fontFamily: mono,
    fontSize: "0.62rem",
    color: subtle,
})

//
// Empty / notice states
//

export const emptyState = style({
    border: `1px dashed ${line}`,
    borderRadius: "4px",
    padding: "3rem 1.5rem",
    textAlign: "center",
    color: subtle,
    fontFamily: mono,
    fontSize: "0.8rem",
    background: surface,
})

export const noticeBar = style({
    fontFamily: mono,
    fontSize: "0.72rem",
    color: ink,
    border: `1px solid ${line}`,
    borderLeft: `3px solid ${accent}`,
    background: surface,
    borderRadius: "4px",
    padding: "0.5rem 0.75rem",
})

export const errorBar = style({
    fontFamily: mono,
    fontSize: "0.72rem",
    color: vars.color.danger,
    border: `1px solid ${line}`,
    background: surface,
    borderRadius: "4px",
    padding: "0.5rem 0.75rem",
})

//
// Drop overlay + upload tray
//

export const dropOverlay = style({
    position: "fixed",
    inset: 0,
    zIndex: 40,
    background: vars.color.overlay,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
})

export const dropOverlayCard = style({
    fontFamily: mono,
    fontSize: "0.9rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: ink,
    border: `1px dashed ${ink}`,
    borderRadius: "4px",
    padding: "2rem 3rem",
    background: surface,
})

export const uploadTray = style({
    position: "fixed",
    right: "1rem",
    bottom: "1rem",
    zIndex: 30,
    width: "min(22rem, calc(100vw - 2rem))",
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: "4px",
    boxShadow: vars.shadow.lg,
    overflow: "hidden",
})

export const uploadTrayHeader = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: mono,
    fontSize: "0.68rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: subtle,
    padding: "0.5rem 0.75rem",
    borderBottom: `1px solid ${line}`,
})

export const uploadTrayClose = style({
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: subtle,
    fontFamily: mono,
    fontSize: "0.72rem",
})

export const uploadJobRow = style({
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.4rem 0.75rem",
    fontSize: "0.75rem",
    borderBottom: `1px solid ${ground}`,
})

export const uploadJobName = style({
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const uploadJobStatus = style({
    fontFamily: mono,
    fontSize: "0.6rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: subtle,
    flexShrink: 0,
})

export const uploadJobError = style([
    uploadJobStatus,
    {
        color: vars.color.danger,
    },
])

//
// Preview modal
//

export const previewBackdrop = style({
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: vars.color.overlay,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
})

export const previewCard = style({
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: "4px",
    width: "min(58rem, 100%)",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
})

export const previewHeader = style({
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.6rem 1rem",
    borderBottom: `1px solid ${line}`,
    fontFamily: mono,
    fontSize: "0.8rem",
})

export const previewBody = style({
    flex: 1,
    minHeight: "20rem",
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: ground,
})

export const previewImage = style({
    maxWidth: "100%",
    maxHeight: "70vh",
    display: "block",
})

export const previewFrame = style({
    width: "100%",
    height: "70vh",
    border: "none",
})

export const previewText = style({
    alignSelf: "stretch",
    margin: 0,
    padding: "1.25rem",
    fontFamily: mono,
    fontSize: "0.78rem",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
})

export const previewUnavailable = style({
    fontFamily: mono,
    fontSize: "0.8rem",
    color: subtle,
    padding: "3rem",
})

//
// Dialogs (rename / move / confirm)
//

export const dialogBackdrop = style({
    position: "fixed",
    inset: 0,
    zIndex: 60,
    background: vars.color.overlay,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "18vh",
})

export const dialogCard = style({
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: "4px",
    width: "min(26rem, calc(100vw - 2rem))",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    color: ink,
    fontFamily: body,
})

export const dialogTitle = style({
    fontFamily: mono,
    fontSize: "0.72rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: subtle,
    margin: 0,
})

export const dialogBodyText = style({
    fontSize: "0.82rem",
    margin: 0,
    lineHeight: 1.5,
})

export const dialogInput = style({
    fontFamily: mono,
    fontSize: "0.85rem",
    color: ink,
    background: ground,
    border: `1px solid ${line}`,
    borderRadius: "4px",
    padding: "0.5rem 0.7rem",
    outline: "none",
    ":focus": {
        borderColor: ink,
    },
})

export const dialogSelect = style([dialogInput, { appearance: "auto" }])

export const dialogActions = style({
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
})

//
// Row actions
//

export const actionsCell = style({
    whiteSpace: "nowrap",
    textAlign: "right",
})

export const rowActionButton = style({
    fontFamily: mono,
    fontSize: "0.62rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    background: "transparent",
    color: subtle,
    border: "none",
    cursor: "pointer",
    padding: "0.25rem 0.35rem",
    borderRadius: "3px",
    ":hover": {
        color: ink,
        background: ground,
    },
})

export const centeredGate = style({
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: ground,
})
