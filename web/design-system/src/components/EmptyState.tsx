import React from "react"
import * as styles from "./EmptyState.styles.css"

export interface EmptyStateProps {
    title: string
    description?: string
    action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps): React.ReactElement {
    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{title}</h3>
            {description ? <p className={styles.description}>{description}</p> : null}
            {action ? <div className={styles.action}>{action}</div> : null}
        </div>
    )
}
