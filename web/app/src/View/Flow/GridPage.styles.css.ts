import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const tableWrap = style({
    overflowX: "auto",
})

export const gridTable = style({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: vars.fontSize.sm,
})

const headCellBase = {
    padding: `${vars.space.xs} ${vars.space.sm}`,
    fontWeight: 600,
    color: vars.color.textSecondary,
    borderBottom: `1px solid ${vars.color.border}`,
    whiteSpace: "nowrap" as const,
}

export const lineHeadCell = style({
    ...headCellBase,
    textAlign: "left",
    minWidth: "160px",
})

export const linkHeadCell = style({
    ...headCellBase,
    textAlign: "left",
    minWidth: "170px",
})

export const monthHeadCell = style({
    ...headCellBase,
    textAlign: "right",
    minWidth: "120px",
})

export const actionHeadCell = style({
    ...headCellBase,
})

const cellBase = {
    padding: `${vars.space.xs} ${vars.space.sm}`,
    verticalAlign: "top" as const,
    borderBottom: `1px solid ${vars.color.border}`,
}

export const lineCell = style({
    ...cellBase,
    textAlign: "left",
})

export const linkCell = style({
    ...cellBase,
    textAlign: "left",
})

export const monthCell = style({
    ...cellBase,
    textAlign: "right",
})

export const actionCell = style({
    ...cellBase,
    textAlign: "right",
})

export const labelInput = style({
    width: "100%",
    minWidth: "140px",
    padding: `${vars.space.xxs} ${vars.space.xs}`,
    border: "1px solid transparent",
    borderRadius: vars.radius.sm,
    background: "transparent",
    color: vars.color.textPrimary,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    selectors: {
        "&:hover": { borderColor: vars.color.border },
        "&:focus": { borderColor: vars.color.accent, outline: "none", background: vars.color.input },
    },
})

export const budgetInput = style({
    width: "104px",
    padding: `${vars.space.xxs} ${vars.space.xs}`,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.sm,
    background: vars.color.input,
    color: vars.color.textPrimary,
    fontSize: vars.fontSize.sm,
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
    selectors: {
        "&:focus": { borderColor: vars.color.accent, outline: "none" },
    },
})

export const actualText = style({
    display: "block",
    marginTop: "2px",
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
})

export const varianceGood = style({
    color: vars.color.success,
})

export const varianceBad = style({
    color: vars.color.danger,
})

export const totalRow = style({
    fontWeight: 600,
})

export const totalBudget = style({
    display: "block",
    fontVariantNumeric: "tabular-nums",
})
