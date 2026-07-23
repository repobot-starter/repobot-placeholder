import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * The storefront's design language: warm paper, deep ink, an editorial serif
 * (Fraunces, loaded in index.html) for display type and Sora for UI copy.
 * Swap the constants below to retheme the whole site; the accent and body
 * font route through the repobot.theme.json brand overlay (packs/README.md),
 * so a project's brand wins over the pack palette automatically.
 */
const paper = "#f7f2e9"
const ink = "#231c14"
const accent = packBrand?.accent ?? "#1d4e56"
const gold = "#b98a3c"

const serif = '"Fraunces", Georgia, "Times New Roman", serif'
const sans = packFont ?? "Sora, system-ui, sans-serif"

export const page = style({
    minHeight: "100vh",
    background: paper,
    color: ink,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

const container = style({
    width: "min(68rem, 100% - 3rem)",
    marginInline: "auto",
})

//
// Top bar
//

export const topbar = style([
    container,
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        paddingBlock: "1.4rem",
    },
])

export const wordmark = style({
    fontFamily: serif,
    fontSize: "1.15rem",
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: ink,
    textDecoration: "none",
})

export const topbarNav = style({
    display: "flex",
    alignItems: "center",
    gap: "1.6rem",
    "@media": {
        "screen and (max-width: 640px)": { display: "none" },
    },
})

export const topbarLink = style({
    fontSize: "0.85rem",
    fontWeight: 500,
    letterSpacing: "0.02em",
    color: "rgba(35, 28, 20, 0.72)",
    textDecoration: "none",
    ":hover": { color: ink },
})

//
// Hero
//

export const hero = style([
    container,
    {
        display: "grid",
        gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
        alignItems: "center",
        gap: "3.5rem",
        paddingBlock: "4rem 5rem",
        "@media": {
            "screen and (max-width: 860px)": {
                gridTemplateColumns: "1fr",
                paddingBlock: "2.5rem 3.5rem",
                gap: "2.75rem",
            },
        },
    },
])

export const eyebrow = style({
    margin: 0,
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: gold,
})

export const title = style({
    margin: "1rem 0 0",
    fontFamily: serif,
    fontSize: "clamp(2.6rem, 6vw, 4.2rem)",
    fontWeight: 500,
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
})

export const byline = style({
    margin: "0.9rem 0 0",
    fontFamily: serif,
    fontStyle: "italic",
    fontSize: "1.15rem",
    color: "rgba(35, 28, 20, 0.78)",
})

export const lede = style({
    margin: "1.4rem 0 0",
    maxWidth: "34rem",
    fontSize: "1.05rem",
    lineHeight: 1.65,
    color: "rgba(35, 28, 20, 0.82)",
})

export const buyRow = style({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1.1rem",
    marginTop: "2.1rem",
})

export const buyButton = style({
    appearance: "none",
    border: "none",
    cursor: "pointer",
    background: accent,
    color: paper,
    fontFamily: sans,
    fontSize: "0.98rem",
    fontWeight: 600,
    letterSpacing: "0.01em",
    padding: "0.95rem 1.9rem",
    borderRadius: "999px",
    transition: "transform 120ms ease, box-shadow 120ms ease",
    boxShadow: "0 10px 24px rgba(29, 78, 86, 0.28)",
    ":hover": { transform: "translateY(-1px)", boxShadow: "0 14px 30px rgba(29, 78, 86, 0.32)" },
    ":disabled": { opacity: 0.6, cursor: "wait", transform: "none" },
})

export const price = style({
    fontFamily: serif,
    fontSize: "1.5rem",
    fontWeight: 500,
})

export const editionNote = style({
    margin: "0.9rem 0 0",
    fontSize: "0.82rem",
    letterSpacing: "0.01em",
    color: "rgba(35, 28, 20, 0.6)",
})

export const buyError = style({
    margin: "0.9rem 0 0",
    fontSize: "0.88rem",
    color: "#8c2f22",
})

//
// The cover — pure CSS so the starter ships no binary art. Replace with a
// real cover image in public/ when the author has one.
//

export const coverWrap = style({
    display: "grid",
    justifyContent: "center",
    padding: "1rem 0",
})

export const cover = style({
    width: "min(19rem, 72vw)",
    aspectRatio: "2 / 3",
    borderRadius: "6px 14px 14px 6px",
    background: `linear-gradient(150deg, #26616b 0%, ${accent} 46%, #0e2f35 100%)`,
    color: "#f3ead9",
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    padding: "2.2rem 1.8rem 1.9rem",
    position: "relative",
    transform: "rotate(2.5deg)",
    boxShadow:
        "0 30px 60px rgba(35, 28, 20, 0.35), 0 10px 20px rgba(35, 28, 20, 0.2), inset 4px 0 10px rgba(0, 0, 0, 0.35)",
    "::before": {
        content: "",
        position: "absolute",
        insetBlock: 0,
        left: "0.65rem",
        width: "1px",
        background: "rgba(243, 234, 217, 0.35)",
    },
})

export const coverEyebrow = style({
    margin: 0,
    textAlign: "center",
    fontSize: "0.62rem",
    fontWeight: 600,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: "rgba(243, 234, 217, 0.75)",
})

export const coverTitle = style({
    margin: 0,
    alignSelf: "center",
    textAlign: "center",
    fontFamily: serif,
    fontSize: "1.9rem",
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: "0.01em",
})

export const coverRule = style({
    width: "3.2rem",
    height: "1px",
    margin: "1.1rem auto 0",
    background: gold,
})

export const coverAuthor = style({
    margin: 0,
    textAlign: "center",
    fontFamily: serif,
    fontStyle: "italic",
    fontSize: "0.95rem",
    color: "rgba(243, 234, 217, 0.9)",
})

//
// Excerpt
//

export const excerptSection = style({
    background: ink,
    color: paper,
    paddingBlock: "4.5rem",
})

export const excerpt = style([
    container,
    {
        maxWidth: "44rem",
        margin: "0 auto",
        fontFamily: serif,
        fontStyle: "italic",
        fontSize: "clamp(1.35rem, 3vw, 1.8rem)",
        lineHeight: 1.5,
        textAlign: "center",
    },
])

export const excerptAttribution = style({
    display: "block",
    marginTop: "1.6rem",
    fontFamily: sans,
    fontStyle: "normal",
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: gold,
    textAlign: "center",
})

//
// Reviews
//

export const section = style([
    container,
    {
        paddingBlock: "4.5rem",
    },
])

export const sectionHeading = style({
    margin: 0,
    fontFamily: serif,
    fontSize: "2rem",
    fontWeight: 500,
    letterSpacing: "-0.01em",
})

export const reviewGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "1.4rem",
    marginTop: "2.2rem",
    "@media": {
        "screen and (max-width: 860px)": { gridTemplateColumns: "1fr" },
    },
})

export const reviewCard = style({
    background: "#fffdf8",
    border: "1px solid rgba(35, 28, 20, 0.1)",
    borderRadius: "12px",
    padding: "1.8rem 1.6rem",
    display: "grid",
    gap: "1.1rem",
    alignContent: "start",
    boxShadow: "0 6px 18px rgba(35, 28, 20, 0.06)",
})

export const reviewQuote = style({
    margin: 0,
    fontFamily: serif,
    fontSize: "1.08rem",
    lineHeight: 1.55,
})

export const reviewSource = style({
    margin: 0,
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(35, 28, 20, 0.55)",
})

//
// About the author
//

export const aboutSection = style([
    container,
    {
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr)",
        gap: "2.6rem",
        alignItems: "start",
        paddingBlock: "1rem 4.5rem",
        "@media": {
            "screen and (max-width: 640px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const portrait = style({
    width: "7.5rem",
    height: "7.5rem",
    borderRadius: "50%",
    display: "grid",
    placeContent: "center",
    background: `radial-gradient(circle at 30% 25%, #2c6c77, ${accent} 70%)`,
    color: "#f3ead9",
    fontFamily: serif,
    fontSize: "2.2rem",
    fontWeight: 500,
    letterSpacing: "0.05em",
    boxShadow: "0 10px 24px rgba(35, 28, 20, 0.18)",
})

export const aboutBody = style({
    display: "grid",
    gap: "1rem",
    maxWidth: "38rem",
})

export const aboutParagraph = style({
    margin: 0,
    fontSize: "0.98rem",
    lineHeight: 1.7,
    color: "rgba(35, 28, 20, 0.82)",
})

//
// Closing buy band + footer
//

export const buyBand = style({
    background: accent,
    color: paper,
    paddingBlock: "3.6rem",
})

export const buyBandInner = style([
    container,
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.6rem",
    },
])

export const buyBandHeading = style({
    margin: 0,
    fontFamily: serif,
    fontSize: "1.7rem",
    fontWeight: 500,
})

export const buyBandButton = style([
    buyButton,
    {
        background: paper,
        color: ink,
        boxShadow: "0 10px 24px rgba(14, 47, 53, 0.4)",
    },
])

export const footer = style([
    container,
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.8rem",
        paddingBlock: "2rem",
        fontSize: "0.8rem",
        color: "rgba(35, 28, 20, 0.55)",
    },
])
