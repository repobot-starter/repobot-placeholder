import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { ctaSecondary, section } from "./shared.css"

export const wrap = section

export const head = style({
    textAlign: "center",
    marginBottom: scaledSpace(28),
})

export const kicker = style({
    display: "block",
    fontSize: 12.5,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    marginBottom: scaledSpace(10),
})

export const headline = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(32px, 4.4vw, 56px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.06,
    color: marketing.color.text,
    margin: 0,
})

/** A short centered rule under the headline; registers may ornament it. */
export const rule = style({
    display: "block",
    width: 96,
    height: marketing.shape.borderWidth,
    margin: `${scaledSpace(18)} auto 0`,
    background: marketing.color.line,
})

export const body = style({
    maxWidth: 680,
    margin: "0 auto",
    fontSize: 16.5,
    lineHeight: 1.65,
    color: marketing.color.text,
})

/** Two columns from tablet up, the way a feature's opening runs. */
export const bodyColumns = style({
    "@media": {
        "(min-width: 760px)": {
            maxWidth: "none",
            columnCount: 2,
            columnGap: scaledSpace(44),
        },
    },
})

export const paragraph = style({
    margin: `0 0 ${scaledSpace(14)}`,
    breakInside: "avoid-column",
})

/** The drop cap: the first letter of the story, three lines deep. */
globalStyle(`${body} ${paragraph}:first-child::first-letter`, {
    float: "left",
    fontFamily: marketing.font.display,
    fontSize: "3.6em",
    lineHeight: 0.84,
    padding: "0.08em 0.1em 0 0",
    color: marketing.color.text,
})

/** The closing line of a multi-paragraph story reads as its coda. */
globalStyle(`${bodyColumns} ${paragraph}:last-child:not(:first-child)`, {
    fontStyle: "italic",
    color: marketing.color.subtle,
})

export const spread = style({
    margin: `${scaledSpace(34)} 0 0`,
    aspectRatio: "16 / 7",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
    "@media": {
        "(max-width: 640px)": { aspectRatio: "4 / 3" },
    },
})

export const spreadImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const pullQuote = style({
    margin: `${scaledSpace(30)} auto`,
    maxWidth: 760,
    padding: `${scaledSpace(10)} 0 ${scaledSpace(18)}`,
    textAlign: "center",
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const pullQuoteText = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(22px, 2.6vw, 32px) * ${marketing.display.scale})`,
    fontStyle: "italic",
    lineHeight: 1.3,
    color: marketing.color.text,
    margin: 0,
    selectors: {
        "&::before": { content: '"\u201C"' },
        "&::after": { content: '"\u201D"' },
    },
})

export const figures = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: scaledSpace(26),
})

export const figure = style({
    margin: 0,
    minWidth: 0,
})

export const figureFrame = style({
    aspectRatio: "4 / 3",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
})

export const figureImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const figureCaption = style({
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: scaledSpace(10),
})

export const figureTitle = style({
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.text,
})

export const figureText = style({
    fontSize: 14.5,
    fontStyle: "italic",
    lineHeight: 1.5,
    color: marketing.color.subtle,
})

export const plate = style({
    margin: `${scaledSpace(38)} auto 0`,
    maxWidth: 900,
    textAlign: "center",
})

export const plateFrame = style({
    overflow: "hidden",
})

/** A drawing prints onto the page's paper instead of sitting on it as a box. */
export const plateImg = style({
    width: "100%",
    height: "auto",
    display: "block",
    mixBlendMode: "multiply",
})

// On a dark ground a multiplied drawing would vanish: it keeps its own paper.
globalStyle(`[data-marketing-mode="dark"] ${plateImg}`, { mixBlendMode: "normal" })

export const plateCaption = style({
    marginTop: scaledSpace(10),
    fontSize: 12,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const ctaRow = style({
    display: "flex",
    justifyContent: "center",
    marginTop: scaledSpace(30),
})

export const cta = ctaSecondary
