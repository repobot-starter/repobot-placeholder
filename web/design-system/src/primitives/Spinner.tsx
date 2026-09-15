import React from "react"
import * as styles from "./Spinner.styles.css"

export interface SpinnerProps {
    size?: "sm" | "md" | "lg"
    "aria-label"?: string
}

export function Spinner({
    size = "md",
    "aria-label": ariaLabel = "Loading",
}: SpinnerProps): React.ReactElement {
    return <span role="status" aria-label={ariaLabel} className={`${styles.spinner} ${styles.size[size]}`} />
}
