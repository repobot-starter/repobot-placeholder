import React from "react"
import * as styles from "./Button.styles.css"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = "primary", size = "md", className, type = "button", ...rest },
    ref,
) {
    const classes = [styles.base, styles.variant[variant], styles.size[size], className]
        .filter(Boolean)
        .join(" ")
    return <button ref={ref} type={type} className={classes} {...rest} />
})
