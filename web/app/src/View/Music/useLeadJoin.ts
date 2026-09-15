import { useState } from "react"
import { submitForm } from "@base/core"

/**
 * The LandingRenderer's lead-capture contract for bespoke pack pages that
 * render MarketingPage/MarketingShell themselves (docs/landing.md): posts
 * through the managed forms pipeline with the localStorage fallback, and
 * flips the joined state optimistically — same behavior, one place.
 */
export function useLeadJoin(
    storageKey: string,
    formKey: string,
): { joined: boolean; join: (email: string, details?: Record<string, string>) => void } {
    const [joined, setJoined] = useState(() => localStorage.getItem(storageKey) !== null)
    const join = (email: string, details?: Record<string, string>): void => {
        void submitForm({
            formKey,
            fields:
                details !== undefined && Object.keys(details).length > 0 ? { email, ...details } : { email },
            fallbackStorageKey: `${storageKey}.submission`,
        })
        localStorage.setItem(storageKey, email)
        setJoined(true)
    }
    return { joined, join }
}
