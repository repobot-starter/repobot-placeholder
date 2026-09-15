import { UiQueryView, UiQueryViewFormModal } from "@ui"
import React from "react"
import { ProjectMembersDialog } from "./ProjectMembersDialog"
import { useProjectsViewModel } from "./ProjectsViewModel"

export default function ProjectsPage(): React.ReactElement {
    const { queryView, formModal, membersProjectId, closeMembers } = useProjectsViewModel()
    return (
        <>
            <UiQueryView viewModel={queryView} />
            {formModal ? <UiQueryViewFormModal {...formModal} /> : null}
            {membersProjectId ? (
                <ProjectMembersDialog projectId={membersProjectId} onClose={closeMembers} />
            ) : null}
        </>
    )
}
