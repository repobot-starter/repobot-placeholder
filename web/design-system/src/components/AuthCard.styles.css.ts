import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

// The auth surface is the product's front door: by default it renders inside
// the dark theme class with a deeper-than-theme backdrop and an accent glow.
// Products can restyle it by overriding AuthScreen's className/themeClassName
// or by theming the tokens — no kernel edits required.
export const screen = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: vars.space.xl,
    boxSizing: "border-box",
    fontFamily: vars.fontFamily.body,
    backgroundColor: "#0d0f13", // theme-exempt: deeper-than-theme front-door backdrop
    backgroundImage:
        "radial-gradient(1100px 500px at 85% -10%, rgba(99, 102, 241, 0.14), transparent 60%)," +
        "radial-gradient(900px 420px at 10% 110%, rgba(56, 130, 246, 0.08), transparent 60%)",
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
    boxShadow: vars.shadow.lg,
    fontFamily: vars.fontFamily.body,
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
    fontSize: vars.fontSize.xl,
    fontWeight: 800,
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
