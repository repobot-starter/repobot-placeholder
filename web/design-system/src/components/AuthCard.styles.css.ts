import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

// The auth surface is the product's front door: it renders inside the app's
// active theme class with a token-derived backdrop and an accent glow, so the
// project's brand carries through to sign-in. Products can restyle it further
// by overriding AuthScreen's className/themeClassName or by theming the
// tokens — no kernel edits required.
export const screen = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: vars.space.xl,
    boxSizing: "border-box",
    fontFamily: vars.fontFamily.body,
    backgroundColor: vars.color.background,
    backgroundImage:
        `radial-gradient(1100px 500px at 85% -10%, color-mix(in srgb, ${vars.color.accent} 14%, transparent), transparent 60%),` +
        `radial-gradient(900px 420px at 10% 110%, color-mix(in srgb, ${vars.color.accent} 8%, transparent), transparent 60%)`,
})

export const card = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.lg,
    width: "min(380px, 100%)",
    padding: vars.space.xl,
    backgroundColor: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    // The character's floating-surface elevation; `plain` is shadow.lg.
    boxShadow: vars.treatment.cardShadow,
    fontFamily: vars.fontFamily.body,
})

/* The bare chrome (`ui.auth.layout: "bare"`): the card dissolves — no
 * surface, border, or elevation — and the forms sit directly on the
 * themed backdrop, the full-bleed minimal front door. Declared after
 * `card` so the resets win the cascade at equal specificity. */
export const cardBare = style({
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    padding: `${vars.space.lg} 0`,
})

export const brandRow = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.sm,
})

export const brandMark = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: vars.radius.sm,
    backgroundColor: vars.color.accent,
    // A diagonal grade off the accent pair reads as a designed mark rather
    // than a flat swatch; the inset highlight gives it a pressed-glass edge.
    backgroundImage: `linear-gradient(135deg, ${vars.color.accentHover}, ${vars.color.accent})`,
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 2px 6px color-mix(in srgb, ${vars.color.accent} 35%, transparent)`,
    color: vars.color.accentText,
    fontSize: vars.fontSize.sm,
    fontWeight: 800,
})

export const brandName = style({
    fontSize: vars.fontSize.md,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const heading = style({
    margin: 0,
    fontFamily: vars.fontFamily.display,
    fontSize: vars.fontSize.xl,
    fontWeight: 800,
    letterSpacing: "-0.015em",
    color: vars.color.textPrimary,
})

export const subheading = style({
    margin: `${vars.space.xs} 0 0`,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const divider = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    color: vars.color.textSecondary,
    fontSize: vars.fontSize.xs,
    selectors: {
        "&::before, &::after": {
            content: "",
            flex: 1,
            height: "1px",
            backgroundColor: vars.color.border,
        },
    },
})

export const form = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
})

export const oauthStack = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
})

export const secondaryActions = style({
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: vars.space.sm,
})

export const message = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.success,
    textAlign: "center",
})

export const errorMessage = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.danger,
    textAlign: "center",
})

// Sandbox-only footnote under the form: keeps the dev bypass one click away
// without letting it *be* the login experience.
export const footnote = style({
    margin: 0,
    paddingTop: vars.space.sm,
    borderTop: `1px solid ${vars.color.border}`,
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    textAlign: "center",
})

export const inlineLink = style({
    padding: 0,
    border: "none",
    background: "none",
    font: "inherit",
    color: vars.color.accent,
    textDecoration: "underline",
    cursor: "pointer",
})
