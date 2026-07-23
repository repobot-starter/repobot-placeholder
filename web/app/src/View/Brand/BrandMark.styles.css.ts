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
    borderRadius: "8px",
    background: "linear-gradient(135deg, #818cf8, #6366f1)",
    color: "#ffffff",
    fontSize: vars.fontSize.sm,
    fontWeight: 800,
    userSelect: "none",
})

export const name = style({
    fontSize: vars.fontSize.md,
    fontWeight: 700,
    color: vars.color.textPrimary,
})
