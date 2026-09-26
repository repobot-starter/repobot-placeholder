import { Spinner } from "@ui"
import React, { useEffect, useState } from "react"
import { runtime } from "../../Config/Runtime"
import AgentDeskPage from "./AgentDeskPage"

/**
 * Session gate for the desk: feature routes are public, but the songs
 * catalog is authenticated — establish a session first (anonymous when
 * nobody is signed in), then mount the desk.
 */
export default function AgentStandalonePage(): React.ReactElement {
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string>()

    useEffect(() => {
        let cancelled = false
        const ensureSession = async (): Promise<void> => {
            const existing = await runtime.authClient.getToken()
            if (existing === null) {
                await runtime.authClient.signInAnonymously()
            }
            if (!cancelled) {
                setReady(true)
            }
        }
        ensureSession().catch((caught: unknown) => {
            if (!cancelled) {
                setError(caught instanceof Error ? caught.message : "Sign-in failed.")
            }
        })
        return () => {
            cancelled = true
        }
    }, [])

    if (error !== undefined) {
        return <p role="alert">{error}</p>
    }
    if (!ready) {
        return <Spinner size="lg" />
    }
    return <AgentDeskPage />
}
