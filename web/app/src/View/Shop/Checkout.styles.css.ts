import { style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * Shared styles for the checkout journey pages (test, success, cancelled).
 * Accent/body font follow the repobot.theme.json brand overlay like
 * ShopPage.styles.css.ts, so the journey re-brands with the storefront.
 */

const paper = "#f7f2e9"
const ink = "#231c14"
const accent = packBrand?.accent ?? "#1d4e56"

const serif = '"Fraunces", Georgia, "Times New Roman", serif'
const sans = packFont ?? "Sora, system-ui, sans-serif"

export const page = style({
    minHeight: "100vh",
    display: "grid",
    placeContent: "center",
    padding: "2rem",
    background: paper,
    color: ink,
    fontFamily: sans,
    boxSizing: "border-box",
})

export const card = style({
    width: "min(26rem, 92vw)",
    background: "#fffdf8",
    border: "1px solid rgba(35, 28, 20, 0.1)",
    borderRadius: "16px",
    padding: "2.2rem",
    display: "grid",
    gap: "1.4rem",
    boxShadow: "0 24px 60px rgba(35, 28, 20, 0.14)",
})

export const testBanner = style({
    margin: 0,
    padding: "0.65rem 0.9rem",
    borderRadius: "8px",
    background: "#fdf3dc",
    border: "1px solid #e5c882",
    color: "#7a5a17",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textAlign: "center",
})

export const heading = style({
    margin: 0,
    fontFamily: serif,
    fontSize: "1.7rem",
    fontWeight: 500,
    letterSpacing: "-0.01em",
})

export const subtext = style({
    margin: 0,
    fontSize: "0.92rem",
    lineHeight: 1.6,
    color: "rgba(35, 28, 20, 0.7)",
})

export const summary = style({
    display: "grid",
    gap: "0.55rem",
    padding: "1.1rem 1.2rem",
    borderRadius: "10px",
    background: "rgba(29, 78, 86, 0.06)",
    border: "1px solid rgba(29, 78, 86, 0.14)",
})

export const summaryRow = style({
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    fontSize: "0.92rem",
})

export const summaryLabel = style({
    color: "rgba(35, 28, 20, 0.6)",
})

export const summaryValue = style({
    fontWeight: 600,
})

export const mockField = style({
    display: "grid",
    gap: "0.35rem",
})

export const mockFieldLabel = style({
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(35, 28, 20, 0.55)",
})

export const mockInput = style({
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: "0.95rem",
    padding: "0.7rem 0.85rem",
    borderRadius: "8px",
    border: "1px dashed rgba(35, 28, 20, 0.3)",
    background: "rgba(35, 28, 20, 0.03)",
    color: "rgba(35, 28, 20, 0.65)",
})

export const payButton = style({
    appearance: "none",
    border: "none",
    cursor: "pointer",
    background: accent,
    color: paper,
    fontFamily: sans,
    fontSize: "0.98rem",
    fontWeight: 600,
    padding: "0.9rem 1.4rem",
    borderRadius: "999px",
    transition: "transform 120ms ease",
    ":hover": { transform: "translateY(-1px)" },
    ":disabled": { opacity: 0.6, cursor: "wait", transform: "none" },
})

export const successMark = style({
    width: "3.4rem",
    height: "3.4rem",
    borderRadius: "50%",
    display: "grid",
    placeContent: "center",
    background: "rgba(29, 78, 86, 0.1)",
    color: accent,
    fontSize: "1.5rem",
})

export const orderRef = style({
    margin: 0,
    fontFamily: "IBM Plex Mono, monospace",
    fontSize: "0.78rem",
    color: "rgba(35, 28, 20, 0.55)",
    overflowWrap: "anywhere",
})

export const backLink = style({
    fontSize: "0.88rem",
    fontWeight: 600,
    color: accent,
    textDecoration: "none",
    ":hover": { textDecoration: "underline" },
})

export const errorText = style({
    margin: 0,
    fontSize: "0.88rem",
    color: "#8c2f22",
})
