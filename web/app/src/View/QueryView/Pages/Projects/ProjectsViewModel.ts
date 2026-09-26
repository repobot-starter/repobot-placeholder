import { useToast, type DataTableSort, type UiQueryViewFormModalProps, type UiQueryViewModel } from "@ui"
import { useMemo, useState } from "react"
import {
    useCreateProjectMutation,
    useProjectCreateFormSchemaLazyQuery,
    useProjectsQuery,
    useProjectUpdateFormSchemaLazyQuery,
    useUpdateProjectMutation,
    type CreateProjectFields,
    type ProjectConnectionInput,
    type ProjectsQuery,
    type ProjectStatus,
    type UpdateProjectFields,
} from "../../../../generated/graphql/types"
import { buildProjectsColumns, type ProjectRow } from "./ProjectsColumns"

const PAGE_SIZE = 25

/** Sortable column ids mapped to the connection's server-side sort fields. */
const SORT_FIELD_BY_COLUMN: Record<string, string> = {
    name: "name",
    status: "status",
    createdTime: "rowCreatedAt",
}

const DEFAULT_SORT: DataTableSort = { columnId: "name", direction: "asc" }

type ModalState = { mode: "create" } | { mode: "edit"; projectId: string }

export interface ProjectsViewModel {
    queryView: UiQueryViewModel<ProjectRow>
    formModal: UiQueryViewFormModalProps | null
    /** Project whose members dialog is open, or null. */
    membersProjectId: string | null
    closeMembers: () => void
}

export function useProjectsViewModel(): ProjectsViewModel {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
    const [tableSort, setTableSort] = useState<DataTableSort>(DEFAULT_SORT)
    const [modal, setModal] = useState<ModalState | null>(null)
    const [membersProjectId, setMembersProjectId] = useState<string | null>(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [submitError, setSubmitError] = useState<string>()
    const toast = useToast()

    const input = useMemo(
        () => buildProjectsInput(search, statusFilter, tableSort),
        [search, statusFilter, tableSort],
    )
    const projectsQuery = useProjectsQuery({ variables: { input } })

    // network-only: cached form schemas would carry stale defaultData after edits.
    const [fetchCreateSchema, createSchemaState] = useProjectCreateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [fetchUpdateSchema, updateSchemaState] = useProjectUpdateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [createProject, createState] = useCreateProjectMutation()
    const [updateProject, updateState] = useUpdateProjectMutation()

    const rows = useMemo(() => transformProjectRows(projectsQuery.data), [projectsQuery.data])
    const pageInfo = projectsQuery.data?.projects.pageInfo

    const loadMore = async (): Promise<void> => {
        if (!pageInfo?.hasNextPage || pageInfo.endCursor == null) {
            return
        }
        setLoadingMore(true)
        try {
            await projectsQuery.fetchMore({
                variables: {
                    input: buildProjectsInput(search, statusFilter, tableSort, pageInfo.endCursor),
                },
                updateQuery: (previous, { fetchMoreResult }) => ({
                    projects: {
                        ...fetchMoreResult.projects,
                        nodes: [...previous.projects.nodes, ...fetchMoreResult.projects.nodes],
                    },
                }),
            })
        } finally {
            setLoadingMore(false)
        }
    }

    const openCreate = (): void => {
        setSubmitError(undefined)
        setModal({ mode: "create" })
        void fetchCreateSchema()
    }

    const openEdit = (projectId: string): void => {
        setSubmitError(undefined)
        setModal({ mode: "edit", projectId })
        void fetchUpdateSchema({ variables: { input: { objectId: projectId } } })
    }

    const submit = async (formData: Record<string, unknown>): Promise<void> => {
        if (!modal) {
            return
        }
        setSubmitError(undefined)
        try {
            if (modal.mode === "create") {
                await createProject({
                    variables: {
                        input: {
                            idempotencyKey: crypto.randomUUID(),
                            fields: formData as unknown as CreateProjectFields,
                        },
                    },
                    // Refetch the active connection query after mutations (see createApolloClient).
                    refetchQueries: ["Projects"],
                })
                toast.publish({ title: "Project created", tone: "success" })
            } else {
                await updateProject({
                    variables: {
                        input: {
                            objectId: modal.projectId,
                            idempotencyKey: crypto.randomUUID(),
                            fields: formData as unknown as UpdateProjectFields,
                        },
                    },
                    refetchQueries: ["Projects"],
                })
                toast.publish({ title: "Project saved", tone: "success" })
            }
            setModal(null)
        } catch (caught) {
            setSubmitError(caught instanceof Error ? caught.message : "Saving failed.")
        }
    }

    const archive = async (projectId: string): Promise<void> => {
        try {
            await updateProject({
                variables: {
                    input: {
                        objectId: projectId,
                        idempotencyKey: crypto.randomUUID(),
                        fields: { doArchive: true },
                    },
                },
                refetchQueries: ["Projects"],
            })
            toast.publish({ title: "Project archived", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Archive failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const queryView: UiQueryViewModel<ProjectRow> = {
        title: "Projects",
        columns: useMemo(buildProjectsColumns, []),
        rows,
        loading: projectsQuery.loading,
        error: projectsQuery.error?.message,
        onRetry: () => void projectsQuery.refetch(),
        search,
        onSearchChange: setSearch,
        searchPlaceholder: "Search by name...",
        primaryAction: { label: "Create Project", onClick: openCreate },
        rowActions: (row) => [
            { id: "edit", label: "Edit", onSelect: () => openEdit(row.id) },
            { id: "members", label: "Members", onSelect: () => setMembersProjectId(row.id) },
            ...(row.status === "ACTIVE"
                ? [{ id: "archive", label: "Archive", danger: true, onSelect: () => void archive(row.id) }]
                : []),
        ],
        hasNextPage: pageInfo?.hasNextPage ?? false,
        onLoadMore: () => void loadMore(),
        loadingMore,
        emptyState: {
            title: "No projects found",
            description: search ? "Try a different search." : "Create the first project to get started.",
        },
        filters: [
            {
                id: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                allLabel: "All statuses",
                options: [
                    { id: "ACTIVE", label: "Active" },
                    { id: "ARCHIVED", label: "Archived" },
                ],
            },
        ],
        tableSort,
        onTableSortChange: (sort) => {
            if (SORT_FIELD_BY_COLUMN[sort.columnId] !== undefined) {
                setTableSort(sort)
            }
        },
    }

    const schemaState = modal?.mode === "create" ? createSchemaState : updateSchemaState

    const formModal: UiQueryViewFormModalProps | null = modal
        ? {
              open: true,
              title: modal.mode === "create" ? "Create Project" : "Edit Project",
              schemaForm: schemaState.data?.schema,
              loading: schemaState.loading,
              error: schemaState.error?.message,
              submitting: createState.loading || updateState.loading,
              submitError,
              onSubmit: submit,
              onClose: () => setModal(null),
          }
        : null

    return { queryView, formModal, membersProjectId, closeMembers: () => setMembersProjectId(null) }
}

function buildProjectsInput(
    search: string,
    statusFilter: string | undefined,
    tableSort: DataTableSort,
    after?: string,
): ProjectConnectionInput {
    const trimmedSearch = search.trim()
    const filters =
        trimmedSearch.length > 0 || statusFilter !== undefined
            ? {
                  name: trimmedSearch.length > 0 ? trimmedSearch : undefined,
                  statuses: statusFilter !== undefined ? [statusFilter as ProjectStatus] : undefined,
              }
            : undefined
    return {
        filters,
        connection: {
            pagination: { first: PAGE_SIZE, after },
            sort: [
                {
                    fieldName: SORT_FIELD_BY_COLUMN[tableSort.columnId] ?? "name",
                    direction: tableSort.direction,
                },
            ],
        },
    }
}

function transformProjectRows(data: ProjectsQuery | undefined): ProjectRow[] {
    if (!data) {
        return []
    }
    return data.projects.nodes.flatMap((project) => {
        if (!project) {
            return []
        }
        return [
            {
                id: project.id,
                name: project.name,
                description: project.description ?? "",
                status: project.status,
                createdTime: project.createdTime,
            },
        ]
    })
}
