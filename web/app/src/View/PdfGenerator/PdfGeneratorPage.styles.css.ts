import { vars } from "@base/design-system/tokens"
import { globalStyle, keyframes, style } from "@vanilla-extract/css"

/**
 * The pdf pack's design language: a print shop at night, in black and white.
 * A pure-black bench (flat, no gradient wash), monospace signage, white
 * lamp-light for the accent held to a whisper, and the document itself as
 * the hero — a white sheet floating on the bench. The palette is
 * deliberately achromatic (no green, no ember): the only color on screen is
 * whatever the document carries. The neutrals ride the theme contract (the
 * pack's catalog seeds the pure-black bench values, mode: dark), so the
 * bench and the AppShell chrome around it re-ink together on a palette or
 * mode roll; the accent and body font route through the pack overlay
 * (packs/README.md), so a project's brand wins automatically.
 */

const bench = vars.color.background
const panel = vars.color.surface
const panelEdge = vars.color.border
const ink = vars.color.textPrimary
const muted = vars.color.textSecondary
const faint = `color-mix(in srgb, ${muted} 62%, ${bench})`
const panelEdgeStrong = `color-mix(in srgb, ${ink} 18%, transparent)`
// The page is a dark surface, so the accent reads the overlay's dark slot
// (the seeded brand keeps the light slot near-black for kernel surfaces).
const accent = "var(--pack-accent-dark, #fafafa)"
// Readable text on the accent: the theme's ground — black type on the
// lamp-white CTA by default, and still the ground when a brand rolls in.
const accentText = bench
// Error states stay inside the achromatic scheme: problems light up to full
// ink against the gray body text instead of turning red.
const danger = ink

const sans = 'var(--pack-font, "Inter", system-ui, sans-serif)'
const mono = 'ui-monospace, "SF Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace'

const glow = (strength: number): string => `color-mix(in srgb, ${accent} ${strength}%, transparent)`

//
// Page frame
//

export const page = style({
    height: "100%",
    display: "flex",
    flexDirection: "column",
    color: ink,
    fontFamily: sans,
    boxSizing: "border-box",
    background: bench,
    WebkitFontSmoothing: "antialiased",
    "@media": {
        "screen and (max-width: 64rem)": {
            height: "auto",
            minHeight: "100%",
        },
    },
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

/** The "/ press room" annex riding beside the shell's brand title. */
export const titleSub = style({
    color: faint,
    fontFamily: mono,
    fontWeight: 400,
    fontSize: "0.72rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
})

export const generateCta = style({
    border: `1px solid ${glow(55)}`,
    borderRadius: "0.6rem",
    background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 92%, white 8%), ${accent})`,
    color: accentText,
    fontFamily: mono,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "0.62rem 1.15rem",
    cursor: "pointer",
    boxShadow: `0 4px 14px ${glow(12)}, inset 0 1px 0 rgba(255, 255, 255, 0.35)`,
    transition: "transform 140ms ease, box-shadow 140ms ease, filter 140ms ease",
    whiteSpace: "nowrap",
    selectors: {
        "&:hover:not(:disabled)": {
            transform: "translateY(-1px)",
            boxShadow: `0 6px 18px ${glow(18)}, inset 0 1px 0 rgba(255, 255, 255, 0.35)`,
            filter: "brightness(1.05)",
        },
        "&:active:not(:disabled)": {
            transform: "translateY(0)",
        },
        "&:disabled": {
            opacity: 0.4,
            cursor: "not-allowed",
            boxShadow: "none",
        },
    },
})

//
// Workbench split
//

export const workbench = style({
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "minmax(24rem, 30rem) minmax(0, 1fr)",
    gap: "1.1rem",
    padding: "1.1rem 1.5rem 1.35rem",
    width: "100%",
    maxWidth: "110rem",
    marginInline: "auto",
    "@media": {
        "screen and (max-width: 64rem)": {
            gridTemplateColumns: "minmax(0, 1fr)",
            padding: "1rem",
        },
    },
})

//
// Editor pane
//

export const editorPane = style({
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    background: panel,
    border: `1px solid ${panelEdge}`,
    borderRadius: "0.9rem",
    overflow: "hidden",
    boxShadow: "0 18px 44px rgba(0, 0, 0, 0.35)",
    "@media": {
        "screen and (max-width: 64rem)": {
            height: "28rem",
        },
    },
})

/** A wash toward the page ground: darkens plates at night, lifts them by day. */
const groundWash = (percent: number): string => `color-mix(in srgb, ${bench} ${percent}%, transparent)`

export const editorTabs = style({
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "0 0.6rem",
    borderBottom: `1px solid ${panelEdge}`,
    background: groundWash(18),
    overflowX: "auto",
    scrollbarWidth: "none",
})

export const editorTab = style({
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    gap: "0.45rem",
    border: "none",
    borderBottom: "2px solid transparent",
    background: "transparent",
    fontFamily: mono,
    fontSize: "0.72rem",
    color: muted,
    padding: "0.72rem 0.8rem 0.62rem",
    cursor: "pointer",
    transition: "color 120ms ease, border-color 120ms ease",
    ":hover": {
        color: ink,
    },
})

export const editorTabActive = style({
    color: ink,
    borderBottomColor: accent,
})

const tabDotBase = style({
    width: "0.4rem",
    height: "0.4rem",
    borderRadius: "999px",
    opacity: 0.9,
})

// File-type dots stay distinguishable in grayscale: three steps of the
// theme's ink, so they survive any palette roll.
export const tabDotJson = style([tabDotBase, { background: ink }])
export const tabDotCss = style([tabDotBase, { background: muted }])
export const tabDotHtml = style([tabDotBase, { background: faint }])

export const resetButton = style({
    marginLeft: "auto",
    border: "none",
    background: "transparent",
    fontFamily: mono,
    fontSize: "0.64rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: faint,
    cursor: "pointer",
    padding: "0.5rem 0.4rem",
    transition: "color 120ms ease",
    ":hover": {
        color: ink,
    },
})

export const editorBody = style({
    flex: 1,
    minHeight: 0,
    display: "flex",
})

export const gutter = style({
    margin: 0,
    padding: "0.9rem 0.7rem 0.9rem 0",
    minWidth: "2.9rem",
    textAlign: "right",
    fontFamily: mono,
    fontSize: "0.76rem",
    lineHeight: 1.75,
    color: faint,
    background: groundWash(14),
    borderRight: `1px solid ${panelEdge}`,
    overflow: "hidden",
    userSelect: "none",
    flexShrink: 0,
})

export const codeArea = style({
    flex: 1,
    minWidth: 0,
    margin: 0,
    padding: "0.9rem 1rem",
    border: "none",
    outline: "none",
    resize: "none",
    background: "transparent",
    color: `color-mix(in srgb, ${ink} 90%, ${bench})`,
    fontFamily: mono,
    fontSize: "0.76rem",
    lineHeight: 1.75,
    whiteSpace: "pre",
    overflow: "auto",
    caretColor: accent,
    tabSize: 2,
    selectors: {
        "&::selection": {
            background: glow(28),
        },
        "&::-webkit-scrollbar": {
            width: "0.6rem",
            height: "0.6rem",
        },
        "&::-webkit-scrollbar-thumb": {
            background: `color-mix(in srgb, ${ink} 16%, transparent)`,
            borderRadius: "999px",
            border: "2px solid transparent",
            backgroundClip: "padding-box",
        },
        "&::-webkit-scrollbar-corner": {
            background: "transparent",
        },
    },
})

export const statusBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.5rem 0.95rem",
    borderTop: `1px solid ${panelEdge}`,
    background: groundWash(18),
    fontFamily: mono,
    fontSize: "0.66rem",
    letterSpacing: "0.05em",
    color: faint,
    minHeight: "2.1rem",
})

export const statusOk = style({
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    color: muted,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
})

export const statusDot = style({
    width: "0.4rem",
    height: "0.4rem",
    borderRadius: "999px",
    background: accent,
    boxShadow: `0 0 4px ${glow(25)}`,
    flexShrink: 0,
})

export const statusProblem = style({
    color: danger,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
})

//
// Preview pane
//

export const previewPane = style({
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    "@media": {
        "screen and (max-width: 64rem)": {
            height: "34rem",
        },
    },
})

export const previewHeader = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.1rem 0.35rem 0.6rem",
    fontFamily: mono,
    fontSize: "0.66rem",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: faint,
})

/** Page-size chip + the Generate CTA, together on the pane's toolbar. */
export const previewMeta = style({
    display: "flex",
    alignItems: "center",
    gap: "0.9rem",
})

export const previewChip = style({
    letterSpacing: "0.1em",
    color: muted,
})

export const pasteboard = style({
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    borderRadius: "0.9rem",
    border: `1px solid ${panelEdge}`,
    // The pasteboard's dot grid, drawn in the theme's ink over the bench.
    background: `
        radial-gradient(circle, color-mix(in srgb, ${ink} 9%, transparent) 1px, transparent 1.4px),
        color-mix(in srgb, ${ink} 3%, transparent)
    `,
    backgroundSize: "21px 21px, auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "2.4rem 2rem 3rem",
    selectors: {
        "&::-webkit-scrollbar": {
            width: "0.6rem",
            height: "0.6rem",
        },
        "&::-webkit-scrollbar-thumb": {
            background: `color-mix(in srgb, ${ink} 16%, transparent)`,
            borderRadius: "999px",
            border: "2px solid transparent",
            backgroundClip: "padding-box",
        },
        "&::-webkit-scrollbar-corner": {
            background: "transparent",
        },
    },
})

export const paperWrap = style({
    position: "relative",
    flex: "none",
    background: "#ffffff", // theme-exempt: the paper is a real document sheet — white in every theme
    borderRadius: "3px",
    overflow: "hidden",
    boxShadow: `
        0 0 0 1px rgba(255, 255, 255, 0.06),
        0 2px 8px rgba(0, 0, 0, 0.45),
        0 28px 70px rgba(0, 0, 0, 0.55)
    `,
})

export const paperFrame = style({
    display: "block",
    border: "none",
    background: "#ffffff", // theme-exempt: the paper is a real document sheet — white in every theme
    transformOrigin: "top left",
})

//
// Loading / load-error states
//

const spin = keyframes({
    to: { transform: "rotate(360deg)" },
})

export const loadingWrap = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    color: faint,
    fontFamily: mono,
    fontSize: "0.7rem",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
})

export const loadingSpinner = style({
    width: "1.7rem",
    height: "1.7rem",
    borderRadius: "999px",
    border: `2px solid color-mix(in srgb, ${ink} 14%, transparent)`,
    borderTopColor: accent,
    animation: `${spin} 0.8s linear infinite`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

export const loadErrorText = style({
    maxWidth: "28rem",
    textAlign: "center",
    color: danger,
    fontFamily: sans,
    fontSize: "0.9rem",
    lineHeight: 1.6,
    textTransform: "none",
    letterSpacing: "normal",
})

//
// Generate modal
//

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

const cardIn = keyframes({
    from: { opacity: 0, transform: "translateY(14px) scale(0.97)" },
    to: { opacity: 1, transform: "translateY(0) scale(1)" },
})

export const modalBackdrop = style({
    position: "fixed",
    inset: 0,
    zIndex: 60,
    background: vars.color.overlay,
    backdropFilter: "blur(7px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1.5rem",
    animation: `${fadeIn} 160ms ease both`,
})

export const modalCard = style({
    width: "min(24.5rem, 100%)",
    background: panel,
    border: `1px solid ${panelEdgeStrong}`,
    borderRadius: "1.1rem",
    padding: "2.1rem 2rem 1.9rem",
    boxShadow: "0 40px 90px rgba(0, 0, 0, 0.6)",
    animation: `${cardIn} 260ms cubic-bezier(0.2, 0.9, 0.3, 1.15) both`,
    outline: "none",
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

export const modalTitle = style({
    margin: "0 0 0.3rem",
    fontFamily: sans,
    fontSize: "1.08rem",
    fontWeight: 600,
    textAlign: "center",
    color: ink,
})

export const modalSub = style({
    margin: "0 0 1.5rem",
    textAlign: "center",
    fontFamily: mono,
    fontSize: "0.66rem",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: faint,
})

// The little sheet being "printed": lines reveal downward while an accent
// scanline sweeps the page.

const printReveal = keyframes({
    "0%": { height: "6%" },
    "78%": { height: "80%" },
    "100%": { height: "80%" },
})

const scanSweep = keyframes({
    "0%": { top: "8%", opacity: 1 },
    "78%": { top: "86%", opacity: 1 },
    "88%": { opacity: 0 },
    "100%": { top: "8%", opacity: 0 },
})

export const sheet = style({
    position: "relative",
    width: "4.4rem",
    height: "5.7rem",
    margin: "0 auto 1.6rem",
    background: "#f7f7f7", // theme-exempt: the miniature sheet being printed — paper-white in every theme
    borderRadius: "4px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
})

export const sheetLines = style({
    position: "absolute",
    left: "14%",
    right: "14%",
    top: "12%",
    height: "80%",
    backgroundImage: "repeating-linear-gradient(#c2c2c2 0 3px, transparent 3px 10px)", // theme-exempt: printed lines on the paper-white sheet
    animation: `${printReveal} 2.3s ease-in-out infinite`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

export const sheetScan = style({
    position: "absolute",
    left: "8%",
    right: "8%",
    height: "3px",
    borderRadius: "2px",
    background: accent,
    boxShadow: `0 0 5px ${glow(35)}`,
    animation: `${scanSweep} 2.3s ease-in-out infinite`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

//
// Modal stages
//

export const stageList = style({
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    margin: "0 auto",
    width: "fit-content",
})

export const stageRow = style({
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    padding: "0.34rem 0.2rem",
    fontFamily: mono,
    fontSize: "0.74rem",
    letterSpacing: "0.04em",
    color: faint,
    transition: "color 200ms ease",
})

export const stageRowActive = style({
    color: ink,
})

export const stageRowDone = style({
    color: muted,
})

const pulseRing = keyframes({
    "0%": { boxShadow: `0 0 0 0 ${glow(22)}` },
    "70%": { boxShadow: `0 0 0 5px transparent` },
    "100%": { boxShadow: "0 0 0 0 transparent" },
})

export const stageIcon = style({
    width: "1.05rem",
    height: "1.05rem",
    borderRadius: "999px",
    border: `1.5px solid ${faint}`,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 200ms ease, background 200ms ease",
})

export const stageIconActive = style({
    borderColor: accent,
    animation: `${pulseRing} 1.1s ease-out infinite`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

export const stageIconDone = style({
    borderColor: accent,
    background: accent,
})

export const stageCheck = style({
    width: "0.28rem",
    height: "0.55rem",
    borderRight: `2px solid ${accentText}`,
    borderBottom: `2px solid ${accentText}`,
    transform: "rotate(45deg)",
    marginTop: "-2px",
})

const shimmer = keyframes({
    from: { backgroundPosition: "0% 0" },
    to: { backgroundPosition: "-200% 0" },
})

export const progressTrack = style({
    marginTop: "1.4rem",
    height: "0.35rem",
    borderRadius: "999px",
    background: `color-mix(in srgb, ${ink} 9%, transparent)`,
    overflow: "hidden",
})

export const progressFill = style({
    height: "100%",
    borderRadius: "999px",
    background: `linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 55%, white 45%), ${accent})`,
    backgroundSize: "200% 100%",
    animation: `${shimmer} 1.6s linear infinite`,
    transition: "width 600ms cubic-bezier(0.3, 0.8, 0.4, 1)",
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

//
// Modal success / error
//

const popIn = keyframes({
    "0%": { opacity: 0, transform: "scale(0.5)" },
    "70%": { transform: "scale(1.08)" },
    "100%": { opacity: 1, transform: "scale(1)" },
})

const checkDraw = keyframes({
    from: { opacity: 0, transform: "rotate(45deg) scale(0.4)" },
    to: { opacity: 1, transform: "rotate(45deg) scale(1)" },
})

export const successBadge = style({
    width: "3.9rem",
    height: "3.9rem",
    margin: "0 auto 1.3rem",
    borderRadius: "999px",
    background: glow(12),
    border: `1.5px solid ${glow(55)}`,
    boxShadow: `0 0 14px ${glow(10)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: `${popIn} 380ms cubic-bezier(0.2, 0.9, 0.3, 1.3) both`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

export const successCheck = style({
    width: "0.85rem",
    height: "1.55rem",
    borderRight: `3px solid ${accent}`,
    borderBottom: `3px solid ${accent}`,
    transform: "rotate(45deg)",
    marginTop: "-0.35rem",
    animation: `${checkDraw} 260ms ease 160ms both`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

export const fileChip = style({
    display: "block",
    width: "fit-content",
    maxWidth: "100%",
    margin: "0 auto",
    padding: "0.5rem 0.95rem",
    borderRadius: "0.55rem",
    border: `1px solid ${panelEdge}`,
    background: groundWash(25),
    fontFamily: mono,
    fontSize: "0.74rem",
    color: muted,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
})

export const modalActions = style({
    display: "flex",
    justifyContent: "center",
    gap: "0.7rem",
    marginTop: "1.6rem",
})

export const downloadButton = style([
    generateCta,
    {
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.7rem 1.4rem",
    },
])

export const ghostButton = style({
    border: `1px solid ${panelEdge}`,
    borderRadius: "0.6rem",
    background: "transparent",
    color: muted,
    fontFamily: mono,
    fontSize: "0.72rem",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    padding: "0.62rem 1.15rem",
    cursor: "pointer",
    transition: "color 140ms ease, border-color 140ms ease",
    ":hover": {
        color: ink,
        borderColor: panelEdgeStrong,
    },
})

export const errorBadge = style({
    width: "3.9rem",
    height: "3.9rem",
    margin: "0 auto 1.3rem",
    borderRadius: "999px",
    border: `1.5px solid ${danger}`,
    background: `color-mix(in srgb, ${ink} 9%, transparent)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: mono,
    fontSize: "1.5rem",
    fontWeight: 700,
    color: danger,
    animation: `${popIn} 320ms ease both`,
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
})

export const errorMessage = style({
    margin: "0 auto",
    maxWidth: "19rem",
    textAlign: "center",
    fontFamily: sans,
    fontSize: "0.86rem",
    lineHeight: 1.55,
    color: danger,
})
