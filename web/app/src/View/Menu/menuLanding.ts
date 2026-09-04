import type { LandingConfig, MarketingContactChannel, MarketingShowcaseItem } from "@ui"
import {
    business,
    dietaryLabels,
    formatPrice,
    hoursNote,
    menu,
    weeklyHours,
    type MenuSection,
} from "./content"
import { dayNames, formatMinute, statusLabel, type DayHours } from "../Landing/hours"

/**
 * The menu pack's page as a landing-kernel config (docs/landing.md).
 * `content.ts` stays the single owner-editable source and `hours.ts` keeps
 * owning the live open/closed logic — the config is rebuilt per render so
 * the hero badge stays current. The `warm-boutique` preset carries the
 * café's warmth.
 *
 * Mapping notes: menu sections and dietary marks both become showcase tag
 * chips (prices ride the `meta` slot via the pack's `formatPrice`); the
 * weekly hours table becomes contact-block channels, one row per day —
 * today's row is no longer bolded, but the live badge survives up top.
 *
 * The builder takes the RESOLVED week and card: the page resolves the
 * business-content contract over `content.ts` once (`useContentHours` /
 * `useContentMenu` in MenuPage) and the builder renders whatever facts it
 * is handed — an owner's Manage edit and the code default walk the same
 * path. Both default to the code content, so callers without a resolved
 * document (pinned tests, the preview route) keep the plain (now)
 * signature.
 */
export function buildMenuLanding(
    now: Date,
    hours: DayHours[] = weeklyHours,
    card: MenuSection[] = menu,
): LandingConfig {
    const day = now.getDay()
    const minute = now.getHours() * 60 + now.getMinutes()

    const menuItems: MarketingShowcaseItem[] = card.flatMap((section) =>
        section.items.map((item) => ({
            title: item.name,
            description: item.description,
            meta: formatPrice(item.priceCents),
            eyebrow: item.popular ? "Popular" : undefined,
            tags: [section.title, ...item.dietary.map((mark) => dietaryLabels[mark])],
        })),
    )

    const hourChannels: MarketingContactChannel[] = dayNames.map((name, d) => {
        const entry = hours.find((dayHours) => dayHours.day === d)
        return {
            label: name,
            value: entry
                ? entry.intervals
                      .map(([open, close]) => `${formatMinute(open)} – ${formatMinute(close)}`)
                      .join(", ")
                : "Closed",
        }
    })

    return {
        style: { preset: "warm-boutique" },
        sections: [
            {
                type: "nav",
                variant: "minimal",
                content: {
                    logo: { name: business.name },
                    cta: { label: "Find us", anchor: "lead-form" },
                },
            },
            {
                type: "hero",
                variant: "centered-stack",
                content: {
                    badge: statusLabel(hours, day, minute),
                    headline: business.name,
                    subheadline: `${business.tagline}. ${business.description}`,
                },
            },
            {
                type: "showcase",
                variant: "filterable-grid",
                content: {
                    kicker: "The menu",
                    title: "Short, from scratch, every day",
                    allLabel: "Everything",
                    items: menuItems,
                },
            },
            {
                type: "lead-form",
                variant: "contact-block",
                content: {
                    kicker: "Visit",
                    title: "Find us",
                    body: hoursNote,
                    channels: [
                        {
                            label: "Address",
                            value: business.address,
                            href: `https://maps.google.com/?q=${encodeURIComponent(business.mapsQuery)}`,
                        },
                        {
                            label: "Phone",
                            value: business.phone,
                            href: `tel:${business.phone.replace(/[^0-9+]/g, "")}`,
                        },
                        { label: "Email", value: business.email, href: `mailto:${business.email}` },
                        // No Instagram row: the shipped handle is filler and
                        // a dead external link is worse than none. Re-add
                        // `{ label: "Instagram", value: "Follow along",
                        // href: business.instagram }` once content.ts points
                        // at a real profile.
                        ...hourChannels,
                    ],
                },
            },
            {
                type: "footer",
                variant: "single-row",
                content: {
                    blurb: `${business.name} — ${business.tagline}`,
                    note: "Built with Repobot",
                },
            },
        ],
    }
}
