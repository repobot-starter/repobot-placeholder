import { useContentLinks, type ContentLink } from "../Landing/linksDocument"
import { useContentLooks, type ContentLook } from "../Landing/looksDocument"
import { home, links, looks, type CreatorLook, type SiteImage } from "./content"

/**
 * The influencer pack's two contract resolutions — the interiors pack's
 * inventory discipline applied to both creator domains of the
 * business-content contract (repobot.content.json):
 *
 * - The LINK HUB resolves through the links domain with `content.ts`
 *   fallback. Nothing joins back — a link hub is words and URLs, so the
 *   resolved entries render as-is, in document order (order is the
 *   content).
 * - The LOOKS resolve through the looks domain with `content.ts`
 *   fallback, and this module joins the code-owned photographs back in
 *   BY REFERENCE via `slug`, so a Manage edit moves words and product
 *   links while the imagery stays code-owned.
 *
 * A look the owner adds in Manage has no code photograph yet — it
 * renders under the pack's signature image (the home hero) until a
 * photograph is produced for its slug. The looks grid's filter chips and
 * the hub's group chips stay derived from whatever the resolved entries
 * carry (`lookCategories` / `linkCategories`) whichever side the facts
 * came from — the taxonomy is data, not code.
 */

/** A contract look wearing its code-owned photograph — the render shape. */
export type { CreatorLook }

/**
 * The code link hub in contract shape — the fallback the resolver hands
 * back when the document doesn't speak for links, and the default the
 * landing builders render with (pinned tests, the preview route).
 */
export function codeLinkHub(): ContentLink[] {
    return links
}

/**
 * The code looks in contract shape — the fallback the resolver hands
 * back when the document doesn't speak for looks. The image rides
 * alongside untouched: `CreatorLook` IS the contract shape plus the
 * photograph.
 */
export function codeLooks(): CreatorLook[] {
    return looks
}

const imagesBySlug = new Map<string, SiteImage>(looks.map((look) => [look.slug, look.image]))

/** Contract looks joined with their code-owned photographs by slug. */
export function withLookImages(resolved: ContentLook[]): CreatorLook[] {
    return resolved.map((look) => ({
        ...look,
        image: imagesBySlug.get(look.slug) ?? home.heroImage,
    }))
}

/**
 * The link hub the influencer pages render: the committed document's
 * links over the code fallback when influencer is the ACTIVE pack —
 * re-rendering on live document edits (dev HMR), the same subscription
 * discipline as `useInteriorsPortfolio`.
 */
export function useInfluencerLinks(): ContentLink[] {
    return useContentLinks(codeLinkHub(), "influencer")
}

/**
 * The looks the influencer pages render: the committed document's looks
 * over the code fallback when influencer is the ACTIVE pack, photographs
 * joined back in — same live-edit subscription as the link hub.
 */
export function useInfluencerLooks(): CreatorLook[] {
    const resolved = useContentLooks(codeLooks(), "influencer")
    return withLookImages(resolved)
}
