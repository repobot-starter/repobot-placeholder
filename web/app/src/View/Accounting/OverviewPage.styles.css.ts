import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

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

export const connectCard = style([
    card,
    {
        maxWidth: "36rem",
    },
])

export const cardHeader = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
})

export const cardTitle = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const cardLink = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.accent,
    textDecoration: "none",
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

export const invoiceList = style({
    display: "grid",
    gap: vars.space.sm,
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const invoiceRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    padding: `${vars.space.sm} 0`,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "&:last-child": { borderBottom: "none", paddingBottom: 0 },
    },
})

export const invoiceBody = style({
    display: "grid",
    gap: "2px",
    flex: 1,
    minWidth: 0,
})

export const invoiceName = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const invoiceMeta = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const invoiceAmount = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
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
