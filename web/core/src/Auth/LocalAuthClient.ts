import type { AuthClient, MfaEnrollment } from "./AuthClient"
import type { AuthMethod, OAuthProvider } from "./AuthMethods"
import { fetchRuntimeAuthMethodsFromUrl } from "./RuntimeAuthMethods"

const STORAGE_KEY = "base.localAuthToken"

export interface LocalAuthClientConfig {
    /**
     * Base URL of the auth__request__api function, when one is reachable
     * (the sandbox runs it next to GraphQL like every environment).
     * Enables the runtime sign-in-method read so sandbox previews render
     * dashboard live-toggles; absent (static demo builds), build-time
     * methods apply.
     */
    authUrl?: string
    /**
     * The signed dev-principal JWT (VITE_LOCAL_AUTH_TOKEN). Unlike every
     * other sign-in method — which the sandbox login surface simulates and
     * routes through signInLocal — anonymous sign-in is initiated by app
     * code (feature packs call it on first use), so the client must carry
     * the token to simulate that flow itself.
     */
    localToken?: string
}

/**
 * Dev-only auth client. The login page hands it the signed dev JWT from
 * VITE_LOCAL_AUTH_TOKEN; it persists the token in localStorage so reloads
 * stay signed in. Every remote sign-in method throws: in sandbox mode the
 * login surface simulates those flows and signs in via signInLocal instead.
 * The runtime method-list read is the one real network call — sandbox
 * previews must render the same live-toggled sign-in methods deploys do.
 */
export class LocalAuthClient implements AuthClient {
    private listeners = new Set<(token: string | null) => void>()
    private readonly authUrl: string | undefined
    private readonly localToken: string | undefined

    constructor(config: LocalAuthClientConfig = {}) {
        this.authUrl = config.authUrl
        this.localToken = config.localToken
    }

    async getToken(): Promise<string | null> {
        return localStorage.getItem(STORAGE_KEY)
    }

    async signInLocal(token: string): Promise<void> {
        localStorage.setItem(STORAGE_KEY, token)
        this.notify(token)
    }

    async signInWithOAuth(provider: OAuthProvider): Promise<void> {
        throw new Error(`${provider} sign-in is not available in local auth mode.`)
    }

    async signInWithMagicLink(_email: string): Promise<void> {
        throw new Error("Magic-link sign-in is not available in local auth mode.")
    }

    async verifyEmailOtp(_email: string, _code: string): Promise<void> {
        throw new Error("Email code sign-in is not available in local auth mode.")
    }

    async signInWithPassword(_email: string, _password: string): Promise<void> {
        throw new Error("Password sign-in is not available in local auth mode.")
    }

    async signUpWithPassword(_email: string, _password: string): Promise<void> {
        throw new Error("Password sign-up is not available in local auth mode.")
    }

    async requestPasswordReset(_email: string): Promise<void> {
        throw new Error("Password reset is not available in local auth mode.")
    }

    async completePasswordReset(_email: string, _code: string, _newPassword: string): Promise<void> {
        throw new Error("Password reset is not available in local auth mode.")
    }

    async updatePassword(_newPassword: string): Promise<void> {
        throw new Error("Password management is not available in local auth mode.")
    }

    async signInAnonymously(): Promise<void> {
        // Feature packs (PDF generator, interpreter, invoices) sign in
        // anonymously on first use rather than through the login surface, so
        // simulate the flow with the dev principal — on deploys this mints a
        // fresh anonymous user; locally it's always the dev user.
        if (this.localToken !== undefined && this.localToken !== "") {
            await this.signInLocal(this.localToken)
            return
        }
        throw new Error("Anonymous sign-in is not available in local auth mode.")
    }

    async fetchRuntimeAuthMethods(): Promise<AuthMethod[] | undefined> {
        // Sandbox parity: the dashboard can live-toggle sign-in methods, and
        // the sandbox's auth API serves the same GET /config deploys read
        // (fed by the platform-written live config file). Fail-safe like the
        // builtin client — no URL or no live config keeps build-time methods.
        if (this.authUrl === undefined) {
            return undefined
        }
        return fetchRuntimeAuthMethodsFromUrl(this.authUrl)
    }

    async verifyMfaCode(_code: string): Promise<void> {
        throw new Error("Two-factor authentication is not available in local auth mode.")
    }

    hasPendingMfaChallenge(): boolean {
        return false
    }

    async enrollMfa(): Promise<MfaEnrollment> {
        throw new Error("Two-factor authentication is not available in local auth mode.")
    }

    async confirmMfa(_code: string): Promise<string[]> {
        throw new Error("Two-factor authentication is not available in local auth mode.")
    }

    async disableMfa(_code: string): Promise<void> {
        throw new Error("Two-factor authentication is not available in local auth mode.")
    }

    async fetchMfaEnabled(): Promise<boolean> {
        // In local (sandbox) auth mode there is no second factor to manage.
        return false
    }

    async signOut(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY)
        this.notify(null)
    }

    onAuthStateChange(callback: (token: string | null) => void): () => void {
        this.listeners.add(callback)
        return () => {
            this.listeners.delete(callback)
        }
    }

    private notify(token: string | null): void {
        for (const listener of this.listeners) {
            listener(token)
        }
    }
}
