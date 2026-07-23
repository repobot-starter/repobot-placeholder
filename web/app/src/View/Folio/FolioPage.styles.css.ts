import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * Editorial paper-and-ink palette; Fraunces (preloaded in index.html) for
 * display type. Accent and body font route through the repobot.theme.json
 * brand overlay (packs/README.md); the pack palette holds until branded.
 */
const paper = "#faf6ef"
const ink = "#221d15"
const inkSoft = "#6f6759"
const line = "#e2daca"
const accent = packBrand?.accent ?? "#d4552b"

const serif = '"Fraunces", Georgia, serif'
const sans = packFont ?? '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif'

const rise = keyframes({
    from: { opacity: 0, transform: "translateY(16px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

const pulse = keyframes({
    "0%": { opacity: 1 },
    "50%": { opacity: 0.35 },
    "100%": { opacity: 1 },
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
    width: "min(1040px, 100%)",
    margin: "0 auto",
    padding: "0 24px 64px",
})

export const nav = style({
    display: "flex",
    alignItems: "center",
    gap: 18,
    padding: "22px 0",
    borderBottom: `1px solid ${line}`,
})

export const monogram = style({
    fontFamily: serif,
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: "-0.02em",
})

export const navLinks = style({
    display: "flex",
    gap: 16,
    marginLeft: "auto",
    fontSize: 14,
    color: inkSoft,
})

export const navLink = style({
    color: "inherit",
    textDecoration: "none",
    selectors: {
        "&:hover": { color: ink },
    },
})

export const contactButton = style({
    fontSize: 14,
    fontWeight: 650,
    color: paper,
    background: ink,
    borderRadius: 999,
    padding: "9px 18px",
    textDecoration: "none",
    transition: "background 150ms ease",
    selectors: {
        "&:hover": { background: accent },
    },
})

export const hero = style({
    padding: "84px 0 64px",
    animation: `${rise} 480ms ease both`,
})

export const availability = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 650,
    color: "#2f7a45",
    background: "#e5f2e3",
    borderRadius: 999,
    padding: "6px 14px",
    marginBottom: 22,
})

export const availabilityDot = style({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#2f7a45",
    animation: `${pulse} 2s ease infinite`,
})

export const statement = style({
    fontFamily: serif,
    fontSize: "clamp(34px, 6vw, 58px)",
    lineHeight: 1.08,
    letterSpacing: "-0.02em",
    fontWeight: 600,
    margin: 0,
    maxWidth: 780,
})

export const statementAccent = style({
    color: accent,
    fontStyle: "italic",
})

export const heroMeta = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 26,
    fontSize: 15,
    color: inkSoft,
})

export const sectionTitle = style({
    fontFamily: serif,
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    margin: "0 0 6px",
})

export const sectionKicker = style({
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: accent,
})

export const workSection = style({
    padding: "24px 0 8px",
    borderTop: `1px solid ${line}`,
    animation: `${rise} 480ms ease 120ms both`,
})

export const filterRow = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    margin: "18px 0 26px",
})

export const filterChip = style({
    fontSize: 13,
    fontWeight: 600,
    color: inkSoft,
    background: "transparent",
    border: `1px solid ${line}`,
    borderRadius: 999,
    padding: "7px 16px",
    cursor: "pointer",
    transition: "all 150ms ease",
    selectors: {
        "&:hover": { borderColor: ink, color: ink },
        '&[aria-pressed="true"]': {
            background: ink,
            borderColor: ink,
            color: paper,
        },
    },
})

export const projectGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 22,
})

export const projectCard = style({
    display: "flex",
    flexDirection: "column",
    borderRadius: 18,
    border: `1px solid ${line}`,
    background: "#fffdf8",
    overflow: "hidden",
    color: "inherit",
    textDecoration: "none",
    transition: "transform 160ms ease, box-shadow 160ms ease",
    selectors: {
        "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 14px 34px rgba(34, 29, 21, 0.12)",
        },
    },
})

export const projectArt = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 56,
    height: 150,
})

export const projectBody = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "18px 20px 20px",
})

export const projectTitleRow = style({
    display: "flex",
    alignItems: "baseline",
    gap: 10,
})

export const projectTitle = style({
    fontFamily: serif,
    fontSize: 21,
    fontWeight: 600,
    margin: 0,
})

export const projectYear = style({
    marginLeft: "auto",
    fontSize: 13,
    color: inkSoft,
})

export const projectDescription = style({
    fontSize: 14.5,
    lineHeight: 1.55,
    color: inkSoft,
    margin: 0,
})

export const projectTags = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
})

export const projectTag = style({
    fontSize: 12,
    fontWeight: 650,
    color: inkSoft,
    background: paper,
    border: `1px solid ${line}`,
    borderRadius: 999,
    padding: "3px 10px",
})

export const aboutSection = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 40,
    padding: "56px 0",
    marginTop: 48,
    borderTop: `1px solid ${line}`,
    "@media": {
        "(max-width: 720px)": {
            gridTemplateColumns: "1fr",
        },
    },
})

export const aboutParagraph = style({
    fontSize: 16,
    lineHeight: 1.7,
    color: inkSoft,
    margin: "0 0 16px",
})

export const skillsCloud = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignContent: "flex-start",
})

export const skillChip = style({
    fontSize: 14,
    fontWeight: 600,
    color: ink,
    background: "#fffdf8",
    border: `1px solid ${line}`,
    borderRadius: 999,
    padding: "8px 16px",
})

export const contactSection = style({
    padding: "72px 0 24px",
    borderTop: `1px solid ${line}`,
    textAlign: "center",
})

export const contactHeadline = style({
    fontFamily: serif,
    fontSize: "clamp(30px, 5vw, 46px)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    margin: "0 0 20px",
})

export const contactEmail = style({
    display: "inline-block",
    fontSize: 17,
    fontWeight: 650,
    color: paper,
    background: ink,
    borderRadius: 999,
    padding: "14px 30px",
    textDecoration: "none",
    transition: "background 150ms ease",
    selectors: {
        "&:hover": { background: accent },
    },
})

export const footerRow = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 40,
    fontSize: 13,
    color: inkSoft,
})

export const footerLink = style({
    color: inkSoft,
    textDecoration: "none",
    selectors: {
        "&:hover": { color: ink },
    },
})
