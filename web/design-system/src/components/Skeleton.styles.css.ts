import { keyframes, style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const pulse = keyframes({
    "0%": { opacity: 1 },
    "50%": { opacity: 0.5 },
    "100%": { opacity: 1 },
})

export const skeleton = style({
    display: "block",
    backgroundColor: vars.color.skeleton,
    borderRadius: vars.radius.sm,
    animation: `${pulse} 1.4s ease-in-out infinite`,
})
