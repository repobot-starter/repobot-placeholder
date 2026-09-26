import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const container = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: vars.space.sm,
    padding: vars.space.xxl,
    textAlign: "center",
})

/* The framed treatment: soft accent wash inside a dashed hairline. */
export const wash = style({
    border: `1px dashed ${vars.color.border}`,
    borderRadius: vars.radius.lg,
    backgroundImage: `radial-gradient(80% 120% at 50% 0%, color-mix(in srgb, ${vars.color.accent} 7%, transparent), transparent 70%)`,
})

export const icon = style({
    display: "grid",
    placeContent: "center",
    width: "44px",
    height: "44px",
    borderRadius: vars.radius.pill,
    color: vars.color.accent,
    backgroundColor: `color-mix(in srgb, ${vars.color.accent} 12%, transparent)`,
})

/* The illustrated voice's hero pictogram: a larger tile with a soft accent
 * bloom behind it, so the artwork carries the state. */
export const iconHero = style({
    width: "72px",
    height: "72px",
    backgroundImage: `radial-gradient(80% 80% at 50% 30%, color-mix(in srgb, ${vars.color.accent} 22%, transparent), transparent 75%)`,
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.lg,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

/* The quiet voice: the state whispers — body-size muted title, no icon. */
export const titleQuiet = style({
    fontSize: vars.fontSize.md,
    fontWeight: 600,
    color: vars.color.textSecondary,
})

export const description = style({
    margin: 0,
    maxWidth: "360px",
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const action = style({
    marginTop: vars.space.sm,
})
