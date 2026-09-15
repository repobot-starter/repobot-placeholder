import React, { useEffect, useState } from "react"
import { Button } from "../primitives/Button"
import { Dialog } from "../primitives/Dialog"
import * as styles from "./DataTableColumnManager.styles.css"

export interface ColumnSettings {
    /** Column ids in display order (every column appears exactly once). */
    order: string[]
    hiddenIds: string[]
}

export interface DataTableColumnManagerProps {
    open: boolean
    onClose: () => void
    /** Column headers by id, for labels. */
    labels: ReadonlyMap<string, string>
    settings: ColumnSettings
    defaultSettings: ColumnSettings
    onSave: (settings: ColumnSettings) => void
}

/**
 * The "Columns" dialog: show/hide and reorder the table's columns. The
 * parent owns persistence (DataTable stores per-tableId in localStorage).
 */
export function DataTableColumnManager({
    open,
    onClose,
    labels,
    settings,
    defaultSettings,
    onSave,
}: DataTableColumnManagerProps): React.ReactElement {
    const [draft, setDraft] = useState<ColumnSettings>(settings)
    useEffect(() => {
        if (open) {
            setDraft(settings)
        }
    }, [open, settings])

    const toggleHidden = (columnId: string): void => {
        setDraft((current) => ({
            ...current,
            hiddenIds: current.hiddenIds.includes(columnId)
                ? current.hiddenIds.filter((id) => id !== columnId)
                : [...current.hiddenIds, columnId],
        }))
    }

    const move = (columnId: string, delta: -1 | 1): void => {
        setDraft((current) => {
            const index = current.order.indexOf(columnId)
            const target = index + delta
            if (index < 0 || target < 0 || target >= current.order.length) {
                return current
            }
            const order = [...current.order]
            order[index] = order[target]
            order[target] = columnId
            return { ...current, order }
        })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose()
                }
            }}
            title="Columns"
            description="Choose which columns show and their order."
            size="skinny"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setDraft(defaultSettings)}>
                        Reset
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            onSave(draft)
                            onClose()
                        }}
                    >
                        Save
                    </Button>
                </>
            }
        >
            <ul className={styles.list}>
                {draft.order.map((columnId, index) => (
                    <li key={columnId} className={styles.item}>
                        <label className={styles.itemLabel}>
                            <input
                                type="checkbox"
                                checked={!draft.hiddenIds.includes(columnId)}
                                onChange={() => toggleHidden(columnId)}
                            />
                            <span>{labels.get(columnId) ?? columnId}</span>
                        </label>
                        <span className={styles.itemControls}>
                            <button
                                type="button"
                                className={styles.moveButton}
                                aria-label={`Move ${labels.get(columnId) ?? columnId} up`}
                                disabled={index === 0}
                                onClick={() => move(columnId, -1)}
                            >
                                &#8593;
                            </button>
                            <button
                                type="button"
                                className={styles.moveButton}
                                aria-label={`Move ${labels.get(columnId) ?? columnId} down`}
                                disabled={index === draft.order.length - 1}
                                onClick={() => move(columnId, 1)}
                            >
                                &#8595;
                            </button>
                        </span>
                    </li>
                ))}
            </ul>
        </Dialog>
    )
}
