import React, { useId } from "react"
import * as styles from "./RadioGroup.styles.css"

export interface RadioGroupOption {
    value: string
    label: React.ReactNode
    /** Secondary line under the option label. */
    description?: React.ReactNode
    disabled?: boolean
}

export interface RadioGroupProps {
    /** Groups the native inputs; defaults to a generated id. */
    name?: string
    value: string | undefined
    onValueChange: (value: string) => void
    options: RadioGroupOption[]
    orientation?: "vertical" | "horizontal"
    disabled?: boolean
    invalid?: boolean
    "aria-label"?: string
}

/**
 * Token-styled radio group over native inputs, so arrow-key navigation and
 * form semantics come from the platform while the dot, ring, and type come
 * from the theme contract. For 2–5 mutually exclusive options where seeing
 * every choice at once beats a Select.
 */
export function RadioGroup({
    name,
    value,
    onValueChange,
    options,
    orientation = "vertical",
    disabled,
    invalid,
    "aria-label": ariaLabel,
}: RadioGroupProps): React.ReactElement {
    const generatedName = useId()
    const groupName = name ?? generatedName
    return (
        <fieldset
            className={`${styles.group} ${styles.orientation[orientation]}`}
            role="radiogroup"
            aria-label={ariaLabel}
            disabled={disabled}
        >
            {options.map((option) => (
                <label
                    key={option.value}
                    className={styles.row}
                    data-disabled={disabled || option.disabled ? "" : undefined}
                >
                    <input
                        type="radio"
                        name={groupName}
                        className={invalid ? `${styles.dot} ${styles.invalid}` : styles.dot}
                        checked={value === option.value}
                        disabled={disabled || option.disabled}
                        onChange={() => onValueChange(option.value)}
                    />
                    <span className={styles.labelColumn}>
                        <span className={styles.labelText}>{option.label}</span>
                        {option.description !== undefined ? (
                            <span className={styles.description}>{option.description}</span>
                        ) : null}
                    </span>
                </label>
            ))}
        </fieldset>
    )
}
