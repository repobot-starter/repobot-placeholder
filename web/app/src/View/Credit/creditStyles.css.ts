import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

// Shared page scaffolding for the credit desk views (packs/credit); page-
// specific styles extend these in their own *.styles.css.ts files.

export const page = style({
    display: "grid",
    gap: vars.space.lg,
})

export const header = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const subtitle = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const card = style({
    display: "grid",
    gap: vars.space.md,
    padding: vars.space.lg,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
})

export const cardHeader = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const cardTitle = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const loadingWrap = style({
    display: "flex",
    justifyContent: "center",
    padding: vars.space.xl,
})

export const errorText = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.danger,
})

export const mutedText = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const row = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const dropZone = style({
    display: "grid",
    justifyItems: "center",
    gap: vars.space.sm,
    padding: vars.space.xl,
    border: `2px dashed ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    background: vars.color.background,
    cursor: "pointer",
    textAlign: "center",
    transition: "border-color 120ms ease, background 120ms ease",
})

export const dropZoneActive = style({
    borderColor: vars.color.accent,
    background: vars.color.surface,
})

export const dropZoneTitle = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const dropZoneHint = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const sampleLinks = style({
    display: "flex",
    gap: vars.space.md,
    flexWrap: "wrap",
    justifyContent: "center",
})

export const sampleLink = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.accent,
    textDecoration: "none",
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

export const fieldGrid = style({
    display: "grid",
    gap: vars.space.md,
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
})

export const fieldLabel = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: vars.color.textSecondary,
})

export const fieldValue = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
})

export const findingList = style({
    display: "grid",
    gap: vars.space.sm,
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const findingItem = style({
    display: "flex",
    alignItems: "baseline",
    gap: vars.space.md,
    padding: vars.space.md,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    background: vars.color.background,
})

export const findingBody = style({
    display: "grid",
    gap: "2px",
})

export const findingTitle = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const findingDetail = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})
