import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * A quiet reading theme: soft white paper, near-black ink, one moss-green
 * accent. Fraunces (preloaded in index.html) carries titles; body text stays
 * on the system stack for crisp long-form reading.
 */
const paper = "#fcfbf6"
const ink = "#20211c"
const inkSoft = "#71716a"
const line = "#e5e3d8"
const accent = packBrand?.accent ?? "#3e6b4f"
const accentSoft = packBrand?.accentSoft ?? "#eef2ea"
const codeBg = "#f2f0e8"

const serif = '"Fraunces", Georgia, serif'
const sans = packFont ?? '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif'
const mono = '"SF Mono", ui-monospace, Menlo, monospace'

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
    width: "min(720px, 100%)",
    margin: "0 auto",
    padding: "0 24px 72px",
})

export const masthead = style({
    padding: "56px 0 28px",
    borderBottom: `1px solid ${line}`,
    animation: `${rise} 0.5s ease both`,
})

export const blogTitle = style({
    fontFamily: serif,
    fontSize: "clamp(34px, 6vw, 46px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
})

export const tagline = style({
    marginTop: 10,
    fontSize: 16,
    lineHeight: 1.55,
    color: inkSoft,
    maxWidth: 520,
})

export const authorRow = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 22,
})

export const avatar = style({
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: accent,
    color: paper,
    display: "grid",
    placeItems: "center",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.02em",
})

export const authorName = style({
    fontSize: 14,
    fontWeight: 650,
})

export const authorRole = style({
    fontSize: 13,
    color: inkSoft,
})

export const tagRow = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: "20px 0 4px",
})

export const tagChip = style({
    fontSize: 13,
    fontWeight: 600,
    color: inkSoft,
    background: "transparent",
    border: `1px solid ${line}`,
    borderRadius: 999,
    padding: "6px 14px",
    cursor: "pointer",
    fontFamily: sans,
    transition: "all 120ms ease",
    selectors: {
        "&:hover": { borderColor: accent, color: accent },
    },
})

export const tagChipActive = style({
    background: accent,
    borderColor: accent,
    color: paper,
    selectors: {
        "&:hover": { color: paper },
    },
})

export const postList = style({
    display: "flex",
    flexDirection: "column",
})

export const postCard = style({
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${line}`,
    padding: "26px 0",
    cursor: "pointer",
    fontFamily: sans,
    color: ink,
    animation: `${rise} 0.5s ease both`,
})

globalStyle(`${postCard}:hover h2`, {
    color: accent,
})

export const postMeta = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: inkSoft,
})

export const postTag = style({
    fontSize: 12,
    fontWeight: 650,
    color: accent,
    background: accentSoft,
    borderRadius: 999,
    padding: "2px 10px",
})

export const postTitle = style({
    fontFamily: serif,
    fontSize: 24,
    fontWeight: 650,
    letterSpacing: "-0.015em",
    margin: "10px 0 8px",
    transition: "color 120ms ease",
})

export const postSummary = style({
    fontSize: 15,
    lineHeight: 1.6,
    color: inkSoft,
    margin: 0,
    maxWidth: 600,
})

/* ---- article view ---- */

export const backLink = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 28,
    fontSize: 14,
    fontWeight: 650,
    color: accent,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: sans,
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

export const article = style({
    animation: `${rise} 0.4s ease both`,
})

export const articleTitle = style({
    fontFamily: serif,
    fontSize: "clamp(30px, 5.5vw, 40px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
    margin: "18px 0 12px",
})

export const articleBody = style({
    marginTop: 28,
    fontSize: 17,
    lineHeight: 1.7,
})

export const bodyParagraph = style({
    margin: "0 0 20px",
})

export const bodyHeading = style({
    fontFamily: serif,
    fontWeight: 650,
    letterSpacing: "-0.015em",
    margin: "34px 0 12px",
})

export const bodyQuote = style({
    margin: "24px 0",
    padding: "4px 0 4px 20px",
    borderLeft: `3px solid ${accent}`,
    color: inkSoft,
    fontStyle: "italic",
})

export const bodyList = style({
    margin: "0 0 20px",
    paddingLeft: 24,
})

globalStyle(`${bodyList} li`, {
    margin: "6px 0",
})

export const bodyCode = style({
    background: codeBg,
    border: `1px solid ${line}`,
    borderRadius: 10,
    padding: "16px 18px",
    margin: "0 0 20px",
    fontFamily: mono,
    fontSize: 13.5,
    lineHeight: 1.6,
    overflowX: "auto",
    whiteSpace: "pre",
})

export const inlineCode = style({
    background: codeBg,
    border: `1px solid ${line}`,
    borderRadius: 5,
    padding: "1px 6px",
    fontFamily: mono,
    fontSize: "0.88em",
})

export const bodyLink = style({
    color: accent,
    fontWeight: 600,
    textDecorationThickness: 1,
    textUnderlineOffset: 3,
})

export const bodyDivider = style({
    border: "none",
    borderTop: `1px solid ${line}`,
    margin: "32px auto",
    width: 96,
})

export const footer = style({
    marginTop: 48,
    paddingTop: 24,
    borderTop: `1px solid ${line}`,
    fontSize: 14,
    color: inkSoft,
    lineHeight: 1.6,
})
