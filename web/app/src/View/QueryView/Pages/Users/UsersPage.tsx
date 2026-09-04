import { UiQueryView, UiQueryViewFormModal } from "@ui"
import React from "react"
import { useUsersViewModel } from "./UsersViewModel"

export default function UsersPage(): React.ReactElement {
    const { queryView, formModal } = useUsersViewModel()
    return (
        <>
            <UiQueryView viewModel={queryView} />
            {formModal ? <UiQueryViewFormModal {...formModal} /> : null}
        </>
    )
}
