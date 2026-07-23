import type { AuthClient } from "./AuthClient"
import type { OAuthProvider } from "./AuthMethods"

const STORAGE_KEY = "base.localAuthToken"

/**
 * Dev-only auth client. The login page hands it the signed dev JWT from
 * VITE_LOCAL_AUTH_TOKEN; it persists the token in localStorage so reloads
 * stay signed in. Every remote method throws: in sandbox mode the login
 * surface simulates those flows and signs in via signInLocal instead.
 */
export class LocalAuthClient implements AuthClient {
    private listeners = new Set<(token: string | null) => void>()

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

    async signInAnonymously(): Promise<void> {
        throw new Error("Anonymous sign-in is not available in local auth mode.")
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
