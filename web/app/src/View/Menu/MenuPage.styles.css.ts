import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * Warm café palette: cream paper, espresso ink, copper accent. Fraunces
 * (preloaded in index.html) for the wordmark and section titles.
 */
const cream = "#faf5ec"
const espresso = "#2b211a"
const espressoSoft = "#7a6a5c"
const line = "#e6dccb"
const copper = packBrand?.accent ?? "#b4622d"
const copperSoft = packBrand?.accentSoft ?? "#f4e5d5"
const open = "#3e6b4f"
const closed = "#a04b3c"

const serif = '"Fraunces", Georgia, serif'
const sans = packFont ?? '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif'

const rise = keyframes({
    from: { opacity: 0, transform: "translateY(14px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

export const page = style({
    minHeight: "100vh",
    background: cream,
    color: espresso,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const frame = style({
    width: "min(860px, 100%)",
    margin: "0 auto",
    padding: "0 24px 72px",
})

export const hero = style({
    textAlign: "center",
    padding: "64px 0 32px",
    borderBottom: `1px solid ${line}`,
    animation: `${rise} 0.5s ease both`,
})

export const wordmark = style({
    fontFamily: serif,
    fontSize: "clamp(38px, 7vw, 56px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
})

export const taglineText = style({
    marginTop: 8,
    fontSize: 17,
    color: espressoSoft,
})

export const statusBadge = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    fontSize: 14,
    fontWeight: 650,
    borderRadius: 999,
    padding: "8px 18px",
    border: `1px solid ${line}`,
    background: "#fff",
})

export const statusDotOpen = style({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: open,
})

export const statusDotClosed = style({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: closed,
})

export const descriptionText = style({
    maxWidth: 560,
    margin: "22px auto 0",
    fontSize: 16,
    lineHeight: 1.65,
    color: espressoSoft,
})

/* ---- menu ---- */

export const sectionTabs = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    padding: "28px 0 8px",
})

export const sectionTab = style({
    fontSize: 14,
    fontWeight: 650,
    color: espressoSoft,
    background: "transparent",
    border: `1px solid ${line}`,
    borderRadius: 999,
    padding: "8px 18px",
    cursor: "pointer",
    fontFamily: sans,
    transition: "all 120ms ease",
    selectors: {
        "&:hover": { borderColor: copper, color: copper },
    },
})

export const sectionTabActive = style({
    background: copper,
    borderColor: copper,
    color: cream,
    selectors: {
        "&:hover": { color: cream },
    },
})

export const dietaryRow = style({
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: 8,
})

export const dietaryChip = style({
    fontSize: 12,
    fontWeight: 650,
    color: espressoSoft,
    background: "transparent",
    border: `1px dashed ${line}`,
    borderRadius: 999,
    padding: "4px 12px",
    cursor: "pointer",
    fontFamily: sans,
    selectors: {
        "&:hover": { borderColor: copper, color: copper },
    },
})

export const dietaryChipActive = style({
    background: copperSoft,
    borderColor: copper,
    borderStyle: "solid",
    color: copper,
    selectors: {
        "&:hover": { color: copper },
    },
})

export const sectionNote = style({
    textAlign: "center",
    fontSize: 13.5,
    fontStyle: "italic",
    color: espressoSoft,
    margin: "14px 0 4px",
})

export const itemList = style({
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
})

export const itemRow = style({
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    padding: "16px 0",
    borderBottom: `1px dashed ${line}`,
    animation: `${rise} 0.4s ease both`,
})

export const itemText = style({
    flex: 1,
    minWidth: 0,
})

export const itemName = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: serif,
    fontSize: 18,
    fontWeight: 650,
})

export const popularStar = style({
    fontSize: 12,
    fontWeight: 700,
    color: copper,
    background: copperSoft,
    borderRadius: 999,
    padding: "2px 9px",
})

export const dietaryMark = style({
    fontSize: 11,
    fontWeight: 700,
    color: open,
    border: `1px solid ${open}`,
    borderRadius: 4,
    padding: "0 5px",
})

export const itemDescription = style({
    marginTop: 4,
    fontSize: 14.5,
    lineHeight: 1.5,
    color: espressoSoft,
})

export const itemPrice = style({
    fontFamily: serif,
    fontSize: 17,
    fontWeight: 650,
    whiteSpace: "nowrap",
})

export const emptyNote = style({
    textAlign: "center",
    padding: "36px 0",
    fontSize: 15,
    color: espressoSoft,
    fontStyle: "italic",
})

/* ---- hours & contact ---- */

export const infoGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 28,
    marginTop: 48,
    paddingTop: 36,
    borderTop: `1px solid ${line}`,
})

export const infoTitle = style({
    fontFamily: serif,
    fontSize: 20,
    fontWeight: 650,
    marginBottom: 14,
})

export const hoursTable = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 14.5,
})

export const hoursRow = style({
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
})

export const hoursDay = style({
    color: espressoSoft,
})

export const hoursToday = style({
    fontWeight: 700,
    color: espresso,
})

export const hoursNoteText = style({
    marginTop: 12,
    fontSize: 13,
    fontStyle: "italic",
    color: espressoSoft,
})

export const contactList = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    fontSize: 14.5,
})

export const contactLink = style({
    color: copper,
    fontWeight: 650,
    textDecoration: "none",
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

export const footer = style({
    marginTop: 48,
    paddingTop: 24,
    borderTop: `1px solid ${line}`,
    textAlign: "center",
    fontSize: 13.5,
    color: espressoSoft,
})
