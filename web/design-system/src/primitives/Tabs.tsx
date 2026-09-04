import * as RadixTabs from "@radix-ui/react-tabs"
import React from "react"
import * as styles from "./Tabs.styles.css"

export interface TabsItem {
    id: string
    label: React.ReactNode
    content: React.ReactNode
    disabled?: boolean
}

export interface TabsProps {
    items: TabsItem[]
    /** Initial tab when uncontrolled; defaults to the first item. */
    defaultId?: string
    /** Controlled selected tab; pair with onValueChange. */
    value?: string
    onValueChange?: (id: string) => void
    "aria-label"?: string
}

/**
 * Radix Tabs skinned with theme tokens: an underline tab list over a plain
 * content region. Keyboard model (arrow keys, automatic activation) and the
 * tablist/tab/tabpanel roles are inherited from Radix. Content-level
 * switching only — route-level sections belong in the AppShell nav.
 */
export function Tabs({
    items,
    defaultId,
    value,
    onValueChange,
    "aria-label": ariaLabel,
}: TabsProps): React.ReactElement {
    return (
        <RadixTabs.Root
            className={styles.root}
            defaultValue={value === undefined ? (defaultId ?? items[0]?.id) : undefined}
            value={value}
            onValueChange={onValueChange}
        >
            <RadixTabs.List className={styles.list} aria-label={ariaLabel}>
                {items.map((item) => (
                    <RadixTabs.Trigger
                        key={item.id}
                        value={item.id}
                        disabled={item.disabled}
                        className={styles.trigger}
                    >
                        {item.label}
                    </RadixTabs.Trigger>
                ))}
            </RadixTabs.List>
            {items.map((item) => (
                <RadixTabs.Content key={item.id} value={item.id} className={styles.content}>
                    {item.content}
                </RadixTabs.Content>
            ))}
        </RadixTabs.Root>
    )
}
