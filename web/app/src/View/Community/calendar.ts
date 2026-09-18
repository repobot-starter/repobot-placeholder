import { useContentEvents } from "../Landing/eventsDocument"
import type { DatedEvent } from "../Landing/events"
import { events, type CommunityEvent, type CommunityImage } from "./content"

/**
 * The community pack's calendar, resolved through the business-content
 * contract (repobot.content.json's events domain) with `content.ts`
 * fallback — the estate inventory's discipline applied to dated events.
 * The contract owns the facts an organizer runs the calendar with (title,
 * start/end, location, description); the code keeps the photographs, and
 * this module joins them back in BY REFERENCE via `slug` — an event the
 * owner adds in Manage simply renders without one (the card's image slot
 * is optional). Upcoming vs. past and the "Next up" highlight stay
 * computed at render time by the events engine (`../Landing/events.ts`)
 * whichever side the facts came from.
 */

const imagesBySlug = new Map<string, CommunityImage>(
    events.flatMap((event) => (event.image !== undefined ? [[event.slug, event.image]] : [])),
)

/** Contract events joined with their code-owned photographs by slug. */
export function withEventImages(resolved: DatedEvent[]): CommunityEvent[] {
    return resolved.map((event) => {
        const image = imagesBySlug.get(event.slug)
        return image !== undefined ? { ...event, image } : { ...event }
    })
}

/**
 * The calendar the community pages render: the committed document's
 * events over the code fallback when community is the ACTIVE pack,
 * photographs joined back in — re-rendering on live document edits (dev
 * HMR), the same subscription discipline as `useScheduleSessions`.
 */
export function useCommunityCalendar(): CommunityEvent[] {
    return withEventImages(useContentEvents(events, "community"))
}
