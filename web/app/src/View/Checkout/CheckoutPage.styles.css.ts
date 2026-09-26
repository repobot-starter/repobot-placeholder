import { vars } from "@base/design-system/tokens"
import { globalStyle, style } from "@vanilla-extract/css"

/**
 * The checkout pack's design language: ink on paper, after hours. A near-black
 * dining room, white "printed card" surfaces for the menu and the reservation,
 * a generous serif for the class name, and exactly one action color — near-black
 * ink by default, deliberately achromatic. The room's neutrals ride the theme
 * contract (the pack's catalog seeds the supper club's night values, mode:
 * dark), so the dining room and the AppShell chrome around it re-ink together;
 * washes and hairlines are mixed from the theme's ink so they survive any
 * palette roll. The accent and body font route through the repobot.theme.json
 * brand overlay (packs/README.md), so a project's brand wins automatically.
 * The printed cards stay paper-white by art direction — they are the menu and
 * the reservation laid ON the room, not part of it.
 */
const room = vars.color.background
const chalk = vars.color.textPrimary
const chalkMuted = vars.color.textSecondary

/** A wash of the theme's ink that survives any palette roll. */
const inkMix = (percent: number): string => `color-mix(in srgb, ${chalk} ${percent}%, transparent)`

/** The hairline silver of the room's etched details. */
const silver = inkMix(84)

// The printed cards: paper is paper in any room — art-directed, like the
// document being the only color in the interpret pack's reading room.
const paper = "#fafafa" // theme-exempt: the printed card is white by art direction
const paperEdge = "#e2e2e2" // theme-exempt: the printed card's hairline frame
const paperInk = "#141414" // theme-exempt: ink printed on the white card
const paperMuted = "#6f6f6f" // theme-exempt: the card's secondary ink

const accent = "var(--pack-accent, #141414)"
const accentHover = "var(--pack-accent-hover, #2b2b2b)"
const accentText = "var(--pack-accent-text, #fafafa)"

const sans = 'var(--pack-font, "Inter", system-ui, sans-serif)'
const serif = '"Source Serif 4", Georgia, "Times New Roman", serif'

export const page = style({
    minHeight: "100%",
    background:
        `radial-gradient(58rem 34rem at 50% -8rem, ${inkMix(7)}, transparent 70%), ` +
        `radial-gradient(40rem 26rem at 88% 108%, ${inkMix(4)}, transparent 70%), ` +
        room,
    color: chalk,
    fontFamily: sans,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

const container = style({
    width: "min(70rem, 100% - 3rem)",
    marginInline: "auto",
})

//
// Hero: the story column and the reservation card
//

export const hero = style([
    container,
    {
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 24.5rem",
        gap: "4rem",
        alignItems: "start",
        paddingBlock: "2.5rem 4rem",
        "@media": {
            "screen and (max-width: 60rem)": {
                gridTemplateColumns: "minmax(0, 1fr)",
                gap: "2.5rem",
                paddingBlock: "1.5rem 3rem",
            },
        },
    },
])

export const story = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
})

export const eyebrow = style({
    margin: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.26em",
    textTransform: "uppercase",
    color: silver,
})

export const eyebrowRule = style({
    width: "2.2rem",
    height: "1px",
    background: `linear-gradient(90deg, transparent, ${silver})`,
    selectors: {
        "&:last-child": {
            background: `linear-gradient(90deg, ${silver}, transparent)`,
        },
    },
    "@media": {
        "screen and (max-width: 40rem)": {
            display: "none",
        },
    },
})

export const headline = style({
    margin: "1.1rem 0 0",
    fontFamily: serif,
    fontSize: "clamp(2.6rem, 5.4vw, 4.1rem)",
    fontWeight: 600,
    lineHeight: 1.04,
    letterSpacing: "-0.015em",
    color: chalk,
})

export const dateline = style({
    margin: "1.35rem 0 0",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.65rem",
    fontSize: "0.92rem",
    fontWeight: 500,
    letterSpacing: "0.04em",
    color: silver,
})

export const datelineDot = style({
    width: "0.28rem",
    height: "0.28rem",
    borderRadius: "999px",
    background: chalkMuted,
    opacity: 0.7,
})

export const lede = style({
    margin: "1.35rem 0 0",
    fontSize: "1.08rem",
    lineHeight: 1.7,
    color: chalkMuted,
    maxWidth: "33rem",
})

//
// Host
//

export const host = style({
    marginTop: "1.75rem",
    display: "flex",
    gap: "0.9rem",
    alignItems: "center",
    maxWidth: "33rem",
})

export const hostMedallion = style({
    flexShrink: 0,
    width: "2.9rem",
    height: "2.9rem",
    borderRadius: "999px",
    border: `1px solid ${silver}`,
    color: silver,
    fontFamily: serif,
    fontSize: "1rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    display: "grid",
    placeItems: "center",
    background: inkMix(6),
})

export const hostText = style({
    margin: 0,
    fontSize: "0.9rem",
    lineHeight: 1.55,
    color: chalkMuted,
})

export const hostName = style({
    display: "block",
    fontWeight: 600,
    color: chalk,
})

//
// The menu card — styled like a printed menu laid on the table, with a
// fork and spoon set beside it and a soft pool of light underneath
//

export const menuSetting = style({
    marginTop: "2.6rem",
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2.4rem",
    position: "relative",
    isolation: "isolate",
    "::before": {
        content: "",
        position: "absolute",
        inset: "-2rem -3rem",
        background: `radial-gradient(50% 60% at 50% 55%, ${inkMix(6)}, transparent 72%)`,
        zIndex: -1,
        pointerEvents: "none",
    },
})

export const utensil = style({
    width: "1.9rem",
    height: "9.5rem",
    color: inkMix(32),
    flexShrink: 0,
    "@media": {
        "screen and (max-width: 40rem)": {
            display: "none",
        },
    },
})

export const menuCard = style({
    width: "min(26.5rem, 100%)",
    background: `linear-gradient(175deg, ${paper}, #efefef)`, // theme-exempt: the printed card's paper sheen
    color: paperInk,
    borderRadius: "0.35rem",
    padding: "1.8rem 2rem 2rem",
    boxShadow: "0 24px 50px rgba(0, 0, 0, 0.55), 0 3px 10px rgba(0, 0, 0, 0.4)",
    position: "relative",
    // The doubled hairline frame of a printed menu card.
    "::before": {
        content: "",
        position: "absolute",
        inset: "0.55rem",
        border: `1px solid ${paperEdge}`,
        borderRadius: "0.2rem",
        pointerEvents: "none",
    },
})

export const menuTitle = style({
    margin: 0,
    textAlign: "center",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: paperMuted,
})

export const menuDivider = style({
    display: "block",
    width: "11rem",
    margin: "0.7rem auto 1.1rem",
    color: paperMuted,
})

export const menuList = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "1.15rem",
})

export const menuItem = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.2rem",
})

export const menuCourse = style({
    fontSize: "0.62rem",
    fontWeight: 700,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: accent,
})

export const menuDish = style({
    fontFamily: serif,
    fontSize: "1.3rem",
    fontWeight: 600,
    letterSpacing: "0.005em",
})

export const menuNote = style({
    fontSize: "0.82rem",
    lineHeight: 1.5,
    color: paperMuted,
})

//
// The reservation card — the checkout affordance
//

export const reserveCard = style({
    background: `linear-gradient(170deg, #ffffff, ${paper})`, // theme-exempt: the printed card's paper sheen
    color: paperInk,
    borderRadius: "0.6rem",
    padding: "1.9rem 1.9rem 1.7rem",
    boxShadow:
        "0 30px 60px rgba(0, 0, 0, 0.6), 0 4px 14px rgba(0, 0, 0, 0.45), " + `inset 0 0 0 1px ${paperEdge}`,
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    position: "sticky",
    top: "1.5rem",
})

export const reserveLabel = style({
    margin: 0,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: paperMuted,
})

export const price = style({
    display: "flex",
    alignItems: "baseline",
    gap: "0.55rem",
    marginTop: "-0.6rem",
})

export const priceAmount = style({
    fontFamily: serif,
    fontSize: "3rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
})

export const priceUnit = style({
    fontSize: "0.9rem",
    color: paperMuted,
})

export const seats = style({
    display: "flex",
    flexDirection: "column",
    gap: "0.45rem",
})

export const seatDots = style({
    display: "flex",
    gap: "0.32rem",
})

const seatDot = style({
    width: "0.62rem",
    height: "0.62rem",
    borderRadius: "999px",
})

export const seatTaken = style([
    seatDot,
    {
        background: paperEdge,
    },
])

export const seatOpen = style([
    seatDot,
    {
        background: accent,
        boxShadow: "0 0 0 2px rgba(20, 20, 20, 0.16)",
    },
])

export const seatsText = style({
    fontSize: "0.82rem",
    fontWeight: 600,
    color: accent,
})

export const includes = style({
    borderTop: `1px solid ${paperEdge}`,
    paddingTop: "1.1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
})

export const includesTitle = style({
    margin: 0,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: paperMuted,
})

export const includesList = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    fontSize: "0.9rem",
    lineHeight: 1.45,
})

export const includesItem = style({
    display: "flex",
    gap: "0.6rem",
    alignItems: "baseline",
})

export const includesMark = style({
    color: paperMuted,
    fontSize: "0.7rem",
})

export const buyButton = style({
    width: "100%",
    border: "none",
    borderRadius: "0.55rem",
    background: `linear-gradient(180deg, ${accent}, ${accentHover})`,
    color: accentText,
    fontSize: "1.02rem",
    fontWeight: 650,
    fontFamily: "inherit",
    letterSpacing: "0.01em",
    padding: "1rem 1.1rem",
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
    transition: "transform 120ms ease, filter 120ms ease",
    ":hover": {
        filter: "brightness(1.07)",
        transform: "translateY(-1px)",
    },
    ":disabled": {
        opacity: 0.55,
        cursor: "default",
        transform: "none",
    },
})

export const buyError = style({
    margin: "-0.6rem 0 0",
    color: "#a13232", // theme-exempt: error ink printed on the white card
    fontSize: "0.85rem",
})

export const trustLine = style({
    margin: "-0.35rem 0 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    fontSize: "0.75rem",
    color: paperMuted,
    textAlign: "center",
})

export const trustGlyph = style({
    width: "0.65rem",
    height: "0.78rem",
    flexShrink: 0,
})

//
// Footer
//

export const footer = style([
    container,
    {
        paddingBlock: "1.6rem",
        borderTop: `1px solid ${inkMix(12)}`,
        color: chalkMuted,
        fontSize: "0.8rem",
        display: "flex",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
    },
])
