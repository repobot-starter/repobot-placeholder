import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const chipRow = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: scaledSpace(30),
})

export const chip = style({
    appearance: "none",
    font: "inherit",
    fontSize: 14,
    lineHeight: 1,
    padding: "9px 16px",
    cursor: "pointer",
    color: marketing.color.subtle,
    background: "transparent",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    selectors: {
        '&[aria-pressed="true"]': {
            color: marketing.color.text,
            borderColor: marketing.color.text,
        },
        "&:focus-visible": {
            outline: `2px solid ${marketing.color.accent}`,
            outlineOffset: 2,
        },
    },
})

/** The ranks side by side, ruled apart; phones stack them. */
export const columns = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    textAlign: "center",
})

export const column = style({
    padding: `0 ${scaledSpace(22)}`,
    selectors: {
        "& + &": { borderLeft: `${marketing.shape.borderWidth} solid ${marketing.color.line}` },
    },
    "@media": {
        "(max-width: 700px)": {
            selectors: {
                "& + &": {
                    borderLeft: "none",
                    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
                    paddingTop: scaledSpace(28),
                    marginTop: scaledSpace(12),
                },
            },
        },
    },
})

export const columnHeading = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(24px, 2.6vw, 32px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.1,
    color: marketing.color.text,
    margin: `0 0 ${scaledSpace(22)}`,
})

export const entries = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: scaledSpace(30),
})

export const entry = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 0,
})

export const portrait = style({
    width: "min(100%, 230px)",
    aspectRatio: "3 / 4",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
    marginBottom: scaledSpace(14),
})

export const portraitImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const name = style({
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.2,
    color: marketing.color.text,
    margin: "0 0 6px",
})

export const nameLink = style({
    color: "inherit",
    textDecoration: "none",
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

export const specialties = style({
    fontSize: 11.5,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    margin: "0 0 6px",
})

export const rate = style({
    fontSize: 15,
    color: marketing.color.text,
    margin: "0 0 2px",
})

export const availability = style({
    fontSize: 14,
    color: marketing.color.subtle,
    margin: 0,
})
