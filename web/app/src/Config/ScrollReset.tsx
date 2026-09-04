import React from "react"
import { useLocation, useNavigationType } from "react-router-dom"

/**
 * SPA navigations keep the window's scroll position by default, so clicking
 * to a new page mid-scroll landed visitors mid-page — mounted once in App,
 * this restores the browser-navigation contract: a PUSH/REPLACE to a new
 * location starts at the top, an in-page anchor target scrolls into view,
 * and back/forward (POP) is left to the browser's own scroll restoration.
 */
export function ScrollReset(): null {
    const location = useLocation()
    const navigationType = useNavigationType()
    React.useLayoutEffect(() => {
        if (navigationType === "POP") {
            return
        }
        if (location.hash !== "") {
            // Cross-page anchor links (the footer's "/#contact" from a
            // subpage) ride the router, so no native anchor scroll happens.
            // The target may mount a few frames later (lazy routes behind
            // Suspense) — poll briefly, then fall back to the top.
            let cancelled = false
            let framesLeft = 20
            const id = location.hash.slice(1)
            const seek = (): void => {
                if (cancelled) {
                    return
                }
                const target = document.getElementById(id)
                if (target !== null) {
                    target.scrollIntoView()
                    return
                }
                framesLeft -= 1
                if (framesLeft > 0) {
                    requestAnimationFrame(seek)
                } else {
                    window.scrollTo(0, 0)
                }
            }
            seek()
            return () => {
                cancelled = true
            }
        }
        window.scrollTo(0, 0)
        return undefined
    }, [location.pathname, location.search, location.hash, navigationType])
    return null
}
