import {
    generateDocumentPdf,
    isUnauthenticatedDocumentsError,
    type GeneratedDocument,
    type AuthClient,
} from "@base/core"
import { runtime, sandboxAutoSignIn } from "./Runtime"

/**
 * The documents transport is a raw fetch, so it gets none of the Apollo
 * links' UNAUTHENTICATED self-heal — and it needs its own. Previews share
 * one browser origin (the platform serves every workspace under
 * /preview/:sessionId paths), so localStorage's persisted session token can
 * come from a DIFFERENT project, signed with that project's own
 * LOCAL_AUTH_SECRET. GraphQL surfaces silently recover from that stale
 * token (createApolloClient's recoverUnauthenticated) but the PDF packs'
 * generate calls surfaced the raw "Invalid local auth token." forever —
 * the pages make no GraphQL calls, so nothing else ever replaced the token.
 *
 * Recovery mirrors the GraphQL contract, once per call:
 * 1. sandboxAutoSignIn.recover() — re-sign the dev principal (sandbox).
 * 2. Otherwise drop the stale session and mint an anonymous guest — the
 *    same degradation the runtime applies to GraphQL (onUnauthenticated →
 *    signOut), plus the guest sign-in the generate endpoint accepts anyway.
 * A retry that still fails propagates its own error.
 */
export interface DocumentsGenerateRequest {
    templateKey: string
    overrides: Record<string, unknown>
}

export interface DocumentsAuthDeps {
    authClient: AuthClient
    recoverSandboxSession: () => Promise<boolean>
    generate: typeof generateDocumentPdf
}

export async function generateAuthenticatedDocumentPdf(
    endpoint: string,
    request: DocumentsGenerateRequest,
    deps: DocumentsAuthDeps = {
        authClient: runtime.authClient,
        recoverSandboxSession: () => sandboxAutoSignIn.recover(),
        generate: generateDocumentPdf,
    },
): Promise<GeneratedDocument> {
    try {
        return await deps.generate(endpoint, request, {
            authToken: await acquireDocumentsAuthToken(deps.authClient),
        })
    } catch (error) {
        if (!isUnauthenticatedDocumentsError(error)) {
            throw error
        }
        if (!(await recoverDocumentsSession(deps))) {
            throw error
        }
        return await deps.generate(endpoint, request, {
            authToken: await acquireDocumentsAuthToken(deps.authClient),
        })
    }
}

/**
 * POST /generate requires an authenticated principal. Signed-in users reuse
 * their session; signed-out visitors are signed in as anonymous guests
 * first, so the public generator keeps working on deployed environments.
 */
async function acquireDocumentsAuthToken(authClient: AuthClient): Promise<string> {
    const existing = await authClient.getToken()
    if (existing !== null) {
        return existing
    }
    await authClient.signInAnonymously()
    const token = await authClient.getToken()
    if (token === null) {
        throw new Error("Guest sign-in did not produce a session.")
    }
    return token
}

async function recoverDocumentsSession(deps: DocumentsAuthDeps): Promise<boolean> {
    try {
        if (await deps.recoverSandboxSession()) {
            return true
        }
    } catch {
        // Recovery is best-effort; fall through to the guest path.
    }
    try {
        await deps.authClient.signOut()
        await deps.authClient.signInAnonymously()
        return (await deps.authClient.getToken()) !== null
    } catch {
        return false
    }
}
