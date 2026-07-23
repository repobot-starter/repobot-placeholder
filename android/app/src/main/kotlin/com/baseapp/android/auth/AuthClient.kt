package com.baseapp.android.auth

/**
 * Auth abstraction consumed by AuthComponent and the sign-in screen. Two
 * implementations exist, mirroring web/core's AuthClient (and the iOS twin):
 * - LocalAuthClient: sandbox flavor; signs in with the bootstrap-generated
 *   dev JWT stamped into the built APK.
 * - BuiltinAuthClient: deployed flavors; email one-time codes, email +
 *   password, Google OAuth, and anonymous guests against the kernel's own
 *   auth API.
 */
interface AuthClient {
    suspend fun restoreSession(): AuthSession?

    /** Local mode only: sign in as the local dev principal. */
    suspend fun signInLocal(): AuthSession

    /** Builtin mode only: email a one-time sign-in code (also carries a magic link). */
    suspend fun sendEmailCode(email: String)

    /** Builtin mode only: verify the emailed code and sign in. */
    suspend fun verifyEmailCode(email: String, code: String): AuthSession

    /** Builtin mode only: email + password sign-in. */
    suspend fun signInWithPassword(email: String, password: String): AuthSession

    /**
     * Builtin mode only: create an email + password account. Returns the
     * session when the environment signs users in immediately, or null when
     * email confirmation is required first.
     */
    suspend fun signUpWithPassword(email: String, password: String): AuthSession?

    /** Builtin mode only: email a password-recovery code. */
    suspend fun requestPasswordReset(email: String)

    /**
     * Builtin mode only: verify the emailed recovery code, set the new
     * password, and sign the user in with the resulting session.
     */
    suspend fun completePasswordReset(email: String, code: String, newPassword: String): AuthSession

    /** Builtin mode only: sign in as an anonymous guest user. */
    suspend fun signInAnonymously(): AuthSession

    /**
     * Builtin mode only: the browser URL that starts an OAuth flow (google).
     * The provider's redirect lands on the app's auth deep link, which
     * handleIncomingUrl completes. Null when OAuth is not available (local
     * mode) or the method is not an OAuth provider.
     */
    fun oauthAuthorizeUrl(provider: AuthMethod): String?

    /**
     * Builtin mode only: complete an auth deep link (OAuth callback).
     * Returns null when the URL is not an auth callback.
     */
    suspend fun handleIncomingUrl(url: String): AuthSession?

    suspend fun signOut()
}

class AuthClientException(message: String) : Exception(message)
