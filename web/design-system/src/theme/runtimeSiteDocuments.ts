/**
 * The deploy-time site-config overlay: the root visual documents
 * (repobot.theme.json, repobot.landing.json, repobot.content.json) read
 * from an inline `<script type="application/json">` tag the deploy job
 * injects into every built page (inject-site-config.mjs on the platform
 * side). Production's answer to the dev server's hot channel
 * (themeHotUpdate.ts): the documents are pure config, so the platform
 * keys the web-bundle cache on the tree WITHOUT them and republishes a
 * design save by re-stamping this tag over the cached bundle — no Vite
 * rebuild. The build-time JSON imports stay as the fallback (and the
 * first paint's vanilla-extract CSS), so a page without the tag — the
 * sandbox dev server, tests, a kernel checkout — behaves exactly as
 * before.
 *
 * The tag rides index.html itself (served must-revalidate, so it is never
 * stale) rather than a fetched JSON (the router's default caching would
 * hold a config republish for minutes), and it is read synchronously at
 * module init — before anything renders — so consumers resolve it exactly
 * where they resolve the build-time import today.
 */

/** The marker id the deploy job's injector writes. */
export const RUNTIME_SITE_CONFIG_ELEMENT_ID = "repobot-site-config"

/**
 * The named document from the injected overlay, or undefined when the page
 * carries no overlay (dev, tests, kernel), the payload is unparseable, or
 * the overlay doesn't speak for this document. Parsed per call — the tag
 * is read a handful of times at boot, and no cache means tests (and any
 * future re-read) always see the live DOM.
 */
export function runtimeSiteDocument(name: string): unknown {
    if (typeof document === "undefined") {
        return undefined
    }
    const tag = document.getElementById(RUNTIME_SITE_CONFIG_ELEMENT_ID)
    if (tag === null) {
        return undefined
    }
    let payload: unknown
    try {
        payload = JSON.parse(tag.textContent ?? "")
    } catch {
        // A corrupt overlay must degrade to the baked documents, never
        // crash the page; the next deploy re-stamps it whole.
        console.warn(
            "[design-system] the injected site-config overlay is not valid JSON; using the built-in documents.",
        )
        return undefined
    }
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
        return undefined
    }
    return (payload as Record<string, unknown>)[name]
}

/** Whether the injected overlay carries the named document at all. */
export function hasRuntimeSiteDocument(name: string): boolean {
    return runtimeSiteDocument(name) !== undefined
}
