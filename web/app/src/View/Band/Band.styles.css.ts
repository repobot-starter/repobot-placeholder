import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The band pack's bespoke surfaces — the tour table, the record shelf, the
 * press kit — drawn from the marketing token contract so they wear the
 * broadside register (ink on paper, hairline rules, letterspaced mono
 * microcopy) and restyle with the platform's theme controls.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"

/* ------------------------------ page scaffold ------------------------------ */

export const main = style({
    maxWidth: marketing.layout.maxWidth,
    margin: "0 auto",
    padding: "0 24px 96px",
})

export const pageHeader = style({
    padding: "88px 0 40px",
    display: "grid",
    gap: 18,
})

export const kicker = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const headlineRow = style({
    display: "flex",
    alignItems: "baseline",
    gap: 20,
    flexWrap: "wrap",
})

export const headline = style({
    fontFamily: marketing.font.display,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.01em",
    fontSize: `calc(clamp(44px, 8vw, 92px) * ${marketing.display.scale})`,
    lineHeight: 0.95,
    margin: 0,
    color: marketing.color.text,
})

export const badge = style({
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    border: `1px solid ${marketing.color.accent}`,
    padding: "7px 14px",
    borderRadius: marketing.shape.radiusControl,
    whiteSpace: "nowrap",
})

export const lede = style({
    fontSize: 17,
    lineHeight: 1.65,
    color: marketing.color.subtle,
    maxWidth: 640,
    margin: 0,
})

export const sectionLabel = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    display: "flex",
    alignItems: "center",
    gap: 16,
    margin: "72px 0 26px",
    selectors: {
        "&::after": {
            content: '""',
            flex: 1,
            height: 1,
            background: marketing.color.line,
        },
    },
})

/* --------------------------------- tour --------------------------------- */

export const nextShow = style({
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 32,
    padding: "34px 36px",
    background: marketing.color.surface,
    border: `1px solid ${marketing.color.text}`,
    borderRadius: marketing.shape.radiusCard,
    "@media": {
        "(max-width: 720px)": {
            gridTemplateColumns: "1fr",
            gap: 18,
            padding: "26px 24px",
        },
    },
})

export const nextShowDate = style({
    display: "grid",
    gap: 4,
    textAlign: "center",
    "@media": {
        "(max-width: 720px)": { textAlign: "left" },
    },
})

export const nextShowWeekday = style({
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const nextShowDay = style({
    fontFamily: marketing.font.display,
    fontWeight: 800,
    textTransform: "uppercase",
    fontSize: 44,
    lineHeight: 1,
    color: marketing.color.text,
})

export const nextShowCity = style({
    fontFamily: marketing.font.display,
    fontWeight: 750,
    textTransform: "uppercase",
    fontSize: "clamp(22px, 3.2vw, 34px)",
    lineHeight: 1.05,
    color: marketing.color.text,
})

export const nextShowVenue = style({
    fontSize: 15.5,
    color: marketing.color.subtle,
    marginTop: 6,
})

export const ticketButton = style({
    fontFamily: MONO,
    fontSize: 12.5,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    textDecoration: "none",
    padding: "14px 26px",
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

export const showTable = style({
    display: "grid",
})

export const showRow = style({
    display: "grid",
    gridTemplateColumns: "150px 1fr auto auto",
    alignItems: "baseline",
    gap: 20,
    padding: "20px 4px",
    borderTop: `1px solid ${marketing.color.line}`,
    selectors: {
        "&:last-child": { borderBottom: `1px solid ${marketing.color.line}` },
    },
    "@media": {
        "(max-width: 720px)": {
            gridTemplateColumns: "110px 1fr",
            rowGap: 8,
        },
    },
})

export const showDate = style({
    fontFamily: MONO,
    fontSize: 13,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.text,
    fontVariantNumeric: "tabular-nums",
})

export const showCity = style({
    fontFamily: marketing.font.display,
    fontWeight: 700,
    textTransform: "uppercase",
    fontSize: 19,
    color: marketing.color.text,
})

export const showVenue = style({
    display: "block",
    fontFamily: marketing.font.body,
    fontWeight: 400,
    textTransform: "none",
    fontSize: 14.5,
    color: marketing.color.subtle,
    marginTop: 3,
})

export const showNote = style({
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    justifySelf: "end",
    "@media": {
        "(max-width: 720px)": { justifySelf: "start" },
    },
})

export const showTicketLink = style({
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.text,
    textDecoration: "none",
    borderBottom: `1px solid ${marketing.color.text}`,
    paddingBottom: 2,
    justifySelf: "end",
    selectors: {
        "&:hover": { color: marketing.color.accent, borderBottomColor: marketing.color.accent },
    },
    "@media": {
        "(max-width: 720px)": { justifySelf: "start" },
    },
})

export const soldOut = style({
    color: marketing.color.subtle,
    borderBottom: "none",
    textDecoration: "line-through",
})

export const pastRow = style({
    opacity: 0.62,
})

/* --------------------------------- music --------------------------------- */

export const record = style({
    display: "grid",
    gridTemplateColumns: "minmax(220px, 320px) 1fr",
    gap: 40,
    alignItems: "start",
    padding: "40px 0",
    borderTop: `1px solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 820px)": { gridTemplateColumns: "1fr", gap: 24 },
    },
})

export const recordCoverWrap = style({
    position: "sticky",
    top: 96,
    "@media": {
        "(max-width: 820px)": { position: "static", maxWidth: 320 },
    },
})

export const recordCover = style({
    width: "100%",
    display: "block",
    border: `1px solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const recordBody = style({
    display: "grid",
    gap: 16,
})

export const recordTitle = style({
    fontFamily: marketing.font.display,
    fontWeight: 800,
    textTransform: "uppercase",
    fontSize: "clamp(26px, 4vw, 40px)",
    lineHeight: 1,
    margin: 0,
    color: marketing.color.text,
})

export const recordMeta = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const recordNotes = style({
    fontSize: 15.5,
    lineHeight: 1.65,
    color: marketing.color.subtle,
    maxWidth: 560,
    margin: 0,
})

export const trackList = style({
    display: "grid",
    gap: 12,
    marginTop: 8,
})

export const videoGrid = style({
    display: "grid",
    gap: 24,
    maxWidth: 900,
})

/* --------------------------------- press --------------------------------- */

export const bioBlock = style({
    display: "grid",
    gridTemplateColumns: "170px 1fr",
    gap: 28,
    padding: "28px 0",
    borderTop: `1px solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 720px)": { gridTemplateColumns: "1fr", gap: 10 },
    },
})

export const bioLabelCol = style({
    display: "grid",
    gap: 12,
    alignContent: "start",
})

export const bioLabel = style({
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const copyButton = style({
    justifySelf: "start",
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    padding: "6px 12px",
    cursor: "pointer",
    color: marketing.color.text,
    background: "transparent",
    border: `1px solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    transition: "border-color 160ms ease, color 160ms ease",
    selectors: {
        "&:hover": { borderColor: marketing.color.text },
    },
})

export const bioText = style({
    fontSize: 15.5,
    lineHeight: 1.7,
    color: marketing.color.text,
    margin: 0,
    display: "grid",
    gap: 14,
})

export const photoGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 24,
    "@media": {
        "(max-width: 820px)": { gridTemplateColumns: "1fr 1fr" },
        "(max-width: 560px)": { gridTemplateColumns: "1fr" },
    },
})

export const photoCard = style({
    display: "grid",
    gap: 10,
})

export const photoImage = style({
    width: "100%",
    display: "block",
    aspectRatio: "2 / 3",
    objectFit: "cover",
    border: `1px solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const photoCredit = style({
    fontSize: 13,
    color: marketing.color.subtle,
})

export const downloadLink = style({
    fontFamily: MONO,
    fontSize: 11.5,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.text,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderBottom: `1px solid ${marketing.color.text}`,
    paddingBottom: 2,
    justifySelf: "start",
    selectors: {
        "&:hover": { color: marketing.color.accent, borderBottomColor: marketing.color.accent },
    },
})

export const logoGrid = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    "@media": {
        "(max-width: 720px)": { gridTemplateColumns: "1fr" },
    },
})

export const logoTile = style({
    display: "grid",
    gap: 12,
    padding: 24,
    border: `1px solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const logoTileGround = style({
    display: "grid",
    placeItems: "center",
    padding: "36px 24px",
    borderRadius: marketing.shape.radiusControl,
})

export const logoTileLight = style({
    background: "#f5f2ea", // theme-exempt: the logo proof sheet shows the mark on a true paper ground
    border: "1px solid rgba(0,0,0,0.12)", // theme-exempt: hairline on the fixed proof ground
})

export const logoTileDark = style({
    background: "#141210", // theme-exempt: the logo proof sheet shows the mark on a true ink ground
    border: "1px solid rgba(255,255,255,0.14)", // theme-exempt: hairline on the fixed proof ground
})

export const logoImage = style({
    maxWidth: 260,
    width: "100%",
    display: "block",
})

export const logoLabel = style({
    fontSize: 13.5,
    color: marketing.color.subtle,
})

export const specGrid = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 48,
    "@media": {
        "(max-width: 820px)": { gridTemplateColumns: "1fr" },
    },
})

export const lineupList = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
})

export const lineupItem = style({
    fontSize: 15.5,
    color: marketing.color.text,
    padding: "13px 2px",
    borderTop: `1px solid ${marketing.color.line}`,
})

export const specRow = style({
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: 16,
    padding: "13px 2px",
    borderTop: `1px solid ${marketing.color.line}`,
})

export const specLabel = style({
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    paddingTop: 2,
})

export const specValue = style({
    fontSize: 15,
    color: marketing.color.text,
})

export const contactGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 24,
    "@media": {
        "(max-width: 820px)": { gridTemplateColumns: "1fr" },
    },
})

export const contactCard = style({
    display: "grid",
    gap: 6,
    padding: "22px 24px",
    background: marketing.color.surface,
    border: `1px solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const contactRole = style({
    fontFamily: MONO,
    fontSize: 10.5,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const contactName = style({
    fontFamily: marketing.font.display,
    fontWeight: 700,
    fontSize: 17,
    color: marketing.color.text,
})

export const contactEmail = style({
    fontSize: 14.5,
    color: marketing.color.subtle,
    wordBreak: "break-all",
})
