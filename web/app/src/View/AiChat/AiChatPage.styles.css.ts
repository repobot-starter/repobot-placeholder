import { vars } from "@base/design-system/tokens"
import { globalStyle, style } from "@vanilla-extract/css"

/**
 * The chat pack's page shell: a deep slate night sky with one violet accent
 * and Sora for the wordmark. The thread itself is the design system's
 * AiChatThread, so only the pack's chrome lives here — the neutrals ride
 * the theme contract (the pack's catalog seeds the night-sky values,
 * mode: dark) and the accent and font route through the pack overlay, so a
 * custom repobot.theme.json re-brands the chrome too.
 */
const night = vars.color.background
const panelEdge = vars.color.border
const textPrimary = vars.color.textPrimary
const textSecondary = vars.color.textSecondary

const sans = "var(--pack-font, Sora, system-ui, sans-serif)"

export const page = style({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: night,
    color: textPrimary,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

/** The New-chat action's row over the thread (the old header's right slot). */
export const toolbar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "min(46rem, 100% - 2.5rem)",
    marginInline: "auto",
    paddingBlock: "1.1rem 0",
})

export const newChatButton = style({
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
    ":hover": { color: textPrimary, borderColor: textSecondary },
})
