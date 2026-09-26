import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
    Observable,
    type ApolloLink,
    type FetchResult,
    type Operation,
} from "@apollo/client"
import { setContext } from "@apollo/client/link/context"
import { onError } from "@apollo/client/link/error"
import { RetryLink } from "@apollo/client/link/retry"
import type { GraphQLFormattedError } from "graphql"

export interface GraphqlFailure {
    /** Human-readable summary suitable for the global error surface. */
    message: string
    /** Technical detail (remaining GraphQL errors, network error text). */
    detail?: string
    /** The failing operation's name, e.g. "CreateBooking". */
    operationName: string
}

export interface CreateApolloClientConfig {
    /** GraphQL endpoint. The app passes import.meta.env.VITE_GRAPHQL_URL; core never reads env directly. */
    graphqlUrl: string
    /** Resolves the current auth token (or null when signed out) for the Authorization header. */
    getToken: () => Promise<string | null>
    /**
     * Global failure hook: called once per failed operation (GraphQL errors
     * or network failure). The app wires this to the design system's
     * publishGlobalError so failures surface without per-callsite handling.
     * Callsites that render errors inline (e.g. form modals) opt out per
     * operation via context: `{ context: { suppressGlobalError: true } }`.
     */
    onFailure?: (failure: GraphqlFailure) => void
    /**
     * Called when an operation that carried a bearer token fails with
     * UNAUTHENTICATED — the persisted session is no longer valid (expired,
     * revoked, or the backend's signing secret changed). The runtime wires
     * this to authClient.signOut() so the app degrades to a clean signed-out
     * state instead of surfacing the failure on the global error surface.
     * onFailure is NOT called for these operations.
     */
    onUnauthenticated?: () => void
    /**
     * Sandbox self-heal: consulted before the terminal UNAUTHENTICATED
     * handling above. Resolving true means a fresh principal was just
     * re-established (the sandbox dev token re-signed after e.g. a pod
     * recycle rotated the signing secret, or a query raced the session
     * bootstrap) — the failed operation then retries ONCE, and the auth
     * link re-reads the token so the retry carries the fresh session.
     * Resolving false (or throwing) falls through to the terminal
     * handling: onUnauthenticated when the request carried a token,
     * onFailure otherwise. Deployed builds leave this undefined (the app
     * only arms it behind the sandboxAutoSignIn deploy boundary), so their
     * UNAUTHENTICATED handling is untouched.
     */
    recoverUnauthenticated?: () => Promise<boolean>
    /**
     * Sandbox boot self-heal: retry operations whose TRANSPORT failed with a
     * status that, in a sandbox, means "the backend is still booting" —
     * never a GraphQL-level error. A workspace restart (template flip, pod
     * relaunch) brings the web server up seconds before the functions
     * emulator finishes registering its functions; in that window the /api
     * proxy relays the emulator hub's "function does not exist" 404 (or a
     * 502/503 from a not-yet-bound upstream), and Apollo surfaced it as a
     * fatal "Received status code 404" on the app's error surface. The
     * GraphQL function cannot legitimately 404 once registered, so in the
     * sandbox these statuses are always the boot window: keep the operation
     * in flight (loading UI) and retry with backoff until the emulator
     * registers or the bounded budget (~70s at the defaults) runs out.
     * Deployed builds leave this undefined — same deploy boundary as
     * recoverUnauthenticated — where a 404 is a real, permanent failure
     * that must surface immediately. 500 is deliberately NOT retried: the
     * emulator answers real function crashes with 500, and masking those
     * for a minute would strand template developers and agents.
     */
    retryTransientHttpErrors?: { initialDelayMs?: number; maxDelayMs?: number; maxAttempts?: number }
    /**
     * Replaces the HTTP transport while keeping the auth and failure links.
     * Demo-mode preview builds pass createDemoLink() here so the whole app
     * runs against in-memory fixtures with no server.
     */
    terminatingLink?: ApolloLink
}

/** Transport statuses that mean "sandbox backend still booting" (see above). */
const TRANSIENT_SANDBOX_HTTP_STATUSES = new Set([404, 502, 503])

/** Whether a network error is a transient sandbox-boot transport failure. */
export function isTransientSandboxHttpError(error: unknown): boolean {
    const statusCode = (error as { statusCode?: unknown } | null | undefined)?.statusCode
    return typeof statusCode === "number" && TRANSIENT_SANDBOX_HTTP_STATUSES.has(statusCode)
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
    const transportLink = config.terminatingLink ?? new HttpLink({ uri: config.graphqlUrl })

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

    /**
     * Terminal failure handling, shared by the error link and the
     * post-recovery retry (whose results the error link never re-inspects).
     * A stale persisted session (e.g. the backend's signing secret changed
     * under a stored token) must degrade to signed-out, not surface as a
     * global error. Only requests that actually sent a token qualify —
     * signed-out callers hitting auth-required operations keep the normal
     * failure path.
     */
    const handleFailure = (
        operation: Operation,
        graphQLErrors: readonly GraphQLFormattedError[] | undefined,
        networkError: Error | null | undefined,
    ): void => {
        const unauthenticated = hasUnauthenticatedError(graphQLErrors)
        if (unauthenticated && config.onUnauthenticated !== undefined && requestCarriedToken(operation)) {
            config.onUnauthenticated()
            return
        }
        const handler = config.onFailure
        if (handler === undefined) {
            return
        }
        if (operation.getContext().suppressGlobalError === true) {
            return
        }
        if (graphQLErrors !== undefined && graphQLErrors.length > 0) {
            handler({
                message: graphQLErrors[0].message,
                detail:
                    graphQLErrors.length > 1
                        ? graphQLErrors
                              .slice(1)
                              .map((error) => error.message)
                              .join("\n")
                        : undefined,
                operationName: operation.operationName,
            })
            return
        }
        if (networkError != null) {
            handler({
                message: "Could not reach the server. Check your connection and try again.",
                detail: networkError.message,
                operationName: operation.operationName,
            })
        }
    }

    const failureLink = onError(({ operation, response, graphQLErrors, networkError, forward }) => {
        const recover = config.recoverUnauthenticated
        if (
            hasUnauthenticatedError(graphQLErrors) &&
            recover !== undefined &&
            operation.getContext().unauthenticatedRecoveryAttempted !== true
        ) {
            operation.setContext({ unauthenticatedRecoveryAttempted: true })
            return recoverAndRetry({
                operation,
                response,
                graphQLErrors,
                networkError,
                forward,
                recover,
                handleFailure,
            })
        }
        handleFailure(operation, graphQLErrors, networkError)
    })

    // Retries sit between the failure handling and the auth link, so every
    // retried attempt re-reads the token and a budget-exhausted failure
    // still flows through the error link's normal handling.
    const retryConfig = config.retryTransientHttpErrors
    const links =
        retryConfig === undefined
            ? [failureLink, authLink, transportLink]
            : [
                  failureLink,
                  new RetryLink({
                      delay: {
                          initial: retryConfig.initialDelayMs ?? 500,
                          max: retryConfig.maxDelayMs ?? 8_000,
                          jitter: true,
                      },
                      attempts: {
                          max: retryConfig.maxAttempts ?? 12,
                          retryIf: (error) => isTransientSandboxHttpError(error),
                      },
                  }),
                  authLink,
                  transportLink,
              ]

    return new ApolloClient({
        link: links.reduce((chain, link) => chain.concat(link)),
        cache: new InMemoryCache(),
    })
}

function hasUnauthenticatedError(errors: readonly GraphQLFormattedError[] | undefined): boolean {
    return errors?.some((error) => error.extensions?.code === "UNAUTHENTICATED") === true
}

/** Whether the auth link attached an Authorization header to this operation. */
function requestCarriedToken(operation: Operation): boolean {
    const headers = operation.getContext().headers as Record<string, string> | undefined
    return typeof headers?.authorization === "string" && headers.authorization.length > 0
}

/**
 * The sandbox self-heal path: one silent re-bootstrap, one retry. When the
 * re-bootstrap succeeds the operation re-runs through the auth link (fresh
 * token) and its result — success OR another failure — propagates to the
 * caller; a still-failing retry gets the same terminal handling the error
 * link would apply (onError never re-inspects retried results). When the
 * re-bootstrap resolves false, the original errored result propagates
 * unchanged after the terminal handling — no doomed second request.
 */
function recoverAndRetry(args: {
    operation: Operation
    response: FetchResult | undefined
    graphQLErrors: readonly GraphQLFormattedError[] | undefined
    networkError: Error | null | undefined
    forward: (operation: Operation) => Observable<FetchResult>
    recover: () => Promise<boolean>
    handleFailure: (
        operation: Operation,
        graphQLErrors: readonly GraphQLFormattedError[] | undefined,
        networkError: Error | null | undefined,
    ) => void
}): Observable<FetchResult> {
    return new Observable<FetchResult>((observer) => {
        let retrySubscription: { unsubscribe: () => void } | undefined
        let cancelled = false
        args.recover()
            .catch(() => false)
            .then((recovered) => {
                if (cancelled) {
                    return
                }
                if (!recovered) {
                    args.handleFailure(args.operation, args.graphQLErrors, args.networkError)
                    if (args.response !== undefined) {
                        observer.next(args.response)
                        observer.complete()
                    } else {
                        observer.error(args.networkError ?? new Error("The request failed."))
                    }
                    return
                }
                retrySubscription = args.forward(args.operation).subscribe({
                    next: (result) => {
                        if (result.errors !== undefined && result.errors.length > 0) {
                            args.handleFailure(args.operation, result.errors, undefined)
                        }
                        observer.next(result)
                    },
                    error: (retryNetworkError: Error) => {
                        args.handleFailure(args.operation, undefined, retryNetworkError)
                        observer.error(retryNetworkError)
                    },
                    complete: () => observer.complete(),
                })
            })
        return () => {
            cancelled = true
            retrySubscription?.unsubscribe()
        }
    })
}
