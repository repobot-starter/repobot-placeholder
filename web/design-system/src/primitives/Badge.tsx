import React from "react"
import * as styles from "./Badge.styles.css"

export type BadgeTone = "neutral" | "success" | "danger" | "accent"

export interface BadgeProps {
    tone?: BadgeTone
    children: React.ReactNode
}

export function Badge({ tone = "neutral", children }: BadgeProps): React.ReactElement {
    return <span className={`${styles.base} ${styles.tone[tone]}`}>{children}</span>
}
