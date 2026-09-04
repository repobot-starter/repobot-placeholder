import type { LandingConfig } from "@ui"
import React from "react"
import { activePack } from "../../Config/activePack"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { faq, features, nightly, pricing, product, reviews, steps } from "./content"
import { launchShell } from "./launchShell"

const WAITLIST_KEY = "launchbot-waitlist-email"

/**
 * Home surface for the `launch` pack, composed on the landing kernel
 * (docs/landing.md): `content.ts` stays the single content file; this
 * binder maps it onto a `LandingConfig`. The chrome (nav + footer) is
 * SHELL chrome (`launchShell.ts`), not sections — that's what binds the
 * platform's Site navigation control and lets manifest pages join the
 * link row. The layout skeleton merges through the landing document's
 * per-page contract (`pages.home`, seeded by the pack catalog), the same
 * contract manifest marketing pages follow, so the platform's structural
 * editor can reorder, delete, and add sections with a live repaint. The
 * waitlist lives in the `lead-form` section at the foot of the page and
 * stores locally (this pack is client-only); PACK.md documents the
 * upgrade path to a real inbox.
 */
export const launchLanding: LandingConfig = {
    style: { preset: PACK_REGISTERS.launch },
    shell: launchShell("", ""),
    sections: [
        // The lamp introduces itself over its own bedroom, and both buttons
        // are scroll-anchors — the ask (the glow list) waits at the foot of
        // the page, after the story has done its job.
        {
            id: "hero",
            type: "hero",
            variant: "centered-stack",
            content: {
                badge: product.heroBadge,
                headline: product.headline,
                subheadline: product.subheadline,
                primaryCta: { label: product.primaryCtaLabel, anchor: "feature-grid" },
                secondaryCta: { label: product.secondaryCtaLabel, anchor: "testimonials" },
                backdrop: { src: "/showcase/lumina-hero.jpg", overlay: "none" },
            },
        },
        {
            id: "social-proof",
            type: "social-proof",
            variant: "text-logos",
            content: { label: "As seen glowing in", items: product.trustedBy },
        },
        {
            id: "feature-grid",
            type: "feature-grid",
            variant: "cards-3up",
            content: { kicker: "Features", title: "Everything you need — plus the puns", features },
        },
        // The night-photography rows: one image per job the lamp does after
        // everyone else is asleep, breaking the card-grid rhythm.
        {
            id: "highlights",
            type: "highlights",
            variant: "alternating",
            content: {
                kicker: nightly.kicker,
                title: nightly.title,
                highlights: nightly.highlights.map((entry) => ({
                    headline: entry.headline,
                    body: entry.body,
                    media: { kind: "image", src: entry.image.src, alt: entry.image.alt },
                })),
            },
        },
        {
            id: "steps",
            type: "steps",
            variant: "numbered-cards",
            content: { kicker: "How it works", title: "Three steps to fully lit", steps },
        },
        {
            id: "testimonials",
            type: "testimonials",
            variant: "quote-grid",
            content: {
                kicker: "Reviews",
                title: "The neighbors are talking",
                quotes: reviews.map((entry) => ({
                    quote: entry.quote,
                    author: entry.author,
                    title: entry.title,
                })),
            },
        },
        {
            id: "pricing",
            type: "pricing",
            variant: "tiers",
            content: { kicker: "Pricing", title: "The lamp is yours. The puns are a plan.", tiers: pricing },
        },
        {
            id: "faq",
            type: "faq",
            variant: "accordion",
            content: { kicker: "FAQ", title: "Asked at 2 a.m.", items: faq },
        },
        {
            id: "lead-form",
            type: "lead-form",
            variant: "inline-email",
            content: {
                kicker: "Say hello",
                title: "Get on the glow list.",
                placeholder: product.waitlistPlaceholder,
                cta: product.waitlistCta,
                confirmation: "You're on the list — I'll glow extra bright the day you're up.",
            },
        },
    ],
}

export default function LaunchPage(): React.ReactElement {
    // The document merge only speaks for the ACTIVE pack: on the /launch
    // preview route under another pack, the document's `pages.home` belongs
    // to that pack and must not bind here (the empty page id opts out).
    const config = useSitePageConfig(activePack.key === "launch" ? "home" : "", launchLanding)
    // Document meta from the same content file the page renders (docs/seo.md).
    return (
        <>
            <PageMeta title={product.name} siteName={product.name} description={product.subheadline} />
            <LandingRenderer config={config} leadStorageKey={WAITLIST_KEY} />
        </>
    )
}
