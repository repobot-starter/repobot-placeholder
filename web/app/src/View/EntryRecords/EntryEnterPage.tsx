import { Spinner } from "@ui"
import React, { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { runtime } from "../../Config/Runtime"

/**
 * The entry pack's home route: Capture Data has no landing page by design
 * (the pack manifest ships zero marketing pages) — the tool IS the front
 * door. Establish a session (anonymous when nobody is signed in, like the
 * pdf and interpret packs), then land on the records table with the entry
 * form already open (`?new=1`, consumed by EntryRecordsViewModel).
 */
export default function EntryEnterPage(): React.ReactElement {
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
    return <Navigate to="/records?new=1" replace />
}
