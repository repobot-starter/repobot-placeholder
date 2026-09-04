import React from "react"
import { DropdownMenu } from "../primitives/DropdownMenu"
import { Input } from "../primitives/Input"
import { Select, type SelectOption } from "../primitives/Select"
import * as styles from "./FiltersToolbar.styles.css"

export interface FiltersToolbarFilterOption {
    id: string
    label: string
}

export interface FiltersToolbarFilter {
    id: string
    /** Facet name shown on the chip, e.g. "Status". */
    label: string
    options: FiltersToolbarFilterOption[]
    /** Selected option id; undefined means "all". */
    value?: string
    onChange: (optionId: string | undefined) => void
    /** The reset entry label, defaults to "All". */
    allLabel?: string
}

export interface FiltersToolbarSearch {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    "aria-label"?: string
}

export interface FiltersToolbarSort {
    options: SelectOption[]
    value: string
    onChange: (value: string) => void
    "aria-label"?: string
}

export interface FiltersToolbarProps {
    search?: FiltersToolbarSearch
    filters?: FiltersToolbarFilter[]
    sort?: FiltersToolbarSort
    /** Right-aligned slot, e.g. an export Button. */
    trailing?: React.ReactNode
}

function ChevronDownIcon(): React.ReactElement {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

function FilterChip({ filter }: { filter: FiltersToolbarFilter }): React.ReactElement {
    const selected = filter.options.find((option) => option.id === filter.value)
    const items = [
        {
            id: "__all__",
            label: filter.allLabel ?? "All",
            onSelect: () => filter.onChange(undefined),
        },
        ...filter.options.map((option) => ({
            id: option.id,
            label: option.label,
            onSelect: () => filter.onChange(option.id),
        })),
    ]
    return (
        <DropdownMenu
            align="start"
            trigger={
                <button
                    type="button"
                    className={selected ? `${styles.chip} ${styles.chipActive}` : styles.chip}
                >
                    <span className={styles.chipLabel}>{filter.label}</span>
                    {selected ? <span className={styles.chipValue}>{selected.label}</span> : null}
                    <ChevronDownIcon />
                </button>
            }
            items={items}
        />
    )
}

/**
 * The list-page filter strip: search, one dropdown chip per facet, and a
 * sort select. Purely presentational and fully controlled — pass state in,
 * apply the filtering wherever the data lives (usually the query variables).
 */
export function FiltersToolbar({ search, filters, sort, trailing }: FiltersToolbarProps): React.ReactElement {
    return (
        <div className={styles.toolbar} data-rb-widget="filters-toolbar">
            {search ? (
                <div className={styles.searchBox}>
                    <Input
                        type="search"
                        value={search.value}
                        placeholder={search.placeholder ?? "Search..."}
                        onChange={(event) => search.onChange(event.target.value)}
                        aria-label={search["aria-label"] ?? search.placeholder ?? "Search"}
                    />
                </div>
            ) : null}
            {filters && filters.length > 0 ? (
                <div className={styles.chips}>
                    {filters.map((filter) => (
                        <FilterChip key={filter.id} filter={filter} />
                    ))}
                </div>
            ) : null}
            <div className={styles.spacer} />
            {sort ? (
                <div className={styles.sort}>
                    <Select
                        value={sort.value}
                        onValueChange={sort.onChange}
                        options={sort.options}
                        aria-label={sort["aria-label"] ?? "Sort"}
                    />
                </div>
            ) : null}
            {trailing}
        </div>
    )
}
