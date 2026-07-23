import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client"
import { setContext } from "@apollo/client/link/context"

export interface CreateApolloClientConfig {
    /** GraphQL endpoint. The app passes import.meta.env.VITE_GRAPHQL_URL; core never reads env directly. */
    graphqlUrl: string
    /** Resolves the current auth token (or null when signed out) for the Authorization header. */
    getToken: () => Promise<string | null>
}

/**
 * Creates the shared Apollo client.
 *
 * Caching contract:
 * - The cache is a normalized InMemoryCache. Backend ids are globally unique,
 *   prefixed row ids ("user_01H...", "project_01H..."), so the default
 *   keyFields: ["id"] normalization is correct as-is.
 * - Queries use the default cache-first fetch policy. Do NOT switch to
 *   no-cache; entity updates returned by mutations merge into the cache and
 *   update every mounted query automatically.
 * - Connection queries (users/projects/...) are keyed by their full `input`
 *   argument, so newly created rows do not appear in them automatically.
 *   The convention: after create/update mutations, pass
 *   `refetchQueries: [<ActiveConnectionQueryDocument>]` (or the operation
 *   name, e.g. "Users") to the mutate call so the active list refreshes.
 */
export function createApolloClient(config: CreateApolloClientConfig): ApolloClient<unknown> {
    const httpLink = new HttpLink({ uri: config.graphqlUrl })

    const authLink = setContext(async (_operation, { headers }) => {
        const token = await config.getToken()
        if (token == null) {
            return { headers }
        }
        return {
            headers: {
                ...(headers as Record<string, string> | undefined),
                authorization: `Bearer ${token}`,
            },
        }
    })

    return new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
    })
}
