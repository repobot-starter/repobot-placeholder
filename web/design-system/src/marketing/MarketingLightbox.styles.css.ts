import { keyframes, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

/**
 * The lightbox is deliberately preset-independent in one respect: the
 * viewing room is always near-black (the neutral-scrim precedent from
 * MarketingBackdrop's `overlayDark`) — photographs are judged against
 * darkness, not against the page palette. Type still follows the theme.
 */
export const overlay = style({
    position: "fixed",
    inset: 0,
    background: "rgba(8, 10, 14, 0.96)",
    zIndex: 50,
    animation: `${fadeIn} 200ms ease`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
})

export const content = style({
    position: "fixed",
    inset: 0,
    zIndex: 51,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "56px 16px 40px",
    outline: "none",
    animation: `${fadeIn} 200ms ease`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { animation: "none" },
    },
})

export const stage = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 0,
    width: "100%",
})

export const image = style({
    maxWidth: "min(1400px, 92vw)",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    display: "block",
})

const controlButton = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    padding: 0,
    background: "rgba(255, 255, 255, 0.06)",
    color: "rgba(255, 255, 255, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "background 140ms ease",
    selectors: {
        "&:hover": { background: "rgba(255, 255, 255, 0.14)" },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

export const close = style([
    controlButton,
    {
        position: "absolute",
        top: 16,
        right: 16,
    },
])

export const prev = style([
    controlButton,
    {
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
    },
])

export const next = style([
    controlButton,
    {
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
    },
])

export const meta = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    marginTop: 14,
    textAlign: "center",
})

export const caption = style({
    fontFamily: marketing.font.body,
    fontSize: 14,
    lineHeight: 1.5,
    color: "rgba(255, 255, 255, 0.88)",
    margin: 0,
})

export const counter = style({
    fontFamily: marketing.font.body,
    fontSize: 12,
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.55)",
})

/** Selection mode (client proofing): the meta bar's select toggle. */
export const selectButton = style({
    fontFamily: marketing.font.body,
    fontSize: 13,
    fontWeight: 600,
    padding: "7px 18px",
    marginTop: 4,
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.35)",
    background: "transparent",
    color: "rgba(255, 255, 255, 0.92)",
    cursor: "pointer",
    transition: "background 140ms ease, border-color 140ms ease",
    selectors: {
        "&:hover": { background: "rgba(255, 255, 255, 0.1)" },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

export const selectButtonSelected = style({
    background: marketing.color.accent,
    borderColor: marketing.color.accent,
    color: marketing.color.onAccent,
})
