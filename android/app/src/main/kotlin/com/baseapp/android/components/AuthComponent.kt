package com.baseapp.android.components

import com.baseapp.android.auth.AuthMethod
import com.baseapp.android.auth.AuthSession
import com.baseapp.android.graphql.GraphQLClientException
import com.baseapp.android.store.AppAlertStore
import com.baseapp.android.store.SessionStore

class AuthComponent {
    private val sessionStore: SessionStore get() = store.sessionStore
    private val appAlertStore: AppAlertStore get() = store.appAlertStore

    suspend fun restoreSessionAndHydrateUser() {
        sessionStore.setSession(appAuthClient.restoreSession())
        if (sessionStore.session == null) {
            return
        }
        hydrateAuthenticatedUser()
    }

    suspend fun refreshHydratedUser() {
        if (sessionStore.session == null) {
            return
        }
        hydrateAuthenticatedUser()
    }

    /** Sandbox flavor: sign in as the bootstrap-generated local dev principal. */
    suspend fun signInLocal() {
        if (sessionStore.state.value.isSigningIn) {
            return
        }
        sessionStore.clearStatusMessages()
        sessionStore.setSigningIn(true)
        try {
            val session = appAuthClient.signInLocal()
            completeAuthenticatedSignIn(session)
        } catch (error: Exception) {
            reportError(error.message ?: "Sign-in failed.")
        } finally {
            sessionStore.setSigningIn(false)
        }
    }

    /**
     * Deployed flavors: email a one-time sign-in code. Returns true when the
     * email was sent so the view can advance to code entry.
     */
    suspend fun sendEmailCode(email: String): Boolean {
        if (sessionStore.state.value.isSigningIn) {
            return false
        }
        sessionStore.clearStatusMessages()
        sessionStore.setSigningIn(true)
        return try {
            appAuthClient.sendEmailCode(email)
            reportSuccess("Check your email for a sign-in code.")
            true
        } catch (error: Exception) {
            reportError(error.message ?: "Could not send the sign-in code.")
            false
        } finally {
            sessionStore.setSigningIn(false)
        }
    }

    suspend fun verifyEmailCode(email: String, code: String) {
        if (sessionStore.state.value.isSigningIn) {
            return
        }
        sessionStore.clearStatusMessages()
        sessionStore.setSigningIn(true)
        try {
            val session = appAuthClient.verifyEmailCode(email, code)
            completeAuthenticatedSignIn(session)
        } catch (error: Exception) {
            reportError(error.message ?: "Sign-in failed.")
        } finally {
            sessionStore.setSigningIn(false)
        }
    }

    /** Deployed flavors: email + password sign-in. */
    suspend fun signInWithPassword(email: String, password: String) {
        if (sessionStore.state.value.isSigningIn) {
            return
        }
        sessionStore.clearStatusMessages()
        sessionStore.setSigningIn(true)
        try {
            val session = appAuthClient.signInWithPassword(email, password)
            completeAuthenticatedSignIn(session)
        } catch (error: Exception) {
            reportError(error.message ?: "Sign-in failed.")
        } finally {
            sessionStore.setSigningIn(false)
        }
    }

    /**
     * Deployed flavors: create an email + password account. Signs in
     * immediately when the project skips email confirmation; otherwise
     * reports the check-your-inbox message.
     */
    suspend fun signUpWithPassword(email: String, password: String) {
        if (sessionStore.state.value.isSigningIn) {
            return
        }
        sessionStore.clearStatusMessages()
        sessionStore.setSigningIn(true)
        try {
            val session = appAuthClient.signUpWithPassword(email, password)
            if (session != null) {
                completeAuthenticatedSignIn(session)
            } else {
                reportSuccess("Account created — check your inbox to confirm your email.")
            }
        } catch (error: Exception) {
            reportError(error.message ?: "Sign-up failed.")
        } finally {
            sessionStore.setSigningIn(false)
        }
    }

    /**
     * Deployed flavors: email a password-reset code. Returns true when the
     * email was sent so the view can advance to code + new-password entry.
     */
    suspend fun requestPasswordReset(email: String): Boolean {
        if (sessionStore.state.value.isSigningIn) {
            return false
        }
        sessionStore.clearStatusMessages()
        sessionStore.setSigningIn(true)
        return try {
            appAuthClient.requestPasswordReset(email)
            reportSuccess("Reset code sent — check your inbox.")
            true
        } catch (error: Exception) {
            reportError(error.message ?: "Could not send the recovery email.")
            false
        } finally {
            sessionStore.setSigningIn(false)
        }
    }

    /**
     * Deployed flavors: verify the emailed reset code, set the new password,
     * and complete the sign-in with the resulting session.
     */
    suspend fun completePasswordReset(email: String, code: String, newPassword: String) {
        if (sessionStore.state.value.isSigningIn) {
            return
        }
        sessionStore.clearStatusMessages()
        sessionStore.setSigningIn(true)
        try {
            val session = appAuthClient.completePasswordReset(email, code, newPassword)
            completeAuthenticatedSignIn(session)
        } catch (error: Exception) {
            reportError(error.message ?: "Password reset failed.")
        } finally {
            sessionStore.setSigningIn(false)
        }
    }

    /** Deployed flavors: sign in as an anonymous guest user. */
    suspend fun signInAnonymously() {
        if (sessionStore.state.value.isSigningIn) {
            return
        }
        sessionStore.clearStatusMessages()
        sessionStore.setSigningIn(true)
        try {
            val session = appAuthClient.signInAnonymously()
            completeAuthenticatedSignIn(session)
        } catch (error: Exception) {
            reportError(error.message ?: "Sign-in failed.")
        } finally {
            sessionStore.setSigningIn(false)
        }
    }

    /**
     * Deployed flavors: the browser URL that starts an OAuth flow. The
     * provider redirects back to the app's auth deep link, which
     * handleIncomingUrl completes.
     */
    fun oauthAuthorizeUrl(provider: AuthMethod): String? = appAuthClient.oauthAuthorizeUrl(provider)

    /** Magic-link deep link back into the app. Returns true when handled. */
    suspend fun handleIncomingUrl(url: String): Boolean {
        val session = appAuthClient.handleIncomingUrl(url) ?: return false
        sessionStore.clearStatusMessages()
        completeAuthenticatedSignIn(session)
        return true
    }

    suspend fun signOut() {
        appAuthClient.signOut()
        sessionStore.resetForSignOut()
    }

    private suspend fun completeAuthenticatedSignIn(session: AuthSession) {
        sessionStore.setSession(session)
        hydrateAuthenticatedUser()
    }

    private suspend fun hydrateAuthenticatedUser() {
        sessionStore.setHydratingUser(true)
        try {
            val hydrated = gql.fetchCurrentUser()
            sessionStore.setHydratedUser(hydrated)
            sessionStore.clearStatusMessages()
            appAlertStore.setActiveAlert(null)
        } catch (error: Exception) {
            if (!isAuthFailure(error)) {
                // Transient problem (offline, server hiccup): keep the session so
                // the user isn't signed out over a network blip. The next refresh
                // retries.
                reportError("Could not load your account. Check your connection and try again.")
                return
            }
            sessionStore.setHydratedUser(null)
            sessionStore.setSession(null)
            reportError("Your session has expired. Please sign in again.")
            appAuthClient.signOut()
        } finally {
            sessionStore.setHydratingUser(false)
        }
    }

    private fun reportError(message: String) {
        val trimmed = message.trim()
        if (trimmed.isEmpty()) {
            return
        }
        sessionStore.reportError(trimmed)
        appAlertStore.setActiveAlert(
            AppAlertStore.AlertMessage(id = "error-$trimmed", message = trimmed, isError = true)
        )
    }

    private fun reportSuccess(message: String) {
        val trimmed = message.trim()
        if (trimmed.isEmpty()) {
            return
        }
        sessionStore.reportSuccess(trimmed)
        appAlertStore.setActiveAlert(
            AppAlertStore.AlertMessage(id = "success-$trimmed", message = trimmed, isError = false)
        )
    }

    private companion object {
        /**
         * Only these errors mean the credentials themselves are bad. Anything
         * else (timeouts, DNS failures, 5xx) should never destroy the session.
         */
        fun isAuthFailure(error: Exception): Boolean {
            val gqlError = error as? GraphQLClientException ?: return false
            return when (gqlError) {
                is GraphQLClientException.Unauthenticated -> true
                is GraphQLClientException.HttpFailure ->
                    gqlError.statusCode == 401 || gqlError.statusCode == 403
                is GraphQLClientException.Upstream ->
                    gqlError.message.contains("unauthenticated", ignoreCase = true)
                        || gqlError.message.contains("unauthorized", ignoreCase = true)
                is GraphQLClientException.InvalidResponse,
                is GraphQLClientException.NetworkFailure -> false
            }
        }
    }
}
