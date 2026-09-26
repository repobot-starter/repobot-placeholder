import { deriveAnalyticsEndpoint, sendPageview } from "@base/core"
import React from "react"
import { useLocation } from "react-router-dom"

/**
 * The analytics kernel's client half (docs/analytics.md): one pageview ping
 * per route change, mounted once in App. First-party and cookieless — the
 * ping carries only the path; no cookie is set and nothing identifies the
 * visitor client-side. Rendering nothing and swallowing every failure are
 * both load-bearing: analytics never affects the page it measures.
 */
export function PageviewBeacon(): null {
    const location = useLocation()
    React.useEffect(() => {
        try {
            sendPageview(deriveAnalyticsEndpoint(import.meta.env.VITE_GRAPHQL_URL), location.pathname)
        } catch {
            // A malformed GraphQL URL (tests, storybook) must not crash the app.
        }
    }, [location.pathname])
    return null
}
