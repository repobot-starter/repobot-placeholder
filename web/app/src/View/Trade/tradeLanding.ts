import type { LandingConfig } from "@ui"
import { certifications, commodities, company, journey, partners, shipments, stats } from "./content"

/**
 * The trade pack's page as a landing-kernel config (docs/landing.md).
 * `content.ts` stays the single owner-editable source; this file only maps
 * it into sections. The `editorial` preset carries the pack's paper-and-ink
 * personality (serif statements, rules over cards).
 *
 * Mapping notes: the KPI strip is `social-proof metrics-row`; commodities
 * and the shipment board are both `showcase card-grid` (spec/origin and
 * status ride the tag chips — the monogram tiles and status-pill tones have
 * no kernel slot); certifications and partners share the text-logo strip.
 */
export const tradeLanding: LandingConfig = {
    style: { preset: "editorial" },
    sections: [
        {
            type: "nav",
            variant: "inline",
            content: {
                logo: { name: company.name },
                links: [
                    { label: "Commodities", anchor: "showcase" },
                    { label: "How it works", anchor: "steps" },
                    { label: "Contact", anchor: "lead-form" },
                ],
                cta: { label: "Request a quote", href: `mailto:${company.email}` },
            },
        },
        {
            type: "hero",
            variant: "statement",
            content: {
                badge: company.kicker,
                headline: company.statement,
                subheadline: company.intro,
                primaryCta: { label: "Request a quote", href: `mailto:${company.email}` },
                secondaryCta: { label: "See what we move", anchor: "showcase" },
            },
        },
        {
            type: "social-proof",
            variant: "metrics-row",
            content: {
                label: "Track record",
                metrics: stats.map((stat) => ({ value: stat.value, label: stat.label })),
            },
        },
        {
            type: "showcase",
            variant: "card-grid",
            content: {
                kicker: "What we move",
                title: "Graded to spec, traceable to the source",
                items: commodities.map((commodity) => ({
                    title: commodity.name,
                    description: commodity.note,
                    tags: [commodity.spec, commodity.origin],
                })),
            },
        },
        {
            type: "steps",
            variant: "timeline",
            content: {
                kicker: "How it gets there",
                title: "One team owns the load, end to end",
                steps: journey.map((step) => ({ title: step.title, description: step.description })),
            },
        },
        {
            type: "showcase",
            variant: "card-grid",
            content: {
                kicker: "On the water right now",
                title: "A live cut of our shipment board",
                items: shipments.map((shipment) => ({
                    title: shipment.ref,
                    eyebrow: shipment.lane,
                    description: shipment.commodity,
                    meta: `ETA ${shipment.eta}`,
                    tags: [shipment.status],
                })),
            },
        },
        {
            type: "social-proof",
            variant: "text-logos",
            content: {
                label: "Held to a standard",
                items: [...certifications.map((certification) => certification.code), ...partners],
            },
        },
        {
            type: "lead-form",
            variant: "contact-block",
            content: {
                kicker: "Contact",
                title: "Tell us what you need on the water, and when.",
                body: "Every quote is answered by the ops desk, not a form queue.",
                channels: [
                    { label: "Email", value: company.email, href: `mailto:${company.email}` },
                    {
                        label: "Phone",
                        value: company.phone,
                        href: `tel:${company.phone.replace(/[^0-9+]/g, "")}`,
                    },
                    { label: "Office", value: company.location },
                ],
            },
        },
        {
            type: "footer",
            variant: "single-row",
            content: {
                blurb: `© ${new Date().getFullYear()} ${company.name}`,
                note: "Made with TradeBot",
            },
        },
    ],
}
