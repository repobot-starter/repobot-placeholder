import { style } from "@vanilla-extract/css"
// .css.ts files import tokens via the dedicated subpath so vanilla-extract's
// build-time evaluation doesn't pull the whole component library in.
import { vars } from "@base/design-system/tokens"

export const row = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.sm,
})

export const mark = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: vars.radius.sm,
    // A subtle gradient of the project's accent, so the mark carries the
    // brand instead of a fixed kernel indigo.
    background: `linear-gradient(135deg, color-mix(in srgb, ${vars.color.accent} 78%, white), ${vars.color.accent})`,
    color: vars.color.accentText,
    fontSize: vars.fontSize.sm,
    fontWeight: 800,
    userSelect: "none",
})

export const name = style({
    fontSize: vars.fontSize.md,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

/** The logo is a link home; the link itself stays visually silent. */
export const homeLink = style({
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
})

/** The committed logo, capped to the wordmark's visual height. */
export const logoImage = style({
    display: "block",
    height: "32px",
    width: "auto",
    maxWidth: "220px",
    objectFit: "contain",
})

/** The committed square mark at the shell sidebar's icon size. */
export const markImage = style({
    display: "block",
    width: "28px",
    height: "28px",
    borderRadius: vars.radius.sm,
    objectFit: "contain",
})
