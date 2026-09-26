import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The release one-pager's bespoke surfaces — the countdown masthead, the
 * tracklist, the listen rail — drawn from the marketing token contract so
 * they wear the monolith register: true black and white, monumental type,
 * razor hairlines, zero accent hue.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"

export const main = style({
    maxWidth: marketing.layout.maxWidth,
    margin: "0 auto",
    padding: "0 24px 96px",
})

/* ------------------------------- the masthead ------------------------------- */

export const masthead = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
    gap: 56,
    alignItems: "center",
    padding: "88px 0 72px",
    "@media": {
        "(max-width: 880px)": {
            gridTemplateColumns: "1fr",
            gap: 36,
            padding: "64px 0 48px",
        },
    },
})

export const mastheadText = style({
    display: "grid",
    gap: 26,
    minWidth: 0,
})

export const kicker = style({
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const title = style({
    fontFamily: marketing.font.display,
    fontWeight: 700,
    letterSpacing: "-0.04em",
    fontSize: `calc(clamp(56px, 10vw, 128px) * ${marketing.display.scale} / 1.3)`,
    lineHeight: 0.92,
    margin: 0,
    color: marketing.color.text,
})

export const statement = style({
    fontSize: 17.5,
    lineHeight: 1.65,
    color: marketing.color.subtle,
    maxWidth: 520,
    margin: 0,
})

export const recordMeta = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const cover = style({
    width: "100%",
    display: "block",
    border: `1px solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 880px)": { maxWidth: 440 },
    },
})

/* ------------------------------- the countdown ------------------------------- */

export const countdown = style({
    display: "grid",
    gap: 14,
})

export const countdownLabel = style({
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: marketing.color.text,
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
})

export const countdownLabelRule = style({
    display: "inline-block",
    width: 44,
    height: 1,
    background: marketing.color.text,
})

export const countdownDigits = style({
    display: "flex",
    gap: 28,
    flexWrap: "wrap",
})

export const countdownCell = style({
    display: "grid",
    gap: 6,
})

export const countdownNumber = style({
    fontFamily: marketing.font.display,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    fontSize: "clamp(40px, 6vw, 64px)",
    lineHeight: 1,
    color: marketing.color.text,
    fontVariantNumeric: "tabular-nums",
})

export const countdownUnit = style({
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const outNow = style({
    fontFamily: marketing.font.display,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    textTransform: "uppercase",
    fontSize: "clamp(34px, 5vw, 52px)",
    lineHeight: 1,
    color: marketing.color.text,
})

/* ------------------------------- listen rail ------------------------------- */

export const listenRail = style({
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
})

export const listenButton = style({
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    textDecoration: "none",
    padding: "14px 24px",
    background: marketing.color.text,
    color: marketing.color.pageBg,
    border: `1px solid ${marketing.color.text}`,
    transition: "background 160ms ease, color 160ms ease",
    selectors: {
        "&:hover": {
            background: "transparent",
            color: marketing.color.text,
        },
    },
})

export const listenButtonGhost = style({
    background: "transparent",
    color: marketing.color.text,
    selectors: {
        "&:hover": {
            background: marketing.color.text,
            color: marketing.color.pageBg,
        },
    },
})

/* ------------------------------- the sections ------------------------------- */

export const sectionLabel = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    display: "flex",
    alignItems: "center",
    gap: 16,
    margin: "72px 0 24px",
    selectors: {
        "&::after": {
            content: '""',
            flex: 1,
            height: 1,
            background: marketing.color.line,
        },
    },
})

export const excerptWrap = style({
    maxWidth: 760,
})

export const trackTable = style({
    display: "grid",
    maxWidth: 760,
})

export const trackRow = style({
    display: "grid",
    gridTemplateColumns: "56px 1fr auto",
    alignItems: "baseline",
    gap: 18,
    padding: "16px 4px",
    borderTop: `1px solid ${marketing.color.line}`,
    selectors: {
        "&:last-child": { borderBottom: `1px solid ${marketing.color.line}` },
    },
})

export const trackNumber = style({
    fontFamily: MONO,
    fontSize: 12.5,
    letterSpacing: "0.12em",
    color: marketing.color.subtle,
    fontVariantNumeric: "tabular-nums",
})

export const trackTitle = style({
    fontFamily: marketing.font.display,
    fontWeight: 600,
    fontSize: 18,
    letterSpacing: "-0.01em",
    color: marketing.color.text,
})

export const trackDuration = style({
    fontFamily: MONO,
    fontSize: 12.5,
    letterSpacing: "0.08em",
    color: marketing.color.subtle,
    fontVariantNumeric: "tabular-nums",
})

export const videoWrap = style({
    maxWidth: 900,
})
