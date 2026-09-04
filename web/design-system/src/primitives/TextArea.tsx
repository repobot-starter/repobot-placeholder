import React from "react"
import * as styles from "./TextArea.styles.css"

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    invalid?: boolean
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
    { invalid, className, ...rest },
    ref,
) {
    const classes = [styles.textArea, invalid ? styles.invalid : undefined, className]
        .filter(Boolean)
        .join(" ")
    return <textarea ref={ref} className={classes} {...rest} />
})
