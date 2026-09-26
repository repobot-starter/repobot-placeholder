import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const page = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.lg,
    maxWidth: "640px",
})

export const title = style({
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
    margin: 0,
})

export const card = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.md,
    padding: vars.space.lg,
    borderRadius: vars.radius.lg,
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surface,
})

export const cardHeader = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
})

export const cardTitle = style({
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textPrimary,
    margin: 0,
    flex: 1,
})

export const cardDescription = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
    margin: 0,
})

export const fieldRow = style({
    display: "flex",
    alignItems: "baseline",
    gap: vars.space.md,
})

export const fieldLabel = style({
    width: "140px",
    flexShrink: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const fieldValue = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.sm,
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
    wordBreak: "break-word",
})

export const passwordForm = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
    maxWidth: "320px",
})

export const formMessage = style({
    fontSize: vars.fontSize.sm,
    margin: 0,
})

export const errorMessage = style([formMessage, { color: vars.color.danger }])

export const successMessage = style([formMessage, { color: vars.color.success }])

export const actionsRow = style({
    display: "flex",
    gap: vars.space.sm,
})

export const avatarPreview = style({
    width: "64px",
    height: "64px",
    borderRadius: vars.radius.pill,
    objectFit: "cover",
    border: `1px solid ${vars.color.border}`,
})

export const avatarPlaceholder = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    borderRadius: vars.radius.pill,
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surfaceHover,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.lg,
    fontWeight: 700,
})

export const hiddenFileInput = style({
    display: "none",
})
