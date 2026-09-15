import {
    DocumentsRequestError,
    generateDocumentPdf,
    isUnauthenticatedDocumentsError,
    LocalAuthClient,
    type GeneratedDocument,
} from "@base/core"
import { afterEach, describe, expect, it, vi } from "vitest"
import { generateAuthenticatedDocumentPdf, type DocumentsAuthDeps } from "../../src/Config/documentsAuth"

// The documents transport is a raw fetch, so it gets none of the Apollo
// links' UNAUTHENTICATED self-heal. Previews share one browser origin
// (/preview/:sessionId paths), so localStorage's persisted token can come
// from a DIFFERENT project, signed with that project's own
// LOCAL_AUTH_SECRET — GraphQL surfaces recovered silently while the PDF
// packs' generate calls surfaced "Generating the document failed: Invalid
// local auth token." forever. These tests pin the typed error the transport
// now raises and the recovery ladder generateAuthenticatedDocumentPdf runs.

const REQUEST = { templateKey: "invoice", overrides: {} }
const realFetch = globalThis.fetch

afterEach(() => {
    globalThis.fetch = realFetch
    localStorage.clear()
})

function unauthenticatedResponse(): Response {
    return new Response(
        JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Invalid local auth token." } }),
        { status: 401, headers: { "content-type": "application/json" } },
    )
}

describe("DocumentsApi error typing", () => {
    it("carries the server's status and RPC code so callers can react to the class", async () => {
        globalThis.fetch = vi.fn(async () => unauthenticatedResponse())

        const failure = await generateDocumentPdf("http://unused.invalid/documents", REQUEST, {
            authToken: "stale",
        }).catch((error: unknown) => error)

        expect(failure).toBeInstanceOf(DocumentsRequestError)
        const typed = failure as DocumentsRequestError
        expect(typed.message).toBe("Generating the document failed: Invalid local auth token.")
        expect(typed.status).toBe(401)
        expect(typed.code).toBe("UNAUTHENTICATED")
        expect(isUnauthenticatedDocumentsError(typed)).toBe(true)
    })

    it("keeps the status-line message for non-JSON error bodies", async () => {
        globalThis.fetch = vi.fn(async () => new Response("<html>not found</html>", { status: 404 }))

        const failure = await generateDocumentPdf("http://unused.invalid/documents", REQUEST).catch(
            (error: unknown) => error,
        )

        expect(failure).toBeInstanceOf(DocumentsRequestError)
        const typed = failure as DocumentsRequestError
        expect(typed.message).toBe("Generating the document failed with status 404.")
        expect(typed.code).toBeUndefined()
        expect(isUnauthenticatedDocumentsError(typed)).toBe(false)
    })
})

describe("generateAuthenticatedDocumentPdf recovery", () => {
    const generated: GeneratedDocument = { fileName: "invoice.pdf", blob: new Blob(["%PDF"]) }
    const unauthenticated = new DocumentsRequestError(
        "Generating the document failed: Invalid local auth token.",
        {
            status: 401,
            code: "UNAUTHENTICATED",
        },
    )

    /** A generate double that refuses every token except `acceptedToken`. */
    function generateAccepting(acceptedToken: string): DocumentsAuthDeps["generate"] & { tokens: string[] } {
        const tokens: string[] = []
        const generate = async (
            _endpoint: string,
            _request: { templateKey: string; overrides: Record<string, unknown> },
            options: { authToken?: string } = {},
        ): Promise<GeneratedDocument> => {
            tokens.push(options.authToken ?? "")
            if (options.authToken !== acceptedToken) {
                throw unauthenticated
            }
            return generated
        }
        return Object.assign(generate, { tokens })
    }

    it("re-signs the sandbox principal and retries once when the persisted token is stale", async () => {
        // The persisted session came from a DIFFERENT project's secret.
        localStorage.setItem("base.localAuthToken", "stale-foreign-token")
        const authClient = new LocalAuthClient({ localToken: "fresh-dev-token" })
        const generate = generateAccepting("fresh-dev-token")
        const recoverSandboxSession = vi.fn(async () => {
            await authClient.signInLocal("fresh-dev-token")
            return true
        })

        const result = await generateAuthenticatedDocumentPdf("http://unused.invalid/documents", REQUEST, {
            authClient,
            recoverSandboxSession,
            generate,
        })

        expect(result).toBe(generated)
        expect(generate.tokens).toEqual(["stale-foreign-token", "fresh-dev-token"])
        expect(recoverSandboxSession).toHaveBeenCalledTimes(1)
        expect(localStorage.getItem("base.localAuthToken")).toBe("fresh-dev-token")
    })

    it("falls back to a fresh guest session when sandbox recovery is unavailable", async () => {
        // Deployed shape: no sandbox recover; the stale session is dropped
        // and an anonymous guest minted, the same degradation GraphQL's
        // onUnauthenticated + the packs' guest sign-in already perform.
        localStorage.setItem("base.localAuthToken", "stale-guest-token")
        const authClient = new LocalAuthClient({ localToken: "guest-token" })
        const generate = generateAccepting("guest-token")

        const result = await generateAuthenticatedDocumentPdf("http://unused.invalid/documents", REQUEST, {
            authClient,
            recoverSandboxSession: async () => false,
            generate,
        })

        expect(result).toBe(generated)
        expect(generate.tokens).toEqual(["stale-guest-token", "guest-token"])
    })

    it("propagates the original failure when no recovery path can produce a session", async () => {
        localStorage.setItem("base.localAuthToken", "stale-token")
        // No localToken: anonymous sign-in is unavailable in this build.
        const authClient = new LocalAuthClient()
        const generate = generateAccepting("never-issued")

        await expect(
            generateAuthenticatedDocumentPdf("http://unused.invalid/documents", REQUEST, {
                authClient,
                recoverSandboxSession: async () => false,
                generate,
            }),
        ).rejects.toThrow("Invalid local auth token.")
        expect(generate.tokens).toEqual(["stale-token"])
    })

    it("never attempts recovery for a non-authentication failure", async () => {
        localStorage.setItem("base.localAuthToken", "valid-token")
        const authClient = new LocalAuthClient({ localToken: "valid-token" })
        const recoverSandboxSession = vi.fn(async () => true)
        const generate = vi.fn(async () => {
            throw new DocumentsRequestError("Generating the document failed with status 500.", {
                status: 500,
            })
        })

        await expect(
            generateAuthenticatedDocumentPdf("http://unused.invalid/documents", REQUEST, {
                authClient,
                recoverSandboxSession,
                generate,
            }),
        ).rejects.toThrow("status 500")
        expect(recoverSandboxSession).not.toHaveBeenCalled()
        expect(generate).toHaveBeenCalledTimes(1)
    })
})
