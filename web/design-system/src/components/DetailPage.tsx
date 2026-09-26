import React from "react"
import { Badge, type BadgeTone } from "../primitives/Badge"
import { Button } from "../primitives/Button"
import { Tabs, type TabsItem } from "../primitives/Tabs"
import * as styles from "./DetailPage.styles.css"

export interface DetailPageMetaItem {
    label: string
    value: React.ReactNode
}

export interface DetailPageProps {
    /** Page heading, e.g. "Order 1042". */
    title: string
    /** Muted line under the title, e.g. the customer or route. */
    subtitle?: string
    /** Status badge beside the title, e.g. { label: "Shipped", tone: "success" }. */
    status?: { label: string; tone?: BadgeTone }
    /** Right-aligned header slot for the record's actions (buttons, menus). */
    actions?: React.ReactNode
    /** Renders a back control above the title (usually navigate(-1) or the list route). */
    onBack?: () => void
    backLabel?: string
    /** Key facts under the header: created date, owner, totals. */
    meta?: DetailPageMetaItem[]
    /** Tabbed content area; omit and pass children for an un-tabbed detail body. */
    tabs?: TabsItem[]
    /** Initial tab when uncontrolled; defaults to the first. */
    defaultTabId?: string
    /** Controlled active tab (e.g. mirrored into the URL); pair with onTabChange. */
    activeTabId?: string
    onTabChange?: (id: string) => void
    /** Un-tabbed detail body, rendered when `tabs` is absent. */
    children?: React.ReactNode
}

/**
 * The drill-down page scaffold: a header block (back control, title, status
 * badge, action slot, key-fact meta row) over a tabbed — or plain — content
 * area. Pages own the data and navigation; this component only lays the
 * archetype out, so an "order detail with tabs" screen is composition, not
 * invention. For a list that stays visible beside the record, reach for
 * ListDetailLayout instead.
 */
export function DetailPage({
    title,
    subtitle,
    status,
    actions,
    onBack,
    backLabel = "Back",
    meta,
    tabs,
    defaultTabId,
    activeTabId,
    onTabChange,
    children,
}: DetailPageProps): React.ReactElement {
    return (
        <section className={styles.container}>
            <header className={styles.header}>
                {onBack ? (
                    <div>
                        <Button variant="ghost" size="sm" onClick={onBack}>
                            &#8592; {backLabel}
                        </Button>
                    </div>
                ) : null}
                <div className={styles.titleRow}>
                    <div className={styles.titleBlock}>
                        <div className={styles.titleLine}>
                            <h1 className={styles.title}>{title}</h1>
                            {status ? <Badge tone={status.tone ?? "neutral"}>{status.label}</Badge> : null}
                        </div>
                        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
                    </div>
                    {actions ? <div className={styles.actions}>{actions}</div> : null}
                </div>
                {meta !== undefined && meta.length > 0 ? (
                    <dl className={styles.metaRow}>
                        {meta.map((item) => (
                            <div key={item.label} className={styles.metaItem}>
                                <dt className={styles.metaLabel}>{item.label}</dt>
                                <dd className={styles.metaValue}>{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                ) : null}
            </header>
            {tabs !== undefined && tabs.length > 0 ? (
                <Tabs
                    items={tabs}
                    defaultId={defaultTabId}
                    value={activeTabId}
                    onValueChange={onTabChange}
                    aria-label={title}
                />
            ) : (
                children
            )}
        </section>
    )
}
