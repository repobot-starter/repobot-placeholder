import { useContentListings, type ContentListing } from "../Landing/listingsDocument"
import { home, listings, type Listing, type SiteImage } from "./content"

/**
 * The estate pack's inventory, resolved through the business-content
 * contract (repobot.content.json's listings domain) with `content.ts`
 * fallback — the fitness family's schedule discipline applied to property
 * cards. The contract owns the owner-run facts (address, price, specs,
 * status, dates, the featured flag); the code keeps the photographs, and
 * this module joins them back in BY REFERENCE via `slug`, so a Manage
 * edit moves numbers and statuses while the imagery stays code-owned.
 *
 * A listing the owner adds in Manage has no code photograph yet — it
 * renders under the pack's signature street scene (the home hero) until a
 * photograph is produced for its slug. Statuses and badges stay computed
 * from the dates by the listings engine (`listings.ts`) whichever side
 * the facts came from.
 */

/** A contract listing wearing its code-owned photograph — the render shape. */
export interface InventoryListing extends ContentListing {
    image: SiteImage
}

/** The home rail's curation, as slugs — the contract's `featured` flag
 * derives from this on the code-fallback path, so the document and code
 * paths agree on which cards lead the home page. */
const featuredSlugs = new Set(home.featuredListings.map((listing) => listing.slug))

/** One code listing lifted into the contract shape (photo kept alongside). */
function liftListing(listing: Listing): InventoryListing {
    const { image, ...facts } = listing
    return {
        ...facts,
        ...(featuredSlugs.has(listing.slug) ? { featured: true } : {}),
        image,
    }
}

/**
 * The code inventory in contract shape — the fallback the resolver hands
 * back when the document doesn't speak for listings, and the default the
 * landing builders render with (pinned tests, the preview route).
 */
export function codeInventory(): InventoryListing[] {
    return listings.map(liftListing)
}

const imagesBySlug = new Map<string, SiteImage>(listings.map((listing) => [listing.slug, listing.image]))

/** Contract listings joined with their code-owned photographs by slug. */
export function withListingImages(resolved: ContentListing[]): InventoryListing[] {
    return resolved.map((listing) => ({
        ...listing,
        image: imagesBySlug.get(listing.slug) ?? home.heroImage,
    }))
}

/**
 * The inventory the estate pages render: the committed document's listings
 * over the code fallback when estate is the ACTIVE pack, photographs
 * joined back in — re-rendering on live document edits (dev HMR), the
 * same subscription discipline as `useScheduleSessions`.
 */
export function useEstateInventory(): InventoryListing[] {
    const resolved = useContentListings(codeInventory(), "estate")
    return withListingImages(resolved)
}
