import * as RadixLabel from "@radix-ui/react-label"
import React from "react"
import * as styles from "./Label.styles.css"

export interface LabelProps extends React.ComponentProps<typeof RadixLabel.Root> {
    required?: boolean
}

export function Label({ required, className, children, ...rest }: LabelProps): React.ReactElement {
    const classes = [styles.label, className].filter(Boolean).join(" ")
    return (
        <RadixLabel.Root className={classes} {...rest}>
            {children}
            {required ? <span className={styles.requiredMark}>*</span> : null}
        </RadixLabel.Root>
    )
}
