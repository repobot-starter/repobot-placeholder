import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const page = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.md,
    // AiChatThread fills its container; pin the page to the viewport minus
    // the shell chrome so the thread scrolls and the composer stays put.
    height: "calc(100vh - 8rem)",
    minHeight: "24rem",
})

export const header = style({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: vars.space.md,
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const subtitle = style({
    margin: 0,
    marginTop: vars.space.xs,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const newChatButton = style({
    appearance: "none",
    border: `1px solid ${vars.color.border}`,
    background: "transparent",
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.sm,
    fontWeight: 500,
    padding: `${vars.space.xs} ${vars.space.md}`,
    borderRadius: vars.radius.pill,
    cursor: "pointer",
    selectors: {
        "&:hover": { color: vars.color.textPrimary, borderColor: vars.color.accent },
    },
})

export const threadWrap = style({
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    overflow: "hidden",
})
