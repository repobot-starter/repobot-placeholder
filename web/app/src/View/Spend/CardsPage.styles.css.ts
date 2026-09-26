import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const page = style({
    display: "grid",
    gap: vars.space.lg,
})

export const header = style({
    display: "grid",
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

export const wall = style({
    display: "grid",
    gap: vars.space.md,
    gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))",
})

/* A corporate-card tile: accent-washed surface, monospace-ish number row. */
export const cardTile = style({
    display: "grid",
    gap: vars.space.xs,
    padding: vars.space.lg,
    textAlign: "left",
    background: vars.color.surface,
    backgroundImage: `radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, ${vars.color.accent} 10%, transparent), transparent 60%)`,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    cursor: "pointer",
    fontFamily: vars.fontFamily.body,
    transition: "border-color 160ms ease, box-shadow 160ms ease",
    ":hover": {
        borderColor: `color-mix(in srgb, ${vars.color.accent} 45%, ${vars.color.border})`,
    },
})

export const cardTileActive = style({
    borderColor: vars.color.accent,
    boxShadow: `0 0 0 1px ${vars.color.accent}`,
})

export const cardTop = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.sm,
})

export const cardLabel = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const cardNumber = style({
    marginTop: vars.space.sm,
    fontSize: vars.fontSize.lg,
    fontWeight: 600,
    letterSpacing: "0.12em",
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
})

export const cardHolder = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const cardMeterTrack = style({
    marginTop: vars.space.sm,
    height: "4px",
    borderRadius: vars.radius.pill,
    background: vars.color.muted,
    overflow: "hidden",
})

export const cardMeterFill = style({
    display: "block",
    height: "100%",
    borderRadius: vars.radius.pill,
    background: vars.color.accent,
})

export const cardPace = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    fontVariantNumeric: "tabular-nums",
})

export const activityCard = style({
    display: "grid",
    gap: vars.space.md,
    padding: vars.space.lg,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
})

export const activityTitle = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const merchantCell = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.sm,
    fontWeight: 500,
})

export const amountCell = style({
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
})
