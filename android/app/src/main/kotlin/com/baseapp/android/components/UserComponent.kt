package com.baseapp.android.components

import com.apollographql.apollo.api.Optional
import com.baseapp.android.graphql.generated.type.UpdateUserFields
import com.baseapp.android.graphql.generated.type.UpdateUserInput
import com.baseapp.android.store.AppAlertStore
import java.util.UUID

/**
 * Identity mutations for the signed-in user. Reads flow through the session
 * store's hydrated user; this component owns writes and the follow-up
 * rehydration + alerts (Store -> Component -> View pattern, mirroring the
 * iOS UserComponent).
 */
class UserComponent {
    /** Returns true when the profile was saved (so editors can dismiss). */
    suspend fun updateDisplayName(userId: String, displayName: String): Boolean {
        val trimmed = displayName.trim()
        if (trimmed.isEmpty()) {
            reportError("Enter a display name.")
            return false
        }
        return try {
            gql.updateUser(
                UpdateUserInput(
                    objectId = userId,
                    idempotencyKey = UUID.randomUUID().toString(),
                    fields = UpdateUserFields(displayName = Optional.present(trimmed)),
                )
            )
            // The settings screen renders the hydrated user; refresh it so the
            // change is visible everywhere (shell profile, settings, users list).
            components.auth.refreshHydratedUser()
            reportSuccess("Profile updated.")
            true
        } catch (error: Exception) {
            reportError(error.message ?: "Could not update the profile.")
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
            AppAlertStore.AlertMessage(id = "user-error-$trimmed", message = trimmed, isError = true)
        )
    }

    private fun reportSuccess(message: String) {
        store.sessionStore.reportSuccess(message)
        store.appAlertStore.setActiveAlert(
            AppAlertStore.AlertMessage(id = "user-success-$message", message = message, isError = false)
        )
    }
}
