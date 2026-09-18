import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

/* Product fragments render as panel art: visible, never interactive. */
export const fragment = style({
    pointerEvents: "none",
    userSelect: "none",
})

export const approvalRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    padding: vars.space.md,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    boxShadow: vars.shadow.sm,
})

export const approvalBody = style({
    display: "grid",
    gap: "2px",
    minWidth: 0,
    flex: 1,
})

export const approvalName = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const approvalMeta = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})
