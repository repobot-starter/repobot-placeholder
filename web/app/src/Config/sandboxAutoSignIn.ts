/**
 * Sandbox auto-signin: the simulation that lets a workspace preview land
 * straight on a signed-in dashboard surface.
 *
 * In a Repobot sandbox the login surface already simulates every sign-in
 * method — any click resolves by signing in the dev principal
 * (VITE_LOCAL_AUTH_TOKEN, minted by bootstrap-env and pinned per project by
 * the platform). Bouncing a preview visitor to /login therefore adds no
 * security and hides the whole signed-in app; visiting a protected route
 * while signed out simulates the one-click sign-in instead.
 *
 * SECURITY INVARIANT — this can never fire on a deployed site:
 * - Deploys with real auth build with VITE_AUTH_MODE=builtin, and deploys
 *   without auth build with VITE_AUTH_MODE=disabled; both are refused here
 *   explicitly.
 * - VITE_LOCAL_AUTH_TOKEN is a local-environments-only variable
 *   (env.manifest.json `environments: ["local"]`), so deployed bundles carry
 *   no token even if the mode guard were wrong.
 * - The token is only honored by the server's LocalTokenVerifier, which
 *   refuses to even construct outside the emulator/tests
 *   (firebase/functions/src/Services/Identity/TokenVerifier.ts) — a deploy
 *   misconfigured into local auth mode crashes at boot rather than
 *   accepting locally-forgeable tokens.
 * The gate below is tested in web/app/tests/Auth/SandboxAutoSignIn.test.ts.
 */

export interface SandboxAuthEnv {
    VITE_AUTH_MODE?: string
    VITE_LOCAL_AUTH_TOKEN?: string
}

/**
 * The dev-principal token to auto-sign-in with, or undefined when this
 * build must never auto-sign-in (builtin/disabled auth modes, or no local
 * token in the environment).
 */
export function sandboxAutoSignInToken(env: SandboxAuthEnv): string | undefined {
    if (env.VITE_AUTH_MODE === "builtin" || env.VITE_AUTH_MODE === "disabled") {
        return undefined
    }
    const token = env.VITE_LOCAL_AUTH_TOKEN
    return token !== undefined && token !== "" ? token : undefined
}

interface AutoSignInAuthClient {
    signInLocal(token: string): Promise<void>
    onAuthStateChange(callback: (token: string | null) => void): () => void
}

export interface SandboxAutoSignIn {
    /** Whether a signed-out visit to a protected route should sign in. */
    isArmed(): boolean
    /** Simulate the login surface's one-click sign-in with the dev token. */
    signIn(): void
    /**
     * The runtime's UNAUTHENTICATED self-heal (createApolloClient's
     * recoverUnauthenticated): re-sign the dev principal and resolve true,
     * so the failed operation retries once with a fresh session. This is
     * what heals the recurring sandbox class — a pod recycle rotates
     * LOCAL_AUTH_SECRET under a persisted token, the runtime degrades the
     * session silently, and the next owner-scoped query (a Favorites
     * click, a dashboard route) would otherwise surface the raw "requires
     * an authenticated caller" error. Resolves false once disarmed: after
     * an observed sign-out the simulation stands down here too, so signing
     * out doesn't get silently undone by the next failing query.
     */
    recover(): Promise<boolean>
}

/**
 * The auto-signin's one behavioral subtlety: signing OUT must stay
 * possible. The kernel's "Sign out" buttons rely on ProtectedRoutes
 * bouncing to /login, so an auto-signin that re-fired after any sign-out
 * would make sign-out look broken. Any sign-out this document observes —
 * the user's own, or the runtime degrading a stale token — disarms the
 * simulation for the rest of the document's life; the login page's
 * simulated flows (one click, any method) take over from there.
 */
export function createSandboxAutoSignIn(config: {
    token: string | undefined
    authClient: AutoSignInAuthClient
}): SandboxAutoSignIn {
    let armed = config.token !== undefined
    if (armed) {
        config.authClient.onAuthStateChange((token) => {
            if (token === null) {
                armed = false
            }
        })
    }
    return {
        isArmed: () => armed,
        signIn: () => {
            if (armed && config.token !== undefined) {
                void config.authClient.signInLocal(config.token)
            }
        },
        recover: async () => {
            if (!armed || config.token === undefined) {
                return false
            }
            await config.authClient.signInLocal(config.token)
            return true
        },
    }
}
