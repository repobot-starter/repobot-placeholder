import type { MarketingBlogListContent, MarketingBlogListVariant } from "./MarketingBlogList"
import type { MarketingCardGridContent, MarketingCardGridVariant } from "./MarketingCardGrid"
import type { MarketingCarouselContent, MarketingCarouselVariant } from "./MarketingCarousel"
import type { MarketingComparisonContent, MarketingComparisonVariant } from "./MarketingComparison"
import type { MarketingContentSplitContent, MarketingContentSplitVariant } from "./MarketingContentSplit"
import type { MarketingCtaBannerContent, MarketingCtaBannerVariant } from "./MarketingCtaBanner"
import type { MarketingFaqContent, MarketingFaqVariant } from "./MarketingFaq"
import type { MarketingFeatureGridContent, MarketingFeatureGridVariant } from "./MarketingFeatureGrid"
import type { MarketingFooterContent, MarketingFooterVariant } from "./MarketingFooter"
import type { MarketingGalleryContent, MarketingGalleryVariant } from "./MarketingGallery"
import type { MarketingHeroContent, MarketingHeroVariant } from "./MarketingHero"
import type { MarketingHighlightsContent, MarketingHighlightsVariant } from "./MarketingHighlights"
import type { MarketingLeadFormContent, MarketingLeadFormVariant } from "./MarketingLeadForm"
import type { MarketingLogosContent, MarketingLogosVariant } from "./MarketingLogos"
import type { MarketingNavContent, MarketingNavVariant } from "./MarketingNav"
import type { MarketingShellConfig } from "./MarketingShell"
import type { MarketingPricingContent, MarketingPricingVariant } from "./MarketingPricing"
import type { MarketingRichProseContent, MarketingRichProseVariant } from "./MarketingRichProse"
import type { MarketingScheduleContent, MarketingScheduleVariant } from "./MarketingSchedule"
import type { MarketingShowcaseContent, MarketingShowcaseVariant } from "./MarketingShowcase"
import type { MarketingSocialProofContent, MarketingSocialProofVariant } from "./MarketingSocialProof"
import type { MarketingStatsContent, MarketingStatsVariant } from "./MarketingStats"
import type { MarketingStepsContent, MarketingStepsVariant } from "./MarketingSteps"
import type { MarketingTeamContent, MarketingTeamVariant } from "./MarketingTeam"
import type { MarketingTestimonialsContent, MarketingTestimonialsVariant } from "./MarketingTestimonials"
import type { MarketingPresetName } from "./theme/marketingTheme.css"

/**
 * The landing kernel's composition contract: a whole page is one of these,
 * kept in a single typed file next to the app's `LandingRenderer` binder.
 * Section `type` names double as on-page anchor ids (`#pricing`, `#faq`),
 * so nav links work with zero configuration.
 *
 * The type/variant/preset names are public, append-only vocabulary shared
 * with the setup architect — see docs/landing-kernel-spec.md §8.
 */
type LandingSectionByType =
    | { type: "nav"; variant?: MarketingNavVariant; content: MarketingNavContent }
    | { type: "hero"; variant?: MarketingHeroVariant; content: MarketingHeroContent }
    | { type: "social-proof"; variant?: MarketingSocialProofVariant; content: MarketingSocialProofContent }
    | { type: "feature-grid"; variant?: MarketingFeatureGridVariant; content: MarketingFeatureGridContent }
    | { type: "steps"; variant?: MarketingStepsVariant; content: MarketingStepsContent }
    | { type: "testimonials"; variant?: MarketingTestimonialsVariant; content: MarketingTestimonialsContent }
    | { type: "pricing"; variant?: MarketingPricingVariant; content: MarketingPricingContent }
    | { type: "faq"; variant?: MarketingFaqVariant; content: MarketingFaqContent }
    | { type: "showcase"; variant?: MarketingShowcaseVariant; content: MarketingShowcaseContent }
    | { type: "highlights"; variant?: MarketingHighlightsVariant; content: MarketingHighlightsContent }
    | { type: "content-split"; variant?: MarketingContentSplitVariant; content: MarketingContentSplitContent }
    | { type: "rich-prose"; variant?: MarketingRichProseVariant; content: MarketingRichProseContent }
    | { type: "card-grid"; variant?: MarketingCardGridVariant; content: MarketingCardGridContent }
    | { type: "carousel"; variant?: MarketingCarouselVariant; content: MarketingCarouselContent }
    | { type: "gallery"; variant?: MarketingGalleryVariant; content: MarketingGalleryContent }
    | { type: "logos"; variant?: MarketingLogosVariant; content: MarketingLogosContent }
    | { type: "stats"; variant?: MarketingStatsVariant; content: MarketingStatsContent }
    | { type: "comparison"; variant?: MarketingComparisonVariant; content: MarketingComparisonContent }
    | { type: "schedule"; variant?: MarketingScheduleVariant; content: MarketingScheduleContent }
    | { type: "team"; variant?: MarketingTeamVariant; content: MarketingTeamContent }
    | { type: "blog-list"; variant?: MarketingBlogListVariant; content: MarketingBlogListContent }
    | { type: "cta-banner"; variant?: MarketingCtaBannerVariant; content: MarketingCtaBannerContent }
    | { type: "lead-form"; variant?: MarketingLeadFormVariant; content: MarketingLeadFormContent }
    | { type: "footer"; variant?: MarketingFooterVariant; content: MarketingFooterContent }

/**
 * A section, optionally carrying a stable `id` — the handle the layout
 * document (`repobot.landing.json`) uses to bind its skeleton entries to
 * this section's code-side content. When `id` is absent it defaults to the
 * section's `type`, which is unambiguous as long as the type appears once
 * in the config; give explicit ids to duplicate-type sections.
 */
export type LandingSection = LandingSectionByType & { id?: string }

export type LandingSectionType = LandingSection["type"]

export interface LandingStyle {
    preset: MarketingPresetName
    /** Targeted `--marketing-*` variable overrides at the page root. */
    overrides?: Record<string, string>
}

export interface LandingConfig {
    style: LandingStyle
    /**
     * Page chrome — sticky top nav and footer — rendered around the section
     * stream by `MarketingShell`. Pre-shell configs instead carry `nav` /
     * `footer` sections, which stay renderable for back-compat; new
     * scaffolds emit shell config.
     */
    shell?: MarketingShellConfig
    sections: LandingSection[]
}
