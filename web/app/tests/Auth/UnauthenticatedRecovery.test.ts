import { ApolloLink, Observable, gql, type FetchResult } from "@apollo/client"
import { createApolloClient, createRuntime, LocalAuthClient } from "@base/core"
import { GraphQLError } from "graphql"
import { afterEach, describe, expect, it, vi } from "vitest"

// The sandbox UNAUTHENTICATED self-heal (createApolloClient's
// recoverUnauthenticated): a pod recycle can rotate the signing secret
// under a persisted session, and a query can race the session bootstrap —
// in both shapes the dev principal is trivially re-establishable, so the
// operation must re-bootstrap silently and retry ONCE instead of surfacing
// the raw "This operation requires an authenticated caller." error (the
// recurring class across app templates: Images/Favorites, Files, dashboards).

const PING = gql`
    query Ping {
        ping
    }
`

interface TransportCall {
    authorization: string | undefined
}

/**
 * A terminating link that fails UNAUTHENTICATED for the first `failures`
 * requests and answers with data afterwards, recording the Authorization
 * header each request carried (the auth link re-reads the token on retry).
 */
function flakyUnauthenticatedLink(failures: number, calls: TransportCall[]): ApolloLink {
    return new ApolloLink(
        (operation) =>
            new Observable<FetchResult>((observer) => {
                const headers = operation.getContext().headers as Record<string, string> | undefined
                calls.push({ authorization: headers?.authorization })
                if (calls.length <= failures) {
                    observer.next({
                        errors: [
                            new GraphQLError("This operation requires an authenticated caller.", {
                                extensions: { code: "UNAUTHENTICATED" },
                            }),
                        ],
                    })
                } else {
                    observer.next({ data: { ping: "pong" } })
                }
                observer.complete()
            }),
    )
}

afterEach(() => {
    localStorage.clear()
})

describe("recoverUnauthenticated in createApolloClient", () => {
    it("re-bootstraps silently and retries once: the caller sees data, not the error", async () => {
        let token: string | null = null
        const calls: TransportCall[] = []
        const onFailure = vi.fn()
        const onUnauthenticated = vi.fn()
        const recoverUnauthenticated = vi.fn(async () => {
            token = "fresh-token"
            return true
        })
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => token,
            onFailure,
            onUnauthenticated,
            recoverUnauthenticated,
            terminatingLink: flakyUnauthenticatedLink(1, calls),
        })

        const result = await client.query({ query: PING })

        expect(result.data).toEqual({ ping: "pong" })
        expect(recoverUnauthenticated).toHaveBeenCalledTimes(1)
        // The retry went back through the auth link with the fresh session.
        expect(calls).toHaveLength(2)
        expect(calls[0].authorization).toBeUndefined()
        expect(calls[1].authorization).toBe("Bearer fresh-token")
        expect(onFailure).not.toHaveBeenCalled()
        expect(onUnauthenticated).not.toHaveBeenCalled()
    })

    it("retries at most once: a still-unauthenticated retry degrades to sign-out", async () => {
        const calls: TransportCall[] = []
        const onFailure = vi.fn()
        const onUnauthenticated = vi.fn()
        // Recovery "succeeds" but the re-signed token is itself stale (the
        // bundle predates the pod recycle) — the retry fails again.
        const recoverUnauthenticated = vi.fn(async () => true)
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => "stale-token",
            onFailure,
            onUnauthenticated,
            recoverUnauthenticated,
            terminatingLink: flakyUnauthenticatedLink(Number.POSITIVE_INFINITY, calls),
        })

        await expect(client.query({ query: PING })).rejects.toThrow(
            "This operation requires an authenticated caller.",
        )
        expect(calls).toHaveLength(2)
        expect(recoverUnauthenticated).toHaveBeenCalledTimes(1)
        // The retried request carried a token, so the terminal handling is
        // the silent stale-session degrade, not the global error surface.
        expect(onUnauthenticated).toHaveBeenCalledTimes(1)
        expect(onFailure).not.toHaveBeenCalled()
    })

    it("skips the retry when recovery resolves false: no doomed second request", async () => {
        const calls: TransportCall[] = []
        const onFailure = vi.fn()
        const onUnauthenticated = vi.fn()
        const recoverUnauthenticated = vi.fn(async () => false)
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => null,
            onFailure,
            onUnauthenticated,
            recoverUnauthenticated,
            terminatingLink: flakyUnauthenticatedLink(Number.POSITIVE_INFINITY, calls),
        })

        await expect(client.query({ query: PING })).rejects.toThrow(
            "This operation requires an authenticated caller.",
        )
        expect(calls).toHaveLength(1)
        // No token was carried, so the failure keeps the normal path.
        expect(onFailure).toHaveBeenCalledTimes(1)
        expect(onUnauthenticated).not.toHaveBeenCalled()
    })

    it("treats a throwing recovery like an unavailable one", async () => {
        const calls: TransportCall[] = []
        const onUnauthenticated = vi.fn()
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => "stale-token",
            onUnauthenticated,
            recoverUnauthenticated: async () => {
                throw new Error("bootstrap unreachable")
            },
            terminatingLink: flakyUnauthenticatedLink(Number.POSITIVE_INFINITY, calls),
        })

        await expect(client.query({ query: PING })).rejects.toThrow(
            "This operation requires an authenticated caller.",
        )
        expect(calls).toHaveLength(1)
        expect(onUnauthenticated).toHaveBeenCalledTimes(1)
    })
})

describe("runtime self-heal after a pod recycle", () => {
    const realFetch = globalThis.fetch

    afterEach(() => {
        globalThis.fetch = realFetch
    })

    it("re-signs the dev principal, retries, and stays signedIn", async () => {
        // A session persisted before the pod recycled its signing secret.
        localStorage.setItem("base.localAuthToken", "stale-token")
        const authClient = new LocalAuthClient({ localToken: "fresh-token" })

        // The server rejects the stale token once; the re-signed principal
        // is then accepted (the way tonight's pod accepts its own token).
        const fetchMock = vi.fn(async (_url: unknown, init?: { headers?: Record<string, string> }) => {
            const authorized = init?.headers?.authorization === "Bearer fresh-token"
            return new Response(
                JSON.stringify(
                    authorized
                        ? { data: { ping: "pong" } }
                        : {
                              errors: [
                                  {
                                      message: "Invalid local auth token.",
                                      extensions: { code: "UNAUTHENTICATED" },
                                  },
                              ],
                          },
                ),
                { status: 200, headers: { "content-type": "application/json" } },
            )
        })
        globalThis.fetch = fetchMock as unknown as typeof fetch

        const onGraphqlFailure = vi.fn()
        const runtime = createRuntime({
            authClient,
            graphqlUrl: "http://unused.invalid/graphql",
            onGraphqlFailure,
            recoverUnauthenticated: async () => {
                await authClient.signInAnonymously()
                return true
            },
        })
        // Let the initial getToken().then(applyToken) settle.
        await Promise.resolve()
        expect(runtime.store.auth.status).toBe("signedIn")

        const result = await runtime.apolloClient.query({ query: PING })

        expect(result.data).toEqual({ ping: "pong" })
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(runtime.store.auth.status).toBe("signedIn")
        expect(localStorage.getItem("base.localAuthToken")).toBe("fresh-token")
        expect(onGraphqlFailure).not.toHaveBeenCalled()
    })
})
