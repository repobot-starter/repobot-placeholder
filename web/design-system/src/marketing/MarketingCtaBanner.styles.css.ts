import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { ctaPrimary, sectionTitle } from "./shared.css"

export const card = style({
    textAlign: "center",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(56)} 24px`,
    marginTop: scaledSpace(72),
})

/** Over a backdrop the banner is an edge-to-edge band, not a boxed card. */
export const band = style({
    textAlign: "center",
    padding: `${scaledSpace(88)} 0`,
    marginTop: scaledSpace(72),
})

/**
 * `full-bleed`: an edge-to-edge tinted band, no card chrome — the closing
 * statement. The tint rides the theme's soft accent so every preset keeps
 * its own register.
 */
export const fullBleed = style({
    textAlign: "center",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    marginTop: scaledSpace(72),
    padding: `${scaledSpace(88)} 24px`,
    background: marketing.color.accentSoft,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

/*
 * `ticket`: the card as an admission stub — a solid outer edge with a
 * perforated inner rule and punched side notches (pageBg circles riding
 * the border), for invitations rather than signups.
 */
export const ticket = style({
    position: "relative",
    textAlign: "center",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    outline: `1px dashed ${marketing.color.line}`,
    outlineOffset: -12,
    padding: `${scaledSpace(56)} 24px`,
    marginTop: scaledSpace(72),
})

const ticketNotch = style({
    position: "absolute",
    top: "50%",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: marketing.color.pageBg,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const ticketNotchLeft = style([ticketNotch, { left: -12, transform: "translateY(-50%)" }])

export const ticketNotchRight = style([ticketNotch, { right: -12, transform: "translateY(-50%)" }])

export const title = style([
    sectionTitle,
    {
        marginBottom: 28,
    },
])

export const body = style({
    fontSize: 15,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 560,
    margin: "-16px auto 28px",
})

export const cta = ctaPrimary
