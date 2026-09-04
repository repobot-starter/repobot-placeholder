package com.baseapp.android.components

import com.apollographql.apollo.api.Optional
import com.baseapp.android.graphql.generated.type.CreateProjectFields
import com.baseapp.android.graphql.generated.type.CreateProjectInput
import com.baseapp.android.graphql.generated.type.UpdateProjectFields
import com.baseapp.android.graphql.generated.type.UpdateProjectInput
import com.baseapp.android.store.AppAlertStore
import java.util.UUID

/**
 * Project mutations. Reads flow through ProjectsPageComponent's feed; this
 * component owns writes and cross-cutting side effects (refresh + alerts).
 */
class ProjectComponent {
    /** Returns true when the project was created (so sheets can dismiss). */
    suspend fun createProject(name: String, description: String?): Boolean {
        val trimmedName = name.trim()
        if (trimmedName.isEmpty()) {
            reportError("Enter a project name.")
            return false
        }
        val trimmedDescription = description?.trim() ?: ""
        return try {
            gql.createProject(
                CreateProjectInput(
                    idempotencyKey = UUID.randomUUID().toString(),
                    fields = CreateProjectFields(
                        name = trimmedName,
                        description = if (trimmedDescription.isEmpty()) {
                            Optional.absent()
                        } else {
                            Optional.present(trimmedDescription)
                        },
                    ),
                )
            )
            components.projectsPage.refresh(withLoading = false)
            reportSuccess("Project created.")
            true
        } catch (error: Exception) {
            reportError(error.message ?: "Could not create the project.")
            false
        }
    }

    suspend fun archiveProject(projectId: String): Boolean {
        return try {
            gql.updateProject(
                UpdateProjectInput(
                    objectId = projectId,
                    idempotencyKey = UUID.randomUUID().toString(),
                    fields = UpdateProjectFields(doArchive = Optional.present(true)),
                )
            )
            components.projectsPage.refresh(withLoading = false)
            reportSuccess("Project archived.")
            true
        } catch (error: Exception) {
            reportError(error.message ?: "Could not archive the project.")
            false
        }
    }

    private fun reportError(message: String) {
        val trimmed = message.trim()
        if (trimmed.isEmpty()) {
            return
        }
        store.sessionStore.reportError(trimmed)
        store.appAlertStore.setActiveAlert(
            AppAlertStore.AlertMessage(id = "project-error-$trimmed", message = trimmed, isError = true)
        )
    }

    private fun reportSuccess(message: String) {
        store.sessionStore.reportSuccess(message)
        store.appAlertStore.setActiveAlert(
            AppAlertStore.AlertMessage(id = "project-success-$message", message = message, isError = false)
        )
    }
}
