import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

// Shared page scaffolding for the flow budgeting views (packs/flow); page-
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
