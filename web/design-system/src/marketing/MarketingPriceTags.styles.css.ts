import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    ctaPrimary,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    spot1,
    spot2,
} from "./shared.css"

export const wrap = style([section])

export const head = sectionHeaderCentered

export const kicker = sectionKicker

export const title = style([sectionTitle, { marginBottom: scaledSpace(12) }])

export const intro = style({
    fontSize: 17,
    lineHeight: 1.55,
    color: marketing.color.subtle,
    maxWidth: 620,
    margin: `0 auto ${scaledSpace(34)}`,
})

export const tags = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: scaledSpace(22),
})

const DARK = '[data-marketing-mode="dark"] &'

/**
 * One swing tag. The tone rotates through the register's inks faded
 * toward the ground (less on the light sheet, where the tags should read
 * saturated; more on the dark one, where type must hold on them), and
 * each tag hangs at its own small angle.
 */
export const tag = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minHeight: 150,
    justifyContent: "center",
    padding: `${scaledSpace(24)} ${scaledSpace(26)} ${scaledSpace(24)} 70px`,
    color: marketing.color.text,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    background: `color-mix(in srgb, ${spot1} 78%, ${marketing.color.pageBg})`,
    transform: "rotate(-1.2deg)",
    selectors: {
        '&[data-tone="1"]': {
            background: `color-mix(in srgb, ${marketing.color.accent} 46%, ${marketing.color.pageBg})`,
            transform: "rotate(0.8deg)",
        },
        '&[data-tone="2"]': {
            background: `color-mix(in srgb, ${spot2} 48%, ${marketing.color.pageBg})`,
            transform: "rotate(-0.5deg)",
        },
        [DARK]: { background: `color-mix(in srgb, ${spot1} 34%, ${marketing.color.surface})` },
        [`${DARK}[data-tone="1"]`]: {
            background: `color-mix(in srgb, ${marketing.color.accent} 30%, ${marketing.color.surface})`,
        },
        [`${DARK}[data-tone="2"]`]: {
            background: `color-mix(in srgb, ${spot2} 28%, ${marketing.color.surface})`,
        },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transform: "none" },
    },
})

/** The punched eyelet: a ring of the ground through the tag's left end. */
export const eyelet = style({
    position: "absolute",
    left: 26,
    top: "50%",
    width: 22,
    height: 22,
    marginTop: -11,
    borderRadius: "50%",
    background: marketing.color.pageBg,
    boxShadow: `inset 0 0 0 4px color-mix(in srgb, ${marketing.color.text} 18%, transparent)`,
})

export const name = style({
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
})

export const price = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: `calc(clamp(40px, 4.4vw, 56px) * ${marketing.display.scale})`,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1,
})

export const qualifier = style({
    fontFamily: marketing.font.body,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: 0,
})

export const note = style({
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.35,
    color: `color-mix(in srgb, ${marketing.color.text} 78%, transparent)`,
})

export const foot = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: `${scaledSpace(12)} ${scaledSpace(24)}`,
    marginTop: scaledSpace(34),
    textAlign: "center",
})

export const footnote = style({
    fontSize: 15,
    fontWeight: 600,
    color: marketing.color.subtle,
    margin: 0,
})

export const cta = ctaPrimary

/*
 * Under `sunburst` the tags hang first, straight under the hero — the
 * register's hook — with the heading and the ask captioned beneath them.
 */
const SUNBURST_ROOT = '[data-marketing-treatment~="sunburst"]'

globalStyle(`${SUNBURST_ROOT} ${wrap}`, {
    display: "flex",
    flexDirection: "column",
    paddingTop: scaledSpace(10),
})

globalStyle(`${SUNBURST_ROOT} ${tags}`, { order: -1 })

globalStyle(`${SUNBURST_ROOT} ${wrap} > ${head}`, { marginTop: scaledSpace(56) })

globalStyle(`${SUNBURST_ROOT} ${tag}`, {
    minHeight: 112,
    paddingTop: scaledSpace(14),
    paddingBottom: scaledSpace(14),
})

globalStyle(`${SUNBURST_ROOT} ${price}`, {
    fontSize: `calc(clamp(34px, 3.6vw, 46px) * ${marketing.display.scale})`,
})

globalStyle(`${SUNBURST_ROOT} ${note}`, { fontSize: 14 })
