import { useToast, type DataTableSort, type UiQueryViewFormModalProps, type UiQueryViewModel } from "@ui"
import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
    useDeleteEntryRecordMutation,
    useEntryFieldsQuery,
    useEntryRecordsQuery,
    type EntryRecordConnectionInput,
    type EntryRecordsQuery,
} from "../../generated/graphql/types"
import { buildEntryRecordsColumns, type EntryRecordRow } from "./EntryRecordsColumns"
import { parseEntryValues } from "./entryValues"
import { useEntryRecordFormModal } from "./useEntryRecordFormModal"

const PAGE_SIZE = 25

const DEFAULT_SORT: DataTableSort = { columnId: "created", direction: "desc" }

export interface EntryRecordsViewModel {
    queryView: UiQueryViewModel<EntryRecordRow>
    formModal: UiQueryViewFormModalProps | null
}

export function useEntryRecordsViewModel(): EntryRecordsViewModel {
    const [search, setSearch] = useState("")
    const [tableSort, setTableSort] = useState<DataTableSort>(DEFAULT_SORT)
    const [loadingMore, setLoadingMore] = useState(false)
    const toast = useToast()

    const fieldsQuery = useEntryFieldsQuery()
    const fields = useMemo(() => fieldsQuery.data?.entryFields ?? [], [fieldsQuery.data])

    const input = useMemo(() => buildEntryRecordsInput(search, tableSort), [search, tableSort])
    const recordsQuery = useEntryRecordsQuery({ variables: { input } })

    const { formModal, openCreate, openEdit } = useEntryRecordFormModal()
    const [deleteRecord] = useDeleteEntryRecordMutation()

    // Capture Data's front door: the pack home redirects here as
    // /records?new=1 so a visitor lands with the entry form already open
    // (the pack has no landing page — the tool greets you mid-flow). The
    // param is consumed so in-app navigation back to Records stays plain.
    const [searchParams, setSearchParams] = useSearchParams()
    const arriveWithForm = searchParams.get("new") === "1"
    useEffect(() => {
        if (arriveWithForm) {
            const next = new URLSearchParams(searchParams)
            next.delete("new")
            setSearchParams(next, { replace: true })
            openCreate()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
    }, [arriveWithForm])

    const rows = useMemo(() => transformRecordRows(recordsQuery.data), [recordsQuery.data])
    const pageInfo = recordsQuery.data?.entryRecords.pageInfo

    const loadMore = async (): Promise<void> => {
        if (!pageInfo?.hasNextPage || pageInfo.endCursor == null) {
            return
        }
        setLoadingMore(true)
        try {
            await recordsQuery.fetchMore({
                variables: { input: buildEntryRecordsInput(search, tableSort, pageInfo.endCursor) },
                updateQuery: (previous, { fetchMoreResult }) => ({
                    entryRecords: {
                        ...fetchMoreResult.entryRecords,
                        nodes: [...previous.entryRecords.nodes, ...fetchMoreResult.entryRecords.nodes],
                    },
                }),
            })
        } finally {
            setLoadingMore(false)
        }
    }

    const remove = async (recordId: string): Promise<void> => {
        try {
            await deleteRecord({
                variables: { input: { objectId: recordId } },
                refetchQueries: ["EntryRecords"],
            })
            toast.publish({ title: "Record deleted", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Delete failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const queryView: UiQueryViewModel<EntryRecordRow> = {
        title: "Records",
        columns: useMemo(() => buildEntryRecordsColumns(fields), [fields]),
        rows,
        loading: recordsQuery.loading || fieldsQuery.loading,
        error: recordsQuery.error?.message ?? fieldsQuery.error?.message,
        onRetry: () => {
            void recordsQuery.refetch()
            void fieldsQuery.refetch()
        },
        search,
        onSearchChange: setSearch,
        searchPlaceholder: "Search records...",
        primaryAction: { label: "New record", onClick: openCreate },
        rowActions: (row) => [
            { id: "edit", label: "Edit", onSelect: () => openEdit(row.id) },
            { id: "delete", label: "Delete", danger: true, onSelect: () => void remove(row.id) },
        ],
        hasNextPage: pageInfo?.hasNextPage ?? false,
        onLoadMore: () => void loadMore(),
        loadingMore,
        emptyState: {
            title: "No records yet",
            description: search
                ? "Try a different search."
                : "Add the first record — the form follows your fields.",
        },
        tableSort,
        onTableSortChange: (sort) => {
            if (sort.columnId === "created") {
                setTableSort(sort)
            }
        },
        tableId: "entry-records",
        pageSize: PAGE_SIZE,
    }

    return { queryView, formModal }
}

function buildEntryRecordsInput(
    search: string,
    tableSort: DataTableSort,
    after?: string,
): EntryRecordConnectionInput {
    const trimmedSearch = search.trim()
    return {
        filters: trimmedSearch.length > 0 ? { search: trimmedSearch } : undefined,
        connection: {
            pagination: { first: PAGE_SIZE, after },
            sort: [{ fieldName: "rowCreatedAt", direction: tableSort.direction }],
        },
    }
}

function transformRecordRows(data: EntryRecordsQuery | undefined): EntryRecordRow[] {
    if (!data) {
        return []
    }
    return data.entryRecords.nodes.flatMap((record) => {
        if (!record) {
            return []
        }
        return [
            {
                id: record.id,
                values: parseEntryValues(record.valuesJson),
                createdTime: record.createdTime,
            },
        ]
    })
}
