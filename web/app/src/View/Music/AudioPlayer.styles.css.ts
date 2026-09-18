import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The category's native audio player, drawn entirely from the marketing
 * token contract so one implementation wears each pack's register: hairline
 * frame, centered-bar waveform, mono timecode. The waveform's played
 * portion is the page's single accent doing its one job.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"

export const player = style({
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 18,
    alignItems: "center",
    padding: 18,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const playerNoCover = style({
    gridTemplateColumns: "1fr",
})

export const cover = style({
    width: 84,
    height: 84,
    objectFit: "cover",
    display: "block",
    borderRadius: marketing.shape.radiusControl,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 560px)": { width: 64, height: 64 },
    },
})

export const body = style({
    display: "grid",
    gap: 10,
    minWidth: 0,
})

export const titleRow = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    minWidth: 0,
})

export const title = style({
    fontFamily: marketing.font.display,
    fontSize: 16,
    fontWeight: 650,
    color: marketing.color.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
})

export const meta = style({
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    whiteSpace: "nowrap",
})

export const controls = style({
    display: "flex",
    alignItems: "center",
    gap: 14,
})

export const playButton = style({
    flexShrink: 0,
    width: 44,
    height: 44,
    display: "grid",
    placeItems: "center",
    padding: 0,
    cursor: "pointer",
    color: marketing.color.text,
    background: "transparent",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    borderRadius: marketing.shape.radiusControl,
    transition: "background 160ms ease, color 160ms ease",
    selectors: {
        "&:hover": {
            background: marketing.color.text,
            color: marketing.color.pageBg,
        },
    },
})

export const wave = style({
    position: "relative",
    flex: 1,
    height: 44,
    cursor: "pointer",
    // Generous hit area without growing the visual.
    touchAction: "none",
})

export const waveLayer = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    color: marketing.color.line,
})

export const waveProgress = style({
    color: marketing.color.accent,
})

export const timecode = style({
    flexShrink: 0,
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.08em",
    color: marketing.color.subtle,
    fontVariantNumeric: "tabular-nums",
})

export const timecodeCurrent = style({
    color: marketing.color.text,
})

/* ---- The click-to-load stream frame (external embedUrl present) ---- */

export const frame = style({
    display: "grid",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    overflow: "hidden",
})

export const frameButton = style({
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 18,
    width: "100%",
    padding: 18,
    textAlign: "left",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    color: marketing.color.text,
    fontFamily: "inherit",
})

export const frameHint = style({
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 10,
})

export const frameIframeWrap = style({
    display: "block",
    width: "100%",
    border: "none",
})

export const linkOut = style({
    textDecoration: "none",
})
