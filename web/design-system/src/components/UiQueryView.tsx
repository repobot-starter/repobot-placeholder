import React from "react"
import { Button } from "../primitives/Button"
import type { DropdownMenuItem } from "../primitives/DropdownMenu"
import { Input } from "../primitives/Input"
import { Spinner } from "../primitives/Spinner"
import { DataTable, type DataTableColumn } from "./DataTable"
import { EmptyState } from "./EmptyState"
import { ErrorPanel } from "./ErrorBoundary"
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
    hasNextPage: boolean
    onLoadMore: () => void
    loadingMore?: boolean
    emptyState?: UiQueryViewEmptyState
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
        hasNextPage,
        onLoadMore,
        loadingMore,
        emptyState,
    } = viewModel

    const showSkeleton = loading && rows.length === 0 && !error
    const showEmpty = !loading && !error && rows.length === 0

    return (
        <section className={styles.container}>
            <div className={styles.toolbar}>
                <h1 className={styles.title}>{title}</h1>
                <div className={styles.toolbarActions}>
                    <div className={styles.searchBox}>
                        <Input
                            type="search"
                            value={search}
                            placeholder={searchPlaceholder ?? "Search..."}
                            onChange={(event) => onSearchChange(event.target.value)}
                            aria-label={`Search ${title}`}
                        />
                    </div>
                    {primaryAction ? (
                        <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
                    ) : null}
                </div>
            </div>

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
                <>
                    <DataTable columns={columns} rows={rows} rowActions={rowActions} />
                    {hasNextPage ? (
                        <div className={styles.footer}>
                            <Button variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
                                {loadingMore ? <Spinner size="sm" /> : null}
                                Load more
                            </Button>
                        </div>
                    ) : null}
                </>
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
