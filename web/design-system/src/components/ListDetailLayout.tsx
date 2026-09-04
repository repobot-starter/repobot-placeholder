import React from "react"
import { Button } from "../primitives/Button"
import { EmptyState } from "./EmptyState"
import * as styles from "./ListDetailLayout.styles.css"

export interface ListDetailLayoutProps {
    /** The master pane: usually a list of selectable rows. */
    list: React.ReactNode
    /** The detail pane for the current selection. */
    detail?: React.ReactNode
    /** Shown in the detail pane when nothing is selected. */
    emptyDetail?: { title: string; description?: string }
    /**
     * On narrow screens only one pane fits; true shows the detail pane.
     * Callers flip this when a row is selected.
     */
    detailOpen?: boolean
    /** Renders a back control on narrow screens to return to the list. */
    onBack?: () => void
    backLabel?: string
    /** Width of the list pane on wide screens, e.g. "20rem". */
    listWidth?: string
}

/**
 * Master-detail split: list on the left, detail on the right, collapsing to
 * one pane at a time on narrow screens. Selection state belongs to the
 * caller — this component only lays the panes out.
 */
export function ListDetailLayout({
    list,
    detail,
    emptyDetail,
    detailOpen = false,
    onBack,
    backLabel = "Back to list",
    listWidth = "20rem",
}: ListDetailLayoutProps): React.ReactElement {
    const listClass = detailOpen ? `${styles.listPane} ${styles.paneHiddenNarrow}` : styles.listPane
    const detailClass = detailOpen ? styles.detailPane : `${styles.detailPane} ${styles.paneHiddenNarrow}`
    return (
        <div
            className={styles.container}
            style={{ gridTemplateColumns: `${listWidth} minmax(0, 1fr)` }}
            data-rb-widget="list-detail"
        >
            <div className={listClass}>{list}</div>
            <div className={detailClass}>
                {onBack ? (
                    <div className={styles.backRow}>
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            &#8592; {backLabel}
                        </Button>
                    </div>
                ) : null}
                {detail ?? (
                    <EmptyState
                        title={emptyDetail?.title ?? "Nothing selected"}
                        description={emptyDetail?.description ?? "Choose an item from the list."}
                    />
                )}
            </div>
        </div>
    )
}
