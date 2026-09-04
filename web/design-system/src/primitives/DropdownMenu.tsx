import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import React from "react"
import * as styles from "./DropdownMenu.styles.css"

export interface DropdownMenuItem {
    id: string
    label: string
    danger?: boolean
    disabled?: boolean
    onSelect: () => void
}

export interface DropdownMenuProps {
    trigger: React.ReactNode
    items: DropdownMenuItem[]
    align?: "start" | "center" | "end"
}

/** Radix DropdownMenu skinned with theme tokens. Trigger must be a focusable element. */
export function DropdownMenu({ trigger, items, align = "end" }: DropdownMenuProps): React.ReactElement {
    return (
        <RadixDropdownMenu.Root>
            <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
            <RadixDropdownMenu.Portal>
                <RadixDropdownMenu.Content className={styles.content} align={align} sideOffset={4}>
                    {items.map((item) => (
                        <RadixDropdownMenu.Item
                            key={item.id}
                            className={[styles.item, item.danger ? styles.dangerItem : undefined]
                                .filter(Boolean)
                                .join(" ")}
                            disabled={item.disabled}
                            onSelect={() => item.onSelect()}
                        >
                            {item.label}
                        </RadixDropdownMenu.Item>
                    ))}
                </RadixDropdownMenu.Content>
            </RadixDropdownMenu.Portal>
        </RadixDropdownMenu.Root>
    )
}
