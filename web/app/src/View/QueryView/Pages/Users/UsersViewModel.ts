import type { UiQueryViewFormModalProps, UiQueryViewModel } from "@ui"
import { useMemo, useState } from "react"
import {
    useCreateUserMutation,
    useCurrentUserQuery,
    useUpdateUserMutation,
    useUserCreateFormSchemaLazyQuery,
    useUsersQuery,
    useUserUpdateFormSchemaLazyQuery,
    type CreateUserFields,
    type UpdateUserFields,
    type UserConnectionInput,
    type UsersQuery,
} from "../../../../generated/graphql/types"
import { buildUsersColumns, type UserRow } from "./UsersColumns"

const PAGE_SIZE = 25

type ModalState = { mode: "create" } | { mode: "edit"; userId: string }

export interface UsersViewModel {
    queryView: UiQueryViewModel<UserRow>
    formModal: UiQueryViewFormModalProps | null
}

export function useUsersViewModel(): UsersViewModel {
    const [search, setSearch] = useState("")
    const [modal, setModal] = useState<ModalState | null>(null)
    const [loadingMore, setLoadingMore] = useState(false)
    const [submitError, setSubmitError] = useState<string>()

    const input = useMemo(() => buildUsersInput(search), [search])
    const usersQuery = useUsersQuery({ variables: { input } })
    const currentUserQuery = useCurrentUserQuery()

    // network-only: cached form schemas would carry stale defaultData after edits.
    const [fetchCreateSchema, createSchemaState] = useUserCreateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [fetchUpdateSchema, updateSchemaState] = useUserUpdateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [createUser, createState] = useCreateUserMutation()
    const [updateUser, updateState] = useUpdateUserMutation()

    const rows = useMemo(() => transformUserRows(usersQuery.data), [usersQuery.data])
    const pageInfo = usersQuery.data?.users.pageInfo

    const loadMore = async (): Promise<void> => {
        if (!pageInfo?.hasNextPage || pageInfo.endCursor == null) {
            return
        }
        setLoadingMore(true)
        try {
            await usersQuery.fetchMore({
                variables: { input: buildUsersInput(search, pageInfo.endCursor) },
                updateQuery: (previous, { fetchMoreResult }) => ({
                    users: {
                        ...fetchMoreResult.users,
                        nodes: [...previous.users.nodes, ...fetchMoreResult.users.nodes],
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

    const openEdit = (userId: string): void => {
        setSubmitError(undefined)
        setModal({ mode: "edit", userId })
        void fetchUpdateSchema({ variables: { input: { objectId: userId } } })
    }

    const submit = async (formData: Record<string, unknown>): Promise<void> => {
        if (!modal) {
            return
        }
        setSubmitError(undefined)
        try {
            if (modal.mode === "create") {
                await createUser({
                    variables: {
                        input: {
                            idempotencyKey: crypto.randomUUID(),
                            fields: formData as unknown as CreateUserFields,
                        },
                    },
                    // Connection queries don't pick up new rows from the normalized
                    // cache; refetch the active Users query (see createApolloClient).
                    refetchQueries: ["Users"],
                })
            } else {
                await updateUser({
                    variables: {
                        input: {
                            objectId: modal.userId,
                            idempotencyKey: crypto.randomUUID(),
                            fields: formData as unknown as UpdateUserFields,
                        },
                    },
                    refetchQueries: ["Users"],
                })
            }
            setModal(null)
        } catch (caught) {
            setSubmitError(caught instanceof Error ? caught.message : "Saving failed.")
        }
    }

    const queryView: UiQueryViewModel<UserRow> = {
        title: "Users",
        columns: useMemo(buildUsersColumns, []),
        rows,
        loading: usersQuery.loading,
        error: usersQuery.error?.message,
        onRetry: () => void usersQuery.refetch(),
        search,
        onSearchChange: setSearch,
        searchPlaceholder: "Search by display name...",
        primaryAction: { label: "Create User", onClick: openCreate },
        rowActions: (row) => [{ id: "edit", label: "Edit", onSelect: () => openEdit(row.id) }],
        hasNextPage: pageInfo?.hasNextPage ?? false,
        onLoadMore: () => void loadMore(),
        loadingMore,
        emptyState: {
            title: "No users found",
            description: search ? "Try a different search." : "Create the first user to get started.",
        },
    }

    const accountId = currentUserQuery.data?.currentUser.account?.id
    const schemaState = modal?.mode === "create" ? createSchemaState : updateSchemaState

    const formModal: UiQueryViewFormModalProps | null = modal
        ? {
              open: true,
              title: modal.mode === "create" ? "Create User" : "Edit User",
              schemaForm: schemaState.data?.schema,
              defaultDataOverrides:
                  modal.mode === "create" && accountId !== undefined ? { accountId } : undefined,
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

function buildUsersInput(search: string, after?: string): UserConnectionInput {
    const trimmedSearch = search.trim()
    return {
        filters: trimmedSearch.length > 0 ? { displayName: trimmedSearch } : undefined,
        connection: {
            pagination: { first: PAGE_SIZE, after },
            sort: [{ fieldName: "displayName", direction: "asc" }],
        },
    }
}

function transformUserRows(data: UsersQuery | undefined): UserRow[] {
    if (!data) {
        return []
    }
    return data.users.nodes.flatMap((user) => {
        if (!user) {
            return []
        }
        return [
            {
                id: user.id,
                displayName: user.displayName,
                email: user.email,
                status: user.status,
                createdTime: user.createdTime,
            },
        ]
    })
}
