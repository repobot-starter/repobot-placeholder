import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The dj pack's bespoke surfaces — the mix shelf and the dates table —
 * drawn from the marketing token contract so they wear the mono-utility
 * register (terminal mono, graph-paper ground, hairline rules) worn
 * achromatic: paper-on-ink, no hue anywhere.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"

/* ------------------------------ page scaffold ------------------------------ */

export const main = style({
    maxWidth: marketing.layout.maxWidth,
    margin: "0 auto",
    padding: "0 24px 96px",
})

export const pageHeader = style({
    padding: "84px 0 36px",
    display: "grid",
    gap: 16,
})

export const kicker = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const headlineRow = style({
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
})

export const headline = style({
    fontFamily: marketing.font.display,
    fontWeight: 650,
    fontSize: "clamp(34px, 6vw, 64px)",
    letterSpacing: "-0.02em",
    lineHeight: 1,
    margin: 0,
    color: marketing.color.text,
})

export const badge = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: marketing.color.text,
    border: `1px solid ${marketing.color.text}`,
    padding: "6px 12px",
    borderRadius: marketing.shape.radiusControl,
    whiteSpace: "nowrap",
})

export const lede = style({
    fontSize: 16.5,
    lineHeight: 1.65,
    color: marketing.color.subtle,
    maxWidth: 620,
    margin: 0,
})

export const sectionLabel = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    display: "flex",
    alignItems: "center",
    gap: 16,
    margin: "64px 0 22px",
    selectors: {
        "&::after": {
            content: '""',
            flex: 1,
            height: 1,
            background: marketing.color.line,
        },
    },
})

/* --------------------------------- mixes --------------------------------- */

export const mix = style({
    display: "grid",
    gridTemplateColumns: "64px minmax(180px, 240px) 1fr",
    gap: 32,
    alignItems: "start",
    padding: "36px 0",
    borderTop: `1px solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 820px)": { gridTemplateColumns: "64px 1fr", rowGap: 20 },
    },
})

export const mixIndex = style({
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: "0.12em",
    color: marketing.color.subtle,
    paddingTop: 4,
})

export const mixCover = style({
    width: "100%",
    display: "block",
    border: `1px solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    "@media": {
        "(max-width: 820px)": { maxWidth: 240 },
    },
})

export const mixBody = style({
    display: "grid",
    gap: 12,
    "@media": {
        "(max-width: 820px)": { gridColumn: "1 / -1" },
    },
})

export const mixTitle = style({
    fontFamily: marketing.font.display,
    fontWeight: 650,
    fontSize: "clamp(22px, 3vw, 32px)",
    letterSpacing: "-0.02em",
    lineHeight: 1,
    margin: 0,
    color: marketing.color.text,
})

export const mixMeta = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const mixNotes = style({
    fontSize: 15,
    lineHeight: 1.65,
    color: marketing.color.subtle,
    maxWidth: 560,
    margin: 0,
})

/* --------------------------------- dates --------------------------------- */

export const nextSet = style({
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 32,
    padding: "30px 32px",
    background: marketing.color.surface,
    border: `1px solid ${marketing.color.text}`,
    borderRadius: marketing.shape.radiusCard,
    "@media": {
        "(max-width: 720px)": { gridTemplateColumns: "1fr", gap: 16, padding: "24px 22px" },
    },
})

export const nextSetDate = style({
    display: "grid",
    gap: 4,
})

export const nextSetWeekday = style({
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const nextSetDay = style({
    fontFamily: marketing.font.display,
    fontWeight: 650,
    fontSize: 38,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    color: marketing.color.text,
})

export const nextSetCity = style({
    fontFamily: marketing.font.display,
    fontWeight: 650,
    fontSize: "clamp(20px, 3vw, 30px)",
    letterSpacing: "-0.02em",
    lineHeight: 1.05,
    color: marketing.color.text,
})

export const nextSetVenue = style({
    fontFamily: MONO,
    fontSize: 12.5,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    display: "block",
    marginTop: 8,
})

export const ticketButton = style({
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    textDecoration: "none",
    padding: "13px 24px",
    background: marketing.color.text,
    color: marketing.color.pageBg,
    border: `1px solid ${marketing.color.text}`,
    borderRadius: marketing.shape.radiusControl,
    whiteSpace: "nowrap",
    transition: "background 160ms ease, color 160ms ease",
    selectors: {
        "&:hover": {
            background: "transparent",
            color: marketing.color.text,
        },
    },
})

export const setTable = style({
    display: "grid",
})

export const setRow = style({
    display: "grid",
    gridTemplateColumns: "150px 1fr auto auto",
    alignItems: "baseline",
    gap: 20,
    padding: "18px 4px",
    borderTop: `1px solid ${marketing.color.line}`,
    fontFamily: MONO,
    selectors: {
        "&:last-child": { borderBottom: `1px solid ${marketing.color.line}` },
    },
    "@media": {
        "(max-width: 720px)": { gridTemplateColumns: "110px 1fr", rowGap: 6 },
    },
})

export const setDate = style({
    fontSize: 12.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.text,
    fontVariantNumeric: "tabular-nums",
})

export const setCity = style({
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "0.02em",
    color: marketing.color.text,
})

export const setVenue = style({
    display: "block",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    marginTop: 4,
})

export const setNote = style({
    fontSize: 10.5,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: marketing.color.text,
    border: `1px solid ${marketing.color.line}`,
    padding: "4px 10px",
    borderRadius: marketing.shape.radiusControl,
    justifySelf: "end",
    "@media": {
        "(max-width: 720px)": { justifySelf: "start" },
    },
})

export const setLink = style({
    fontSize: 11.5,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.text,
    textDecoration: "none",
    borderBottom: `1px solid ${marketing.color.text}`,
    paddingBottom: 2,
    justifySelf: "end",
    selectors: {
        "&:hover": { opacity: 0.7 },
    },
    "@media": {
        "(max-width: 720px)": { justifySelf: "start" },
    },
})

export const pastRow = style({
    opacity: 0.55,
})
