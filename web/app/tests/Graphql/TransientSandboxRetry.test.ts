import { ApolloLink, Observable, gql, type FetchResult } from "@apollo/client"
import { createApolloClient, isTransientSandboxHttpError } from "@base/core"
import { describe, expect, it, vi } from "vitest"

// A workspace restart (template flip, pod relaunch) brings the web server up
// seconds before the functions emulator registers its functions; in that
// window /api relays the emulator hub's "function does not exist" 404 and
// Apollo used to surface it as a fatal "Received status code 404" (the SaaS
// dashboard's error screen on dev). With retryTransientHttpErrors armed —
// sandbox builds only — the operation stays in flight and retries through
// the boot window. These tests pin the retry branch choice and the deploy
// boundary (config absent = old behavior, error surfaces immediately).

const PING = gql`
    query Ping {
        ping
    }
`

/** The transport failure HttpLink raises for a non-2xx response. */
function httpStatusError(statusCode: number): Error {
    return Object.assign(new Error(`Response not successful: Received status code ${statusCode}`), {
        statusCode,
    })
}

/** Fails with `error` for the first `failures` requests, then succeeds. */
function flakyLink(error: Error, failures: number): { link: ApolloLink; attempts: () => number } {
    let attempts = 0
    const link = new ApolloLink(
        () =>
            new Observable<FetchResult>((observer) => {
                attempts += 1
                if (attempts <= failures) {
                    observer.error(error)
                    return
                }
                observer.next({ data: { ping: "pong" } })
                observer.complete()
            }),
    )
    return { link, attempts: () => attempts }
}

const FAST_RETRY = { initialDelayMs: 1, maxDelayMs: 2 }

describe("transient sandbox transport retry", () => {
    it("classifies exactly the boot-window statuses as transient", () => {
        expect(isTransientSandboxHttpError(httpStatusError(404))).toBe(true)
        expect(isTransientSandboxHttpError(httpStatusError(502))).toBe(true)
        expect(isTransientSandboxHttpError(httpStatusError(503))).toBe(true)
        expect(isTransientSandboxHttpError(httpStatusError(400))).toBe(false)
        expect(isTransientSandboxHttpError(httpStatusError(500))).toBe(false)
        expect(isTransientSandboxHttpError(new Error("Failed to fetch"))).toBe(false)
        expect(isTransientSandboxHttpError(undefined)).toBe(false)
    })

    it("retries a boot-window 404 until the backend registers", async () => {
        const onFailure = vi.fn()
        const { link, attempts } = flakyLink(httpStatusError(404), 2)
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => null,
            onFailure,
            retryTransientHttpErrors: FAST_RETRY,
            terminatingLink: link,
        })

        const result = await client.query({ query: PING })

        expect(result.data).toEqual({ ping: "pong" })
        expect(attempts()).toBe(3)
        expect(onFailure).not.toHaveBeenCalled()
    })

    it("surfaces the failure once the bounded retry budget runs out", async () => {
        const onFailure = vi.fn()
        const { link, attempts } = flakyLink(httpStatusError(404), Number.POSITIVE_INFINITY)
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => null,
            onFailure,
            retryTransientHttpErrors: { ...FAST_RETRY, maxAttempts: 3 },
            terminatingLink: link,
        })

        await expect(client.query({ query: PING })).rejects.toThrow("Received status code 404")
        expect(attempts()).toBe(3)
        expect(onFailure).toHaveBeenCalledTimes(1)
    })

    it("never retries a non-transient status, even with retries armed", async () => {
        const { link, attempts } = flakyLink(httpStatusError(500), Number.POSITIVE_INFINITY)
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => null,
            retryTransientHttpErrors: FAST_RETRY,
            terminatingLink: link,
        })

        await expect(client.query({ query: PING })).rejects.toThrow("Received status code 500")
        expect(attempts()).toBe(1)
    })

    it("keeps the deployed behavior when the config is absent: a 404 surfaces immediately", async () => {
        const onFailure = vi.fn()
        const { link, attempts } = flakyLink(httpStatusError(404), Number.POSITIVE_INFINITY)
        const client = createApolloClient({
            graphqlUrl: "http://unused.invalid/graphql",
            getToken: async () => null,
            onFailure,
            terminatingLink: link,
        })

        await expect(client.query({ query: PING })).rejects.toThrow("Received status code 404")
        expect(attempts()).toBe(1)
        expect(onFailure).toHaveBeenCalledTimes(1)
    })
})
