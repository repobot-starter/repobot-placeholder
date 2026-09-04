import React from "react"
import { useNavigate } from "react-router-dom"

/**
 * Routes same-origin anchor clicks through the SPA router. The marketing
 * shell and section library render plain `<a href>` links (the design
 * system cannot depend on react-router), so without this every nav click
 * is a full document navigation: the browser tears the page down, the
 * whole app re-boots, and embedded previews flash their loading cover —
 * for a route the SPA could have swapped in place instantly.
 *
 * Scope rules (the standard SPA delegation contract):
 * - only plain left-clicks (no modifier keys, no non-default buttons)
 * - only same-origin hrefs; `target` (≠ _self), `download`, and
 *   `data-native-nav` opt out
 * - hash-only changes on the current path stay native (anchor scroll)
 * - hrefs outside the router's basename stay native
 */
export function MarketingLinkInterceptor(): null {
    const navigate = useNavigate()
    React.useEffect(() => {
        const basename = (import.meta.env.BASE_URL || "/").replace(/\/$/, "")
        const onClick = (event: MouseEvent): void => {
            if (event.defaultPrevented || event.button !== 0) return
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            const target = event.target as Element | null
            const anchor = target?.closest?.("a[href]")
            if (!(anchor instanceof HTMLAnchorElement)) return
            if (anchor.origin !== window.location.origin) return
            if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) {
                return
            }
            if (anchor.hasAttribute("data-native-nav")) return
            // Same-document hash hop: native anchor scrolling does it right.
            if (
                anchor.pathname === window.location.pathname &&
                anchor.search === window.location.search &&
                anchor.hash !== ""
            ) {
                return
            }
            let routerPath = anchor.pathname
            if (basename !== "") {
                if (!routerPath.startsWith(basename)) return
                routerPath = routerPath.slice(basename.length) || "/"
            }
            event.preventDefault()
            void navigate(`${routerPath}${anchor.search}${anchor.hash}`)
        }
        document.addEventListener("click", onClick)
        return () => document.removeEventListener("click", onClick)
    }, [navigate])
    return null
}
