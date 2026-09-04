import React from "react"
import * as styles from "./Checkbox.styles.css"

export interface CheckboxProps {
    id?: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    /** Clicking the label toggles; omit it to compose your own row. */
    label?: React.ReactNode
    /** Secondary line under the label. */
    description?: React.ReactNode
    disabled?: boolean
    invalid?: boolean
    name?: string
    "aria-label"?: string
}

/**
 * Token-styled checkbox: a native input (`appearance: none`) so keyboard,
 * labels, and form submission behave exactly like the platform control,
 * with the box, check, and focus ring drawn from the theme contract.
 */
export function Checkbox({
    id,
    checked,
    onCheckedChange,
    label,
    description,
    disabled,
    invalid,
    name,
    "aria-label": ariaLabel,
}: CheckboxProps): React.ReactElement {
    const input = (
        <input
            id={id}
            type="checkbox"
            name={name}
            className={invalid ? `${styles.box} ${styles.invalid}` : styles.box}
            checked={checked}
            disabled={disabled}
            aria-label={ariaLabel}
            onChange={(event) => onCheckedChange(event.target.checked)}
        />
    )
    if (label === undefined) {
        return input
    }
    return (
        <label className={styles.row} data-disabled={disabled ? "" : undefined}>
            {input}
            <span className={styles.labelColumn}>
                <span className={styles.labelText}>{label}</span>
                {description !== undefined ? <span className={styles.description}>{description}</span> : null}
            </span>
        </label>
    )
}
