import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * Study-lamp palette: soft lavender paper, deep indigo ink, violet accent
 * with an amber "flip" highlight. Fraunces (preloaded in index.html) for
 * the wordmark and card faces.
 */
const paper = "#f7f6fc"
const ink = "#232136"
const inkSoft = "#6e6a86"
const line = "#e2e0ef"
const violet = packBrand?.accent ?? "#5b4fc7"
const violetSoft = packBrand?.accentSoft ?? "#eceafb"
const amber = "#e5a33d"
const green = "#3e6b4f"
const red = "#a04b3c"

const serif = '"Fraunces", Georgia, serif'
const sans = packFont ?? '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif'

const rise = keyframes({
    from: { opacity: 0, transform: "translateY(14px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

export const page = style({
    minHeight: "100vh",
    background: paper,
    color: ink,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const frame = style({
    width: "min(680px, 100%)",
    margin: "0 auto",
    padding: "0 24px 72px",
})

export const masthead = style({
    textAlign: "center",
    padding: "52px 0 10px",
    animation: `${rise} 0.5s ease both`,
})

export const wordmark = style({
    fontFamily: serif,
    fontSize: "clamp(34px, 6vw, 44px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
})

export const tagline = style({
    marginTop: 8,
    fontSize: 15.5,
    color: inkSoft,
})

/* ---- deck list ---- */

export const deckList = style({
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginTop: 28,
})

export const deckCard = style({
    display: "flex",
    alignItems: "center",
    gap: 16,
    width: "100%",
    textAlign: "left",
    background: "#fff",
    border: `1px solid ${line}`,
    borderRadius: 16,
    padding: "18px 20px",
    cursor: "pointer",
    fontFamily: sans,
    color: ink,
    transition: "border-color 120ms ease, transform 120ms ease",
    animation: `${rise} 0.5s ease both`,
    selectors: {
        "&:hover": { borderColor: violet, transform: "translateY(-1px)" },
    },
})

export const deckEmoji = style({
    fontSize: 30,
    width: 52,
    height: 52,
    display: "grid",
    placeItems: "center",
    background: violetSoft,
    borderRadius: 14,
    flexShrink: 0,
})

export const deckText = style({
    flex: 1,
    minWidth: 0,
})

export const deckTitle = style({
    fontFamily: serif,
    fontSize: 19,
    fontWeight: 650,
    margin: 0,
})

export const deckDescription = style({
    margin: "3px 0 8px",
    fontSize: 13.5,
    color: inkSoft,
})

export const progressTrack = style({
    height: 6,
    borderRadius: 999,
    background: line,
    overflow: "hidden",
})

export const progressFill = style({
    height: "100%",
    borderRadius: 999,
    background: violet,
    transition: "width 300ms ease",
})

export const deckMeta = style({
    fontSize: 12.5,
    color: inkSoft,
    marginTop: 6,
})

export const dueBadge = style({
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    background: amber,
    borderRadius: 999,
    padding: "4px 11px",
    whiteSpace: "nowrap",
})

export const doneBadge = style({
    fontSize: 12,
    fontWeight: 700,
    color: green,
    background: "#e8efe9",
    borderRadius: 999,
    padding: "4px 11px",
    whiteSpace: "nowrap",
})

/* ---- study session ---- */

export const studyHeader = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 26,
})

export const backLink = style({
    fontSize: 14,
    fontWeight: 650,
    color: violet,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: sans,
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

export const sessionCount = style({
    marginLeft: "auto",
    fontSize: 13.5,
    color: inkSoft,
})

export const cardScene = style({
    perspective: 1200,
    marginTop: 22,
})

export const studyCard = style({
    position: "relative",
    width: "100%",
    minHeight: 300,
    transformStyle: "preserve-3d",
    transition: "transform 350ms ease",
    cursor: "pointer",
})

export const studyCardFlipped = style({
    transform: "rotateX(180deg)",
})

const face = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 28,
    borderRadius: 20,
    border: `1px solid ${line}`,
    backfaceVisibility: "hidden",
    textAlign: "center",
})

export const cardFront = style([
    face,
    {
        background: "#fff",
    },
])

export const cardBack = style([
    face,
    {
        background: ink,
        color: paper,
        transform: "rotateX(180deg)",
    },
])

export const faceLabel = style({
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkSoft,
})

export const faceLabelBack = style({
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: amber,
})

export const faceText = style({
    fontFamily: serif,
    fontSize: "clamp(22px, 4.5vw, 30px)",
    fontWeight: 650,
    lineHeight: 1.25,
})

export const faceHint = style({
    fontSize: 14,
    color: inkSoft,
    fontStyle: "italic",
})

globalStyle(`${cardBack} ${faceHint}`, {
    color: "#a9a5c4",
})

export const flipNudge = style({
    fontSize: 12.5,
    color: inkSoft,
})

export const gradeRow = style({
    display: "flex",
    gap: 12,
    marginTop: 20,
})

const gradeButton = style({
    flex: 1,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: sans,
    borderRadius: 14,
    padding: "15px 0",
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "transform 100ms ease",
    selectors: {
        "&:hover": { transform: "translateY(-1px)" },
        "&:disabled": { opacity: 0.4, cursor: "default", transform: "none" },
    },
})

export const againButton = style([
    gradeButton,
    {
        background: "#f6e7e3",
        color: red,
        borderColor: "#e8cfc8",
    },
])

export const goodButton = style([
    gradeButton,
    {
        background: violet,
        color: "#fff",
    },
])

/* ---- session summary ---- */

export const summary = style({
    textAlign: "center",
    marginTop: 40,
    animation: `${rise} 0.4s ease both`,
})

export const summaryEmoji = style({
    fontSize: 44,
})

export const summaryTitle = style({
    fontFamily: serif,
    fontSize: 26,
    fontWeight: 700,
    margin: "12px 0 6px",
})

export const summaryText = style({
    fontSize: 15,
    color: inkSoft,
    lineHeight: 1.6,
})

export const summaryStats = style({
    display: "flex",
    justifyContent: "center",
    gap: 28,
    marginTop: 22,
})

export const statBlock = style({
    textAlign: "center",
})

export const statNumber = style({
    fontFamily: serif,
    fontSize: 30,
    fontWeight: 700,
    color: violet,
})

export const statLabel = style({
    fontSize: 12.5,
    color: inkSoft,
    marginTop: 2,
})

export const footer = style({
    marginTop: 52,
    paddingTop: 22,
    borderTop: `1px solid ${line}`,
    textAlign: "center",
    fontSize: 13,
    color: inkSoft,
})
