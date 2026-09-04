import React from "react"
import * as styles from "./SettingsGroups.styles.css"

export interface SettingsGroupsProps {
    children: React.ReactNode
}

/** The vertical stack of SettingsGroup cards a settings page is made of. */
export function SettingsGroups({ children }: SettingsGroupsProps): React.ReactElement {
    return (
        <div className={styles.groups} data-rb-widget="settings-groups">
            {children}
        </div>
    )
}

export interface SettingsGroupProps {
    title: string
    description?: string
    /** Rows or a form — usually SettingsRow children. */
    children: React.ReactNode
    /** Card footer, right-aligned — typically the Save button. */
    footer?: React.ReactNode
    /** Renders the card in a destructive tone (e.g. "Danger zone"). */
    danger?: boolean
}

/** One titled card of related settings. */
export function SettingsGroup({
    title,
    description,
    children,
    footer,
    danger,
}: SettingsGroupProps): React.ReactElement {
    return (
        <section className={danger ? `${styles.group} ${styles.groupDanger}` : styles.group}>
            <header className={styles.groupHeader}>
                <h2
                    className={danger ? `${styles.groupTitle} ${styles.groupTitleDanger}` : styles.groupTitle}
                >
                    {title}
                </h2>
                {description ? <p className={styles.groupDescription}>{description}</p> : null}
            </header>
            <div className={styles.groupBody}>{children}</div>
            {footer ? <footer className={styles.groupFooter}>{footer}</footer> : null}
        </section>
    )
}

export interface SettingsRowProps {
    label: string
    description?: string
    /** The control: an Input, Select, Button, toggle, etc. */
    children: React.ReactNode
    /** Associates the label with the control for accessibility. */
    htmlFor?: string
}

/** Label-and-control row inside a SettingsGroup. */
export function SettingsRow({ label, description, children, htmlFor }: SettingsRowProps): React.ReactElement {
    return (
        <div className={styles.row}>
            <div className={styles.rowText}>
                <label className={styles.rowLabel} htmlFor={htmlFor}>
                    {label}
                </label>
                {description ? <p className={styles.rowDescription}>{description}</p> : null}
            </div>
            <div className={styles.rowControl}>{children}</div>
        </div>
    )
}
