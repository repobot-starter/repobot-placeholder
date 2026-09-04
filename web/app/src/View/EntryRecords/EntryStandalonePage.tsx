import { AppShell, Spinner, type AppShellNavSection } from "@ui"
import React, { useEffect, useState } from "react"
import { runtime } from "../../Config/Runtime"
import EntryRecordsPage from "./EntryRecordsPage"

/** The workbook is one surface; the rail names it and nothing else. */
const NAV_SECTIONS: AppShellNavSection[] = [
    { id: "workbook", title: "Workbook", items: [{ id: "records", label: "Records" }] },
]

/** A filled square of record rows, worn as the shell brand mark. */
function RecordsBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <rect x="3" y="4" width="14" height="2.6" rx="1.3" fill="currentColor" />
            <rect x="3" y="8.7" width="14" height="2.6" rx="1.3" fill="currentColor" opacity="0.65" />
            <rect x="3" y="13.4" width="14" height="2.6" rx="1.3" fill="currentColor" opacity="0.35" />
        </svg>
    )
}

/**
 * The pack's always-mounted preview route (`/entry`, packs/README.md
 * `intent: "feature"`): the records workbook outside the dashboard shell.
 * Feature routes are public, but the Entry domain is authenticated — so this
 * gate establishes a session first (an anonymous one when nobody is signed
 * in, like the pdf and interpret packs), then mounts the real surface whose
 * queries fire on mount. The chrome is the kernel AppShell (the catalog
 * theme's sidebar treatment), so a shell/content remix press is visible on
 * this route exactly as it is on the dashboard — the workbook itself renders
 * unwrapped at the dashboard's `/records`, which brings its own shell.
 */
export default function EntryStandalonePage(): React.ReactElement {
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

    return (
        <AppShell
            title="Data Capture"
            brandIcon={<RecordsBrandIcon />}
            sections={NAV_SECTIONS}
            activeItemId="records"
            onItemSelect={() => undefined}
        >
            {error !== undefined ? (
                <p role="alert">{error}</p>
            ) : !ready ? (
                <Spinner size="lg" />
            ) : (
                <EntryRecordsPage />
            )}
        </AppShell>
    )
}
