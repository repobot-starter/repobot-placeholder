import { style } from "@vanilla-extract/css"

export const page = style({
    minHeight: "100vh",
    display: "grid",
    placeContent: "center",
    justifyItems: "center",
    gap: "1.75rem",
    padding: "2rem",
    textAlign: "center",
    background: "#ffffff",
    color: "#111827",
    fontFamily: "Sora, system-ui, sans-serif",
    boxSizing: "border-box",
})

export const logo = style({
    width: "min(12.5rem, 42vw)",
    height: "auto",
    display: "block",
})

export const copy = style({
    display: "grid",
    gap: "0.85rem",
    justifyItems: "center",
})

export const lede = style({
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 400,
    letterSpacing: "-0.01em",
    color: "#6b7280",
    lineHeight: 1.45,
})
