import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const inviteRow = style({
    display: "flex",
    alignItems: "flex-end",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const inviteField = style({
    display: "grid",
    gap: vars.space.xs,
    minWidth: "16rem",
    flex: 1,
    maxWidth: "24rem",
})

export const inviteList = style({
    display: "grid",
    gap: vars.space.xs,
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const inviteItem = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    padding: `${vars.space.xs} 0`,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "&:last-child": { borderBottom: "none" },
    },
})

export const inviteEmail = style({
    flex: 1,
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const clientCell = style({
    display: "grid",
    gap: "2px",
})

export const clientName = style({
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const clientEmail = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})
