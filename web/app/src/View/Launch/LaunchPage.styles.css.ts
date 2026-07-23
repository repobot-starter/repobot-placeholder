import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/** Deep-navy SaaS palette with a sun-gold accent (it's a calendar product). */
const bg = "#0c1022"
const surface = "#141a33"
const line = "#252d4f"
const text = "#eef0fb"
const subtle = "#9aa3c7"
const gold = packBrand?.accent ?? "#f5b83d"
const goldDark = "#141a33"

const sans = packFont ?? '"Sora", -apple-system, "Segoe UI", Roboto, sans-serif'

const rise = keyframes({
    from: { opacity: 0, transform: "translateY(16px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

export const page = style({
    minHeight: "100vh",
    background: bg,
    backgroundImage:
        "radial-gradient(circle at 80% -10%, rgba(245, 184, 61, 0.14), transparent 50%), " +
        "radial-gradient(circle at 10% 30%, rgba(96, 116, 255, 0.10), transparent 45%)",
    color: text,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const frame = style({
    width: "min(1080px, 100%)",
    margin: "0 auto",
    padding: "0 24px 56px",
})

export const nav = style({
    display: "flex",
    alignItems: "center",
    gap: 20,
    padding: "20px 0",
})

export const logo = style({
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: "-0.01em",
})

export const navLinks = style({
    display: "flex",
    gap: 18,
    marginLeft: "auto",
    fontSize: 14,
    color: subtle,
    "@media": {
        "(max-width: 640px)": { display: "none" },
    },
})

export const navLink = style({
    color: "inherit",
    textDecoration: "none",
    selectors: { "&:hover": { color: text } },
})

export const navCta = style({
    fontSize: 14,
    fontWeight: 700,
    color: goldDark,
    background: gold,
    borderRadius: 10,
    padding: "9px 16px",
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
})

export const hero = style({
    textAlign: "center",
    padding: "72px 0 40px",
    animation: `${rise} 480ms ease both`,
})

export const headline = style({
    fontSize: "clamp(36px, 6vw, 62px)",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
    margin: "0 auto",
    maxWidth: 760,
})

export const headlineAccent = style({
    color: gold,
})

export const subheadline = style({
    fontSize: 18,
    lineHeight: 1.6,
    color: subtle,
    maxWidth: 620,
    margin: "22px auto 0",
})

export const waitlistForm = style({
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 32,
})

export const waitlistInput = style({
    width: "min(320px, 100%)",
    fontSize: 15,
    fontFamily: "inherit",
    color: text,
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: 12,
    padding: "13px 16px",
    outline: "none",
    selectors: {
        "&:focus": { borderColor: gold },
        "&::placeholder": { color: subtle },
    },
})

export const waitlistButton = style({
    fontSize: 15,
    fontWeight: 700,
    fontFamily: "inherit",
    color: goldDark,
    background: gold,
    border: "none",
    borderRadius: 12,
    padding: "13px 24px",
    cursor: "pointer",
    transition: "transform 140ms ease",
    selectors: {
        "&:hover": { transform: "translateY(-1px)" },
    },
})

export const waitlistConfirm = style({
    marginTop: 14,
    fontSize: 14,
    fontWeight: 600,
    color: "#8fe3a5",
})

export const trustStrip = style({
    display: "flex",
    flexWrap: "wrap",
    gap: "14px 34px",
    justifyContent: "center",
    padding: "34px 0 10px",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#59628c",
})

export const section = style({
    padding: "64px 0 0",
})

export const sectionKicker = style({
    display: "block",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: gold,
    marginBottom: 8,
})

export const sectionTitle = style({
    textAlign: "center",
    fontSize: "clamp(26px, 4vw, 36px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: "0 0 36px",
})

export const featureGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 18,
})

export const featureCard = style({
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: 16,
    padding: "22px 22px 24px",
})

export const featureEmoji = style({
    fontSize: 30,
    display: "block",
    marginBottom: 12,
})

export const featureTitle = style({
    fontSize: 17,
    fontWeight: 700,
    margin: "0 0 8px",
})

export const featureDescription = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: subtle,
    margin: 0,
})

export const stepsRow = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
    counterReset: "step",
})

export const stepCard = style({
    position: "relative",
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: 16,
    padding: "26px 22px 24px",
})

export const stepNumber = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: "50%",
    fontWeight: 700,
    color: goldDark,
    background: gold,
    marginBottom: 14,
})

export const billingToggle = style({
    display: "flex",
    justifyContent: "center",
    gap: 6,
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: 999,
    padding: 4,
    width: "fit-content",
    margin: "0 auto 34px",
})

export const billingOption = style({
    fontSize: 14,
    fontWeight: 650,
    fontFamily: "inherit",
    color: subtle,
    background: "transparent",
    border: "none",
    borderRadius: 999,
    padding: "8px 18px",
    cursor: "pointer",
    selectors: {
        '&[aria-pressed="true"]': {
            color: goldDark,
            background: gold,
        },
    },
})

export const pricingGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18,
    alignItems: "stretch",
})

export const tierCard = style({
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: 18,
    padding: "26px 24px",
    selectors: {
        '&[data-highlighted="true"]': {
            borderColor: gold,
            boxShadow: "0 0 40px rgba(245, 184, 61, 0.15)",
        },
    },
})

export const tierBadge = style({
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: goldDark,
    background: gold,
    borderRadius: 999,
    padding: "4px 10px",
})

export const tierName = style({
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
})

export const tierPrice = style({
    fontSize: 38,
    fontWeight: 700,
    letterSpacing: "-0.02em",
})

export const tierPeriod = style({
    fontSize: 14,
    fontWeight: 500,
    color: subtle,
})

export const tierDescription = style({
    fontSize: 14,
    color: subtle,
    margin: 0,
})

export const tierFeatures = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: 0,
    margin: 0,
    fontSize: 14,
    color: text,
})

export const tierFeatureItem = style({
    display: "flex",
    gap: 9,
    alignItems: "baseline",
    selectors: {
        "&::before": {
            content: '"✓"',
            color: gold,
            fontWeight: 700,
        },
    },
})

export const faqList = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxWidth: 720,
    margin: "0 auto",
})

export const faqItem = style({
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: 14,
    padding: "4px 20px",
})

export const faqQuestion = style({
    fontSize: 15.5,
    fontWeight: 650,
    padding: "16px 0",
    cursor: "pointer",
    listStyle: "none",
    selectors: {
        "&::-webkit-details-marker": { display: "none" },
        "&::after": {
            content: '"+"',
            float: "right",
            color: subtle,
            fontWeight: 400,
            fontSize: 20,
        },
    },
})

globalStyle(`${faqItem}[open] ${faqQuestion}::after`, {
    content: '"–"',
})

export const faqAnswer = style({
    fontSize: 14.5,
    lineHeight: 1.65,
    color: subtle,
    padding: "0 0 18px",
    margin: 0,
})

export const finalCta = style({
    textAlign: "center",
    background: surface,
    border: `1px solid ${line}`,
    borderRadius: 22,
    padding: "56px 24px",
    marginTop: 72,
})

export const footerBar = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: "36px 0 0",
    fontSize: 13,
    color: subtle,
})

export const footerLink = style({
    color: subtle,
    textDecoration: "none",
    selectors: { "&:hover": { color: text } },
})
