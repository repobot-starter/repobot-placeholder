import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const groups = style({
    display: "grid",
    gap: vars.space.lg,
    maxWidth: "44rem",
})

export const group = style({
    display: "grid",
    gap: vars.space.md,
    padding: vars.space.lg,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
})

export const groupDanger = style({
    borderColor: vars.color.danger,
})

export const groupHeader = style({
    display: "grid",
    gap: vars.space.xxs,
})

export const groupTitle = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const groupTitleDanger = style({
    color: vars.color.danger,
})

export const groupDescription = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const groupBody = style({
    display: "grid",
})

export const groupFooter = style({
    display: "flex",
    justifyContent: "flex-end",
    gap: vars.space.sm,
    borderTop: `1px solid ${vars.color.border}`,
    paddingTop: vars.space.md,
})

export const row = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.lg,
    padding: `${vars.space.md} 0`,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "&:last-child": { borderBottom: "none", paddingBottom: 0 },
        "&:first-child": { paddingTop: 0 },
    },
    "@media": {
        "screen and (max-width: 560px)": {
            flexDirection: "column",
            alignItems: "stretch",
            gap: vars.space.sm,
        },
    },
})

export const rowText = style({
    display: "grid",
    gap: "2px",
    minWidth: 0,
})

export const rowLabel = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const rowDescription = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const rowControl = style({
    flexShrink: 0,
    minWidth: "12rem",
    display: "flex",
    justifyContent: "flex-end",
    "@media": {
        "screen and (max-width: 560px)": {
            minWidth: 0,
            justifyContent: "stretch",
        },
    },
})
