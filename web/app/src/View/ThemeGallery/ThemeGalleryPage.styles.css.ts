import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const page = style({
    minHeight: "100vh",
    backgroundColor: vars.color.background,
    color: vars.color.textPrimary,
    fontFamily: vars.fontFamily.body,
    padding: `${vars.space.xl} ${vars.space.xl} ${vars.space.xxl}`,
})

export const inner = style({
    maxWidth: "1040px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xl,
})

export const header = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const title = style({
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    margin: 0,
})

export const subtitle = style({
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
    margin: 0,
    flexBasis: "100%",
})

export const headerSpacer = style({
    flex: 1,
})

export const contractPill = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xxs,
    padding: `${vars.space.xxs} ${vars.space.sm}`,
    borderRadius: vars.radius.pill,
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surface,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.xs,
    fontFamily: vars.fontFamily.mono,
})

export const section = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.md,
})

export const sectionTitle = style({
    fontSize: vars.fontSize.lg,
    fontWeight: 600,
    margin: 0,
})

export const sectionHint = style({
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
    margin: 0,
})

export const panel = style({
    backgroundColor: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    padding: vars.space.lg,
    display: "flex",
    flexDirection: "column",
    gap: vars.space.md,
})

export const swatchRow = style({
    display: "flex",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const swatch = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
    minWidth: "96px",
})

export const swatchChip = style({
    height: "44px",
    borderRadius: vars.radius.md,
    border: `1px solid ${vars.color.border}`,
})

export const swatchLabel = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    fontFamily: vars.fontFamily.mono,
})

export const radiusRow = style({
    display: "flex",
    gap: vars.space.lg,
    alignItems: "flex-end",
    flexWrap: "wrap",
})

export const radiusSample = style({
    width: "72px",
    height: "48px",
    backgroundColor: vars.color.surfaceHover,
    border: `1px solid ${vars.color.border}`,
})

export const spacingRow = style({
    display: "flex",
    alignItems: "flex-end",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const spacingBar = style({
    backgroundColor: vars.color.accent,
    borderRadius: vars.radius.sm,
    width: "20px",
})

export const scaleItem = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: vars.space.xxs,
})

export const typeRow = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
})

export const controlsGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: vars.space.lg,
})

export const controlStack = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
})

export const inlineRow = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    flexWrap: "wrap",
})

export const composedGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: vars.space.lg,
    alignItems: "start",
})

export const promptList = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
    margin: 0,
    paddingLeft: vars.space.lg,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
})

export const promptCode = style({
    fontFamily: vars.fontFamily.mono,
    color: vars.color.textPrimary,
})
