import { MfaRequiredError, type AuthClient, type MfaEnrollment } from "./AuthClient"
import { type AuthMethod, type OAuthProvider } from "./AuthMethods"
import { fetchRuntimeAuthMethodsFromUrl } from "./RuntimeAuthMethods"

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

/** A sign-in response is a session — or an MFA challenge to answer first. */
type SignInResponse = Partial<SessionResponse> & {
    mfa_required?: boolean
    challenge_token?: string
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
    /** Set while a sign-in yielded an MFA challenge; verifyMfaCode consumes it. */
    private pendingMfaChallenge: string | undefined
    /** A reset flow's new password, applied once its MFA challenge is answered. */
    private pendingPasswordReset: string | undefined

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
        // The backend exposes one start route per registered provider; the
        // AuthMethods registry and this URL shape are the whole client seam.
        const redirectTo = encodeURIComponent(this.resolveRedirectTo())
        window.location.assign(`${this.authUrl}/${provider}/start?redirect_to=${redirectTo}`)
    }

    async signInWithMagicLink(email: string): Promise<void> {
        await this.postJson("/otp", { email })
    }

    async fetchRuntimeAuthMethods(): Promise<AuthMethod[] | undefined> {
        return fetchRuntimeAuthMethodsFromUrl(this.authUrl)
    }

    async verifyEmailOtp(email: string, code: string): Promise<void> {
        const response = await this.postJson<SignInResponse>("/verify", {
            email,
            code,
            type: "email",
        })
        this.adoptSignInResponse(response)
    }

    async signInWithPassword(email: string, password: string): Promise<void> {
        const response = await this.postJson<SignInResponse>("/token", {
            grant_type: "password",
            email,
            password,
        })
        this.adoptSignInResponse(response)
    }

    async signUpWithPassword(email: string, password: string): Promise<void> {
        const result = await this.postJson<SignInResponse>("/signup", { email, password })
        // Degraded environments (no SMTP) auto-confirm and return a session
        // (or a challenge, when the email already had MFA enabled).
        if (typeof result.access_token === "string" || result.mfa_required === true) {
            this.adoptSignInResponse(result)
        }
    }

    async requestPasswordReset(email: string): Promise<void> {
        await this.postJson("/recover", { email })
    }

    async completePasswordReset(email: string, code: string, newPassword: string): Promise<void> {
        // Verifying the recovery code creates a session, so on success the
        // auth store flips to signedIn and the app redirects. With MFA
        // enabled the verify yields a challenge instead; the new password is
        // held and applied right after verifyMfaCode succeeds.
        const response = await this.postJson<SignInResponse>("/verify", {
            email,
            code,
            type: "recovery",
        })
        if (response.mfa_required === true) {
            this.pendingPasswordReset = newPassword
        }
        const session = this.adoptSignInResponse(response)
        await this.postJson("/password", { password: newPassword }, session.accessToken)
    }

    async updatePassword(newPassword: string): Promise<void> {
        // getToken refreshes transparently, so the bearer token is always live.
        const token = await this.getToken()
        if (token === null) {
            throw new Error("You must be signed in to change your password.")
        }
        await this.postJson("/password", { password: newPassword }, token)
    }

    async signInAnonymously(): Promise<void> {
        const session = await this.postJson<SessionResponse>("/anonymous", {})
        this.storeSession(session)
    }

    async verifyMfaCode(code: string): Promise<void> {
        if (this.pendingMfaChallenge === undefined) {
            throw new Error("No sign-in is awaiting a code. Start over from the sign-in page.")
        }
        const session = await this.postJson<SessionResponse>("/mfa/verify", {
            challenge_token: this.pendingMfaChallenge,
            code,
        })
        this.pendingMfaChallenge = undefined
        this.storeSession(session)
        if (this.pendingPasswordReset !== undefined) {
            const newPassword = this.pendingPasswordReset
            this.pendingPasswordReset = undefined
            await this.postJson("/password", { password: newPassword }, session.access_token)
        }
    }

    hasPendingMfaChallenge(): boolean {
        return this.pendingMfaChallenge !== undefined
    }

    async enrollMfa(): Promise<MfaEnrollment> {
        const response = await this.postJson<{ secret: string; otpauth_uri: string }>(
            "/mfa/enroll",
            {},
            await this.requireToken(),
        )
        return { secret: response.secret, otpauthUri: response.otpauth_uri }
    }

    async confirmMfa(code: string): Promise<string[]> {
        const response = await this.postJson<{ recovery_codes: string[] }>(
            "/mfa/confirm",
            { code },
            await this.requireToken(),
        )
        return response.recovery_codes
    }

    async disableMfa(code: string): Promise<void> {
        await this.postJson("/mfa/disable", { code }, await this.requireToken())
    }

    async fetchMfaEnabled(): Promise<boolean> {
        // Fail-safe like fetchRuntimeAuthMethods: the Settings surface must
        // render even when the status endpoint is unreachable.
        try {
            const token = await this.getToken()
            if (token === null) {
                return false
            }
            const response = await fetch(`${this.authUrl}/mfa/status`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) {
                return false
            }
            const body = (await response.json()) as { enabled?: unknown }
            return body.enabled === true
        } catch {
            return false
        }
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
     * Adopts a sign-in response: stores the session, or — when the backend
     * answered with an MFA challenge — holds the challenge token and throws
     * MfaRequiredError so the surface can switch to its challenge view.
     */
    private adoptSignInResponse(response: SignInResponse): StoredSession {
        if (response.mfa_required === true && typeof response.challenge_token === "string") {
            this.pendingMfaChallenge = response.challenge_token
            throw new MfaRequiredError()
        }
        return this.storeSession(response as SessionResponse)
    }

    /**
     * OAuth and magic-link flows land on the app with the session in the URL
     * hash (never sent to any server, never logged). Adopt and strip it.
     * With MFA enabled the fragment carries a challenge instead of tokens.
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
        const mfaChallenge = params.get("mfa_challenge")
        if (mfaChallenge !== null) {
            this.pendingMfaChallenge = mfaChallenge
            window.history.replaceState(null, "", window.location.pathname + window.location.search)
            return
        }
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

    private async requireToken(): Promise<string> {
        const token = await this.getToken()
        if (token === null) {
            throw new Error("You must be signed in to manage two-factor authentication.")
        }
        return token
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
