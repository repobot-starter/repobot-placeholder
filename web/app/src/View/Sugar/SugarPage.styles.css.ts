import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * Bakery-pink palette: blush paper, cocoa ink, raspberry accent with mint
 * for "fresh" and amber for "selling fast". Fraunces (preloaded in
 * index.html) for the wordmark and section titles.
 */
const paper = "#fdf3f6"
const ink = "#46242f"
const inkSoft = "#93707c"
const line = "#f3dbe4"
const raspberry = packBrand?.accent ?? "#d2447e"
const raspberrySoft = packBrand?.accentSoft ?? "#fbe3ed"
const pinkDeep = "#f6bdd4"
const mint = "#2f6b52"
const mintSoft = "#e2f0e8"
const amber = "#b07a24"
const amberSoft = "#f8ecd8"
const neutral = "#8d8189"
const neutralSoft = "#f0eaed"

const serif = '"Fraunces", Georgia, serif'
const sans = packFont ?? '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif'

const rise = keyframes({
    from: { opacity: 0, transform: "translateY(14px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

const bob = keyframes({
    "0%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-6px)" },
    "100%": { transform: "translateY(0)" },
})

export const page = style({
    minHeight: "100vh",
    background: paper,
    color: ink,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const frame = style({
    width: "min(760px, 100%)",
    margin: "0 auto",
    padding: "0 24px 72px",
})

/* ---- hero ---- */

export const hero = style({
    textAlign: "center",
    padding: "56px 0 8px",
    animation: `${rise} 0.5s ease both`,
})

export const wordmark = style({
    fontFamily: serif,
    fontSize: "clamp(38px, 7vw, 54px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
    color: raspberry,
})

export const tagline = style({
    marginTop: 10,
    fontSize: 17,
    color: ink,
    fontWeight: 550,
})

export const story = style({
    margin: "14px auto 0",
    maxWidth: 560,
    fontSize: 14.5,
    lineHeight: 1.65,
    color: inkSoft,
})

/* ---- the machine illustration ---- */

export const machineScene = style({
    display: "flex",
    justifyContent: "center",
    marginTop: 30,
    animation: `${bob} 5s ease-in-out infinite`,
})

export const machineBody = style({
    width: 230,
    borderRadius: 26,
    background: pinkDeep,
    border: `3px solid ${raspberry}`,
    padding: "18px 18px 14px",
    boxShadow: `0 18px 40px -18px ${raspberry}66`,
})

export const machineHeader = style({
    fontFamily: serif,
    fontSize: 15,
    fontWeight: 700,
    color: ink,
    textAlign: "center",
    marginBottom: 12,
})

export const machineWindow = style({
    background: "#fff8fb",
    borderRadius: 14,
    border: `2px solid ${raspberry}`,
    padding: "10px 8px",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    rowGap: 10,
})

export const machineShelfItem = style({
    fontSize: 26,
    textAlign: "center",
})

export const machineSlot = style({
    marginTop: 12,
    height: 26,
    borderRadius: 9,
    background: ink,
    display: "grid",
    placeItems: "center",
    color: pinkDeep,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
})

/* ---- how it works ---- */

export const sectionTitle = style({
    fontFamily: serif,
    fontSize: 26,
    fontWeight: 700,
    textAlign: "center",
    margin: "56px 0 6px",
})

export const sectionKicker = style({
    textAlign: "center",
    fontSize: 13.5,
    color: inkSoft,
    margin: 0,
})

export const stepRow = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14,
    marginTop: 24,
})

export const stepCard = style({
    background: "#fff",
    border: `1px solid ${line}`,
    borderRadius: 16,
    padding: "20px 18px",
    textAlign: "center",
    animation: `${rise} 0.5s ease both`,
})

export const stepEmoji = style({
    fontSize: 30,
})

export const stepTitle = style({
    fontFamily: serif,
    fontSize: 17,
    fontWeight: 700,
    margin: "10px 0 6px",
})

export const stepText = style({
    fontSize: 13.5,
    lineHeight: 1.55,
    color: inkSoft,
    margin: 0,
})

/* ---- today's case ---- */

export const caseTitleBadge = style({
    display: "block",
    width: "fit-content",
    margin: "22px auto 0",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: raspberry,
    background: raspberrySoft,
    borderRadius: 999,
    padding: "5px 14px",
})

export const pastryList = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 18,
})

export const pastryCard = style({
    display: "flex",
    alignItems: "center",
    gap: 15,
    background: "#fff",
    border: `1px solid ${line}`,
    borderRadius: 16,
    padding: "15px 18px",
    animation: `${rise} 0.5s ease both`,
})

export const pastryEmoji = style({
    fontSize: 28,
    width: 50,
    height: 50,
    display: "grid",
    placeItems: "center",
    background: raspberrySoft,
    borderRadius: 13,
    flexShrink: 0,
})

export const pastryText = style({
    flex: 1,
    minWidth: 0,
})

export const pastryName = style({
    fontFamily: serif,
    fontSize: 17,
    fontWeight: 650,
    margin: 0,
})

export const pastryDescription = style({
    margin: "3px 0 0",
    fontSize: 13,
    color: inkSoft,
})

export const pastryPrice = style({
    fontFamily: serif,
    fontSize: 17,
    fontWeight: 700,
    color: raspberry,
    whiteSpace: "nowrap",
})

/* ---- machines ---- */

export const machineList = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 24,
})

export const machineCard = style({
    background: "#fff",
    border: `1px solid ${line}`,
    borderRadius: 16,
    padding: "17px 18px",
    animation: `${rise} 0.5s ease both`,
})

export const machineTop = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
})

export const machineName = style({
    fontFamily: serif,
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
})

export const machineSpot = style({
    margin: "3px 0 0",
    fontSize: 13.5,
    color: inkSoft,
})

export const machineNote = style({
    margin: "7px 0 0",
    fontSize: 12.5,
    color: inkSoft,
    fontStyle: "italic",
})

const statusBadge = style({
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: 700,
    borderRadius: 999,
    padding: "5px 12px",
    whiteSpace: "nowrap",
    flexShrink: 0,
})

export const statusFresh = style([statusBadge, { color: mint, background: mintSoft }])
export const statusSellingFast = style([statusBadge, { color: amber, background: amberSoft }])
export const statusUpcoming = style([statusBadge, { color: raspberry, background: raspberrySoft }])
export const statusSoldOut = style([statusBadge, { color: neutral, background: neutralSoft }])
export const statusClosed = style([statusBadge, { color: neutral, background: neutralSoft }])

/* ---- host CTA + footer ---- */

export const hostBlock = style({
    marginTop: 56,
    background: raspberry,
    borderRadius: 20,
    padding: "30px 26px",
    textAlign: "center",
    color: "#fff",
    animation: `${rise} 0.5s ease both`,
})

export const hostTitle = style({
    fontFamily: serif,
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
})

export const hostButton = style({
    display: "inline-block",
    marginTop: 16,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: sans,
    color: raspberry,
    background: "#fff",
    borderRadius: 999,
    padding: "12px 26px",
    textDecoration: "none",
    transition: "transform 100ms ease",
    selectors: {
        "&:hover": { transform: "translateY(-1px)" },
    },
})

export const donationNote = style({
    marginTop: 18,
    textAlign: "center",
    fontSize: 13,
    color: inkSoft,
})

export const footer = style({
    marginTop: 40,
    paddingTop: 22,
    borderTop: `1px solid ${line}`,
    textAlign: "center",
    fontSize: 13,
    color: inkSoft,
})

export const footerLink = style({
    color: raspberry,
    fontWeight: 650,
    textDecoration: "none",
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})
