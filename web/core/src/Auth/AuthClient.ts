import type { AuthMethod, OAuthProvider } from "./AuthMethods"

/**
 * Thrown by sign-in calls when the identity has two-factor authentication
 * enabled: the primary factor was accepted, and the client is now holding a
 * pending challenge that verifyMfaCode answers. The AuthCard recognizes it
 * structurally (error.name) and switches to the challenge view.
 */
export class MfaRequiredError extends Error {
    constructor() {
        super("Enter the 6-digit code from your authenticator app.")
        this.name = "MfaRequiredError"
    }
}

export interface MfaEnrollment {
    /** The base32 TOTP secret, for manual entry into an authenticator app. */
    secret: string
    /** The otpauth:// URI (QR contents on web, opened directly on mobile). */
    otpauthUri: string
}

/**
 * Auth abstraction consumed by the runtime and the login page. Two
 * implementations exist: LocalAuthClient (dev JWT injected by bootstrap) and
 * BuiltinAuthClient (deployed environments). Every method the sign-in
 * surface can render (see AuthMethods.ts) has a client call here; modes that
 * don't support a method throw a descriptive error instead of failing silently.
 */
export interface AuthClient {
    /** Current bearer token, or null when signed out. */
    getToken(): Promise<string | null>
    /** Local mode only: store the bootstrap-provided dev JWT and sign in. */
    signInLocal(token: string): Promise<void>
    /** Builtin mode only: start an OAuth redirect flow (google, apple). */
    signInWithOAuth(provider: OAuthProvider): Promise<void>
    /** Builtin mode only: send a sign-in code email (also carries a magic-link fallback). */
    signInWithMagicLink(email: string): Promise<void>
    /** Builtin mode only: verify the emailed one-time code and sign in. */
    verifyEmailOtp(email: string, code: string): Promise<void>
    /** Builtin mode only: email + password sign-in. */
    signInWithPassword(email: string, password: string): Promise<void>
    /** Builtin mode only: create an email + password account (sends a confirmation email). */
    signUpWithPassword(email: string, password: string): Promise<void>
    /** Builtin mode only: email a password-reset code (the message also carries a link fallback). */
    requestPasswordReset(email: string): Promise<void>
    /** Builtin mode only: verify the emailed recovery code and set a new password; leaves the user signed in. */
    completePasswordReset(email: string, code: string, newPassword: string): Promise<void>
    /** Builtin mode only: set a new password for the current signed-in session (e.g. from account settings). */
    updatePassword(newPassword: string): Promise<void>
    /** Builtin mode only: sign in as an anonymous guest user. */
    signInAnonymously(): Promise<void>
    signOut(): Promise<void>
    /**
     * Builtin mode only: the runtime (dashboard-toggled) sign-in methods
     * from the auth API's GET /config, or undefined when the project has
     * never live-toggled them (or the fetch failed) — callers then keep
     * their build-time configured methods. Never throws.
     */
    fetchRuntimeAuthMethods(): Promise<AuthMethod[] | undefined>
    /**
     * Builtin mode only: answer a pending MFA challenge (raised as
     * MfaRequiredError by a sign-in call, or adopted from a redirect's
     * #mfa_challenge fragment) with a TOTP or recovery code and sign in.
     */
    verifyMfaCode(code: string): Promise<void>
    /** True while an unanswered MFA challenge is pending (see verifyMfaCode). */
    hasPendingMfaChallenge(): boolean
    /** Builtin mode only: start TOTP enrollment for the signed-in user. */
    enrollMfa(): Promise<MfaEnrollment>
    /** Builtin mode only: confirm enrollment with the first code; returns the recovery codes (once). */
    confirmMfa(code: string): Promise<string[]>
    /** Builtin mode only: disable MFA; requires a current TOTP or recovery code. */
    disableMfa(code: string): Promise<void>
    /** Whether the signed-in user has MFA enabled. Never throws (false on failure). */
    fetchMfaEnabled(): Promise<boolean>
    /** Subscribe to token changes. Returns an unsubscribe function. */
    onAuthStateChange(callback: (token: string | null) => void): () => void
}
