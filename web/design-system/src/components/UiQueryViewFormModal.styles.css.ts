import { style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

/* The inline presentation: the same surface card as the modal, rendered
 * in-flow on the page instead of portaled over it. */
export const inlineCard = style({
    display: "flex",
    flexDirection: "column",
    backgroundColor: vars.color.surface,
    color: vars.color.textPrimary,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    boxShadow: vars.shadow.sm,
})

/* Width caps matching the Dialog's card widths, but in-flow (100% of the
 * slot the caller gives the card, up to the preset). */
export const inlineWidth = styleVariants({
    skinny: { maxWidth: "400px" },
    normal: { maxWidth: "560px" },
    wide: { maxWidth: "820px" },
})

export const inlineHeader = style({
    padding: `${vars.space.lg} ${vars.space.xl}`,
    borderBottom: `1px solid ${vars.color.border}`,
})

export const inlineTitle = style({
    margin: 0,
    fontSize: vars.fontSize.lg,
    fontWeight: 700,
})

export const inlineBody = style({
    padding: `${vars.space.lg} ${vars.space.xl}`,
})

export const inlineFooter = style({
    display: "flex",
    justifyContent: "flex-end",
    gap: vars.space.sm,
    padding: `${vars.space.md} ${vars.space.xl}`,
    borderTop: `1px solid ${vars.color.border}`,
})

export const loadingBody = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.md,
})

export const submitError = style({
    margin: `${vars.space.sm} 0 0`,
    padding: vars.space.sm,
    backgroundColor: vars.color.dangerSurface,
    borderRadius: vars.radius.sm,
    color: vars.color.danger,
    fontSize: vars.fontSize.sm,
})
