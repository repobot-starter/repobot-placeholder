import { useToast, type UiQueryViewFormModalProps, type UiQueryViewModel } from "@ui"
import { useMemo, useState } from "react"
import {
    useCreateEntryFieldMutation,
    useDeleteEntryFieldMutation,
    useEntryFieldCreateFormSchemaLazyQuery,
    useEntryFieldsQuery,
    useEntryFieldUpdateFormSchemaLazyQuery,
    useUpdateEntryFieldMutation,
    type CreateEntryFieldFields,
    type UpdateEntryFieldFields,
} from "../../generated/graphql/types"
import { buildEntryFieldsColumns, type EntryFieldRow } from "./EntryFieldsColumns"

type ModalState = { mode: "create" } | { mode: "edit"; fieldId: string }

export interface EntryFieldsViewModel {
    queryView: UiQueryViewModel<EntryFieldRow>
    formModal: UiQueryViewFormModalProps | null
}

/**
 * The field designer: the workbook's schema as a small always-complete list
 * (no pagination — a workbook has a handful of columns). Changing fields
 * refetches records too, because the records table's columns and the entry
 * form are both derived from these definitions.
 */
export function useEntryFieldsViewModel(): EntryFieldsViewModel {
    const [search, setSearch] = useState("")
    const [modal, setModal] = useState<ModalState | null>(null)
    const [submitError, setSubmitError] = useState<string>()
    const toast = useToast()

    const fieldsQuery = useEntryFieldsQuery()

    // network-only: the update schema's defaultData is the field's current state.
    const [fetchCreateSchema, createSchemaState] = useEntryFieldCreateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [fetchUpdateSchema, updateSchemaState] = useEntryFieldUpdateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [createField, createState] = useCreateEntryFieldMutation()
    const [updateField, updateState] = useUpdateEntryFieldMutation()
    const [deleteField] = useDeleteEntryFieldMutation()

    const fields = useMemo(() => fieldsQuery.data?.entryFields ?? [], [fieldsQuery.data])
    const rows = useMemo(() => {
        const trimmed = search.trim().toLowerCase()
        return fields
            .filter((field) => trimmed === "" || field.label.toLowerCase().includes(trimmed))
            .map((field): EntryFieldRow => ({
                id: field.id,
                label: field.label,
                fieldKey: field.fieldKey,
                fieldType: field.fieldType,
                required: field.required,
                options: field.options ?? undefined,
            }))
    }, [fields, search])

    const openCreate = (): void => {
        setSubmitError(undefined)
        setModal({ mode: "create" })
        void fetchCreateSchema()
    }

    const openEdit = (fieldId: string): void => {
        setSubmitError(undefined)
        setModal({ mode: "edit", fieldId })
        void fetchUpdateSchema({ variables: { input: { objectId: fieldId } } })
    }

    const submit = async (formData: Record<string, unknown>): Promise<void> => {
        if (!modal) {
            return
        }
        setSubmitError(undefined)
        try {
            if (modal.mode === "create") {
                await createField({
                    variables: {
                        input: {
                            idempotencyKey: crypto.randomUUID(),
                            fields: formData as unknown as CreateEntryFieldFields,
                        },
                    },
                    refetchQueries: ["EntryFields", "EntryRecords"],
                })
                toast.publish({ title: "Field added", tone: "success" })
            } else {
                await updateField({
                    variables: {
                        input: {
                            objectId: modal.fieldId,
                            idempotencyKey: crypto.randomUUID(),
                            fields: formData as unknown as UpdateEntryFieldFields,
                        },
                    },
                    refetchQueries: ["EntryFields", "EntryRecords"],
                })
                toast.publish({ title: "Field saved", tone: "success" })
            }
            setModal(null)
        } catch (caught) {
            setSubmitError(caught instanceof Error ? caught.message : "Saving failed.")
        }
    }

    const remove = async (fieldId: string): Promise<void> => {
        try {
            await deleteField({
                variables: { input: { objectId: fieldId } },
                refetchQueries: ["EntryFields", "EntryRecords"],
            })
            toast.publish({ title: "Field deleted", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Delete failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const queryView: UiQueryViewModel<EntryFieldRow> = {
        title: "Fields",
        columns: useMemo(buildEntryFieldsColumns, []),
        rows,
        loading: fieldsQuery.loading,
        error: fieldsQuery.error?.message,
        onRetry: () => void fieldsQuery.refetch(),
        search,
        onSearchChange: setSearch,
        searchPlaceholder: "Search fields...",
        primaryAction: { label: "New field", onClick: openCreate },
        rowActions: (row) => [
            { id: "edit", label: "Edit", onSelect: () => openEdit(row.id) },
            { id: "delete", label: "Delete", danger: true, onSelect: () => void remove(row.id) },
        ],
        hasNextPage: false,
        onLoadMore: () => undefined,
        emptyState: {
            title: "No fields yet",
            description: "Add a field to shape the workbook — the entry form follows.",
        },
        tableId: "entry-fields",
    }

    const schemaState = modal?.mode === "create" ? createSchemaState : updateSchemaState

    const formModal: UiQueryViewFormModalProps | null = modal
        ? {
              open: true,
              title: modal.mode === "create" ? "New field" : "Edit field",
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
