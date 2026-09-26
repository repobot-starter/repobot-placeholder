import React from "react"
import { Button } from "../primitives/Button"
import type { DropdownMenuItem } from "../primitives/DropdownMenu"
import { Input } from "../primitives/Input"
import type { UiTableStyle } from "../theme/themeConfig"
import { DataTable, type DataTableColumn, type DataTableExpandable, type DataTableSort } from "./DataTable"
import { EmptyState } from "./EmptyState"
import { ErrorPanel } from "./ErrorBoundary"
import { FiltersToolbar, type FiltersToolbarFilter, type FiltersToolbarSort } from "./FiltersToolbar"
import { Skeleton } from "./Skeleton"
import * as styles from "./UiQueryView.styles.css"

export interface UiQueryViewPrimaryAction {
    label: string
    onClick: () => void
}

export interface UiQueryViewEmptyState {
    title: string
    description?: string
}

/**
 * Presentational view model for a connection-backed table screen. Domain pages
 * build this from their generated Apollo hooks (Page -> ViewModel -> Columns)
 * and pass it in; UiQueryView owns loading skeleton / empty / error states,
 * search, toolbar and "load more" pagination.
 */
export interface UiQueryViewModel<TRow extends { id: string }> {
    title: string
    columns: DataTableColumn<TRow>[]
    rows: TRow[]
    loading: boolean
    error?: string
    onRetry?: () => void
    search: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    primaryAction?: UiQueryViewPrimaryAction
    rowActions?: (row: TRow) => DropdownMenuItem[]
    /** Master-detail rows (see DataTable): chevron toggles a detail region. */
    expandable?: DataTableExpandable<TRow>
    hasNextPage: boolean
    onLoadMore: () => void
    loadingMore?: boolean
    emptyState?: UiQueryViewEmptyState
    /**
     * Facet filters rendered in a FiltersToolbar under the title. When
     * present, search moves into that toolbar too. Apply the actual
     * filtering in the query variables.
     */
    filters?: FiltersToolbarFilter[]
    /** A sort select in the FiltersToolbar — for sorts that aren't column-shaped. */
    sort?: FiltersToolbarSort
    /**
     * Column-header sorting (see DataTable): pass the current sort and
     * re-query on change. Prefer this over `sort` when sorting by a visible
     * column.
     */
    tableSort?: DataTableSort
    onTableSortChange?: (sort: DataTableSort) => void
    /**
     * Stable table identity (e.g. "orders") for the column manager's
     * persistence and CSV filenames in the detailed style.
     */
    tableId?: string
    /** Overrides the repobot.theme.json `ui.table.style` preset for this table. */
    tableStyle?: UiTableStyle
    /** Rows per page / per load-more increment; default 25. */
    pageSize?: number
}

export interface UiQueryViewProps<TRow extends { id: string }> {
    viewModel: UiQueryViewModel<TRow>
}

export function UiQueryView<TRow extends { id: string }>({
    viewModel,
}: UiQueryViewProps<TRow>): React.ReactElement {
    const {
        title,
        columns,
        rows,
        loading,
        error,
        onRetry,
        search,
        onSearchChange,
        searchPlaceholder,
        primaryAction,
        rowActions,
        expandable,
        hasNextPage,
        onLoadMore,
        loadingMore,
        emptyState,
        filters,
        sort,
        tableSort,
        onTableSortChange,
        tableId,
        tableStyle,
        pageSize,
    } = viewModel

    const showSkeleton = loading && rows.length === 0 && !error
    const showEmpty = !loading && !error && rows.length === 0
    const hasFilterBar = (filters !== undefined && filters.length > 0) || sort !== undefined

    return (
        <section className={styles.container}>
            <div className={styles.toolbar}>
                <h1 className={styles.title}>{title}</h1>
                <div className={styles.toolbarActions}>
                    {!hasFilterBar ? (
                        <div className={styles.searchBox}>
                            <Input
                                type="search"
                                value={search}
                                placeholder={searchPlaceholder ?? "Search..."}
                                onChange={(event) => onSearchChange(event.target.value)}
                                aria-label={`Search ${title}`}
                            />
                        </div>
                    ) : null}
                    {primaryAction ? (
                        <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
                    ) : null}
                </div>
            </div>

            {hasFilterBar ? (
                <FiltersToolbar
                    search={{
                        value: search,
                        onChange: onSearchChange,
                        placeholder: searchPlaceholder,
                        "aria-label": `Search ${title}`,
                    }}
                    filters={filters}
                    sort={sort}
                />
            ) : null}

            {error ? (
                <ErrorPanel
                    title={`Failed to load ${title.toLowerCase()}`}
                    message={error}
                    onRetry={onRetry}
                />
            ) : null}
            {showSkeleton ? <TableSkeleton /> : null}
            {showEmpty ? (
                <EmptyState
                    title={emptyState?.title ?? `No ${title.toLowerCase()} found`}
                    description={emptyState?.description}
                />
            ) : null}

            {!error && rows.length > 0 ? (
                // Pagination presentation (load-more vs pages) follows the
                // repobot.theme.json ui.table preset inside DataTable; the
                // server fetch hooks in when the loaded rows are exhausted.
                <DataTable
                    columns={columns}
                    rows={rows}
                    rowActions={rowActions}
                    expandable={expandable}
                    sort={tableSort}
                    onSortChange={onTableSortChange}
                    tableId={tableId}
                    style={tableStyle}
                    pagination={{ pageSize, hasNextPage, onLoadMore, loadingMore }}
                />
            ) : null}
        </section>
    )
}

function TableSkeleton(): React.ReactElement {
    return (
        <div className={styles.skeletonTable} aria-label="Loading">
            <Skeleton height={20} width="30%" />
            <Skeleton height={20} />
            <Skeleton height={20} />
            <Skeleton height={20} width="85%" />
            <Skeleton height={20} width="70%" />
        </div>
    )
}
