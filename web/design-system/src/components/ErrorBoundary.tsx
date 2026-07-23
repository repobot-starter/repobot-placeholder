import React from "react"
import { Button } from "../primitives/Button"
import * as styles from "./ErrorBoundary.styles.css"

export interface ErrorPanelProps {
    title?: string
    message: string
    onRetry?: () => void
}

/** Standalone error panel; also used by UiQueryView for query errors. */
export function ErrorPanel({
    title = "Something went wrong",
    message,
    onRetry,
}: ErrorPanelProps): React.ReactElement {
    return (
        <div role="alert" className={styles.panel}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.message}>{message}</p>
            {onRetry ? (
                <div className={styles.actions}>
                    <Button variant="secondary" size="sm" onClick={onRetry}>
                        Try again
                    </Button>
                </div>
            ) : null}
        </div>
    )
}

export interface ErrorBoundaryProps {
    /** Custom fallback; defaults to an ErrorPanel with a reset button. */
    fallback?: (error: Error, reset: () => void) => React.ReactNode
    children: React.ReactNode
}

interface ErrorBoundaryState {
    error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error }
    }

    private reset = (): void => {
        this.setState({ error: null })
    }

    render(): React.ReactNode {
        const { error } = this.state
        if (error === null) {
            return this.props.children
        }
        if (this.props.fallback) {
            return this.props.fallback(error, this.reset)
        }
        return <ErrorPanel message={error.message} onRetry={this.reset} />
    }
}
