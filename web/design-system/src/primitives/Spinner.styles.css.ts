import { keyframes, style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

const spin = keyframes({
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" },
})

export const spinner = style({
    display: "inline-block",
    borderRadius: "50%",
    borderStyle: "solid",
    borderColor: vars.color.border,
    borderTopColor: vars.color.accent,
    animation: `${spin} 700ms linear infinite`,
})

export const size = styleVariants({
    sm: { width: "14px", height: "14px", borderWidth: "2px" },
    md: { width: "20px", height: "20px", borderWidth: "2px" },
    lg: { width: "32px", height: "32px", borderWidth: "3px" },
})
