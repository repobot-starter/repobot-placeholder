import React from "react"

/** Overflow below this many pixels is sub-pixel rounding or a trailing letter-space, not a clipped word. */
const FIT_TOLERANCE_PX = 2

/**
 * Keeps a display headline inside its column when one unbreakable word is
 * wider than the column — a register with a monumental display scale on a
 * site whose headline has a long word ("PHOTOGRAPHS" in a condensed-caps
 * register). The headline is measured at its authored size; only an
 * overflowing one is scaled down, to exactly the width it has. A headline
 * that fits is never touched, so every register keeps its authored type
 * wherever the copy was written for it. Re-measures when `headline` (the
 * copy) or the column width changes.
 */
export function useHeadlineFit<T extends HTMLElement>(headline: string): React.RefObject<T | null> {
    const ref = React.useRef<T | null>(null)
    React.useLayoutEffect(() => {
        const element = ref.current
        if (element === null) return
        let measuredWidth = -1
        const fit = (): void => {
            element.style.removeProperty("font-size")
            const overflow = element.scrollWidth - element.clientWidth
            if (element.clientWidth === 0 || overflow <= FIT_TOLERANCE_PX) return
            const size = Number.parseFloat(getComputedStyle(element).fontSize)
            if (!Number.isFinite(size) || size <= 0) return
            const fitted = Math.floor(size * (element.clientWidth / element.scrollWidth) * 10) / 10
            element.style.fontSize = `${fitted}px`
        }
        fit()
        if (typeof document !== "undefined" && document.fonts !== undefined) {
            void document.fonts.ready.then(() => {
                if (ref.current === element) fit()
            })
        }
        if (typeof ResizeObserver === "undefined") return
        // Width only: the fit itself changes the headline's height, and
        // re-fitting on that would loop.
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0
            if (Math.abs(width - measuredWidth) < 0.5) return
            measuredWidth = width
            fit()
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [headline])
    return ref
}
