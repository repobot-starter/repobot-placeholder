import type { AuthClient } from "./AuthClient"
import type { OAuthProvider } from "./AuthMethods"

export interface BuiltinAuthClientConfig {
    /** Base URL of the auth__request__api function (see deriveAuthEndpoint). */
    authUrl: string
    /** Where OAuth / magic-link flows land; defaults to the current origin. */
    redirectTo?: string
}

/**
 * The auth API endpoint is the auth__request__api function, which lives next
 * to the GraphQL function in every environment — the emulator and the
 * platform deployer treat all exports uniformly — so its URL is the GraphQL
 * URL with the trailing function name swapped. The app passes its GraphQL URL
 * (import.meta.env.VITE_GRAPHQL_URL); core never reads env directly.
 */
export function deriveAuthEndpoint(graphqlUrl: string): string {
    const endpoint = graphqlUrl.replace(/graphql__request__api\/?$/, "auth__request__api")
    if (endpoint === graphqlUrl) {
        throw new Error(
            "Could not derive the auth endpoint: the GraphQL URL does not end with " +
                "the graphql__request__api function name.",
        )
    }
    return endpoint
}

const STORAGE_KEY = "base.builtinAuthSession"
/** Refresh this many seconds before the access token actually expires. */
const EXPIRY_MARGIN_SECONDS = 60

interface StoredSession {
    accessToken: string
    refreshToken: string
    /** Unix ms when the access token expires. */
    expiresAt: number
}

interface SessionResponse {
    access_token: string
    refresh_token: string
    expires_in: number
}

/**
 * Auth client for deployed environments (VITE_AUTH_MODE=builtin): talks to
 * the kernel's own auth__request__api function. Sessions persist in
 * localStorage and refresh transparently; OAuth and magic-link flows land
 * back on the app with the session in the URL hash fragment, which the
 * constructor picks up and strips.
 */
export class BuiltinAuthClient implements AuthClient {
    private readonly authUrl: string
    private readonly redirectTo: string | undefined
    private listeners = new Set<(token: string | null) => void>()
    private refreshPromise: Promise<StoredSession | null> | undefined

    constructor(config: BuiltinAuthClientConfig) {
        this.authUrl = config.authUrl.replace(/\/$/, "")
        this.redirectTo = config.redirectTo
        this.adoptSessionFromUrl()
    }

    async getToken(): Promise<string | null> {
        const session = this.readSession()
        if (session === null) {
            return null
        }
        if (Date.now() < session.expiresAt - EXPIRY_MARGIN_SECONDS * 1000) {
            return session.accessToken
        }
        const refreshed = await this.refresh(session)
        return refreshed?.accessToken ?? null
    }

    async signInLocal(_token: string): Promise<void> {
        throw new Error("Local dev sign-in is not available in builtin auth mode.")
    }

    async signInWithOAuth(provider: OAuthProvider): Promise<void> {
        if (provider !== "google") {
            throw new Error(`${provider} sign-in is not supported yet.`)
        }
        const redirectTo = encodeURIComponent(this.resolveRedirectTo())
        window.location.assign(`${this.authUrl}/google/start?redirect_to=${redirectTo}`)
    }

    async signInWithMagicLink(email: string): Promise<void> {
        await this.postJson("/otp", { email })
    }

    async verifyEmailOtp(email: string, code: string): Promise<void> {
        const session = await this.postJson<SessionResponse>("/verify", {
            email,
            code,
            type: "email",
        })
        this.storeSession(session)
    }

    async signInWithPassword(email: string, password: string): Promise<void> {
        const session = await this.postJson<SessionResponse>("/token", {
            grant_type: "password",
            email,
            password,
        })
        this.storeSession(session)
    }

    async signUpWithPassword(email: string, password: string): Promise<void> {
        const result = await this.postJson<Partial<SessionResponse>>("/signup", { email, password })
        // Degraded environments (no SMTP) auto-confirm and return a session.
        if (typeof result.access_token === "string") {
            this.storeSession(result as SessionResponse)
        }
    }

    async requestPasswordReset(email: string): Promise<void> {
        await this.postJson("/recover", { email })
    }

    async completePasswordReset(email: string, code: string, newPassword: string): Promise<void> {
        // Verifying the recovery code creates a session, so on success the
        // auth store flips to signedIn and the app redirects.
        const session = await this.postJson<SessionResponse>("/verify", {
            email,
            code,
            type: "recovery",
        })
        this.storeSession(session)
        await this.postJson("/password", { password: newPassword }, session.access_token)
    }

    async signInAnonymously(): Promise<void> {
        const session = await this.postJson<SessionResponse>("/anonymous", {})
        this.storeSession(session)
    }

    async signOut(): Promise<void> {
        const session = this.readSession()
        if (session !== null) {
            // Best effort: local sign-out proceeds even if revocation fails.
            try {
                await this.postJson("/signout", { refresh_token: session.refreshToken })
            } catch {
                // Ignored; the local session is cleared regardless.
            }
        }
        this.clearSession()
    }

    onAuthStateChange(callback: (token: string | null) => void): () => void {
        this.listeners.add(callback)
        return () => {
            this.listeners.delete(callback)
        }
    }

    // ---- Internals ------------------------------------------------------

    /**
     * OAuth and magic-link flows land on the app with the session in the URL
     * hash (never sent to any server, never logged). Adopt and strip it.
     */
    private adoptSessionFromUrl(): void {
        if (typeof window === "undefined") {
            return
        }
        const hash = window.location.hash.replace(/^#/, "")
        if (hash === "") {
            return
        }
        const params = new URLSearchParams(hash)
        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")
        if (accessToken === null || refreshToken === null) {
            return
        }
        const expiresIn = Number(params.get("expires_in") ?? "3600")
        this.storeSession({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresIn,
        })
        window.history.replaceState(null, "", window.location.pathname + window.location.search)
    }

    private async refresh(session: StoredSession): Promise<StoredSession | null> {
        // Single-flight: concurrent getToken calls share one refresh request.
        this.refreshPromise ??= (async () => {
            try {
                const refreshed = await this.postJson<SessionResponse>("/token", {
                    grant_type: "refresh_token",
                    refresh_token: session.refreshToken,
                })
                return this.storeSession(refreshed)
            } catch {
                this.clearSession()
                return null
            } finally {
                this.refreshPromise = undefined
            }
        })()
        return await this.refreshPromise
    }

    private async postJson<T = unknown>(path: string, body: unknown, bearerToken?: string): Promise<T> {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (bearerToken !== undefined) {
            headers.Authorization = `Bearer ${bearerToken}`
        }
        const response = await fetch(`${this.authUrl}${path}`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        })
        const payload: unknown = await response.json().catch(() => ({}))
        if (!response.ok) {
            const message =
                typeof payload === "object" &&
                payload !== null &&
                typeof (payload as { error?: { message?: unknown } }).error?.message === "string"
                    ? (payload as { error: { message: string } }).error.message
                    : `Auth request failed (${response.status}).`
            throw new Error(message)
        }
        return payload as T
    }

    private storeSession(session: SessionResponse): StoredSession {
        const stored: StoredSession = {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: Date.now() + session.expires_in * 1000,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
        this.notify(stored.accessToken)
        return stored
    }

    private readSession(): StoredSession | null {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === null) {
            return null
        }
        try {
            const parsed = JSON.parse(raw) as StoredSession
            if (typeof parsed.accessToken === "string" && typeof parsed.refreshToken === "string") {
                return parsed
            }
        } catch {
            // Fall through to clearing the malformed value.
        }
        localStorage.removeItem(STORAGE_KEY)
        return null
    }

    private clearSession(): void {
        localStorage.removeItem(STORAGE_KEY)
        this.notify(null)
    }

    private resolveRedirectTo(): string {
        if (this.redirectTo !== undefined && this.redirectTo !== "") {
            return this.redirectTo
        }
        return window.location.origin
    }

    private notify(token: string | null): void {
        for (const listener of this.listeners) {
            listener(token)
        }
    }
}
