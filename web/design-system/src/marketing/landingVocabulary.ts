import type { LandingSectionType } from "./LandingConfig"
import type { MarketingBlogListVariant } from "./MarketingBlogList"
import type { MarketingCardGridVariant } from "./MarketingCardGrid"
import type { MarketingCarouselVariant } from "./MarketingCarousel"
import type { MarketingComparisonVariant } from "./MarketingComparison"
import type { MarketingContentSplitVariant } from "./MarketingContentSplit"
import type { MarketingCtaBannerVariant } from "./MarketingCtaBanner"
import type { MarketingFaqVariant } from "./MarketingFaq"
import type { MarketingFeatureGridVariant } from "./MarketingFeatureGrid"
import type { MarketingFooterVariant } from "./MarketingFooter"
import type { MarketingGalleryVariant } from "./MarketingGallery"
import type { MarketingHeroVariant } from "./MarketingHero"
import type { MarketingHighlightsVariant } from "./MarketingHighlights"
import type { MarketingLeadFormVariant } from "./MarketingLeadForm"
import type { MarketingLogosVariant } from "./MarketingLogos"
import type { MarketingNavVariant } from "./MarketingNav"
import type { MarketingShellFooterVariant } from "./MarketingShell"
import type { MarketingPricingVariant } from "./MarketingPricing"
import type { MarketingRichProseVariant } from "./MarketingRichProse"
import type { MarketingScheduleVariant } from "./MarketingSchedule"
import type { MarketingShowcaseVariant } from "./MarketingShowcase"
import type { MarketingSocialProofVariant } from "./MarketingSocialProof"
import type { MarketingStatsVariant } from "./MarketingStats"
import type { MarketingStepsVariant } from "./MarketingSteps"
import type { MarketingTeamVariant } from "./MarketingTeam"
import type { MarketingTestimonialsVariant } from "./MarketingTestimonials"

/**
 * The landing kernel's runtime vocabulary: every section type's variant
 * list as a value, not just a type. This is what data-driven callers
 * validate against — the `repobot.landing.json` layout resolver, the
 * manifest section scaffolder, and platform tooling.
 *
 * Lockstep expectation: these names are the public, append-only contract
 * shared with the platform (docs/landing-kernel-spec.md §8) — the platform
 * mirrors them append-only, exactly like `MARKETING_NAV_VARIANTS` in
 * `themeConfig.ts`. Never rename or remove a shipped name; new variants are
 * appended here in the same edit that adds them to the component's variant
 * type (the `variantsOf` helper fails the build if the two drift).
 */

/**
 * Locks a variant array to its component's variant type in both
 * directions: every entry must be a valid variant (the `readonly T[]`
 * constraint), and every variant must be listed (the conditional rejects
 * arrays whose union doesn't cover `T`).
 */
const variantsOf =
    <T extends string>() =>
    <const U extends readonly T[]>(
        variants: U & ([T] extends [U[number]] ? unknown : ["missing a variant of this section type"]),
    ): readonly T[] =>
        variants

/** Per-section-type variant lists, keyed by `LandingSection["type"]`. */
export const LANDING_SECTION_VARIANTS = {
    nav: variantsOf<MarketingNavVariant>()(["inline", "minimal"]),
    hero: variantsOf<MarketingHeroVariant>()([
        "centered-stack",
        "split-media",
        "statement",
        "form-first",
        "product-frame",
        "full-bleed-media",
        "panel-collage",
        "masthead-overlay",
    ]),
    "social-proof": variantsOf<MarketingSocialProofVariant>()([
        "text-logos",
        "metrics-row",
        "marquee",
        "ticker",
    ]),
    "feature-grid": variantsOf<MarketingFeatureGridVariant>()(["cards-3up", "icon-list", "bento"]),
    steps: variantsOf<MarketingStepsVariant>()(["numbered-cards", "timeline"]),
    testimonials: variantsOf<MarketingTestimonialsVariant>()(["quote-grid", "single-featured"]),
    pricing: variantsOf<MarketingPricingVariant>()(["tiers"]),
    faq: variantsOf<MarketingFaqVariant>()(["accordion"]),
    showcase: variantsOf<MarketingShowcaseVariant>()([
        "card-grid",
        "filterable-grid",
        "collections",
        "media-rail",
    ]),
    highlights: variantsOf<MarketingHighlightsVariant>()(["alternating", "stacked", "setlist"]),
    "content-split": variantsOf<MarketingContentSplitVariant>()(["media-right", "media-left"]),
    "rich-prose": variantsOf<MarketingRichProseVariant>()(["narrow", "two-column"]),
    "card-grid": variantsOf<MarketingCardGridVariant>()(["3up", "2up", "4up"]),
    carousel: variantsOf<MarketingCarouselVariant>()(["cards", "spotlight"]),
    gallery: variantsOf<MarketingGalleryVariant>()([
        "uniform",
        "masonry",
        "justified",
        "sequence",
        "filmstrip",
        "scrapbook",
        "before-after",
    ]),
    logos: variantsOf<MarketingLogosVariant>()(["strip", "grid"]),
    stats: variantsOf<MarketingStatsVariant>()(["row", "cards"]),
    comparison: variantsOf<MarketingComparisonVariant>()(["table", "cards"]),
    schedule: variantsOf<MarketingScheduleVariant>()(["week-grid", "day-rows"]),
    team: variantsOf<MarketingTeamVariant>()(["grid", "list", "portraits"]),
    "blog-list": variantsOf<MarketingBlogListVariant>()(["cards", "list"]),
    "cta-banner": variantsOf<MarketingCtaBannerVariant>()(["card", "full-bleed", "ticket"]),
    "lead-form": variantsOf<MarketingLeadFormVariant>()(["inline-email", "contact-block", "detail-form"]),
    footer: variantsOf<MarketingFooterVariant>()(["single-row"]),
} satisfies Record<LandingSectionType, readonly string[]>

/**
 * Shell footer variants — the chrome sibling of `marketingShellNavVariants`
 * (MarketingShell.tsx, which stays the nav list's one home). Same
 * append-only contract.
 */
export const MARKETING_SHELL_FOOTER_VARIANTS = variantsOf<MarketingShellFooterVariant>()([
    "simple",
    "multi-column",
    "newsletter",
])

/*
 * Composition rules, as data. These three records used to live as
 * imperative logic (the platform's remix engine, this repo's manifest
 * scaffolder) and prose (docs/landing.md) — declaring them here makes them
 * part of the same append-only vocabulary the variant lists are, so
 * data-driven composers (remix, design-space compose, the manifest
 * generator) read one source instead of re-encoding the rules. Same
 * lockstep contract as above: never remove a shipped entry.
 */

/**
 * Variants that only present well when the section has real media bound —
 * a composer must not choose one for a section without an image (a
 * full-bleed hero over a placeholder reads as broken, not bold).
 */
export const LANDING_MEDIA_DEPENDENT_VARIANTS: Partial<Record<LandingSectionType, readonly string[]>> = {
    hero: ["full-bleed-media", "masthead-overlay"],
}

/**
 * Variants whose presence proves the section already renders real media —
 * a section currently on one of these may roll into a media-dependent
 * variant even when the composer can't see the image binding itself.
 */
export const LANDING_MEDIA_EVIDENCE_VARIANTS: Partial<Record<LandingSectionType, readonly string[]>> = {
    hero: ["full-bleed-media", "split-media", "product-frame", "panel-collage", "masthead-overlay"],
}

/**
 * Variants that only present well when the section carries MULTIPLE media
 * items — rows and grids that degenerate at a single item (a one-photo
 * `justified` row is a spacer-orphaned thumbnail, not a layout). The
 * composed document never carries item counts, so composers use the same
 * evidence pattern as the media fields above: a seed authored on one of
 * these variants proves the content has 2+ items; a seed authored on a
 * single-safe variant (gallery's `sequence`) must not be rolled onto one
 * of these.
 */
export const LANDING_MULTI_MEDIA_VARIANTS: Partial<Record<LandingSectionType, readonly string[]>> = {
    gallery: ["uniform", "masonry", "justified", "filmstrip", "scrapbook", "before-after"],
}

/**
 * Variants whose content is SEMANTICALLY PAIRED — each item couples two
 * media slots that only this presentation can express (gallery's
 * `before-after`: a before frame + an after frame under a drag divider).
 * The pairing is a property of the CONTENT, not just the layout, so a
 * composer must keep a section on whichever side of the boundary its seed
 * sits: a section authored on a paired variant re-rolls only among paired
 * variants (its items carry `beforeMedia` that every other layout would
 * silently drop — the "two flat cards where the drag used to be" defect),
 * and a section authored on an unpaired variant never rolls INTO one (its
 * items carry no pairs for the comparison to reveal). With one member per
 * type today this pins `before-after` in place; the rule generalizes if a
 * second paired presentation ever ships.
 */
export const LANDING_PAIRED_MEDIA_VARIANTS: Partial<Record<LandingSectionType, readonly string[]>> = {
    gallery: ["before-after"],
}

/**
 * Where each section type sits in a page's narrative order. Composers keep
 * `leading` types at the front and `trailing` types at the back and only
 * arrange the `body` middle — a page that opens with its hero and closes
 * with its footer still reads as a page no matter how the middle varies.
 * (The legacy `nav`/`footer` section types are chrome; new work uses the
 * shell, but the roles cover them for documents that still carry them.)
 */
export const LANDING_SECTION_ORDER_ROLES = {
    nav: "leading",
    hero: "leading",
    "social-proof": "body",
    "feature-grid": "body",
    steps: "body",
    testimonials: "body",
    pricing: "body",
    faq: "body",
    showcase: "body",
    highlights: "body",
    "content-split": "body",
    "rich-prose": "body",
    "card-grid": "body",
    carousel: "body",
    gallery: "body",
    logos: "body",
    stats: "body",
    comparison: "body",
    schedule: "body",
    team: "body",
    "blog-list": "body",
    "cta-banner": "body",
    "lead-form": "body",
    footer: "trailing",
} satisfies Record<LandingSectionType, "leading" | "body" | "trailing">
