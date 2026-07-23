import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * The chat pack's page shell: a deep slate night sky with one violet accent
 * and Sora for the wordmark. The thread itself is the design system's
 * AiChatThread (rendered inside darkTheme), so only the pack's chrome lives
 * here — the accent and font route through the brand overlay so a custom
 * repobot.theme.json re-brands the chrome too.
 */
const night = "#0e1016"
const panelEdge = "rgba(148, 163, 198, 0.14)"
const textPrimary = "#e8ebf4"
const textSecondary = "rgba(232, 235, 244, 0.62)"
const violet = packBrand?.accentDark ?? "#8b7cf7"

const sans = packFont ?? "Sora, system-ui, sans-serif"

export const page = style({
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: night,
    color: textPrimary,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

export const header = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "min(46rem, 100% - 2.5rem)",
    marginInline: "auto",
    paddingBlock: "1.1rem",
})

export const wordmark = style({
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    fontSize: "1rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
})

export const wordmarkDot = style({
    width: "0.6rem",
    height: "0.6rem",
    borderRadius: "50%",
    background: violet,
    boxShadow: `0 0 12px ${violet}`,
})

export const headerButton = style({
    appearance: "none",
    border: `1px solid ${panelEdge}`,
    background: "transparent",
    color: textSecondary,
    fontFamily: sans,
    fontSize: "0.8rem",
    fontWeight: 500,
    padding: "0.45rem 0.9rem",
    borderRadius: "999px",
    cursor: "pointer",
    ":hover": { color: textPrimary, borderColor: "rgba(148, 163, 198, 0.35)" },
})
