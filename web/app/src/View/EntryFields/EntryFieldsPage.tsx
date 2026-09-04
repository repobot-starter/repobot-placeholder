import { UiQueryView, UiQueryViewFormModal } from "@ui"
import React from "react"
import { useEntryFieldsViewModel } from "./EntryFieldsViewModel"

/**
 * The entry pack's field designer destination (manifest path `/fields`):
 * the workbook's schema. Every change here reshapes the records table's
 * columns and the backend-built entry form.
 */
export default function EntryFieldsPage(): React.ReactElement {
    const { queryView, formModal } = useEntryFieldsViewModel()
    return (
        <>
            <UiQueryView viewModel={queryView} />
            {formModal ? <UiQueryViewFormModal {...formModal} /> : null}
        </>
    )
}
