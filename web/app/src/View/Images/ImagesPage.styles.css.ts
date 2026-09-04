import { vars } from "@base/design-system/tokens"
import { globalStyle, style } from "@vanilla-extract/css"

/**
 * The Contact Sheet register: the same mono-utility spec-sheet content as
 * the Locker, printed in reverse — a darkroom contact sheet rendered inside
 * the kernel AppShell chrome. The pure-black ground lives in the pack's
 * seeded repobot.theme.json palette (mode: dark), so every neutral here
 * reads the theme contract's tokens; IBM Plex Mono frame numbers and one
 * restrained accent (via the pack overlay) carry the character. Photos are
 * the only color on the page; the chrome stays out of their way.
 */
const ground = vars.color.background
const surface = vars.color.surface
const line = vars.color.border
const ink = vars.color.textPrimary
const subtle = vars.color.textSecondary
const accent = "var(--pack-accent, #d8b24a)"
const accentText = "var(--pack-accent-text, #0a0a0a)"
const danger = vars.color.danger

const mono = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
const body = 'var(--pack-font, "Inter", system-ui, sans-serif)'

export const page = style({
    minHeight: "100%",
    boxSizing: "border-box",
    color: ink,
    fontFamily: body,
    fontSize: "0.875rem",
    // The contact sheet's faint grid, drawn in the mode's ink over the
    // shell canvas (transparent base — the ground itself is the theme's).
    background:
        `repeating-linear-gradient(0deg, color-mix(in srgb, ${ink} 3%, transparent) 0 1px, transparent 1px 28px), ` +
        `repeating-linear-gradient(90deg, color-mix(in srgb, ${ink} 3%, transparent) 0 1px, transparent 1px 28px)`,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    maxWidth: "90rem",
    width: "100%",
    margin: "0 auto",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

//
// Page toolbar (search + import) — lives in the page so every shell
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
    width: "min(18rem, 100%)",
    outline: "none",
    ":focus": {
        borderColor: subtle,
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
// Buttons
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
        borderColor: subtle,
    },
})

export const buttonDanger = style({
    ...buttonBase,
    background: "transparent",
    color: danger,
    border: `1px solid ${line}`,
    ":hover": {
        borderColor: danger,
    },
})

//
// Nav glyphs (the AppShell rail's contact-sheet marks)
//

export const navGlyph = style({
    fontFamily: mono,
    fontSize: "0.7rem",
    lineHeight: 1,
})

export const statusLine = style({
    fontFamily: mono,
    fontSize: "0.68rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: subtle,
    display: "flex",
    alignItems: "baseline",
    gap: "0.75rem",
    flexWrap: "wrap",
})

export const monthHeading = style({
    fontFamily: mono,
    fontSize: "0.72rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: subtle,
    borderBottom: `1px solid ${line}`,
    paddingBottom: "0.4rem",
    margin: "0.5rem 0 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
})

export const monthCount = style({
    fontSize: "0.62rem",
    letterSpacing: "0.08em",
})

//
// Masonry: CSS columns; frames keep natural aspect.
//

export const masonry = style({
    columnGap: "0.75rem",
    columnWidth: "13rem",
})

export const frame = style({
    breakInside: "avoid",
    marginBottom: "0.75rem",
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: "3px",
    overflow: "hidden",
    cursor: "pointer",
    position: "relative",
    display: "block",
    width: "100%",
    padding: 0,
    textAlign: "left",
    ":hover": {
        borderColor: subtle,
    },
})

export const frameImage = style({
    width: "100%",
    display: "block",
    background: ground,
})

export const frameMeta = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "0.5rem",
    padding: "0.35rem 0.5rem",
    borderTop: `1px solid ${line}`,
})

export const frameNumber = style({
    fontFamily: mono,
    fontSize: "0.6rem",
    letterSpacing: "0.08em",
    color: subtle,
    whiteSpace: "nowrap",
})

export const frameCaption = style({
    fontSize: "0.68rem",
    color: ink,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
})

export const frameStar = style({
    position: "absolute",
    top: "0.35rem",
    right: "0.35rem",
    // Legibility scrim over arbitrary photo content, not a theme surface.
    background: "rgba(10, 10, 10, 0.65)",
    border: "none",
    borderRadius: "3px",
    color: "#cfcfcf", // theme-exempt: ink over the photo scrim, not a theme surface
    cursor: "pointer",
    fontSize: "0.85rem",
    lineHeight: 1,
    padding: "0.25rem 0.35rem",
})

export const frameStarOn = style({
    color: accent,
})

//
// Album shelf
//

export const albumShelf = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(13rem, 1fr))",
    gap: "0.75rem",
})

export const albumCard = style({
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: "4px",
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    ":hover": {
        borderColor: subtle,
    },
})

export const albumCover = style({
    height: "8rem",
    width: "100%",
    objectFit: "cover",
    display: "block",
    borderBottom: `1px solid ${line}`,
    background: ground,
})

export const albumCoverEmpty = style({
    height: "8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: mono,
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: subtle,
    borderBottom: `1px solid ${line}`,
    background: ground,
})

export const albumMeta = style({
    padding: "0.5rem 0.65rem",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "0.5rem",
})

export const albumName = style({
    fontSize: "0.82rem",
    color: ink,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const albumCount = style({
    fontFamily: mono,
    fontSize: "0.62rem",
    color: subtle,
    whiteSpace: "nowrap",
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
    color: danger,
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
        color: danger,
    },
])

//
// Lightbox — the darkroom moment stays true black regardless of theme:
// photos are inspected against a void, not a surface.
//

export const lightboxBackdrop = style({
    position: "fixed",
    inset: 0,
    zIndex: 50,
    background: "rgba(0, 0, 0, 0.94)", // theme-exempt: the darkroom void behind inspected photos
    display: "flex",
    flexDirection: "column",
})

const lightboxLine = "rgba(255, 255, 255, 0.16)" // theme-exempt: hairlines on the darkroom void
const lightboxInk = "#ececec" // theme-exempt: ink on the darkroom void
const lightboxSubtle = "#8f8f8f" // theme-exempt: muted ink on the darkroom void

export const lightboxTop = style({
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.6rem 1rem",
    borderBottom: `1px solid ${lightboxLine}`,
    fontFamily: mono,
    fontSize: "0.75rem",
    color: lightboxSubtle,
    flexWrap: "wrap",
})

export const lightboxTitle = style({
    color: lightboxInk,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
    flex: 1,
})

export const lightboxStage = style({
    flex: 1,
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
})

export const lightboxImage = style({
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transition: "transform 160ms ease",
})

export const lightboxImageZoomed = style({
    transform: "scale(2)",
    cursor: "zoom-out",
})

export const lightboxNav = style({
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(10, 10, 10, 0.6)", // theme-exempt: scrim over photo content
    border: `1px solid ${lightboxLine}`,
    borderRadius: "4px",
    color: lightboxInk,
    cursor: "pointer",
    fontFamily: mono,
    fontSize: "1rem",
    padding: "0.6rem 0.8rem",
})

export const lightboxNavLeft = style({ left: "1rem" })
export const lightboxNavRight = style({ right: "1rem" })

/** Lightbox controls keep darkroom inks in both theme modes. */
export const lightboxButton = style({
    ...buttonBase,
    background: "transparent",
    color: lightboxInk,
    border: `1px solid ${lightboxLine}`,
    ":hover": {
        borderColor: lightboxSubtle,
    },
})

export const lightboxButtonDanger = style({
    ...buttonBase,
    background: "transparent",
    color: "#d08373", // theme-exempt: danger ink on the darkroom void
    border: `1px solid ${lightboxLine}`,
    ":hover": {
        borderColor: "#d08373", // theme-exempt: danger ink on the darkroom void
    },
})

export const lightboxSelect = style({
    fontFamily: mono,
    fontSize: "0.85rem",
    color: lightboxInk,
    background: "transparent",
    border: `1px solid ${lightboxLine}`,
    borderRadius: "4px",
    padding: "0.5rem 0.7rem",
    outline: "none",
    appearance: "auto",
})

export const lightboxBottom = style({
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.6rem 1rem",
    borderTop: `1px solid ${lightboxLine}`,
    flexWrap: "wrap",
})

export const captionInput = style({
    flex: 1,
    minWidth: "12rem",
    fontFamily: body,
    fontSize: "0.82rem",
    color: lightboxInk,
    background: "transparent",
    border: "none",
    borderBottom: `1px dashed ${lightboxLine}`,
    padding: "0.3rem 0.1rem",
    outline: "none",
    ":focus": {
        borderBottomColor: lightboxSubtle,
    },
    "::placeholder": {
        color: lightboxSubtle,
    },
})

//
// Dialogs
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
        borderColor: subtle,
    },
})

export const dialogSelect = style([dialogInput, { appearance: "auto" }])

export const dialogActions = style({
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
})

export const centeredGate = style({
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: ground,
    color: subtle,
    fontFamily: mono,
    fontSize: "0.8rem",
})
