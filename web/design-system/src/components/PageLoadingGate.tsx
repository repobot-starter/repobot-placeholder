import React, { useEffect, useRef, useState } from "react"
import { Spinner } from "../primitives/Spinner"
import { type UiLoaderStyle } from "../theme/themeConfig"
import { useThemeContract } from "../theme/themeHotUpdate"
import * as styles from "./PageLoadingGate.styles.css"

export interface PageLoadingGateProps {
    /** True while the page's data is loading (e.g. `query.loading`). */
    loading: boolean
    /**
     * Overrides the repobot.theme.json `ui.loaders.style` preset for this
     * mount: "gate" holds the whole page behind a centered spinner and then
     * presents everything at once; "progressive" renders content immediately
     * so each region shows its own skeleton.
     */
    style?: UiLoaderStyle
    /**
     * Progressive-mode placeholder rendered instead of children while
     * loading (compose from <Skeleton>). Omit to render children
     * immediately and let each region skeleton itself.
     */
    skeleton?: React.ReactNode
    /**
     * Once the spinner/skeleton shows, keep it visible at least this long so
     * fast responses don't flash. Default 300ms.
     */
    minVisibleMs?: number
    children: React.ReactNode
}

/**
 * The page-level loading preset. Wrap a page's content and pass its
 * aggregate loading flag:
 *
 *     <PageLoadingGate loading={loading}>
 *         <StatCardRow ... />
 *         <DataTable ... />
 *     </PageLoadingGate>
 *
 * In "gate" style (the Repobot pattern) the user sees one calm spinner and
 * then the finished page — no staggered pop-in. In "progressive" style the
 * layout appears immediately with per-region placeholders.
 */
export function PageLoadingGate({
    loading,
    style,
    skeleton,
    minVisibleMs = 300,
    children,
}: PageLoadingGateProps): React.ReactElement {
    const { ui } = useThemeContract()
    const resolved = style ?? ui.loaders.style
    const showPlaceholder = useMinimumVisible(loading, minVisibleMs)

    if (resolved === "gate") {
        if (showPlaceholder) {
            return (
                <div className={styles.gate}>
                    <Spinner size="lg" aria-label="Loading page" />
                </div>
            )
        }
        return <>{children}</>
    }

    if (skeleton !== undefined && showPlaceholder) {
        return <>{skeleton}</>
    }
    return <>{children}</>
}

/** True while loading, held true until the placeholder has shown minVisibleMs. */
function useMinimumVisible(loading: boolean, minVisibleMs: number): boolean {
    const [held, setHeld] = useState(loading)
    const shownAtRef = useRef<number | null>(loading ? Date.now() : null)

    useEffect(() => {
        if (loading) {
            if (shownAtRef.current === null) {
                shownAtRef.current = Date.now()
            }
            setHeld(true)
            return
        }
        if (shownAtRef.current === null) {
            return
        }
        const remaining = minVisibleMs - (Date.now() - shownAtRef.current)
        if (remaining <= 0) {
            shownAtRef.current = null
            setHeld(false)
            return
        }
        const timer = window.setTimeout(() => {
            shownAtRef.current = null
            setHeld(false)
        }, remaining)
        return () => window.clearTimeout(timer)
    }, [loading, minVisibleMs])

    return loading || held
}
