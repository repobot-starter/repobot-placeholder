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
     * Builtin mode only: the browser URL that starts an OAuth flow (google,
     * apple). The provider's redirect lands on the app's auth deep link,
     * which handleIncomingUrl completes. Null when OAuth is not available
     * (local mode) or the method is not an OAuth provider.
     */
    fun oauthAuthorizeUrl(provider: AuthMethod): String?

    /**
     * Builtin mode only: complete an auth deep link (OAuth callback).
     * Returns null when the URL is not an auth callback.
     */
    suspend fun handleIncomingUrl(url: String): AuthSession?

    /**
     * Builtin mode only: the runtime (dashboard-toggled) sign-in methods
     * from the auth API's GET /config, or null when the project has never
     * live-toggled them (or the fetch failed) — callers then keep the
     * build-time AUTH_METHODS config. Never throws.
     */
    suspend fun fetchRuntimeAuthMethods(): List<AuthMethod>?

    /**
     * True while a sign-in yielded an MFA challenge (a sign-in call threw
     * MfaRequiredException, or an auth deep link carried #mfa_challenge)
     * that verifyMfaCode has not answered yet.
     */
    val hasPendingMfaChallenge: Boolean

    /**
     * Builtin mode only: answer the pending MFA challenge with a TOTP or
     * recovery code and complete the sign-in.
     */
    suspend fun verifyMfaCode(code: String): AuthSession

    /** Builtin mode only: start TOTP enrollment for the signed-in user. */
    suspend fun enrollMfa(): MfaEnrollment

    /**
     * Builtin mode only: confirm enrollment with the first authenticator
     * code; returns the recovery codes (shown exactly once).
     */
    suspend fun confirmMfa(code: String): List<String>

    /** Builtin mode only: disable MFA; requires a current TOTP or recovery code. */
    suspend fun disableMfa(code: String)

    /** Whether the signed-in user has MFA enabled. Never throws (false on failure). */
    suspend fun fetchMfaEnabled(): Boolean

    suspend fun signOut()
}

class AuthClientException(message: String) : Exception(message)
