import { useToast, type UiQueryViewFormModalProps } from "@ui"
import { useState } from "react"
import {
    useCreateEntryRecordMutation,
    useEntryRecordCreateFormSchemaLazyQuery,
    useEntryRecordUpdateFormSchemaLazyQuery,
    useUpdateEntryRecordMutation,
} from "../../generated/graphql/types"

type ModalState = { mode: "create" } | { mode: "edit"; recordId: string }

export interface EntryRecordFormModal {
    formModal: UiQueryViewFormModalProps | null
    openCreate: () => void
    openEdit: (recordId: string) => void
}

/**
 * The record entry modal, shared by the overview's "New record" action and
 * the records table's create/edit flows. The form schema is built on the
 * backend from the live field definitions (entryRecordCreateFormSchema), so
 * this hook never knows the fields — it just wraps the submitted form data
 * back into the mutation's valuesJson envelope.
 */
export function useEntryRecordFormModal(): EntryRecordFormModal {
    const [modal, setModal] = useState<ModalState | null>(null)
    const [submitError, setSubmitError] = useState<string>()
    const toast = useToast()

    // network-only: the record form schema embeds the CURRENT field
    // definitions and (for edits) the record's stored values — cached copies
    // go stale the moment a field or record changes.
    const [fetchCreateSchema, createSchemaState] = useEntryRecordCreateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [fetchUpdateSchema, updateSchemaState] = useEntryRecordUpdateFormSchemaLazyQuery({
        fetchPolicy: "network-only",
    })
    const [createRecord, createState] = useCreateEntryRecordMutation()
    const [updateRecord, updateState] = useUpdateEntryRecordMutation()

    const openCreate = (): void => {
        setSubmitError(undefined)
        setModal({ mode: "create" })
        void fetchCreateSchema()
    }

    const openEdit = (recordId: string): void => {
        setSubmitError(undefined)
        setModal({ mode: "edit", recordId })
        void fetchUpdateSchema({ variables: { input: { objectId: recordId } } })
    }

    const submit = async (formData: Record<string, unknown>): Promise<void> => {
        if (!modal) {
            return
        }
        setSubmitError(undefined)
        const valuesJson = JSON.stringify(formData)
        try {
            if (modal.mode === "create") {
                await createRecord({
                    variables: {
                        input: { idempotencyKey: crypto.randomUUID(), fields: { valuesJson } },
                    },
                    refetchQueries: ["EntryRecords"],
                })
                toast.publish({ title: "Record added", tone: "success" })
            } else {
                await updateRecord({
                    variables: {
                        input: {
                            objectId: modal.recordId,
                            idempotencyKey: crypto.randomUUID(),
                            fields: { valuesJson },
                        },
                    },
                    refetchQueries: ["EntryRecords"],
                })
                toast.publish({ title: "Record saved", tone: "success" })
            }
            setModal(null)
        } catch (caught) {
            setSubmitError(caught instanceof Error ? caught.message : "Saving failed.")
        }
    }

    const schemaState = modal?.mode === "create" ? createSchemaState : updateSchemaState

    const formModal: UiQueryViewFormModalProps | null = modal
        ? {
              open: true,
              title: modal.mode === "create" ? "New record" : "Edit record",
              schemaForm: schemaState.data?.schema,
              loading: schemaState.loading,
              error: schemaState.error?.message,
              submitting: createState.loading || updateState.loading,
              submitError,
              onSubmit: submit,
              onClose: () => setModal(null),
          }
        : null

    return { formModal, openCreate, openEdit }
}
