import { ApolloLink, Observable, gql, type FetchResult } from "@apollo/client"
import { createApolloClient, createRuntime, LocalAuthClient } from "@base/core"
import { GraphQLError } from "graphql"
import { afterEach, describe, expect, it, vi } from "vitest"

// A persisted session the backend no longer accepts (e.g. the sandbox's
// LOCAL_AUTH_SECRET rotated under a stored token during a template flip)
// must degrade to a clean signed-out state — never the global error surface.

const PING = gql`
    query Ping {
        ping
    }
`

function unauthenticatedLink(): ApolloLink {
    return new ApolloLink(
        () =>
            new Observable<FetchResult>((observer) => {
                observer.next({
                    errors: [
                        new GraphQLError("Invalid local auth token.", {
                            extensions: { code: "UNAUTHENTICATED" },
                        }),
                    ],
                })
                observer.complete()
            }),
    )
}

afterEach(() => {
    localStorage.clear()
})

describe("UNAUTHENTICATED handling in createApolloClient", () => {
    it("signs out instead of surfacing a global error when the request carried a token", async () => {
        const onFailure = vi.fn()
        const onUnauthenticated = vi.fn()
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => "stale-token",
            onFailure,
            onUnauthenticated,
            terminatingLink: unauthenticatedLink(),
        })

        await expect(client.query({ query: PING })).rejects.toThrow("Invalid local auth token.")
        expect(onUnauthenticated).toHaveBeenCalledTimes(1)
        expect(onFailure).not.toHaveBeenCalled()
    })

    it("keeps the normal failure path when no token was attached", async () => {
        const onFailure = vi.fn()
        const onUnauthenticated = vi.fn()
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => null,
            onFailure,
            onUnauthenticated,
            terminatingLink: unauthenticatedLink(),
        })

        await expect(client.query({ query: PING })).rejects.toThrow("Invalid local auth token.")
        expect(onUnauthenticated).not.toHaveBeenCalled()
        expect(onFailure).toHaveBeenCalledTimes(1)
    })
})

describe("runtime stale-session degradation", () => {
    const realFetch = globalThis.fetch

    afterEach(() => {
        globalThis.fetch = realFetch
    })

    it("clears the persisted token and lands on signedOut", async () => {
        // Simulate a session persisted before the backend's secret changed.
        localStorage.setItem("base.localAuthToken", "stale-token")
        // The server answers every operation the way the kernel's GraphQL
        // endpoint does for a token it can no longer verify.
        globalThis.fetch = vi.fn(
            async () =>
                new Response(
                    JSON.stringify({
                        errors: [
                            {
                                message: "Invalid local auth token.",
                                extensions: { code: "UNAUTHENTICATED" },
                            },
                        ],
                    }),
                    { status: 200, headers: { "content-type": "application/json" } },
                ),
        )

        const onGraphqlFailure = vi.fn()
        const runtime = createRuntime({
            authClient: new LocalAuthClient(),
            graphqlUrl: "http://unused.invalid/graphql",
            onGraphqlFailure,
        })
        // Let the initial getToken().then(applyToken) settle.
        await Promise.resolve()
        expect(runtime.store.auth.status).toBe("signedIn")

        await expect(runtime.apolloClient.query({ query: PING })).rejects.toThrow("Invalid local auth token.")

        expect(runtime.store.auth.status).toBe("signedOut")
        expect(localStorage.getItem("base.localAuthToken")).toBeNull()
        expect(onGraphqlFailure).not.toHaveBeenCalled()
    })
})
