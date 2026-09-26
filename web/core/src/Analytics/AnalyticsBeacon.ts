/**
 * Transport for the analytics kernel's pageview beacon
 * (analytics__request__api — see docs/analytics.md). First-party and
 * cookieless by design: the ping carries only the visited path. The visitor
 * identity is a daily-salted hash the server computes from the request
 * itself; the client sets no cookie, reads no storage, and fingerprints
 * nothing.
 */

/**
 * The analytics endpoint is the analytics__request__api function, which
 * lives next to the GraphQL function in every environment — so its URL is
 * the GraphQL URL with the trailing function name swapped (the storage and
 * documents kernels derive their endpoints the same way). The app passes
 * its GraphQL URL (import.meta.env.VITE_GRAPHQL_URL); core never reads env
 * directly.
 */
export function deriveAnalyticsEndpoint(graphqlUrl: string): string {
    const endpoint = graphqlUrl.replace(/graphql__request__api\/?$/, "analytics__request__api")
    if (endpoint === graphqlUrl) {
        throw new Error(
            "Could not derive the analytics endpoint: the GraphQL URL does not end with " +
                "the graphql__request__api function name.",
        )
    }
    return endpoint
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"])

/**
 * Fire-and-forget pageview ping. keepalive lets the request survive a
 * navigation away, and every failure is swallowed — analytics must never
 * break or slow the page it measures.
 *
 * A loopback endpoint is skipped when the page itself isn't served from
 * loopback: hosted template previews run this app with the pod's own
 * emulator as its backend, so the derived endpoint is 127.0.0.1 — a URL
 * only the pod can reach, and one browsers block outright from public
 * origins (private network access). Skipping beats stamping a CORS error
 * into every preview visitor's console. Local dev still beacons: there the
 * page origin is loopback too.
 */
export function sendPageview(endpoint: string, path: string): void {
    try {
        if (
            LOOPBACK_HOSTS.has(new URL(endpoint).hostname) &&
            typeof window !== "undefined" &&
            !LOOPBACK_HOSTS.has(window.location.hostname)
        ) {
            return
        }
    } catch {
        // An unparseable endpoint falls through; the fetch below swallows
        // its own failure.
    }
    void fetch(`${endpoint}/pageview`, {
        method: "POST",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path }),
    }).catch(() => {
        // Ad blockers, offline tabs, and shutdowns are all expected here.
    })
}
