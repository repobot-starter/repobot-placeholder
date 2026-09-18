import React from "react"
import * as styles from "./Switch.styles.css"

export interface SwitchProps {
    id?: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    /** Clicking the label toggles; omit it to compose your own row. */
    label?: React.ReactNode
    disabled?: boolean
    "aria-label"?: string
}

/**
 * Token-styled toggle (`role="switch"` button) for boolean settings that
 * apply immediately — feature flags, notification toggles. In a form that
 * saves on submit, prefer Checkbox; the switch idiom promises instant effect.
 */
export function Switch({
    id,
    checked,
    onCheckedChange,
    label,
    disabled,
    "aria-label": ariaLabel,
}: SwitchProps): React.ReactElement {
    const control = (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            className={styles.track}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
        >
            <span className={styles.thumb} />
        </button>
    )
    if (label === undefined) {
        return control
    }
    return (
        <label className={styles.row} data-disabled={disabled ? "" : undefined}>
            {control}
            <span className={styles.labelText}>{label}</span>
        </label>
    )
}
