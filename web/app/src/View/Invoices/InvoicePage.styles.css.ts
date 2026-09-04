import { vars } from "@base/design-system/tokens"
import { globalStyle, style } from "@vanilla-extract/css"

/**
 * The invoice pack's design language: cool paper, slate ink, and a single
 * confident accent. The neutrals ride the theme contract (the pack's
 * catalog seeds the cool-paper values, mode: light), so the studio and the
 * AppShell chrome around it re-ink together on a palette or mode roll; the
 * accent and body font route through the pack overlay (packs/README.md),
 * so a project's brand wins over the pack palette automatically.
 */
const paper = vars.color.background
const card = vars.color.surface
const ink = vars.color.textPrimary
const muted = vars.color.textSecondary
const line = vars.color.border
const accent = "var(--pack-accent, #2b4c7e)"

const sans = 'var(--pack-font, "Inter", system-ui, sans-serif)'

export const page = style({
    minHeight: "100%",
    background: paper,
    color: ink,
    fontFamily: sans,
    boxSizing: "border-box",
    paddingBottom: "4rem",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

const container = style({
    width: "min(72rem, 100% - 3rem)",
    marginInline: "auto",
})

/** The old topbar's tagline row, kept as a page toolbar above the form. */
export const toolbar = style([
    container,
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "1rem",
        paddingBlock: "0.75rem 1.25rem",
    },
])

export const tagline = style({
    color: muted,
    fontSize: "0.85rem",
})

export const layout = style([
    container,
    {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 21rem",
        gap: "1.5rem",
        alignItems: "start",
        "@media": {
            "screen and (max-width: 56rem)": {
                gridTemplateColumns: "minmax(0, 1fr)",
            },
        },
    },
])

export const form = style({
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
})

export const section = style({
    background: card,
    border: `1px solid ${line}`,
    borderRadius: "0.75rem",
    padding: "1.5rem",
})

export const sectionTitle = style({
    margin: "0 0 1rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: muted,
})

export const fieldGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0.9rem 1rem",
    "@media": {
        "screen and (max-width: 40rem)": {
            gridTemplateColumns: "minmax(0, 1fr)",
        },
    },
})

export const fieldFull = style({
    gridColumn: "1 / -1",
})

export const field = style({
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
})

//
// Line items
//

export const lineItemHeader = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 5rem 8rem 6.5rem 2rem",
    gap: "0.75rem",
    padding: "0 0 0.5rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: muted,
})

export const lineItemRow = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 5rem 8rem 6.5rem 2rem",
    gap: "0.75rem",
    alignItems: "center",
    paddingBlock: "0.4rem",
    borderTop: `1px solid ${line}`,
})

export const lineItemTotal = style({
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    fontSize: "0.9rem",
})

export const removeButton = style({
    border: "none",
    background: "transparent",
    color: muted,
    fontSize: "1.1rem",
    lineHeight: 1,
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: "0.4rem",
    ":hover": {
        color: ink,
        background: paper,
    },
})

export const addLineButton = style({
    marginTop: "0.75rem",
})

//
// Summary sidebar
//

export const sidebar = style({
    position: "sticky",
    top: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
})

export const totalsRow = style({
    display: "flex",
    justifyContent: "space-between",
    paddingBlock: "0.45rem",
    fontSize: "0.95rem",
    fontVariantNumeric: "tabular-nums",
})

export const grandTotalRow = style([
    totalsRow,
    {
        marginTop: "0.4rem",
        borderTop: `2px solid ${ink}`,
        paddingTop: "0.8rem",
        fontSize: "1.15rem",
        fontWeight: 700,
    },
])

export const generateButton = style({
    width: "100%",
    marginTop: "1rem",
})

export const problemList = style({
    margin: "0.75rem 0 0",
    paddingLeft: "1.1rem",
    color: muted,
    fontSize: "0.85rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
})

export const errorText = style({
    marginTop: "0.75rem",
    color: vars.color.danger,
    fontSize: "0.85rem",
})

export const downloadsList = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
})

export const downloadLink = style({
    display: "flex",
    justifyContent: "space-between",
    gap: "0.75rem",
    alignItems: "baseline",
    color: accent,
    textDecoration: "none",
    fontSize: "0.9rem",
    ":hover": {
        textDecoration: "underline",
    },
})

export const downloadTime = style({
    color: muted,
    fontSize: "0.75rem",
    whiteSpace: "nowrap",
})

export const emptyDownloads = style({
    color: muted,
    fontSize: "0.85rem",
    margin: 0,
})
