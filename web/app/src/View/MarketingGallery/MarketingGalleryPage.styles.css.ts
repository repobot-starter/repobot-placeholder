import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const page = style({
    minHeight: "100vh",
    backgroundColor: vars.color.background,
    color: vars.color.textPrimary,
    fontFamily: vars.fontFamily.body,
    padding: `${vars.space.lg} ${vars.space.lg} ${vars.space.xxl}`,
    display: "flex",
    flexDirection: "column",
    gap: vars.space.lg,
})

export const header = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.md,
})

export const title = style({
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    margin: 0,
})

export const subtitle = style({
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
    margin: `${vars.space.xxs} 0 0`,
})

export const controls = style({
    display: "flex",
    alignItems: "flex-end",
    gap: vars.space.md,
    flexWrap: "wrap",
})

export const controlStack = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
    minWidth: "170px",
})

export const inlineControl = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.xs,
})

export const colorInput = style({
    width: "44px",
    height: "34px",
    padding: "2px",
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.sm,
    backgroundColor: vars.color.surface,
    cursor: "pointer",
})

export const overridesReadout = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xxs,
})

export const overridesLabel = style({
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.xs,
})

export const overridesJson = style({
    margin: 0,
    padding: vars.space.sm,
    borderRadius: vars.radius.md,
    border: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.surface,
    fontFamily: vars.fontFamily.mono,
    fontSize: vars.fontSize.xs,
    overflowX: "auto",
})

export const compareGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: vars.space.lg,
})

export const compareTile = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
    padding: vars.space.xs,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    backgroundColor: vars.color.surface,
    cursor: "zoom-in",
    textAlign: "left",
    font: "inherit",
    color: "inherit",
    transition: "border-color 120ms ease",
    selectors: {
        "&:hover": { borderColor: vars.color.ring },
    },
})

export const tileLabel = style({
    fontFamily: vars.fontFamily.mono,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    padding: `0 ${vars.space.xxs}`,
})

export const previewViewport = style({
    position: "relative",
    overflow: "hidden",
    borderRadius: vars.radius.md,
    // The preview is a poster, not a page: clicks belong to the tile.
    pointerEvents: "none",
})

export const previewCanvas = style({
    transformOrigin: "top left",
})

export const singleFrame = style({
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    overflow: "hidden",
})
