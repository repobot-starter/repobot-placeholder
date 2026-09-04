import { vars } from "@base/design-system/tokens"
import { globalStyle, style } from "@vanilla-extract/css"

/**
 * The agent pack's desk: true black, white type, one hard plate for
 * actions. Accent and font route through the brand overlay so a custom
 * repobot.theme.json re-brands the chrome too; the neutrals ride the theme
 * contract (the catalog seeds the true-black values), so the desk and the
 * AppShell chrome around it re-ink together.
 */
const ink = "var(--pack-accent-dark, #ffffff)"
const ground = vars.color.background
const panel = vars.color.surface
const edge = vars.color.border
const muted = vars.color.textSecondary
const sans = "var(--pack-font, Sora, system-ui, sans-serif)"

export const page = style({
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: ground,
    color: ink,
    fontFamily: sans,
    boxSizing: "border-box",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

/** Nav glyphs in the shell rail keep the desk's spare, typographic register. */
export const navGlyph = style({
    fontSize: "0.85rem",
    lineHeight: 1,
})

export const body = style({
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
})

export const chatBody = style({
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
})

export const voiceStage = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.75rem",
    padding: "2rem 1.5rem",
})

export const orb = style({
    width: "9.5rem",
    height: "9.5rem",
    borderRadius: "50%",
    border: `1px solid ${ink}`,
    background: ground,
    color: ink,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: sans,
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    userSelect: "none",
    ":hover": { background: panel },
    ":disabled": { opacity: 0.45, cursor: "not-allowed" },
})

export const orbHolding = style({
    background: ink,
    color: ground,
    transform: "scale(1.04)",
    ":hover": { background: ink },
})

export const voiceHint = style({
    color: muted,
    fontSize: "0.9rem",
    textAlign: "center",
    maxWidth: "28rem",
    lineHeight: 1.5,
})

export const transcript = style({
    width: "min(36rem, 100%)",
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
    maxHeight: "14rem",
    overflowY: "auto",
})

export const bubble = style({
    borderTop: `1px solid ${edge}`,
    paddingTop: "0.75rem",
    fontSize: "0.92rem",
    lineHeight: 1.5,
})

export const bubbleLabel = style({
    display: "block",
    fontSize: "0.68rem",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: muted,
    marginBottom: "0.3rem",
})

export const dataLayout = style({
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(16rem, 20rem)",
    gap: "0",
    "@media": {
        "(max-width: 840px)": {
            gridTemplateColumns: "1fr",
            gridTemplateRows: "1fr auto",
        },
    },
})

export const tableWrap = style({
    overflow: "auto",
    borderRight: `1px solid ${edge}`,
    "@media": {
        "(max-width: 840px)": { borderRight: "none", borderBottom: `1px solid ${edge}` },
    },
})

export const table = style({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.88rem",
})

export const th = style({
    textAlign: "left",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: "0.68rem",
    color: muted,
    padding: "0.85rem 1rem",
    borderBottom: `1px solid ${edge}`,
    position: "sticky",
    top: 0,
    background: ground,
})

export const td = style({
    padding: "0.7rem 1rem",
    borderBottom: `1px solid ${edge}`,
    verticalAlign: "top",
})

export const row = style({
    cursor: "pointer",
    ":hover": { background: panel },
})

export const rowActive = style({
    background: panel,
})

export const editor = style({
    padding: "1.1rem 1.2rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    overflowY: "auto",
    background: panel,
})

export const editorTitle = style({
    fontSize: "0.8rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: 0,
})

export const label = style({
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    fontSize: "0.68rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: muted,
})

export const input = style({
    appearance: "none",
    border: `1px solid ${edge}`,
    background: ground,
    color: ink,
    fontFamily: sans,
    fontSize: "0.9rem",
    padding: "0.45rem 0.6rem",
    borderRadius: 0,
    ":focus": { outline: `1px solid ${ink}` },
})

export const textarea = style({
    appearance: "none",
    border: `1px solid ${edge}`,
    background: ground,
    color: ink,
    fontFamily: sans,
    fontSize: "0.9rem",
    padding: "0.45rem 0.6rem",
    minHeight: "5.5rem",
    resize: "vertical",
    borderRadius: 0,
    ":focus": { outline: `1px solid ${ink}` },
})

export const editorActions = style({
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.4rem",
})

export const primaryButton = style({
    appearance: "none",
    border: `1px solid ${ink}`,
    background: ink,
    color: ground,
    fontFamily: sans,
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "0.5rem 0.85rem",
    cursor: "pointer",
    ":disabled": { opacity: 0.4, cursor: "not-allowed" },
})

export const ghostButton = style({
    appearance: "none",
    border: `1px solid ${edge}`,
    background: "transparent",
    color: muted,
    fontFamily: sans,
    fontSize: "0.8rem",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "0.5rem 0.85rem",
    cursor: "pointer",
    ":hover": { color: ink, borderColor: ink },
})

export const errorText = style({
    color: ink,
    fontSize: "0.85rem",
})

export const search = style({
    appearance: "none",
    border: `1px solid ${edge}`,
    background: ground,
    color: ink,
    fontFamily: sans,
    fontSize: "0.85rem",
    padding: "0.4rem 0.7rem",
    minWidth: "12rem",
    ":focus": { outline: `1px solid ${ink}` },
})
