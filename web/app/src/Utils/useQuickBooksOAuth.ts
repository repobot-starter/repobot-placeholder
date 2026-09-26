import { useEffect, useRef, useState } from "react"
import {
    useBeginQuickBooksAuthorizationMutation,
    useCompleteQuickBooksAuthorizationMutation,
    useQuickBooksStatusQuery,
} from "../generated/graphql/types"

/**
 * The live (QUICKBOOKS_MODE=intuit) connect flow every books surface shares.
 *
 * In local mode this is inert (isOAuthMode false) and pages connect over
 * their instant mutations. In intuit mode connecting hands the browser to
 * Intuit's consent screen and this hook finishes the round trip: on mount it
 * looks for Intuit's callback parameters (code, state, realmId) in the query
 * string, completes the connect, strips them from the URL, and reports back.
 */
export interface QuickBooksOAuth {
    /** True when connecting goes through Intuit's consent screen. */
    isOAuthMode: boolean
    /** True while finishing a connect from Intuit's callback parameters. */
    isCompleting: boolean
    /** Starts the OAuth connect: requests the consent URL and navigates to it. */
    startOAuth: () => Promise<void>
}

export function useQuickBooksOAuth(options: {
    /** Called after a callback completes; refetch the page's queries here. */
    onConnected: (companyName: string) => void
    onError: (message: string) => void
    /**
     * False on surfaces that render before there is a session (the
     * quickbooks feature pack's page lives on a public route). The whole
     * QuickBooks domain is authenticated, so the status query must not run
     * while signed out. Defaults to true for the auth-gated dashboards.
     */
    enabled?: boolean
}): QuickBooksOAuth {
    const enabled = options.enabled ?? true
    const statusQuery = useQuickBooksStatusQuery({ skip: !enabled })
    const [beginAuthorization] = useBeginQuickBooksAuthorizationMutation()
    const [completeAuthorization, completeState] = useCompleteQuickBooksAuthorizationMutation()
    const [isCompleting, setIsCompleting] = useState(() => hasCallbackParams())
    const handledCallback = useRef(false)
    // The latest callbacks without retriggering the completion effect.
    const optionsRef = useRef(options)
    optionsRef.current = options

    useEffect(() => {
        if (!enabled || handledCallback.current || !hasCallbackParams()) {
            return
        }
        handledCallback.current = true
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code") ?? ""
        const state = params.get("state") ?? ""
        const realmId = params.get("realmId") ?? ""
        stripCallbackParams()
        void (async () => {
            try {
                const result = await completeAuthorization({
                    variables: {
                        input: {
                            idempotencyKey: crypto.randomUUID(),
                            code,
                            state,
                            realmId,
                            redirectUri: currentRedirectUri(),
                        },
                    },
                    refetchQueries: ["QuickBooksStatus"],
                })
                const companyName = result.data?.completeQuickBooksAuthorization.companyName ?? ""
                optionsRef.current.onConnected(companyName)
            } catch (caught) {
                optionsRef.current.onError(
                    caught instanceof Error ? caught.message : "Connecting QuickBooks failed.",
                )
            } finally {
                setIsCompleting(false)
            }
        })()
    }, [completeAuthorization, enabled])

    const startOAuth = async (): Promise<void> => {
        try {
            const result = await beginAuthorization({
                variables: { input: { redirectUri: currentRedirectUri() } },
            })
            const url = result.data?.beginQuickBooksAuthorization.authorizationUrl
            if (url === undefined) {
                throw new Error("Intuit did not return an authorization URL.")
            }
            window.location.assign(url)
        } catch (caught) {
            optionsRef.current.onError(
                caught instanceof Error ? caught.message : "Starting the QuickBooks connect failed.",
            )
        }
    }

    return {
        isOAuthMode: statusQuery.data?.quickBooksStatus.mode === "INTUIT",
        isCompleting: isCompleting || completeState.loading,
        startOAuth,
    }
}

/** The page's own address, query-less — what Intuit redirects back to. */
function currentRedirectUri(): string {
    return `${window.location.origin}${window.location.pathname}`
}

function hasCallbackParams(): boolean {
    const params = new URLSearchParams(window.location.search)
    return params.get("code") !== null && params.get("state") !== null && params.get("realmId") !== null
}

/** Removes Intuit's callback parameters so refresh/back never re-submits the code. */
function stripCallbackParams(): void {
    const url = new URL(window.location.href)
    url.searchParams.delete("code")
    url.searchParams.delete("state")
    url.searchParams.delete("realmId")
    window.history.replaceState(window.history.state, "", url.toString())
}
