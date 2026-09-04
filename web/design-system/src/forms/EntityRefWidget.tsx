import type { WidgetProps } from "@rjsf/utils"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "../primitives/Input"
import { Spinner } from "../primitives/Spinner"
import * as styles from "./EntityRefWidget.styles.css"

export interface SchemaFormReferenceOption {
    value: string
    label: string
    /** Optional secondary line in the dropdown (e.g. a port's country). */
    description?: string
}

export interface SchemaFormQuickCreate {
    /** Link label beside the field, e.g. "+ Add customer". */
    label: string
    /**
     * App-owned create flow — usually a nested create-form modal over the
     * entity's own SchemaForm. Resolves to the created option (which the
     * field selects immediately) or null when the user cancels.
     */
    run: () => Promise<SchemaFormReferenceOption | null>
}

/**
 * The app-side data hookup for one `entityRef` reference key. The design
 * system stays domain-agnostic: the backend's uiSchema names the reference
 * ("customers", "ports"...) and the app maps each name to live queries.
 */
export interface SchemaFormReferenceResolver {
    /** Search options as the user types; an empty query returns initial suggestions. */
    search: (query: string) => Promise<SchemaFormReferenceOption[]>
    /** Resolve a stored value to its option, for labels on edit-form defaults. */
    resolve?: (value: string) => Promise<SchemaFormReferenceOption | null>
    /** Quick-create flow, rendered when the uiSchema sets `allowCreate`. */
    create?: SchemaFormQuickCreate
}

export type SchemaFormReferenceResolvers = Record<string, SchemaFormReferenceResolver>

/** The runtime's rjsf formContext shape (see SchemaFormRuntime). */
export interface SchemaFormRuntimeFormContext {
    referenceResolvers?: SchemaFormReferenceResolvers
}

const SEARCH_DEBOUNCE_MS = 200

/**
 * `"ui:widget": "entityRef"` — a searchable reference picker over live app
 * data. The uiSchema names the reference and the host supplies a resolver:
 *
 *     "ui:widget": "entityRef",
 *     "ui:options": { "reference": "customers", "allowCreate": true }
 *
 * Without a registered resolver the widget falls back to the plain select
 * over the schema's enum snapshot (when present), so backend-snapshot forms
 * keep working while the app wires resolvers up.
 */
export function EntityRefWidget(props: WidgetProps): React.ReactElement {
    const referenceKey = typeof props.options.reference === "string" ? props.options.reference : ""
    const formContext = props.registry.formContext as SchemaFormRuntimeFormContext | undefined
    const resolver = formContext?.referenceResolvers?.[referenceKey]

    if (resolver === undefined) {
        const FallbackSelect = props.registry.widgets.SelectWidget
        return <FallbackSelect {...props} />
    }
    return <EntityRefCombobox {...props} resolver={resolver} />
}

function EntityRefCombobox(
    props: WidgetProps & { resolver: SchemaFormReferenceResolver },
): React.ReactElement {
    const { resolver } = props
    const disabled = props.disabled === true || props.readonly === true
    const allowCreate = props.options.allowCreate === true && resolver.create !== undefined

    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [options, setOptions] = useState<SchemaFormReferenceOption[]>([])
    const [loading, setLoading] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [creating, setCreating] = useState(false)
    // Labels we've learned for values, so the closed field can display them.
    const labelCacheRef = useRef(new Map<string, string>())
    const [selectedLabel, setSelectedLabel] = useState<string>("")
    const containerRef = useRef<HTMLDivElement>(null)
    const searchTokenRef = useRef(0)

    const value = typeof props.value === "string" ? props.value : ""

    // Resolve the display label whenever the stored value changes from
    // outside (edit-form defaults, quick-create selection, derivations).
    useEffect(() => {
        if (value === "") {
            setSelectedLabel("")
            return
        }
        const cached = labelCacheRef.current.get(value)
        if (cached !== undefined) {
            setSelectedLabel(cached)
            return
        }
        if (resolver.resolve === undefined) {
            setSelectedLabel(value)
            return
        }
        let cancelled = false
        void resolver.resolve(value).then((option) => {
            if (cancelled) {
                return
            }
            const label = option?.label ?? value
            labelCacheRef.current.set(value, label)
            setSelectedLabel(label)
        })
        return () => {
            cancelled = true
        }
    }, [value, resolver])

    // Debounced search while the dropdown is open.
    useEffect(() => {
        if (!open) {
            return
        }
        const token = ++searchTokenRef.current
        setLoading(true)
        const timer = window.setTimeout(() => {
            void resolver
                .search(query)
                .then((results) => {
                    if (searchTokenRef.current !== token) {
                        return
                    }
                    setOptions(results)
                    setActiveIndex(results.length > 0 ? 0 : -1)
                })
                .finally(() => {
                    if (searchTokenRef.current === token) {
                        setLoading(false)
                    }
                })
        }, SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(timer)
    }, [open, query, resolver])

    const select = useCallback(
        (option: SchemaFormReferenceOption): void => {
            labelCacheRef.current.set(option.value, option.label)
            setSelectedLabel(option.label)
            setOpen(false)
            setQuery("")
            props.onChange(option.value)
        },
        [props],
    )

    const close = useCallback((): void => {
        setOpen(false)
        setQuery("")
    }, [])

    const handleQuickCreate = async (): Promise<void> => {
        if (resolver.create === undefined || creating) {
            return
        }
        setCreating(true)
        try {
            const created = await resolver.create.run()
            if (created !== null) {
                select(created)
            }
        } finally {
            setCreating(false)
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
            setOpen(true)
            return
        }
        if (event.key === "ArrowDown") {
            event.preventDefault()
            setActiveIndex((current) => Math.min(current + 1, options.length - 1))
        } else if (event.key === "ArrowUp") {
            event.preventDefault()
            setActiveIndex((current) => Math.max(current - 1, 0))
        } else if (event.key === "Enter") {
            event.preventDefault()
            const option = options[activeIndex]
            if (option !== undefined) {
                select(option)
            }
        } else if (event.key === "Escape") {
            close()
        }
    }

    return (
        <div
            ref={containerRef}
            className={styles.container}
            onBlur={(event) => {
                // Only close when focus leaves the whole combobox (the
                // dropdown options are buttons inside this container).
                if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
                    close()
                }
            }}
        >
            <Input
                id={props.id}
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
                aria-label={props.label}
                value={open ? query : selectedLabel}
                placeholder={
                    props.placeholder !== undefined && props.placeholder !== ""
                        ? props.placeholder
                        : "Search..."
                }
                disabled={disabled}
                invalid={(props.rawErrors ?? []).length > 0}
                autoComplete="off"
                onFocus={() => setOpen(true)}
                onChange={(event) => {
                    setQuery(event.target.value)
                    if (!open) {
                        setOpen(true)
                    }
                }}
                onKeyDown={handleKeyDown}
            />
            {open ? (
                <div className={styles.dropdown} role="listbox">
                    {loading ? (
                        <div className={styles.dropdownStatus}>
                            <Spinner size="sm" /> Searching...
                        </div>
                    ) : null}
                    {!loading && options.length === 0 ? (
                        <div className={styles.dropdownStatus}>No matches.</div>
                    ) : null}
                    {options.map((option, index) => (
                        <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={option.value === value}
                            className={`${styles.option}${index === activeIndex ? ` ${styles.optionActive}` : ""}`}
                            // preventDefault keeps the input focused so the
                            // container blur handler doesn't race the click.
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => select(option)}
                        >
                            <span className={styles.optionLabel}>{option.label}</span>
                            {option.description !== undefined ? (
                                <span className={styles.optionDescription}>{option.description}</span>
                            ) : null}
                        </button>
                    ))}
                </div>
            ) : null}
            {allowCreate ? (
                <div className={styles.createRow}>
                    <button
                        type="button"
                        className={styles.createLink}
                        disabled={disabled || creating}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => void handleQuickCreate()}
                    >
                        {creating ? "Creating..." : resolver.create!.label}
                    </button>
                </div>
            ) : null}
        </div>
    )
}
