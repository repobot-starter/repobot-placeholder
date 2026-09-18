import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const row = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const card = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(26)} ${scaledSpace(22)} ${scaledSpace(24)}`,
})

export const number = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: "50%",
    fontWeight: 700,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    marginBottom: 14,
})

export const timeline = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: scaledSpace(30),
    maxWidth: 640,
    margin: "0 auto",
    padding: 0,
    textAlign: "left",
})

export const timelineItem = style({
    position: "relative",
    paddingLeft: 56,
    selectors: {
        // The rail connecting one step's dot to the next.
        "&:not(:last-child)::after": {
            content: '""',
            position: "absolute",
            left: 16,
            top: 40,
            // Tracks the scaled timeline gap so the rail still reaches
            // toward the next dot at every density.
            bottom: `calc(-1 * ${scaledSpace(24)})`,
            width: marketing.shape.borderWidth,
            background: marketing.color.line,
        },
    },
})

export const timelineDot = style({
    position: "absolute",
    left: 0,
    top: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: "50%",
    fontWeight: 700,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

export const stepTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: "0 0 8px",
})

export const stepDescription = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})
