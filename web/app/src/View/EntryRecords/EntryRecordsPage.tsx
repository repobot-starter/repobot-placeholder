import { UiQueryView, UiQueryViewFormModal } from "@ui"
import React from "react"
import { useEntryRecordsViewModel } from "./EntryRecordsViewModel"

/**
 * The entry pack's records destination (manifest path `/records`): the
 * workbook table whose columns are the user's field definitions, with the
 * backend-driven entry form in a modal. Also the pack's standalone preview
 * surface when added as a feature into an existing app.
 */
export default function EntryRecordsPage(): React.ReactElement {
    const { queryView, formModal } = useEntryRecordsViewModel()
    return (
        <>
            <UiQueryView viewModel={queryView} />
            {formModal ? <UiQueryViewFormModal {...formModal} /> : null}
        </>
    )
}
