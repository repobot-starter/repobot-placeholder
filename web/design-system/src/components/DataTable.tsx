import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "../primitives/Button"
import { DropdownMenu, type DropdownMenuItem } from "../primitives/DropdownMenu"
import { type UiTablePagination, type UiTableStyle } from "../theme/themeConfig"
import { useThemeContract } from "../theme/themeHotUpdate"
import * as styles from "./DataTable.styles.css"
import { DataTableColumnManager, type ColumnSettings } from "./DataTableColumnManager"
import { buildCsv, downloadCsv } from "./dataTableCsv"

export type DataTableSortDirection = "asc" | "desc"

export interface DataTableSort {
    columnId: string
    direction: DataTableSortDirection
}

export interface DataTableColumnFilterOption {
    value: string
    label: string
}

export type DataTableColumnFilter =
    { type: "text" } | { type: "select"; options: DataTableColumnFilterOption[] }

export interface DataTableInlineEdit<TRow> {
    /** The editable raw value shown in the input. */
    value: (row: TRow) => string
    /** Persist the edit (usually a mutation). Rejections keep the cell in edit mode. */
    onCommit: (row: TRow, value: string) => void | Promise<void>
}

export interface DataTableColumn<TRow> {
    id: string
    header: string
    width?: number | string
    render: (row: TRow) => React.ReactNode
    /**
     * Makes the column header sortable. With `onSortChange` on the table the
     * sort is controlled (re-query server-side); without it, rows are sorted
     * in place by this value.
     */
    sortValue?: (row: TRow) => string | number
    /** Marks a controlled-sort column that has no client-side sort value. */
    sortable?: boolean
    /** Sticks the column to the left edge under horizontal scroll. */
    pinned?: "left"
    /** Start hidden; users reveal it via the column manager. */
    hiddenByDefault?: boolean
    /** Renders a filter input under the header (client-side over the given rows). */
    filter?: DataTableColumnFilter
    /** Plain value for filtering and CSV export; defaults to `sortValue`. */
    exportValue?: (row: TRow) => string | number
    /** Click-to-edit for this column's cells. */
    editable?: DataTableInlineEdit<TRow>
}

export interface DataTableExpandable<TRow> {
    /**
     * The detail region rendered full-width under an expanded row — child
     * tables (a contract's containers), summaries, anything.
     */
    renderExpanded: (row: TRow) => React.ReactNode
    /** Rows without detail render no chevron. Defaults to every row expandable. */
    isExpandable?: (row: TRow) => boolean
}

export interface DataTablePaginationProps {
    /** Overrides the repobot.theme.json `ui.table.pagination` preset. */
    mode?: UiTablePagination
    /** Rows per page (or per "Load more" increment). Default 25. */
    pageSize?: number
    /** Server has rows beyond those provided; exhausting them calls onLoadMore. */
    hasNextPage?: boolean
    onLoadMore?: () => void
    loadingMore?: boolean
}

export interface DataTableProps<TRow extends { id: string }> {
    columns: DataTableColumn<TRow>[]
    rows: TRow[]
    /** When provided, a trailing "..." menu column is rendered per row. */
    rowActions?: (row: TRow) => DropdownMenuItem[]
    /**
     * Master-detail rows: a leading chevron column toggles a full-width
     * detail region under the row (e.g. a contract's containers as a nested
     * mini-table). Works with sorting, pagination, and every table style.
     */
    expandable?: DataTableExpandable<TRow>
    /** Current sort, for controlled sorting. */
    sort?: DataTableSort
    /**
     * Controlled-sort callback: re-sort the data (usually via query
     * variables) and pass the new `sort` back in. When absent, sortable
     * columns with a `sortValue` sort client-side.
     */
    onSortChange?: (sort: DataTableSort) => void
    /**
     * Visual weight, defaulting to the repobot.theme.json `ui.table.style`
     * preset: "minimalist" (hairlines, no chrome), "standard" (bordered
     * card), "detailed" (dense rows, sticky header, column dividers — the
     * data-heavy back-office treatment, which also turns on the column
     * manager, CSV export, and focus mode by default).
     */
    style?: UiTableStyle
    /**
     * Stable identity for this table (e.g. "orders"). Enables persisting
     * column-manager choices in localStorage and names the CSV export.
     */
    tableId?: string
    /** Paginate the provided rows; omit to render them all. */
    pagination?: DataTablePaginationProps
    /** Force the column manager on/off (defaults on for detailed style). */
    enableColumnManager?: boolean
    /** Force CSV export on/off (defaults on for detailed style). */
    enableCsvExport?: boolean
    /** Force the fullscreen focus toggle on/off (defaults on for detailed style). */
    enableFullscreen?: boolean
}

function isSortable<TRow>(column: DataTableColumn<TRow>, controlled: boolean): boolean {
    return column.sortValue !== undefined || (controlled && column.sortable === true)
}

function compareValues(a: string | number, b: string | number): number {
    if (typeof a === "number" && typeof b === "number") {
        return a - b
    }
    return String(a).localeCompare(String(b))
}

function plainValue<TRow>(column: DataTableColumn<TRow>, row: TRow): string {
    const value = column.exportValue?.(row) ?? column.sortValue?.(row)
    if (value !== undefined) {
        return String(value)
    }
    const rendered = column.render(row)
    return typeof rendered === "string" || typeof rendered === "number" ? String(rendered) : ""
}

const COLUMN_SETTINGS_STORAGE_PREFIX = "base.table."

function defaultColumnSettings<TRow>(columns: DataTableColumn<TRow>[]): ColumnSettings {
    return {
        order: columns.map((column) => column.id),
        hiddenIds: columns.filter((column) => column.hiddenByDefault === true).map((column) => column.id),
    }
}

/** Loads saved settings, reconciled against the current column set (schema drift-safe). */
function loadColumnSettings<TRow>(
    tableId: string | undefined,
    columns: DataTableColumn<TRow>[],
): ColumnSettings {
    const defaults = defaultColumnSettings(columns)
    if (tableId === undefined || typeof window === "undefined") {
        return defaults
    }
    try {
        const raw = window.localStorage.getItem(`${COLUMN_SETTINGS_STORAGE_PREFIX}${tableId}.columns.v1`)
        if (raw === null) {
            return defaults
        }
        const parsed = JSON.parse(raw) as ColumnSettings
        const known = new Set(defaults.order)
        const order = parsed.order.filter((id) => known.has(id))
        for (const id of defaults.order) {
            if (!order.includes(id)) {
                order.push(id)
            }
        }
        return { order, hiddenIds: parsed.hiddenIds.filter((id) => known.has(id)) }
    } catch {
        return defaults
    }
}

function saveColumnSettings(tableId: string | undefined, settings: ColumnSettings): void {
    if (tableId === undefined || typeof window === "undefined") {
        return
    }
    try {
        window.localStorage.setItem(
            `${COLUMN_SETTINGS_STORAGE_PREFIX}${tableId}.columns.v1`,
            JSON.stringify(settings),
        )
    } catch {
        // Storage may be unavailable; settings still apply in-memory.
    }
}

const DEFAULT_PAGE_SIZE = 25
const DEFAULT_PINNED_WIDTH = 160
const EXPANDER_WIDTH = 36

/**
 * Generic typed table. Data shaping (formatting, badges) belongs in column
 * render functions. Style, pagination, and the detailed-mode extras (column
 * manager, per-column filters, pinned columns, inline editing, CSV export,
 * fullscreen focus) all default from the repobot.theme.json `ui.table`
 * presets — prefer changing the contract over passing props everywhere.
 */
export function DataTable<TRow extends { id: string }>({
    columns,
    rows,
    rowActions,
    expandable,
    sort,
    onSortChange,
    style,
    tableId,
    pagination,
    enableColumnManager,
    enableCsvExport,
    enableFullscreen,
}: DataTableProps<TRow>): React.ReactElement {
    const { ui } = useThemeContract()
    const resolvedStyle = style ?? ui.table.style
    const hasActions = rowActions !== undefined
    const hasExpander = expandable !== undefined
    const controlled = onSortChange !== undefined
    const [internalSort, setInternalSort] = useState<DataTableSort | undefined>(undefined)
    const activeSort = controlled ? sort : (internalSort ?? sort)

    const showColumnManager = enableColumnManager ?? resolvedStyle === "detailed"
    const showCsvExport = enableCsvExport ?? resolvedStyle === "detailed"
    const showFullscreen = enableFullscreen ?? resolvedStyle === "detailed"

    /* ---------------------- column settings ---------------------- */

    const [columnSettings, setColumnSettings] = useState<ColumnSettings>(() =>
        loadColumnSettings(tableId, columns),
    )
    const [managerOpen, setManagerOpen] = useState(false)
    const columnIdsKey = columns.map((column) => column.id).join("|")
    useEffect(() => {
        setColumnSettings(loadColumnSettings(tableId, columns))
        // Reload only when the column set or table identity changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableId, columnIdsKey])

    const visibleColumns = useMemo(() => {
        const byId = new Map(columns.map((column) => [column.id, column]))
        const hidden = new Set(columnSettings.hiddenIds)
        const ordered = columnSettings.order
            .map((id) => byId.get(id))
            .filter(
                (column): column is DataTableColumn<TRow> => column !== undefined && !hidden.has(column.id),
            )
        // Pinned columns lead so sticky offsets stack from the left edge.
        return [...ordered.filter((c) => c.pinned === "left"), ...ordered.filter((c) => c.pinned !== "left")]
    }, [columns, columnSettings])

    /** Sticky left offsets for pinned columns, from declared widths. */
    const pinnedOffsets = useMemo(() => {
        const offsets = new Map<string, number>()
        // The expander column leads the row, so pinned columns stack after it.
        let left = hasExpander ? EXPANDER_WIDTH : 0
        for (const column of visibleColumns) {
            if (column.pinned !== "left") {
                break
            }
            offsets.set(column.id, left)
            left += typeof column.width === "number" ? column.width : DEFAULT_PINNED_WIDTH
        }
        return offsets
    }, [visibleColumns, hasExpander])

    /* ------------------------ expandable rows --------------------------- */

    const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set())
    const toggleExpanded = (rowId: string): void => {
        setExpandedIds((current) => {
            const next = new Set(current)
            if (next.has(rowId)) {
                next.delete(rowId)
            } else {
                next.add(rowId)
            }
            return next
        })
    }

    /* -------------------------- filters --------------------------- */

    const [filterValues, setFilterValues] = useState<Record<string, string>>({})
    const hasFilterRow = visibleColumns.some((column) => column.filter !== undefined)

    const filteredRows = useMemo(() => {
        const active = Object.entries(filterValues).filter(([, value]) => value !== "")
        if (active.length === 0) {
            return rows
        }
        const byId = new Map(columns.map((column) => [column.id, column]))
        return rows.filter((row) =>
            active.every(([columnId, value]) => {
                const column = byId.get(columnId)
                if (column?.filter === undefined) {
                    return true
                }
                const cellValue = plainValue(column, row)
                return column.filter.type === "select"
                    ? cellValue === value
                    : cellValue.toLowerCase().includes(value.toLowerCase())
            }),
        )
    }, [rows, columns, filterValues])

    /* --------------------------- sorting -------------------------- */

    const handleHeaderClick = (column: DataTableColumn<TRow>): void => {
        const direction: DataTableSortDirection =
            activeSort?.columnId === column.id && activeSort.direction === "asc" ? "desc" : "asc"
        const next = { columnId: column.id, direction }
        if (controlled) {
            onSortChange(next)
        } else {
            setInternalSort(next)
        }
    }

    const sortedRows = useMemo(() => {
        if (controlled || !activeSort) {
            return filteredRows
        }
        const column = columns.find((entry) => entry.id === activeSort.columnId)
        const sortValue = column?.sortValue
        if (!sortValue) {
            return filteredRows
        }
        const factor = activeSort.direction === "asc" ? 1 : -1
        return [...filteredRows].sort((a, b) => factor * compareValues(sortValue(a), sortValue(b)))
    }, [filteredRows, columns, controlled, activeSort])

    /* ------------------------- pagination ------------------------- */

    const paginationMode = pagination === undefined ? undefined : (pagination.mode ?? ui.table.pagination)
    const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE
    const [visibleCount, setVisibleCount] = useState(pageSize)
    const [pageIndex, setPageIndex] = useState(0)
    const filterKey = JSON.stringify(filterValues)
    useEffect(() => {
        setVisibleCount(pageSize)
        setPageIndex(0)
    }, [filterKey, pageSize])

    const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize))
    const clampedPageIndex = Math.min(pageIndex, pageCount - 1)
    const pagedRows = useMemo(() => {
        if (paginationMode === "loadMore") {
            return sortedRows.slice(0, visibleCount)
        }
        if (paginationMode === "pages") {
            return sortedRows.slice(clampedPageIndex * pageSize, (clampedPageIndex + 1) * pageSize)
        }
        return sortedRows
    }, [sortedRows, paginationMode, visibleCount, clampedPageIndex, pageSize])

    /* ------------------------- inline edit ------------------------ */

    const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string; value: string } | null>(
        null,
    )
    const [savingCell, setSavingCell] = useState(false)

    const commitEdit = useCallback(
        async (column: DataTableColumn<TRow>, row: TRow): Promise<void> => {
            if (editingCell === null || column.editable === undefined) {
                return
            }
            if (editingCell.value === column.editable.value(row)) {
                setEditingCell(null)
                return
            }
            setSavingCell(true)
            try {
                await column.editable.onCommit(row, editingCell.value)
                setEditingCell(null)
            } finally {
                setSavingCell(false)
            }
        },
        [editingCell],
    )

    /* ------------------------- fullscreen ------------------------- */

    const [fullscreen, setFullscreen] = useState(false)

    /* --------------------------- export --------------------------- */

    const exportCsv = (): void => {
        const csv = buildCsv(
            visibleColumns.map((column) => ({
                header: column.header,
                value: (row: TRow) => plainValue(column, row),
            })),
            sortedRows,
        )
        downloadCsv(`${tableId ?? "table"}.csv`, csv)
    }

    /* --------------------------- render --------------------------- */

    const showToolbar = showColumnManager || showCsvExport || showFullscreen
    const columnLabels = useMemo(
        () => new Map(columns.map((column) => [column.id, column.header])),
        [columns],
    )

    const pinnedCellProps = (
        column: DataTableColumn<TRow>,
    ): { className: string; style: React.CSSProperties } => {
        const offset = pinnedOffsets.get(column.id)
        if (offset === undefined) {
            return { className: "", style: {} }
        }
        return { className: ` ${styles.pinnedCell}`, style: { left: offset } }
    }

    // The expander column only needs sticky treatment when pinned columns
    // stack after it — otherwise it scrolls with the row like any cell.
    const expanderSticky = hasExpander && pinnedOffsets.size > 0
    const fullColSpan = visibleColumns.length + (hasActions ? 1 : 0) + (hasExpander ? 1 : 0)

    return (
        <div
            className={`${styles.container}${fullscreen ? ` ${styles.containerFullscreen}` : ""}`}
            data-rb-widget="data-table"
        >
            {showToolbar ? (
                <div className={styles.toolbar}>
                    {showColumnManager ? (
                        <button
                            type="button"
                            className={styles.toolbarButton}
                            onClick={() => setManagerOpen(true)}
                        >
                            Columns
                        </button>
                    ) : null}
                    {showCsvExport ? (
                        <button type="button" className={styles.toolbarButton} onClick={exportCsv}>
                            CSV
                        </button>
                    ) : null}
                    {showFullscreen ? (
                        <button
                            type="button"
                            className={styles.toolbarButton}
                            aria-pressed={fullscreen}
                            onClick={() => setFullscreen((current) => !current)}
                        >
                            {fullscreen ? "Exit focus" : "Focus"}
                        </button>
                    ) : null}
                </div>
            ) : null}

            <div
                className={`${styles.wrapper} ${styles.wrapperStyle[resolvedStyle]}${
                    fullscreen ? ` ${styles.wrapperFullscreen}` : ""
                }`}
            >
                <table className={`${styles.table} ${styles.tableStyle[resolvedStyle]}`}>
                    <thead>
                        <tr>
                            {hasExpander ? (
                                <th
                                    className={`${styles.headerCell} ${styles.headerCellStyle[resolvedStyle]} ${styles.expanderCell}${expanderSticky ? ` ${styles.pinnedCell}` : ""}`}
                                    style={expanderSticky ? { left: 0 } : undefined}
                                    aria-label="Expand"
                                />
                            ) : null}
                            {visibleColumns.map((column) => {
                                const sortable = isSortable(column, controlled)
                                const sorted =
                                    activeSort?.columnId === column.id ? activeSort.direction : undefined
                                const pinned = pinnedCellProps(column)
                                return (
                                    <th
                                        key={column.id}
                                        className={`${styles.headerCell} ${styles.headerCellStyle[resolvedStyle]}${pinned.className}`}
                                        style={{ width: column.width, ...pinned.style }}
                                        aria-sort={
                                            sorted
                                                ? sorted === "asc"
                                                    ? "ascending"
                                                    : "descending"
                                                : undefined
                                        }
                                    >
                                        {sortable ? (
                                            <button
                                                type="button"
                                                className={styles.headerSortButton}
                                                onClick={() => handleHeaderClick(column)}
                                            >
                                                {column.header}
                                                <span className={styles.sortIndicator} aria-hidden>
                                                    {sorted === "asc"
                                                        ? "\u2191"
                                                        : sorted === "desc"
                                                          ? "\u2193"
                                                          : "\u2195"}
                                                </span>
                                            </button>
                                        ) : (
                                            column.header
                                        )}
                                    </th>
                                )
                            })}
                            {hasActions ? (
                                <th
                                    className={`${styles.headerCell} ${styles.headerCellStyle[resolvedStyle]}`}
                                    aria-label="Actions"
                                />
                            ) : null}
                        </tr>
                        {hasFilterRow ? (
                            <tr>
                                {hasExpander ? (
                                    <th
                                        className={`${styles.filterCell} ${styles.expanderCell}${expanderSticky ? ` ${styles.pinnedCell}` : ""}`}
                                        style={expanderSticky ? { left: 0 } : undefined}
                                    />
                                ) : null}
                                {visibleColumns.map((column) => {
                                    const pinned = pinnedCellProps(column)
                                    return (
                                        <th
                                            key={column.id}
                                            className={`${styles.filterCell}${pinned.className}`}
                                            style={pinned.style}
                                        >
                                            {column.filter !== undefined ? (
                                                <ColumnFilterInput
                                                    column={column}
                                                    value={filterValues[column.id] ?? ""}
                                                    onChange={(value) =>
                                                        setFilterValues((current) => ({
                                                            ...current,
                                                            [column.id]: value,
                                                        }))
                                                    }
                                                />
                                            ) : null}
                                        </th>
                                    )
                                })}
                                {hasActions ? <th className={styles.filterCell} /> : null}
                            </tr>
                        ) : null}
                    </thead>
                    <tbody>
                        {pagedRows.length === 0 ? (
                            <tr>
                                <td className={styles.emptyCell} colSpan={fullColSpan}>
                                    No rows match the current filters.
                                </td>
                            </tr>
                        ) : null}
                        {pagedRows.map((row) => {
                            const canExpand =
                                expandable !== undefined && (expandable.isExpandable?.(row) ?? true)
                            const isExpanded = canExpand && expandedIds.has(row.id)
                            return (
                                <React.Fragment key={row.id}>
                                    <tr className={styles.row}>
                                        {hasExpander ? (
                                            <td
                                                className={`${styles.cell} ${styles.cellStyle[resolvedStyle]} ${styles.expanderCell}${expanderSticky ? ` ${styles.pinnedCell}` : ""}`}
                                                style={expanderSticky ? { left: 0 } : undefined}
                                            >
                                                {canExpand ? (
                                                    <button
                                                        type="button"
                                                        className={styles.expanderButton}
                                                        aria-expanded={isExpanded}
                                                        aria-label={
                                                            isExpanded ? "Collapse row" : "Expand row"
                                                        }
                                                        onClick={() => toggleExpanded(row.id)}
                                                    >
                                                        <ExpanderChevron expanded={isExpanded} />
                                                    </button>
                                                ) : null}
                                            </td>
                                        ) : null}
                                        {visibleColumns.map((column) => {
                                            const pinned = pinnedCellProps(column)
                                            const isEditing =
                                                editingCell?.rowId === row.id &&
                                                editingCell.columnId === column.id
                                            return (
                                                <td
                                                    key={column.id}
                                                    className={`${styles.cell} ${styles.cellStyle[resolvedStyle]}${pinned.className}`}
                                                    style={pinned.style}
                                                >
                                                    {column.editable !== undefined ? (
                                                        isEditing ? (
                                                            <input
                                                                className={styles.editableCellInput}
                                                                value={editingCell.value}
                                                                disabled={savingCell}
                                                                autoFocus
                                                                onChange={(event) =>
                                                                    setEditingCell((current) =>
                                                                        current === null
                                                                            ? current
                                                                            : {
                                                                                  ...current,
                                                                                  value: event.target.value,
                                                                              },
                                                                    )
                                                                }
                                                                onKeyDown={(event) => {
                                                                    if (event.key === "Enter") {
                                                                        void commitEdit(column, row)
                                                                    }
                                                                    if (event.key === "Escape") {
                                                                        setEditingCell(null)
                                                                    }
                                                                }}
                                                                onBlur={() => void commitEdit(column, row)}
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className={styles.editableCellButton}
                                                                aria-label={`Edit ${column.header}`}
                                                                onClick={() =>
                                                                    setEditingCell({
                                                                        rowId: row.id,
                                                                        columnId: column.id,
                                                                        value: column.editable!.value(row),
                                                                    })
                                                                }
                                                            >
                                                                {column.render(row)}
                                                            </button>
                                                        )
                                                    ) : (
                                                        column.render(row)
                                                    )}
                                                </td>
                                            )
                                        })}
                                        {hasActions ? (
                                            <td
                                                className={`${styles.cell} ${styles.cellStyle[resolvedStyle]} ${styles.actionsCell}`}
                                            >
                                                <RowActionsMenu items={rowActions(row)} />
                                            </td>
                                        ) : null}
                                    </tr>
                                    {isExpanded && expandable !== undefined ? (
                                        <tr className={styles.expandedRow}>
                                            <td className={styles.expandedCell} colSpan={fullColSpan}>
                                                {expandable.renderExpanded(row)}
                                            </td>
                                        </tr>
                                    ) : null}
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {paginationMode === "pages" && (pageCount > 1 || pagination?.hasNextPage === true) ? (
                <div className={styles.footer}>
                    <span className={styles.footerStatus}>
                        {sortedRows.length} row{sortedRows.length === 1 ? "" : "s"}
                        {pagination?.hasNextPage === true ? "+" : ""}
                    </span>
                    <div className={styles.footerControls}>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={clampedPageIndex === 0}
                            onClick={() => setPageIndex(clampedPageIndex - 1)}
                        >
                            Previous
                        </Button>
                        <span className={styles.footerStatus}>
                            Page {clampedPageIndex + 1} of {pageCount}
                        </span>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={
                                clampedPageIndex >= pageCount - 1 &&
                                (pagination?.hasNextPage !== true || pagination.loadingMore === true)
                            }
                            onClick={() => {
                                if (clampedPageIndex < pageCount - 1) {
                                    setPageIndex(clampedPageIndex + 1)
                                } else {
                                    pagination?.onLoadMore?.()
                                }
                            }}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            ) : null}
            {paginationMode === "loadMore" &&
            (sortedRows.length > visibleCount || pagination?.hasNextPage === true) ? (
                <div className={styles.loadMoreFooter}>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={pagination?.loadingMore === true}
                        onClick={() => {
                            if (sortedRows.length > visibleCount) {
                                setVisibleCount((current) => current + pageSize)
                            } else {
                                pagination?.onLoadMore?.()
                            }
                        }}
                    >
                        {pagination?.loadingMore === true ? "Loading..." : "Load more"}
                    </Button>
                </div>
            ) : null}

            {showColumnManager ? (
                <DataTableColumnManager
                    open={managerOpen}
                    onClose={() => setManagerOpen(false)}
                    labels={columnLabels}
                    settings={columnSettings}
                    defaultSettings={defaultColumnSettings(columns)}
                    onSave={(settings) => {
                        setColumnSettings(settings)
                        saveColumnSettings(tableId, settings)
                    }}
                />
            ) : null}
        </div>
    )
}

function ColumnFilterInput<TRow>({
    column,
    value,
    onChange,
}: {
    column: DataTableColumn<TRow>
    value: string
    onChange: (value: string) => void
}): React.ReactElement | null {
    if (column.filter === undefined) {
        return null
    }
    if (column.filter.type === "select") {
        return (
            <select
                className={styles.filterInput}
                value={value}
                aria-label={`Filter ${column.header}`}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">All</option>
                {column.filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        )
    }
    return (
        <input
            type="search"
            className={styles.filterInput}
            value={value}
            placeholder="Filter..."
            aria-label={`Filter ${column.header}`}
            onChange={(event) => onChange(event.target.value)}
        />
    )
}

function ExpanderChevron({ expanded }: { expanded: boolean }): React.ReactElement {
    return (
        <svg
            viewBox="0 0 12 12"
            width="10"
            height="10"
            aria-hidden="true"
            style={{
                transform: expanded ? "rotate(90deg)" : undefined,
                transition: "transform 120ms ease",
            }}
        >
            <path
                d="M4 2.5 L8 6 L4 9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function RowActionsMenu({ items }: { items: DropdownMenuItem[] }): React.ReactElement | null {
    if (items.length === 0) {
        return null
    }
    return (
        <DropdownMenu
            trigger={
                <Button variant="ghost" size="sm" aria-label="Row actions">
                    &#8943;
                </Button>
            }
            items={items}
        />
    )
}
