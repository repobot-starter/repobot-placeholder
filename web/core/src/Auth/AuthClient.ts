import type { OAuthProvider } from "./AuthMethods"

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
    /** Builtin mode only: start an OAuth redirect flow (google). */
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
    /** Builtin mode only: sign in as an anonymous guest user. */
    signInAnonymously(): Promise<void>
    signOut(): Promise<void>
    /** Subscribe to token changes. Returns an unsubscribe function. */
    onAuthStateChange(callback: (token: string | null) => void): () => void
}
