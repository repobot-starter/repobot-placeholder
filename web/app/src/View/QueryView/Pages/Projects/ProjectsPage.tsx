import { UiQueryView, UiQueryViewFormModal } from "@ui"
import React from "react"
import { useProjectsViewModel } from "./ProjectsViewModel"

export default function ProjectsPage(): React.ReactElement {
    const { queryView, formModal } = useProjectsViewModel()
    return (
        <>
            <UiQueryView viewModel={queryView} />
            {formModal ? <UiQueryViewFormModal {...formModal} /> : null}
        </>
    )
}
