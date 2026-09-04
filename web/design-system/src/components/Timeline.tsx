import React from "react"
import { EmptyState, type EmptyStateProps } from "./EmptyState"
import * as styles from "./Timeline.styles.css"

export type TimelineTone = "neutral" | "success" | "danger" | "warning" | "info" | "accent"

export interface TimelineChange {
    /** The field that changed, e.g. "Status". */
    label: string
    /** The old value; omit when the field was first set. */
    before?: React.ReactNode
    /** The new value; omit when the field was cleared. */
    after?: React.ReactNode
}

export interface TimelineEntry {
    id: string
    /** Already-formatted timestamp, right-aligned, e.g. "Mar 4, 14:02". */
    timestamp: string
    /** Who did it, e.g. "Dana Reyes". */
    actor?: string
    /** What happened, e.g. "Status changed". */
    title: string
    description?: string
    /** Colors the entry's marker dot; defaults to neutral. */
    tone?: TimelineTone
    /** Field-level value diffs, rendered as before -> after pairs. */
    changes?: TimelineChange[]
}

export interface TimelineProps {
    /** Newest-first or oldest-first is the caller's ordering choice. */
    entries: TimelineEntry[]
    /** Shown when entries is empty. */
    emptyState?: Pick<EmptyStateProps, "title" | "description">
}

/**
 * The change-log surface: entries over time with who/when/what and optional
 * before -> after value pairs — an audit trail on an order detail tab, or the
 * body of a "History" dialog. Purely presentational: callers shape their
 * domain events into entries (and format timestamps) before passing them in.
 * For a plain "recent events" card without diffs, ActivityFeed is lighter.
 */
export function Timeline({ entries, emptyState }: TimelineProps): React.ReactElement {
    if (entries.length === 0) {
        return (
            <EmptyState title={emptyState?.title ?? "No history yet"} description={emptyState?.description} />
        )
    }
    return (
        <ol className={styles.list}>
            {entries.map((entry) => (
                <li key={entry.id} className={styles.entry}>
                    <span className={`${styles.marker} ${styles.markerTone[entry.tone ?? "neutral"]}`} />
                    <div className={styles.body}>
                        <div className={styles.headerRow}>
                            <span className={styles.title}>{entry.title}</span>
                            <span className={styles.timestamp}>{entry.timestamp}</span>
                        </div>
                        {entry.actor !== undefined ? (
                            <span className={styles.actor}>{entry.actor}</span>
                        ) : null}
                        {entry.description !== undefined ? (
                            <p className={styles.description}>{entry.description}</p>
                        ) : null}
                        {entry.changes !== undefined && entry.changes.length > 0 ? (
                            <ul className={styles.changes}>
                                {entry.changes.map((change) => (
                                    <li key={change.label} className={styles.change}>
                                        <span className={styles.changeLabel}>{change.label}</span>
                                        {change.before !== undefined ? (
                                            <span className={styles.changeBefore}>{change.before}</span>
                                        ) : null}
                                        {change.before !== undefined && change.after !== undefined ? (
                                            <span className={styles.changeArrow} aria-hidden="true">
                                                &#8594;
                                            </span>
                                        ) : null}
                                        {change.after !== undefined ? (
                                            <span className={styles.changeAfter}>{change.after}</span>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                </li>
            ))}
        </ol>
    )
}
