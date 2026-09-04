import {
    BuiltinAuthClient,
    createRuntime,
    deriveAuthEndpoint,
    LocalAuthClient,
    type AuthClient,
} from "@base/core"
import { publishGlobalError } from "@ui"
import { createSandboxAutoSignIn, sandboxAutoSignInToken } from "./sandboxAutoSignIn"

function createAuthClient(): AuthClient {
    if (import.meta.env.VITE_AUTH_MODE === "builtin") {
        return new BuiltinAuthClient({ authUrl: deriveAuthEndpoint(import.meta.env.VITE_GRAPHQL_URL) })
    }
    // Sandbox parity: the local client still reads the runtime (dashboard
    // live-toggled) sign-in methods from the auth API next to GraphQL.
    // Static/demo builds without a derivable auth URL keep build-time
    // methods (the client is fail-safe about an unreachable one).
    return new LocalAuthClient({
        authUrl: tryDeriveAuthEndpoint(import.meta.env.VITE_GRAPHQL_URL),
        localToken: import.meta.env.VITE_LOCAL_AUTH_TOKEN,
    })
}

function tryDeriveAuthEndpoint(graphqlUrl: string | undefined): string | undefined {
    if (!graphqlUrl) {
        return undefined
    }
    try {
        return deriveAuthEndpoint(graphqlUrl)
    } catch {
        return undefined
    }
}

const authClient = createAuthClient()

// One auto-signin per document (see sandboxAutoSignIn.ts for the deploy
// boundary): ProtectedRoutes uses it to land previews signed in, and the
// runtime uses its recover() to silently re-establish the principal (and
// retry once) when an operation fails UNAUTHENTICATED — the recurring
// sandbox class where a pod recycle rotates the signing secret under a
// persisted session. Sharing the instance keeps the disarm-on-sign-out
// state consistent between both consumers.
const sandboxToken = sandboxAutoSignInToken(import.meta.env)
export const sandboxAutoSignIn = createSandboxAutoSignIn({ token: sandboxToken, authClient })

/** Client runtime singleton: valtio store + auth client + Apollo client. */
export const runtime = createRuntime({
    authClient,
    graphqlUrl: import.meta.env.VITE_GRAPHQL_URL,
    // Preview builds for the marketing site: GraphQL resolves against
    // in-memory fixtures, so the template can be played with no backend.
    demoMode: import.meta.env.VITE_DEMO_MODE === "true",
    // Failed operations surface on the app's single <GlobalErrors> mount
    // (main.tsx) — no per-callsite error UI needed. Callsites that render
    // errors inline opt out with `context: { suppressGlobalError: true }`.
    onGraphqlFailure: (failure) => publishGlobalError({ message: failure.message, detail: failure.detail }),
    // Sandbox only (undefined on deploys): no owner-scoped operation should
    // ever surface the raw "requires an authenticated caller" error when
    // the dev principal can simply be re-signed and the operation retried.
    recoverUnauthenticated: sandboxToken !== undefined ? () => sandboxAutoSignIn.recover() : undefined,
    // Sandbox only (same boundary): a restarting workspace stack answers
    // /api with 404/502/503 for the seconds-to-a-minute the functions
    // emulator needs to register — retry through the boot window instead of
    // surfacing "Received status code 404" on the error surface.
    retryTransientHttpErrors: sandboxToken !== undefined ? {} : undefined,
})
