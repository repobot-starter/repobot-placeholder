import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { ctaPrimary, section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const form = style({
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
})

export const input = style({
    width: "min(320px, 100%)",
    fontSize: 15,
    fontFamily: "inherit",
    color: marketing.color.text,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "13px 16px",
    outline: "none",
    selectors: {
        "&:focus": { borderColor: marketing.color.accent },
        "&::placeholder": { color: marketing.color.subtle },
    },
})

export const button = style([
    ctaPrimary,
    {
        fontFamily: "inherit",
    },
])

// The honeypot input: present in the DOM for bots to fill, invisible and
// unreachable for humans (off-screen, untabbable, hidden from readers).
// display:none would work too, but many bots skip display:none fields.
export const trap = style({
    position: "absolute",
    left: "-9999px",
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: "none",
})

export const confirmation = style({
    marginTop: 14,
    fontSize: 14,
    fontWeight: 600,
    color: marketing.color.accent,
})

export const body = style({
    fontSize: 16,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 560,
    margin: "0 auto 30px",
})

export const channels = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: `${scaledSpace(22)} ${scaledSpace(48)}`,
})

/**
 * The channels trailer under the detail-form card. Without its own top
 * margin the phone/email/office columns sat flush against the card's
 * bottom border (`channels` alone carries no outer spacing — in
 * `contact-block` the body copy above provides it).
 */
export const channelsTrailer = style([
    channels,
    {
        marginTop: scaledSpace(34),
    },
])

export const channel = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
})

export const channelLabel = style({
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const channelValue = style({
    fontSize: 15.5,
    fontWeight: 600,
    color: marketing.color.text,
})

export const channelLink = style([
    channelValue,
    {
        color: marketing.color.accent,
        textDecoration: "none",
        selectors: {
            "&:hover": { textDecoration: "underline" },
        },
    },
])

// -------------------------------------------------------------- detail form

/** The multi-field card: a bordered surface so the form reads as a place. */
export const detailForm = style({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
    width: "min(640px, 100%)",
    margin: "0 auto",
    padding: scaledSpace(26),
    textAlign: "left",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    "@media": {
        "screen and (max-width: 560px)": {
            gridTemplateColumns: "minmax(0, 1fr)",
        },
    },
})

export const detailField = style({
    display: "grid",
    gap: 6,
})

export const detailFieldFull = style({
    gridColumn: "1 / -1",
})

export const detailLabel = style({
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: "0.04em",
    color: marketing.color.text,
})

export const detailInput = style([
    input,
    {
        width: "100%",
        boxSizing: "border-box",
        padding: "11px 14px",
    },
])

export const detailTextarea = style([
    detailInput,
    {
        minHeight: 120,
        resize: "vertical",
        lineHeight: 1.5,
    },
])

export const detailSelect = style([
    detailInput,
    {
        // The native chrome would ignore the register's radius and border;
        // restyling as an input keeps selects in the same voice, with a
        // hand-drawn chevron so the affordance survives appearance: none.
        appearance: "none",
        backgroundImage:
            "linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)",
        backgroundPosition: "calc(100% - 19px) 50%, calc(100% - 14px) 50%",
        backgroundSize: "5px 5px, 5px 5px",
        backgroundRepeat: "no-repeat",
        paddingRight: 36,
        cursor: "pointer",
    },
])

export const detailSubmitRow = style({
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-start",
    marginTop: 4,
})
