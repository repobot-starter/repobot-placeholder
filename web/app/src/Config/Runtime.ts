import {
    BuiltinAuthClient,
    createRuntime,
    deriveAuthEndpoint,
    LocalAuthClient,
    type AuthClient,
} from "@base/core"

function createAuthClient(): AuthClient {
    if (import.meta.env.VITE_AUTH_MODE === "builtin") {
        return new BuiltinAuthClient({ authUrl: deriveAuthEndpoint(import.meta.env.VITE_GRAPHQL_URL) })
    }
    return new LocalAuthClient()
}

/** Client runtime singleton: valtio store + auth client + Apollo client. */
export const runtime = createRuntime({
    authClient: createAuthClient(),
    graphqlUrl: import.meta.env.VITE_GRAPHQL_URL,
})
