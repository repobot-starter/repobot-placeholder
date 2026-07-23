import type { ApolloClient } from "@apollo/client"
import type { AuthClient } from "../Auth/AuthClient"
import { createApolloClient } from "../Graphql/createApolloClient"
import { createStore, type CoreStore } from "./createStore"

export interface CreateRuntimeConfig {
    authClient: AuthClient
    graphqlUrl: string
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
    })

    const applyToken = (token: string | null): void => {
        store.auth.status = token != null ? "signedIn" : "signedOut"
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
