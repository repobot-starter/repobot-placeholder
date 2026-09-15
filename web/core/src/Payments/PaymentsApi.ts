/**
 * Transport for the payments kernel endpoint (payments__request__api). Today
 * that surface is session-gated delivery: GET /delivery streams a product's
 * delivery file after the backend verifies the checkout session is PAID. See
 * docs/payments.md.
 */

/**
 * The payments endpoint is the payments__request__api function, which lives
 * next to the GraphQL function in every environment — the emulator and the
 * platform deployer treat all exports uniformly — so its URL is the GraphQL
 * URL with the trailing function name swapped. The app passes its GraphQL
 * URL (import.meta.env.VITE_GRAPHQL_URL); core never reads env directly.
 */
export function derivePaymentsEndpoint(graphqlUrl: string): string {
    const endpoint = graphqlUrl.replace(/graphql__request__api\/?$/, "payments__request__api")
    if (endpoint === graphqlUrl) {
        throw new Error(
            "Could not derive the payments endpoint: the GraphQL URL does not end with " +
                "the graphql__request__api function name.",
        )
    }
    return endpoint
}

/**
 * The session-gated delivery URL for a paid checkout session. Rendered as a
 * plain download link; the backend re-verifies payment before streaming.
 */
export function buildDeliveryUrl(endpoint: string, checkoutSessionId: string): string {
    return `${endpoint}/delivery?session=${encodeURIComponent(checkoutSessionId)}`
}
