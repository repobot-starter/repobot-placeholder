import { proxy } from "valtio/vanilla"

export type AuthStatus = "loading" | "signedOut" | "signedIn"

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
