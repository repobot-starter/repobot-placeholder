import { proxy } from "valtio/vanilla"

/**
 * "mfaChallenge": a redirect sign-in (OAuth / magic link) landed with an MFA
 * challenge instead of tokens — the app should route to the login surface's
 * challenge view rather than treating the user as plainly signed out.
 */
export type AuthStatus = "loading" | "signedOut" | "signedIn" | "mfaChallenge"

export interface AuthState {
    status: AuthStatus
    token?: string
}

export interface CoreStore {
    auth: AuthState
}

/** Valtio store holding client-global state. Read from React with useSnapshot(store). */
export function createStore(): CoreStore {
    return proxy<CoreStore>({
        auth: { status: "loading" },
    })
}
