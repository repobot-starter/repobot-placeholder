import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * Pub-quiz palette: warm cream paper, deep pine ink, coral accent with a
 * brass highlight for scores. Fraunces (preloaded in index.html) for the
 * wordmark and question prompts. The accent and body font route through the
 * repobot.theme.json brand overlay (packs/README.md): the pack's art palette
 * holds until the project sets its own brand.
 */
const paper = "#faf6ee"
const ink = "#22403c"
const inkSoft = "#5f7672"
const line = "#e6ddcd"
const coral = packBrand?.accent ?? "#d95d43"
const coralSoft = packBrand?.accentSoft ?? "#fbe9e4"
const brass = "#b98b2f"
const green = "#2f6b46"
const greenSoft = "#e4efe6"
const red = "#a04b3c"
const redSoft = "#f6e7e3"

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

/* ---- quiz list ---- */

export const quizList = style({
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginTop: 28,
})

export const quizCard = style({
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
        "&:hover": { borderColor: coral, transform: "translateY(-1px)" },
    },
})

export const quizEmoji = style({
    fontSize: 30,
    width: 52,
    height: 52,
    display: "grid",
    placeItems: "center",
    background: coralSoft,
    borderRadius: 14,
    flexShrink: 0,
})

export const quizText = style({
    flex: 1,
    minWidth: 0,
})

export const quizTitle = style({
    fontFamily: serif,
    fontSize: 19,
    fontWeight: 650,
    margin: 0,
})

export const quizDescription = style({
    margin: "3px 0 6px",
    fontSize: 13.5,
    color: inkSoft,
})

export const quizMeta = style({
    fontSize: 12.5,
    color: inkSoft,
})

export const bestBadge = style({
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    background: brass,
    borderRadius: 999,
    padding: "4px 11px",
    whiteSpace: "nowrap",
})

export const newBadge = style({
    fontSize: 12,
    fontWeight: 700,
    color: coral,
    background: coralSoft,
    borderRadius: 999,
    padding: "4px 11px",
    whiteSpace: "nowrap",
})

/* ---- quiz run ---- */

export const runHeader = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 26,
})

export const backLink = style({
    fontSize: 14,
    fontWeight: 650,
    color: coral,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: sans,
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

export const runCount = style({
    marginLeft: "auto",
    fontSize: 13.5,
    color: inkSoft,
})

export const progressTrack = style({
    height: 6,
    borderRadius: 999,
    background: line,
    overflow: "hidden",
    marginTop: 16,
})

export const progressFill = style({
    height: "100%",
    borderRadius: 999,
    background: coral,
    transition: "width 250ms ease",
})

export const questionCard = style({
    background: "#fff",
    border: `1px solid ${line}`,
    borderRadius: 20,
    padding: "28px 26px",
    marginTop: 18,
    animation: `${rise} 0.35s ease both`,
})

export const prompt = style({
    fontFamily: serif,
    fontSize: "clamp(20px, 4vw, 26px)",
    fontWeight: 650,
    lineHeight: 1.3,
    margin: 0,
})

export const choiceList = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 22,
})

export const choice = style({
    width: "100%",
    textAlign: "left",
    fontFamily: sans,
    fontSize: 15,
    fontWeight: 550,
    color: ink,
    background: paper,
    border: `1px solid ${line}`,
    borderRadius: 12,
    padding: "13px 16px",
    cursor: "pointer",
    transition: "border-color 120ms ease, background 120ms ease",
    selectors: {
        "&:hover:enabled": { borderColor: coral },
        "&:disabled": { cursor: "default" },
    },
})

export const choiceCorrect = style({
    background: greenSoft,
    borderColor: green,
    color: green,
    fontWeight: 700,
})

export const choiceWrong = style({
    background: redSoft,
    borderColor: red,
    color: red,
    fontWeight: 700,
})

export const choiceDimmed = style({
    opacity: 0.55,
})

export const explanation = style({
    marginTop: 18,
    padding: "13px 16px",
    borderRadius: 12,
    background: coralSoft,
    fontSize: 14,
    lineHeight: 1.55,
    color: ink,
})

export const nextRow = style({
    display: "flex",
    marginTop: 20,
})

export const nextButton = style({
    flex: 1,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: sans,
    borderRadius: 14,
    padding: "15px 0",
    cursor: "pointer",
    border: "1px solid transparent",
    background: coral,
    color: "#fff",
    transition: "transform 100ms ease",
    selectors: {
        "&:hover": { transform: "translateY(-1px)" },
    },
})

export const ghostButton = style({
    flex: 1,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: sans,
    borderRadius: 14,
    padding: "15px 0",
    cursor: "pointer",
    background: "#fff",
    color: coral,
    border: `1px solid ${coral}`,
    transition: "transform 100ms ease",
    selectors: {
        "&:hover": { transform: "translateY(-1px)" },
    },
})

/* ---- results ---- */

export const results = style({
    textAlign: "center",
    marginTop: 40,
    animation: `${rise} 0.4s ease both`,
})

export const resultsEmoji = style({
    fontSize: 44,
})

export const resultsTitle = style({
    fontFamily: serif,
    fontSize: 26,
    fontWeight: 700,
    margin: "12px 0 6px",
})

export const resultsText = style({
    fontSize: 15,
    color: inkSoft,
    lineHeight: 1.6,
})

export const scoreRow = style({
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
    color: coral,
})

export const statLabel = style({
    fontSize: 12.5,
    color: inkSoft,
    marginTop: 2,
})

export const newBestNote = style({
    marginTop: 14,
    fontSize: 13.5,
    fontWeight: 700,
    color: brass,
})

export const missList = style({
    marginTop: 26,
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: 10,
})

export const missItem = style({
    background: "#fff",
    border: `1px solid ${line}`,
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 13.5,
    lineHeight: 1.5,
})

export const missPrompt = style({
    fontWeight: 700,
    display: "block",
})

export const missAnswer = style({
    color: green,
    fontWeight: 650,
})

export const resultsButtons = style({
    display: "flex",
    gap: 12,
    marginTop: 24,
})

export const footer = style({
    marginTop: 52,
    paddingTop: 22,
    borderTop: `1px solid ${line}`,
    textAlign: "center",
    fontSize: 13,
    color: inkSoft,
})
