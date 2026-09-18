import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: `${scaledSpace(32)} ${scaledSpace(24)}`,
})

export const gridMember = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    textAlign: "center",
})

export const list = style({
    display: "flex",
    flexDirection: "column",
    gap: scaledSpace(28),
    maxWidth: 680,
    margin: "0 auto",
    textAlign: "left",
})

export const listRow = style({
    display: "flex",
    gap: 18,
    alignItems: "flex-start",
})

const avatar = style({
    width: 88,
    height: 88,
    borderRadius: "50%",
    flexShrink: 0,
})

export const avatarEmoji = style([
    avatar,
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 38,
        background: marketing.color.accentSoft,
        border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
        marginBottom: 8,
    },
])

export const avatarImg = style([
    avatar,
    {
        objectFit: "cover",
        border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
        marginBottom: 8,
    },
])

/* The photography-led treatment: full 3:4 frames, captions set beneath
 * like a gallery wall — left-aligned against the centered header. */
export const portraits = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: `${scaledSpace(36)} ${scaledSpace(24)}`,
    textAlign: "left",
})

export const portraitFigure = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
})

export const portraitImg = style({
    width: "100%",
    aspectRatio: "3 / 4",
    objectFit: "cover",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    marginBottom: 14,
})

export const portraitEmoji = style({
    width: "100%",
    aspectRatio: "3 / 4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: marketing.color.accentSoft,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    marginBottom: 14,
})

export const portraitName = style({
    fontFamily: marketing.font.display,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: marketing.display.tracking,
    color: marketing.color.text,
    margin: 0,
})

export const portraitRole = style({
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    marginTop: 4,
})

export const portraitBio = style({
    fontSize: 14,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: "10px 0 0",
})

export const name = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: 0,
})

export const role = style({
    fontSize: 13.5,
    fontWeight: 600,
    color: marketing.color.accent,
})

export const bio = style({
    fontSize: 14,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: "8px 0 0",
    maxWidth: 320,
})
