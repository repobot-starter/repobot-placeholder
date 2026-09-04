import type { ApolloClient } from "@apollo/client"
import type { AuthClient } from "../Auth/AuthClient"
import { createApolloClient, type GraphqlFailure } from "../Graphql/createApolloClient"
import { createDemoLink } from "../Graphql/createDemoLink"
import { createStore, type CoreStore } from "./createStore"

export interface CreateRuntimeConfig {
    authClient: AuthClient
    graphqlUrl: string
    /** Forwarded to the Apollo client's global failure hook (see createApolloClient). */
    onGraphqlFailure?: (failure: GraphqlFailure) => void
    /**
     * Sandbox self-heal for UNAUTHENTICATED operations (see
     * createApolloClient.recoverUnauthenticated): the app passes the
     * sandboxAutoSignIn's recover() so a rotated signing secret or a query
     * racing the session bootstrap re-signs the dev principal and retries
     * once instead of surfacing "This operation requires an authenticated
     * caller." Deployed builds pass nothing.
     */
    recoverUnauthenticated?: () => Promise<boolean>
    /**
     * Sandbox boot self-heal for transient transport failures (see
     * createApolloClient.retryTransientHttpErrors): the app passes an empty
     * object behind the same deploy boundary as recoverUnauthenticated, so
     * the boot-window 404/502/503 from a restarting workspace stack retries
     * instead of surfacing "Received status code 404". Deployed builds pass
     * nothing.
     */
    retryTransientHttpErrors?: { initialDelayMs?: number; maxDelayMs?: number; maxAttempts?: number }
    /**
     * Demo mode (VITE_DEMO_MODE): GraphQL resolves against in-memory fixtures
     * (see createDemoLink) so static preview builds run with no backend.
     */
    demoMode?: boolean
}

export interface Runtime {
    store: CoreStore
    authClient: AuthClient
    apolloClient: ApolloClient<unknown>
}

/**
 * Wires the client runtime: valtio store + auth client + Apollo client.
 * Created once at module scope in the app (src/Config/Runtime.ts).
 */
export function createRuntime(config: CreateRuntimeConfig): Runtime {
    const store = createStore()
    const authClient = config.authClient

    const apolloClient = createApolloClient({
        graphqlUrl: config.graphqlUrl,
        getToken: () => authClient.getToken(),
        onFailure: config.onGraphqlFailure,
        // A persisted token the backend no longer accepts (expired, revoked,
        // or the signing secret rotated — e.g. a sandbox template flip)
        // degrades to a clean signed-out state instead of a global error.
        onUnauthenticated: () => {
            void authClient.signOut()
        },
        recoverUnauthenticated: config.recoverUnauthenticated,
        retryTransientHttpErrors: config.retryTransientHttpErrors,
        terminatingLink: config.demoMode === true ? createDemoLink() : undefined,
    })

    const applyToken = (token: string | null): void => {
        store.auth.status =
            token != null ? "signedIn" : authClient.hasPendingMfaChallenge() ? "mfaChallenge" : "signedOut"
        store.auth.token = token ?? undefined
    }

    authClient.onAuthStateChange((token) => {
        const wasSignedIn = store.auth.status === "signedIn"
        applyToken(token)
        // Drop cached data belonging to the previous principal.
        if (wasSignedIn && token == null) {
            void apolloClient.clearStore()
        }
    })

    void authClient
        .getToken()
        .then(applyToken)
        .catch(() => applyToken(null))

    return { store, authClient, apolloClient }
}
