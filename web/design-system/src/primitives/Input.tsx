import React from "react"
import * as styles from "./Input.styles.css"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
    { invalid, className, ...rest },
    ref,
) {
    const classes = [styles.input, invalid ? styles.invalid : undefined, className].filter(Boolean).join(" ")
    return <input ref={ref} className={classes} {...rest} />
})
