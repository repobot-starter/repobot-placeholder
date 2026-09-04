import { vars } from "@base/design-system/tokens"
import { globalStyle, keyframes, style } from "@vanilla-extract/css"

/**
 * The interpret pack's design language: a reading room on a pure-black
 * ground (flat, no gradient wash) split into two panes — the document on
 * the left, the AI's reading on the right — in black and white: white
 * lamp-light for the accent held to a whisper, monospace for anything
 * machine-extracted, and no hue anywhere — the document is the only color.
 * The neutrals ride the theme contract (the pack's catalog seeds the
 * pure-black reading-room values, mode: dark), so the room and the AppShell
 * chrome around it re-ink together; the accent and body font route through
 * the pack overlay (packs/README.md), so a project's brand wins
 * automatically. Washes and hairlines are mixed from the theme's ink so
 * they survive any palette roll.
 */
const backdrop = vars.color.background
const onDark = vars.color.textPrimary
const onDarkMuted = vars.color.textSecondary
const paneLine = vars.color.border
// The page is a dark surface, so the accent reads the overlay's dark slot
// (the seeded brand keeps the light slot near-black for kernel surfaces).
const accent = "var(--pack-accent-dark, #fafafa)"

/** A wash of the theme's ink that survives any palette roll. */
const inkMix = (percent: number): string => `color-mix(in srgb, ${onDark} ${percent}%, transparent)`

const sans = 'var(--pack-font, "Inter", system-ui, sans-serif)'
const mono = 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace'

/** Alpha washes of the accent that survive any brand hex. */
const accentMix = (percent: number): string => `color-mix(in srgb, ${accent} ${percent}%, transparent)`

//
// Motion
//

const rise = keyframes({
    from: { opacity: 0, transform: "translateY(0.65rem)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

const stampIn = keyframes({
    from: { opacity: 0, transform: "scale(1.12)" },
    to: { opacity: 1, transform: "scale(1)" },
})

const shimmer = keyframes({
    from: { backgroundPosition: "150% 0" },
    to: { backgroundPosition: "-50% 0" },
})

const scan = keyframes({
    from: { top: "-20%" },
    to: { top: "104%" },
})

const pulse = keyframes({
    "0%, 100%": { opacity: 1, transform: "scale(1)" },
    "50%": { opacity: 0.45, transform: "scale(0.8)" },
})

const breathe = keyframes({
    "0%, 100%": { opacity: 0.5 },
    "50%": { opacity: 0.85 },
})

/** Dwell on each phrase, then slide to the next; the last is a copy of the first. */
const tick = keyframes({
    "0%, 18%": { transform: "translateY(0)" },
    "25%, 43%": { transform: "translateY(-1.6rem)" },
    "50%, 68%": { transform: "translateY(-3.2rem)" },
    "75%, 93%": { transform: "translateY(-4.8rem)" },
    "100%": { transform: "translateY(-6.4rem)" },
})

const still = {
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
        },
    },
} as const

//
// Frame
//

export const page = style({
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    background: backdrop,
    color: onDark,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

const container = style({
    width: "min(80rem, 100% - 3rem)",
    marginInline: "auto",
})

export const statusChip = style({
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontFamily: mono,
    fontSize: "0.72rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: onDarkMuted,
})

export const statusDot = style({
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "999px",
    background: inkMix(22),
    transition: "background 200ms ease, box-shadow 200ms ease",
})

export const statusDotBusy = style([
    {
        background: accent,
        boxShadow: `0 0 5px ${accentMix(35)}`,
        animation: `${pulse} 1.1s ease-in-out infinite`,
    },
    still,
])

export const statusDotDone = style({
    background: accent,
    boxShadow: `0 0 5px ${accentMix(25)}`,
})

export const split = style([
    container,
    {
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 1.08fr)",
        gap: "1.25rem",
        alignItems: "stretch",
        // The old topbar's rhythm, now that the shell owns the chrome row.
        paddingBlock: "1.25rem 1.5rem",
        "@media": {
            "(max-width: 920px)": {
                gridTemplateColumns: "minmax(0, 1fr)",
            },
        },
    },
])

export const pane = style({
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    background: inkMix(3),
    border: `1px solid ${paneLine}`,
    borderRadius: "1.1rem",
    padding: "1.15rem 1.25rem 1.25rem",
    minHeight: 0,
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 22px 48px rgba(0, 0, 0, 0.4)",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
    "@media": {
        "(min-width: 921px)": {
            minHeight: "min(44rem, calc(100vh - 10.5rem))",
        },
    },
})

export const paneDragActive = style({
    borderColor: accentMix(70),
    boxShadow: `0 0 0 1px ${accentMix(50)}, 0 0 16px ${accentMix(9)}`,
})

export const paneLabel = style({
    display: "flex",
    alignItems: "center",
    gap: "0.55rem",
    fontFamily: mono,
    fontSize: "0.66rem",
    fontWeight: 500,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: onDarkMuted,
})

/** The Reading pane's label row: the label left, the status chip right. */
export const paneLabelRow = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
})

globalStyle(`${paneLabel}::before`, {
    content: "",
    width: "1.1rem",
    height: "1px",
    background: accentMix(70),
})

//
// Left pane: drop zone → document preview
//

export const dropZone = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    border: `1.5px dashed ${inkMix(20)}`,
    borderRadius: "0.85rem",
    cursor: "pointer",
    minHeight: "22rem",
    transition: "border-color 150ms ease, background 150ms ease",
    ":hover": {
        borderColor: accentMix(85),
        background: accentMix(7),
    },
})

export const dropZoneActive = style({
    borderColor: accent,
    background: accentMix(11),
})

/** The glyph's halo: a soft accent pool the paper sheet floats on. */
export const glyphHalo = style({
    display: "grid",
    placeItems: "center",
    width: "9.5rem",
    height: "9.5rem",
    marginBottom: "0.4rem",
    borderRadius: "999px",
    background: `radial-gradient(closest-side, ${accentMix(7)}, transparent)`,
})

/** A paper sheet drawn in CSS: clipped fold, ruled text lines. */
export const glyph = style({
    position: "relative",
    width: "4.1rem",
    height: "5.2rem",
    borderRadius: "0.4rem",
    border: `1px solid ${inkMix(38)}`,
    background: inkMix(5),
    clipPath: "polygon(0 0, calc(100% - 1.1rem) 0, 100% 1.1rem, 100% 100%, 0 100%)",
    transition: "transform 200ms ease, border-color 200ms ease",
    selectors: {
        [`${dropZone}:hover &, ${dropZoneActive} &`]: {
            transform: "translateY(-0.3rem)",
            borderColor: accentMix(90),
        },
    },
})

globalStyle(`${glyph}::before`, {
    content: "",
    position: "absolute",
    inset: "1.7rem 0.8rem 0.8rem",
    background: `repeating-linear-gradient(to bottom, ${inkMix(34)} 0 2px, transparent 2px 11px)`,
})

globalStyle(`${glyph}::after`, {
    content: "",
    position: "absolute",
    top: 0,
    right: 0,
    width: "1.1rem",
    height: "1.1rem",
    background: `linear-gradient(225deg, transparent 0 50%, ${inkMix(26)} 50%)`,
})

export const dropTitle = style({
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 650,
    letterSpacing: "-0.01em",
})

export const dropHint = style({
    margin: 0,
    fontFamily: mono,
    fontSize: "0.72rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: onDarkMuted,
})

export const previewFrame = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    minHeight: 0,
})

export const fileBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
})

export const fileName = style({
    fontFamily: mono,
    fontSize: "0.78rem",
    color: onDark,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const replaceButton = style({
    border: "none",
    background: "none",
    padding: 0,
    fontFamily: mono,
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: onDarkMuted,
    cursor: "pointer",
    transition: "color 120ms ease",
    ":hover": {
        color: accent,
    },
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
    },
})

export const previewBody = style({
    position: "relative",
    flex: 1,
    minHeight: "24rem",
    borderRadius: "0.75rem",
    overflow: "hidden",
    border: `1px solid ${paneLine}`,
    // The well behind the browser's PDF viewer: the theme's lifted surface.
    background: vars.color.surfaceHover,
})

export const preview = style({
    display: "block",
    width: "100%",
    height: "100%",
    border: "none",
})

export const scanOverlay = style({
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    background: accentMix(6),
})

export const scanBeam = style([
    {
        position: "absolute",
        left: 0,
        right: 0,
        height: "17%",
        background: `linear-gradient(to bottom, transparent, ${accentMix(42)} 80%, ${accent} 98%, transparent)`,
        boxShadow: `0 4px 12px ${accentMix(24)}`,
        animation: `${scan} 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite`,
    },
    still,
])

//
// Right pane: ghost → analyzing → the reading
//

export const errorText = style({
    margin: "0.5rem 0 0",
    fontFamily: mono,
    fontSize: "0.85rem",
    lineHeight: 1.6,
    // Errors stay achromatic: full ink against the gray body text.
    color: onDark,
})

/** The reading's silhouette, promised in dashed outline before a file lands. */
export const ghost = style([
    {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
        paddingTop: "0.4rem",
        animation: `${breathe} 4s ease-in-out infinite`,
    },
    still,
])

export const ghostBone = style({
    border: `1px dashed ${inkMix(14)}`,
    borderRadius: "0.45rem",
})

export const ghostBadge = style({ width: "8.5rem", height: "1.7rem" })
export const ghostTitle = style({ width: "72%", height: "2.3rem" })
export const ghostLineFull = style({ width: "100%", height: "0.95rem" })
export const ghostLineShort = style({ width: "58%", height: "0.95rem" })
export const ghostChip = style({ width: "min(17rem, 80%)", height: "2.6rem" })

export const skeletonGap = style({ height: "0.8rem" })

export const analyzing = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    paddingTop: "0.4rem",
})

export const tickerRow = style({
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
})

export const thinkingDot = style([
    {
        width: "0.55rem",
        height: "0.55rem",
        borderRadius: "999px",
        background: accent,
        boxShadow: `0 0 6px ${accentMix(35)}`,
        animation: `${pulse} 1.1s ease-in-out infinite`,
        flexShrink: 0,
    },
    still,
])

export const ticker = style({
    height: "1.6rem",
    overflow: "hidden",
})

export const tickerTrack = style([
    {
        display: "flex",
        flexDirection: "column",
        animation: `${tick} 7s cubic-bezier(0.65, 0, 0.35, 1) infinite`,
    },
    still,
])

export const tickerLine = style({
    display: "block",
    height: "1.6rem",
    lineHeight: "1.6rem",
    fontSize: "1rem",
    fontWeight: 550,
    letterSpacing: "-0.005em",
})

export const skeleton = style({
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
})

export const bone = style([
    {
        borderRadius: "0.45rem",
        background: `linear-gradient(100deg, ${inkMix(5)} 40%, ${accentMix(14)} 50%, ${inkMix(5)} 60%)`,
        backgroundSize: "200% 100%",
        animation: `${shimmer} 1.7s linear infinite`,
    },
    still,
])

export const boneBadge = style({ width: "8.5rem", height: "1.7rem" })
export const boneTitle = style({ width: "72%", height: "2.3rem" })
export const boneLineFull = style({ width: "100%", height: "0.95rem" })
export const boneLineShort = style({ width: "58%", height: "0.95rem" })
export const boneChip = style({ width: "min(17rem, 80%)", height: "2.6rem" })

//
// The reading itself, arriving in stages
//

export const result = style({
    display: "flex",
    flexDirection: "column",
    gap: "1.15rem",
    paddingTop: "0.2rem",
})

const revealed = {
    animation: `${rise} 480ms cubic-bezier(0.2, 0.7, 0.3, 1) both`,
    ...still,
} as const

export const resultHead = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
    ...revealed,
})

export const typeBadge = style([
    {
        display: "inline-flex",
        alignItems: "center",
        padding: "0.35rem 0.65rem",
        borderRadius: "0.45rem",
        border: `1px solid ${accentMix(50)}`,
        background: accentMix(12),
        boxShadow: `0 0 8px ${accentMix(10)}`,
        fontFamily: mono,
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: onDark,
        animation: `${stampIn} 420ms cubic-bezier(0.2, 0.9, 0.3, 1.15) both`,
    },
    still,
])

export const pageCount = style({
    fontFamily: mono,
    fontSize: "0.72rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: onDarkMuted,
    whiteSpace: "nowrap",
})

export const verdict = style({
    margin: 0,
    fontSize: "clamp(1.5rem, 2.6vw, 2.15rem)",
    lineHeight: 1.12,
    letterSpacing: "-0.02em",
    fontWeight: 700,
    ...revealed,
})

export const summary = style({
    margin: 0,
    maxWidth: "62ch",
    fontSize: "1rem",
    lineHeight: 1.7,
    color: `color-mix(in srgb, ${onDark} 82%, ${backdrop})`,
    ...revealed,
})

export const section = style({
    borderTop: `1px solid ${paneLine}`,
    paddingTop: "1.1rem",
    ...revealed,
})

export const sectionLabel = style({
    margin: "0 0 0.75rem",
    fontFamily: mono,
    fontSize: "0.66rem",
    fontWeight: 500,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: onDarkMuted,
})

export const keyPointList = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
})

export const keyPoint = style({
    position: "relative",
    paddingLeft: "1.2rem",
    fontSize: "0.95rem",
    lineHeight: 1.55,
    color: `color-mix(in srgb, ${onDark} 82%, ${backdrop})`,
})

globalStyle(`${keyPoint}::before`, {
    content: "",
    position: "absolute",
    left: "0.1rem",
    top: "0.52em",
    width: "0.4rem",
    height: "0.4rem",
    background: accent,
    transform: "rotate(45deg)",
})

export const fieldList = style({
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))",
    gap: "0.9rem 1.5rem",
})

export const fieldRow = style({
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    borderLeft: `2px solid ${accentMix(55)}`,
    paddingLeft: "0.75rem",
})

export const fieldLabel = style({
    fontFamily: mono,
    fontSize: "0.64rem",
    fontWeight: 500,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: onDarkMuted,
})

export const fieldValue = style({
    margin: 0,
    fontFamily: mono,
    fontSize: "0.88rem",
    lineHeight: 1.45,
    color: onDark,
    wordBreak: "break-word",
})

export const againRow = style({
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "0.25rem",
    ...revealed,
})
