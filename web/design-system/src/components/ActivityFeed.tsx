import React from "react"
import { Badge, type BadgeTone } from "../primitives/Badge"
import { EmptyState, type EmptyStateProps } from "./EmptyState"
import * as styles from "./ActivityFeed.styles.css"

export interface ActivityFeedItem {
    id: string
    /** Primary line, e.g. "Order 1042 shipped". */
    title: string
    /** Secondary line, e.g. "by Dana Reyes". */
    meta?: string
    /** Already-formatted timestamp, right-aligned. */
    timestamp?: string
    badge?: { label: string; tone?: BadgeTone }
    /** Optional leading visual (an icon or avatar), sized by the caller. */
    icon?: React.ReactNode
}

export interface ActivityFeedProps {
    items: ActivityFeedItem[]
    /** Shown when items is empty. */
    emptyState?: Pick<EmptyStateProps, "title" | "description">
}

/**
 * A vertical list of recent events — the "Recent activity" card body on a
 * dashboard. Purely presentational: callers shape their domain events into
 * items (and format timestamps) before passing them in.
 */
export function ActivityFeed({ items, emptyState }: ActivityFeedProps): React.ReactElement {
    if (items.length === 0) {
        return (
            <EmptyState
                title={emptyState?.title ?? "No activity yet"}
                description={emptyState?.description}
            />
        )
    }
    return (
        <ul className={styles.list} data-rb-widget="activity-feed">
            {items.map((item) => (
                <li key={item.id} className={styles.row}>
                    {item.icon ? <span className={styles.icon}>{item.icon}</span> : null}
                    <div className={styles.body}>
                        <span className={styles.title}>{item.title}</span>
                        {item.meta ? <span className={styles.meta}>{item.meta}</span> : null}
                    </div>
                    {item.badge ? (
                        <Badge tone={item.badge.tone ?? "neutral"}>{item.badge.label}</Badge>
                    ) : null}
                    {item.timestamp ? <span className={styles.timestamp}>{item.timestamp}</span> : null}
                </li>
            ))}
        </ul>
    )
}
