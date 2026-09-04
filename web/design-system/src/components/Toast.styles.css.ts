import { keyframes, style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const slideIn = keyframes({
    from: { opacity: 0, transform: "translateY(8px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

export const viewport = style({
    position: "fixed",
    display: "grid",
    gap: vars.space.sm,
    zIndex: 1000,
    maxWidth: "22rem",
    width: "calc(100vw - 2 * 16px)",
    "@media": {
        "screen and (min-width: 480px)": {
            width: "auto",
            minWidth: "18rem",
        },
    },
})

/* Where the stack lives; bottomRight is the pre-contract placement. */
export const position = styleVariants({
    bottomRight: { bottom: vars.space.lg, right: vars.space.lg },
    topRight: { top: vars.space.lg, right: vars.space.lg },
    bottomCenter: {
        bottom: vars.space.lg,
        left: "50%",
        transform: "translateX(-50%)",
        justifyItems: "center",
    },
})

export const toast = style({
    display: "flex",
    alignItems: "flex-start",
    gap: vars.space.sm,
    padding: `${vars.space.sm} ${vars.space.md}`,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderLeftWidth: "3px",
    borderRadius: vars.radius.md,
    boxShadow: vars.shadow.md,
    animation: `${slideIn} 160ms ease-out`,
})

export const tone = styleVariants({
    neutral: { borderLeftColor: vars.color.accent },
    success: { borderLeftColor: vars.color.success },
    danger: { borderLeftColor: vars.color.danger },
})

/* Card dressings beyond the default tone edge (`ui.toasts.style`). Each is
 * a designed treatment layered over `toast`; `edge` is the base itself. */

/* Solid: the inverse card — ink on paper flipped — with the tone kept as
 * the edge bar. Reads loud on any palette without needing on-tone text. */
export const solid = style({
    background: vars.color.textPrimary,
    color: vars.color.background,
    // Longhands on purpose: the tone class owns border-left-color (the
    // edge bar); the other three sides dissolve into the inverse fill.
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
})

/* Soft: a tone-tinted fill inside a hairline of the tone color — the
 * gentle read; the edge bar dissolves into the tint. */
export const soft = styleVariants({
    neutral: {
        background: `color-mix(in srgb, ${vars.color.accent} 10%, ${vars.color.surface})`,
        border: `1px solid color-mix(in srgb, ${vars.color.accent} 35%, transparent)`,
        boxShadow: vars.shadow.sm,
    },
    success: {
        background: vars.color.successSurface,
        border: `1px solid color-mix(in srgb, ${vars.color.success} 35%, transparent)`,
        boxShadow: vars.shadow.sm,
    },
    danger: {
        background: vars.color.dangerSurface,
        border: `1px solid color-mix(in srgb, ${vars.color.danger} 35%, transparent)`,
        boxShadow: vars.shadow.sm,
    },
})

export const body = style({
    display: "grid",
    gap: "2px",
    flex: 1,
    minWidth: 0,
})

export const title = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const description = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

/* Solid-dressing text reads: declared after title/description so the
 * inverse colors win the cascade at equal specificity. */
export const solidText = style({
    color: vars.color.background,
})

export const solidMuted = style({
    color: `color-mix(in srgb, ${vars.color.background} 78%, ${vars.color.textPrimary})`,
})

export const dismiss = style({
    flexShrink: 0,
    border: "none",
    background: "transparent",
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.md,
    lineHeight: 1,
    padding: vars.space.xxs,
    cursor: "pointer",
    borderRadius: vars.radius.sm,
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover, color: vars.color.textPrimary },
    },
})

export const dismissSolid = style({
    color: `color-mix(in srgb, ${vars.color.background} 78%, ${vars.color.textPrimary})`,
    selectors: {
        "&:hover": {
            backgroundColor: `color-mix(in srgb, ${vars.color.background} 16%, transparent)`,
            color: vars.color.background,
        },
    },
})
