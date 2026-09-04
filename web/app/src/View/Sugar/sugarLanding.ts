import type { LandingConfig } from "@ui"
import { brand, contact, howItWorks, lineups, machines } from "./content"
import { epochDay, formatPrice, lineupIndexForDay, statusAt } from "./freshness"

/**
 * The sugar pack's page as a landing-kernel config (docs/landing.md).
 * `content.ts` stays the single owner-editable source and `freshness.ts`
 * keeps owning the live logic — the config is rebuilt per render, so the
 * daily case rotation and every machine's status badge stay current. The
 * `warm-boutique` preset carries the pink-pastry warmth.
 *
 * Mapping notes: today's case and the machine list are both `showcase`
 * grids — prices ride the `meta` slot via the pack's `formatPrice`, and
 * each machine's live status label rides the same slot (the status-tone
 * colors and the CSS-drawn vending machine have no kernel slot).
 */
export function buildSugarLanding(now: Date): LandingConfig {
    const day = now.getDay()
    const minute = now.getHours() * 60 + now.getMinutes()
    const lineup = lineups[lineupIndexForDay(epochDay(now), lineups.length)]

    return {
        style: { preset: "warm-boutique" },
        sections: [
            {
                type: "nav",
                variant: "minimal",
                content: {
                    logo: { emoji: "🧁", name: brand.name },
                    cta: { label: "Talk to us", href: `mailto:${contact.email}` },
                },
            },
            {
                type: "hero",
                variant: "centered-stack",
                content: {
                    headline: brand.tagline,
                    subheadline: brand.story,
                    media: { kind: "emoji", emoji: "🧁" },
                },
            },
            {
                type: "feature-grid",
                variant: "cards-3up",
                content: {
                    kicker: "How it works",
                    title: "Same promise at every machine, every day",
                    features: howItWorks.map((step) => ({
                        emoji: step.emoji,
                        title: step.title,
                        description: step.text,
                    })),
                },
            },
            {
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Today's case",
                    title: lineup.title,
                    items: lineup.pastries.map((pastry) => ({
                        title: pastry.name,
                        description: pastry.description,
                        meta: formatPrice(pastry.priceCents),
                        media: { kind: "emoji", emoji: pastry.emoji },
                    })),
                },
            },
            {
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Find a machine",
                    title: "Live from the bins",
                    items: machines.map((machine) => {
                        const status = statusAt(machine.schedule, day, minute)
                        return {
                            title: machine.name,
                            description: machine.note ? `${machine.spot} · ${machine.note}` : machine.spot,
                            meta: status.label,
                            media: { kind: "emoji" as const, emoji: "📍" },
                        }
                    }),
                },
            },
            {
                type: "cta-banner",
                variant: "card",
                content: {
                    title: contact.hostPitch,
                    body: contact.donationNote,
                    cta: { label: "Talk to us", href: `mailto:${contact.email}` },
                },
            },
            {
                type: "footer",
                variant: "single-row",
                content: {
                    blurb: brand.name,
                    // No footer links: the shipped Instagram handle is
                    // filler and a dead external link is worse than none.
                    // Re-add `{ label: "Instagram", href: contact.instagram }`
                    // once content.ts points at a real profile.
                    links: [],
                    note: "Built with Repobot",
                },
            },
        ],
    }
}
