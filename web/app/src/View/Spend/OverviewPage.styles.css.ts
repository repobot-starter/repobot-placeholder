import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

const WIDE = "screen and (min-width: 1024px)"

export const page = style({
    display: "grid",
    gap: vars.space.lg,
})

export const header = style({
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const subtitle = style({
    margin: `${vars.space.xs} 0 0`,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const rangeSelect = style({
    width: "10.5rem",
})

export const chartsRow = style({
    display: "grid",
    gap: vars.space.md,
    "@media": {
        [WIDE]: {
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
        },
    },
})

export const listsRow = style({
    display: "grid",
    gap: vars.space.md,
    alignItems: "start",
    "@media": {
        [WIDE]: {
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        },
    },
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
})

export const cardTitle = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const cardLink = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 500,
    color: vars.color.accent,
    textDecoration: "none",
    ":hover": { textDecoration: "underline" },
})

/* Approvals queue rows. */

export const queue = style({
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const queueRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    padding: `${vars.space.sm} 0`,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "&:last-child": { borderBottom: "none", paddingBottom: 0 },
        "&:first-child": { paddingTop: 0 },
    },
})

export const queueBody = style({
    display: "grid",
    gap: "2px",
    minWidth: 0,
    flex: 1,
})

export const queueName = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const queueMeta = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const queueAmount = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
})

export const queueActions = style({
    display: "flex",
    gap: vars.space.xs,
    flexShrink: 0,
})

export const queueEmpty = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

/* Recent-transactions ledger rows. */

export const ledger = style({
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const ledgerRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    padding: `${vars.space.sm} 0`,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "&:last-child": { borderBottom: "none", paddingBottom: 0 },
        "&:first-child": { paddingTop: 0 },
    },
})

export const ledgerBody = style({
    display: "grid",
    gap: "2px",
    minWidth: 0,
    flex: 1,
})

export const ledgerName = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const ledgerMeta = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const ledgerAmount = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    minWidth: "5.5rem",
    textAlign: "right",
})
