import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The blog reader's typography, drawn entirely from the marketing token
 * contract: the page chrome (logo-only nav, footer) is `MarketingShell`
 * under the `editorial` preset, so the customer's `repobot.theme.json`
 * brand and font flow in through the same seam as every marketing page.
 */

const mono = '"SF Mono", ui-monospace, Menlo, monospace'

const rise = keyframes({
    from: { opacity: 0, transform: "translateY(14px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

/* ---- post list ---- */

export const postList = style({
    display: "flex",
    flexDirection: "column",
    marginTop: 24,
})

/** A post row is the whole click target — no "read more" affordance needed. */
export const postRow = style({
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    padding: "34px 0",
    cursor: "pointer",
    fontFamily: marketing.font.body,
    color: marketing.color.text,
    animation: `${rise} ${marketing.motion.rise} ease both`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
})

export const postMeta = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: marketing.color.subtle,
})

export const postTitle = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(22px, 3.6vw, 28px)",
    fontWeight: 650,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.2,
    margin: "10px 0 8px",
    transition: "color 120ms ease",
})

export const postSummary = style({
    fontSize: 15.5,
    lineHeight: 1.65,
    color: marketing.color.subtle,
    margin: 0,
    maxWidth: "58ch",
})

globalStyle(`${postRow}:hover h2`, {
    color: marketing.color.accent,
})

/* ---- article view ---- */

export const backLink = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 28,
    fontSize: 14,
    fontWeight: 650,
    color: marketing.color.accent,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    fontFamily: marketing.font.body,
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

export const article = style({
    animation: `${rise} ${marketing.motion.rise} ease both`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
})

export const articleTitle = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(30px, 5.5vw, 40px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
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
    fontFamily: marketing.font.display,
    fontWeight: 650,
    letterSpacing: marketing.display.tracking,
    margin: "34px 0 12px",
})

export const bodyQuote = style({
    margin: "24px 0",
    padding: "4px 0 4px 20px",
    borderLeft: `3px solid ${marketing.color.accent}`,
    color: marketing.color.subtle,
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
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    padding: "16px 18px",
    margin: "0 0 20px",
    fontFamily: mono,
    fontSize: 13.5,
    lineHeight: 1.6,
    overflowX: "auto",
    whiteSpace: "pre",
})

export const inlineCode = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "1px 6px",
    fontFamily: mono,
    fontSize: "0.88em",
})

export const bodyLink = style({
    color: marketing.color.accent,
    fontWeight: 600,
    textDecorationThickness: 1,
    textUnderlineOffset: 3,
})

export const bodyDivider = style({
    border: "none",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    margin: "32px auto",
    width: 96,
})

/** The article's closing byline — content, not site chrome. */
export const byline = style({
    marginTop: 48,
    paddingTop: 24,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    fontSize: 14,
    color: marketing.color.subtle,
    lineHeight: 1.6,
})
