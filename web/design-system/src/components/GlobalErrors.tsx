import React, { useEffect, useState, useSyncExternalStore } from "react"
import { type UiErrorPresentation } from "../theme/themeConfig"
import { useThemeContract } from "../theme/themeHotUpdate"
import { Button } from "../primitives/Button"
import {
    dismissAllGlobalErrors,
    dismissGlobalError,
    getGlobalErrors,
    subscribeGlobalErrors,
    type GlobalErrorEntry,
} from "./globalErrorStore"
import * as styles from "./GlobalErrors.styles.css"

export interface GlobalErrorsProps {
    /**
     * Overrides the repobot.theme.json `ui.errors.presentation` preset for
     * this mount: "modal" centers a stacking, pageable dialog over the app;
     * "corner" stacks dismissible cards bottom-right.
     */
    presentation?: UiErrorPresentation
}

/**
 * The app's single global error surface. Mount once near the root (inside
 * UiThemeProvider) and publish failures from anywhere via
 * publishGlobalError() — components never need bespoke error UI for
 * unexpected failures. Errors stack and persist until dismissed; the modal
 * variant pages through the stack with prev/next.
 */
export function GlobalErrors({ presentation }: GlobalErrorsProps): React.ReactElement | null {
    const entries = useSyncExternalStore(subscribeGlobalErrors, getGlobalErrors, getGlobalErrors)
    const { ui } = useThemeContract()
    const resolved = presentation ?? ui.errors.presentation
    if (entries.length === 0) {
        return null
    }
    return resolved === "modal" ? <ErrorModal entries={entries} /> : <ErrorCorner entries={entries} />
}

function ErrorModal({ entries }: { entries: readonly GlobalErrorEntry[] }): React.ReactElement {
    const [index, setIndex] = useState(0)

    // Clamp when dismissals shrink the stack (new arrivals append; stay put).
    const activeIndex = Math.min(index, entries.length - 1)
    useEffect(() => {
        if (index !== activeIndex) {
            setIndex(activeIndex)
        }
    }, [index, activeIndex])

    const entry = entries[activeIndex]
    return (
        <div className={styles.overlay}>
            <div
                role="alertdialog"
                aria-modal="true"
                aria-label={entry.title ?? "Error"}
                className={styles.modal}
            >
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>{entry.title ?? "Something went wrong"}</span>
                    {entries.length > 1 ? (
                        <span className={styles.pager}>
                            <button
                                type="button"
                                className={styles.pagerButton}
                                aria-label="Previous error"
                                disabled={activeIndex === 0}
                                onClick={() => setIndex(activeIndex - 1)}
                            >
                                &#8249;
                            </button>
                            <span className={styles.pagerLabel}>
                                {activeIndex + 1} of {entries.length}
                            </span>
                            <button
                                type="button"
                                className={styles.pagerButton}
                                aria-label="Next error"
                                disabled={activeIndex === entries.length - 1}
                                onClick={() => setIndex(activeIndex + 1)}
                            >
                                &#8250;
                            </button>
                        </span>
                    ) : null}
                </div>
                <p className={styles.message}>{entry.message}</p>
                {entry.detail ? <pre className={styles.detail}>{entry.detail}</pre> : null}
                <div className={styles.modalFooter}>
                    {entries.length > 1 ? (
                        <Button variant="ghost" onClick={() => dismissAllGlobalErrors()}>
                            Dismiss all
                        </Button>
                    ) : null}
                    <Button variant="primary" onClick={() => dismissGlobalError(entry.id)}>
                        Dismiss
                    </Button>
                </div>
            </div>
        </div>
    )
}

function ErrorCorner({ entries }: { entries: readonly GlobalErrorEntry[] }): React.ReactElement {
    return (
        <div className={styles.cornerViewport} role="region" aria-label="Errors">
            {entries.length > 1 ? (
                <button
                    type="button"
                    className={styles.cornerDismissAll}
                    onClick={() => dismissAllGlobalErrors()}
                >
                    Dismiss all ({entries.length})
                </button>
            ) : null}
            {entries.map((entry) => (
                <div key={entry.id} role="alert" className={styles.cornerCard}>
                    <div className={styles.cornerBody}>
                        <span className={styles.cornerTitle}>{entry.title ?? "Something went wrong"}</span>
                        <span className={styles.cornerMessage}>{entry.message}</span>
                    </div>
                    <button
                        type="button"
                        className={styles.cornerDismiss}
                        aria-label="Dismiss"
                        onClick={() => dismissGlobalError(entry.id)}
                    >
                        &#215;
                    </button>
                </div>
            ))}
        </div>
    )
}
