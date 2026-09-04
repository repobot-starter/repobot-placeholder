import { createVar, style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const markerColor = createVar()

export const list = style({
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const entry = style({
    position: "relative",
    display: "flex",
    gap: vars.space.md,
    paddingBottom: vars.space.lg,
    // The rail connecting the markers; the last entry ends at its dot.
    selectors: {
        "&::before": {
            content: '""',
            position: "absolute",
            left: "5px",
            top: "14px",
            bottom: 0,
            width: "1px",
            backgroundColor: vars.color.border,
        },
        "&:last-child": { paddingBottom: 0 },
        "&:last-child::before": { display: "none" },
    },
})

export const marker = style({
    position: "relative",
    flexShrink: 0,
    width: "11px",
    height: "11px",
    marginTop: "4px",
    borderRadius: vars.radius.pill,
    backgroundColor: markerColor,
    border: `2px solid ${vars.color.surface}`,
    boxShadow: `0 0 0 1px ${markerColor}`,
})

export const markerTone = styleVariants({
    neutral: { vars: { [markerColor]: vars.color.textSecondary } },
    success: { vars: { [markerColor]: vars.color.success } },
    danger: { vars: { [markerColor]: vars.color.danger } },
    warning: { vars: { [markerColor]: vars.color.warning } },
    info: { vars: { [markerColor]: vars.color.info } },
    accent: { vars: { [markerColor]: vars.color.accent } },
})

export const body = style({
    display: "grid",
    gap: vars.space.xxs,
    flex: 1,
    minWidth: 0,
})

export const headerRow = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: vars.space.md,
})

export const title = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const timestamp = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    whiteSpace: "nowrap",
})

export const actor = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const description = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const changes = style({
    display: "grid",
    gap: vars.space.xxs,
    margin: `${vars.space.xs} 0 0`,
    padding: `${vars.space.sm} ${vars.space.md}`,
    listStyle: "none",
    backgroundColor: vars.color.muted,
    borderRadius: vars.radius.sm,
})

export const change = style({
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: vars.space.xs,
    fontSize: vars.fontSize.xs,
})

export const changeLabel = style({
    fontWeight: 600,
    color: vars.color.textSecondary,
})

export const changeBefore = style({
    color: vars.color.textSecondary,
    textDecoration: "line-through",
})

export const changeArrow = style({
    color: vars.color.textSecondary,
})

export const changeAfter = style({
    color: vars.color.textPrimary,
    fontWeight: 600,
})
