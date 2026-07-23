import type { UiQueryViewFormModalProps, UiQueryViewModel } from "@ui"
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
    type UpdateProjectFields,
} from "../../../../generated/graphql/types"
import { buildProjectsColumns, type ProjectRow } from "./ProjectsColumns"

const PAGE_SIZE = 25

type ModalState = { mode: "create" } | { mode: "edit"; projectId: string }

export interface ProjectsViewModel {
    queryView: UiQueryViewModel<ProjectRow>
    formModal: UiQueryViewFormModalProps | null
}

export function useProjectsViewModel(): ProjectsViewModel {
    const [search, setSearch] = useState("")
    const [modal, setModal] = useState<ModalState | null>(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [submitError, setSubmitError] = useState<string>()

    const input = useMemo(() => buildProjectsInput(search), [search])
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
                variables: { input: buildProjectsInput(search, pageInfo.endCursor) },
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
            }
            setModal(null)
        } catch (caught) {
            setSubmitError(caught instanceof Error ? caught.message : "Saving failed.")
        }
    }

    const archive = async (projectId: string): Promise<void> => {
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

    return { queryView, formModal }
}

function buildProjectsInput(search: string, after?: string): ProjectConnectionInput {
    const trimmedSearch = search.trim()
    return {
        filters: trimmedSearch.length > 0 ? { name: trimmedSearch } : undefined,
        connection: {
            pagination: { first: PAGE_SIZE, after },
            sort: [{ fieldName: "name", direction: "asc" }],
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
