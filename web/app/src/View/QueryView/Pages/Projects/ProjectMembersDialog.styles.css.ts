import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const body = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.lg,
    minWidth: 0,
})

export const memberList = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
})

export const memberRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    padding: `${vars.space.sm} 0`,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "&:last-child": { borderBottom: "none" },
    },
})

export const memberIdentity = style({
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    minWidth: 0,
})

export const memberName = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const memberEmail = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const roleSelect = style({
    width: "120px",
    flexShrink: 0,
})

export const sectionTitle = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    margin: 0,
})

export const addRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    flexWrap: "wrap",
})

export const userSelect = style({
    flex: 1,
    minWidth: "180px",
})

export const message = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.danger,
    margin: 0,
})

export const emptyText = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
    margin: 0,
})

export const loadingRow = style({
    display: "flex",
    justifyContent: "center",
    padding: vars.space.lg,
})
