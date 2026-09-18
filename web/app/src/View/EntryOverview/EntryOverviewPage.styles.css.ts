import { vars } from "@base/design-system/tokens"
import { style } from "@vanilla-extract/css"

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

export const columns = style({
    display: "grid",
    gap: vars.space.lg,
    "@media": {
        [WIDE]: {
            gridTemplateColumns: "3fr 2fr",
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
    alignContent: "start",
})

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
    fontWeight: 500,
    color: vars.color.accent,
    textDecoration: "none",
    ":hover": {
        textDecoration: "underline",
    },
})

export const fieldList = style({
    display: "grid",
    gap: vars.space.sm,
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const fieldItem = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.md,
    padding: `${vars.space.sm} 0`,
    borderBottom: `1px solid ${vars.color.border}`,
    selectors: {
        "&:last-child": {
            borderBottom: "none",
        },
    },
})

export const fieldLabel = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 500,
    color: vars.color.textPrimary,
})
