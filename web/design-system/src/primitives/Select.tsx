import * as RadixSelect from "@radix-ui/react-select"
import React from "react"
import * as styles from "./Select.styles.css"

export interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

export interface SelectProps {
    id?: string
    value?: string
    onValueChange?: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
    "aria-label"?: string
}

function ChevronDownIcon(): React.ReactElement {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

/** Radix Select skinned with theme tokens. Value "" is treated as unset. */
export function Select({
    id,
    value,
    onValueChange,
    options,
    placeholder = "Select...",
    disabled,
    invalid,
    "aria-label": ariaLabel,
}: SelectProps): React.ReactElement {
    const triggerClasses = [styles.trigger, invalid ? styles.invalid : undefined].filter(Boolean).join(" ")
    return (
        <RadixSelect.Root
            value={value === "" ? undefined : value}
            onValueChange={onValueChange}
            disabled={disabled}
        >
            <RadixSelect.Trigger id={id} className={triggerClasses} aria-label={ariaLabel}>
                <RadixSelect.Value placeholder={placeholder} />
                <RadixSelect.Icon className={styles.icon}>
                    <ChevronDownIcon />
                </RadixSelect.Icon>
            </RadixSelect.Trigger>
            <RadixSelect.Portal>
                <RadixSelect.Content className={styles.content} position="popper" sideOffset={4}>
                    <RadixSelect.Viewport className={styles.viewport}>
                        {options.map((option) => (
                            <RadixSelect.Item
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                                className={styles.item}
                            >
                                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                            </RadixSelect.Item>
                        ))}
                    </RadixSelect.Viewport>
                </RadixSelect.Content>
            </RadixSelect.Portal>
        </RadixSelect.Root>
    )
}
