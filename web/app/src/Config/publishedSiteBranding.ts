import { runtimeSiteDocument } from "@ui"

interface PublishedSiteOverlay {
    showSpaceboyFooter?: unknown
}

function readPublishedSiteOverlay(): PublishedSiteOverlay | undefined {
    const overlay = runtimeSiteDocument("repobot.publish.json")
    if (typeof overlay !== "object" || overlay === null || Array.isArray(overlay)) {
        return undefined
    }
    return overlay as PublishedSiteOverlay
}

export function shouldShowSpaceboyFooter(): boolean {
    return readPublishedSiteOverlay()?.showSpaceboyFooter === true
}
