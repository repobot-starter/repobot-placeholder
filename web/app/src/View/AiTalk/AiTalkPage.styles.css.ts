import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { mixHex, packBrand, packFont } from "@base/design-system/theme"

/**
 * The talk pack's web landing: near-black with a warm amber voice orb —
 * deliberately distinct from the chat pack's violet. The accent and font
 * route through the brand overlay so a custom repobot.theme.json re-brands
 * the orb too.
 */
const night = "#0b0c10"
const textPrimary = "#f2f0ea"
const textSecondary = "rgba(242, 240, 234, 0.6)"
const textFaint = "rgba(242, 240, 234, 0.38)"
const amber = packBrand?.accentDark ?? "#f2a33c"
const amberDeep = packBrand ? mixHex(packBrand.accentDark, "#000000", 0.22) : "#c97b16"
const panelEdge = "rgba(242, 240, 234, 0.12)"

const sans = packFont ?? "Sora, system-ui, sans-serif"
const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

export const page = style({
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: night,
    color: textPrimary,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

const column = style({
    width: "min(44rem, 100% - 2.5rem)",
    marginInline: "auto",
})

export const header = style([
    column,
    {
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        paddingBlock: "1.2rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
    },
])

export const headerDot = style({
    width: "0.6rem",
    height: "0.6rem",
    borderRadius: "50%",
    background: amber,
    boxShadow: `0 0 12px ${amber}`,
})

export const hero = style([
    column,
    {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "1.1rem",
        paddingBlock: "3rem 2.5rem",
    },
])

const breathe = keyframes({
    "0%": { transform: "scale(1)", boxShadow: `0 0 60px rgba(242, 163, 60, 0.25)` },
    "50%": { transform: "scale(1.05)", boxShadow: `0 0 90px rgba(242, 163, 60, 0.45)` },
    "100%": { transform: "scale(1)", boxShadow: `0 0 60px rgba(242, 163, 60, 0.25)` },
})

export const orb = style({
    width: "9rem",
    height: "9rem",
    borderRadius: "50%",
    background: `radial-gradient(circle at 32% 28%, ${amber}, ${amberDeep} 68%)`,
    animation: `${breathe} 3.4s ease-in-out infinite`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.6rem",
})

export const title = style({
    fontSize: "clamp(2rem, 5vw, 2.8rem)",
    fontWeight: 600,
    lineHeight: 1.15,
    margin: 0,
})

export const lede = style({
    color: textSecondary,
    fontSize: "1rem",
    lineHeight: 1.7,
    maxWidth: "32rem",
    margin: 0,
})

export const iosBadge = style({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    border: `1px solid ${panelEdge}`,
    borderRadius: "999px",
    padding: "0.55rem 1.1rem",
    fontSize: "0.85rem",
    color: textSecondary,
})

export const steps = style([
    column,
    {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
        paddingBlock: "1rem 3rem",
        "@media": {
            "screen and (max-width: 640px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const step = style({
    border: `1px solid ${panelEdge}`,
    borderRadius: "1rem",
    padding: "1.2rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
})

export const stepNumber = style({
    fontFamily: mono,
    fontSize: "0.75rem",
    color: amber,
    letterSpacing: "0.1em",
})

export const stepTitle = style({
    fontSize: "0.98rem",
    fontWeight: 600,
    margin: 0,
})

export const stepBody = style({
    color: textSecondary,
    fontSize: "0.86rem",
    lineHeight: 1.6,
    margin: 0,
})

export const footer = style([
    column,
    {
        marginTop: "auto",
        paddingBlock: "1.5rem",
        textAlign: "center",
        color: textFaint,
        fontSize: "0.78rem",
        lineHeight: 1.6,
    },
])
