import {
    MarketingBlogList,
    MarketingCardGrid,
    MarketingCarousel,
    MarketingComparison,
    MarketingContentSplit,
    MarketingCtaBanner,
    MarketingFaq,
    MarketingFeatureGrid,
    MarketingFooter,
    MarketingGallery,
    MarketingHero,
    MarketingHighlights,
    MarketingLeadForm,
    MarketingLogos,
    MarketingNav,
    MarketingPage,
    MarketingPricing,
    MarketingRichProse,
    MarketingSchedule,
    MarketingShell,
    MarketingShowcase,
    MarketingSocialProof,
    MarketingStats,
    MarketingSteps,
    MarketingTeam,
    MarketingTestimonials,
    type LandingConfig,
    type LandingSection,
} from "@ui"
import { submitForm } from "@base/core"
import React, { useState } from "react"

const DEFAULT_LEAD_KEY = "landing-lead-email"
const DEFAULT_LEAD_FORM_KEY = "inquiry"

export interface LandingRendererProps {
    config: LandingConfig
    /** localStorage key for the pre-deploy lead-capture fallback. */
    leadStorageKey?: string
    /** The managed-forms key lead submissions post under (default "inquiry"). */
    leadFormKey?: string
    /**
     * Bespoke blocks rendered directly AFTER a matching section, inside the
     * shell (keyed by the section's id, falling back to its type) — how a
     * pack mounts an interactive companion under a kernel section without
     * re-composing the whole page: the fitness packs hang the booking
     * widget under "schedule" this way.
     */
    sectionTrailers?: Record<string, React.ReactNode>
}

/**
 * The landing kernel binder: maps a `LandingConfig` to marketing sections
 * and owns the page-level runtime concerns — the style preset scope and
 * lead-capture delivery. Section types double as anchor ids, so nav links
 * like `{ anchor: "pricing" }` need no wiring.
 *
 * Lead capture posts through the managed forms pipeline (same-origin
 * /__forms/submit — see docs/landing.md): on a deployed site the owner gets
 * an email and a dashboard entry with zero setup. Outside a deploy (sandbox
 * dev server) the client falls back to a localStorage write, so the submit
 * interaction always completes. Full-stack apps that want submissions in
 * their own database can still point `join` at a mutation instead
 * (docs/adding-a-domain.md).
 */
export function LandingRenderer({
    config,
    leadStorageKey = DEFAULT_LEAD_KEY,
    leadFormKey = DEFAULT_LEAD_FORM_KEY,
    sectionTrailers,
}: LandingRendererProps): React.ReactElement {
    const [joined, setJoined] = useState(() => localStorage.getItem(leadStorageKey) !== null)

    const join = (email: string, details?: Record<string, string>): void => {
        // Optimistic: the confirmation state flips immediately; submitForm
        // never throws and falls back to localStorage when undeliverable.
        // The fallback record lives beside the joined marker (not on it):
        // leadStorageKey always holds the plain email — that's the kernel's
        // pinned promise — while the structured submission keeps its own key.
        void submitForm({
            formKey: leadFormKey,
            fields:
                details !== undefined && Object.keys(details).length > 0 ? { email, ...details } : { email },
            fallbackStorageKey: `${leadStorageKey}.submission`,
        })
        localStorage.setItem(leadStorageKey, email)
        setJoined(true)
    }

    return (
        <MarketingPage preset={config.style.preset} overrides={config.style.overrides}>
            <MarketingShell
                nav={config.shell?.nav}
                footer={config.shell?.footer}
                newsletterJoined={joined}
                onNewsletterSubmit={join}
            >
                {config.sections.map((section, index) => (
                    // Section identity for the platform's preview editor: the
                    // wrapper carries which manifest section rendered here so
                    // hit-testing can resolve a DOM point to a section (the
                    // anchor id inside is the *type*, which collides for
                    // duplicates). display:contents generates no box, so the
                    // wrapper is invisible to layout and CSS; tools that need
                    // its geometry read the first element child's rect.
                    <div
                        key={`${section.type}-${index}`}
                        style={{ display: "contents" }}
                        data-rb-section={section.id ?? section.type}
                        data-rb-section-type={section.type}
                        data-rb-section-index={index}
                        // The rendered layout variant, for the platform's
                        // layout chooser to mark current. Absent when neither
                        // the document nor the code config declares one (the
                        // component's own default renders).
                        {...(section.variant !== undefined
                            ? { "data-rb-section-variant": section.variant }
                            : {})}
                    >
                        <LandingSectionView section={section} joined={joined} onJoin={join} />
                        {sectionTrailers?.[section.id ?? section.type]}
                    </div>
                ))}
            </MarketingShell>
        </MarketingPage>
    )
}

/**
 * One registered section, rendered. Exported for pack pages that compose
 * bespoke blocks (an audio player, a countdown) BETWEEN kernel sections:
 * they render MarketingPage/MarketingShell themselves and map their kernel
 * sections through this view, so the section vocabulary stays one
 * implementation however a page interleaves it.
 */
export function LandingSectionView({
    section,
    joined,
    onJoin,
}: {
    section: LandingSection
    joined: boolean
    onJoin: (email: string) => void
}): React.ReactElement {
    const anchorId = section.type
    switch (section.type) {
        case "nav":
            return <MarketingNav variant={section.variant} anchorId={anchorId} {...section.content} />
        case "hero":
            return (
                <MarketingHero
                    variant={section.variant}
                    anchorId={anchorId}
                    {...section.content}
                    formJoined={joined}
                    onFormSubmit={onJoin}
                />
            )
        case "social-proof":
            return <MarketingSocialProof variant={section.variant} anchorId={anchorId} {...section.content} />
        case "feature-grid":
            return <MarketingFeatureGrid variant={section.variant} anchorId={anchorId} {...section.content} />
        case "steps":
            return <MarketingSteps variant={section.variant} anchorId={anchorId} {...section.content} />
        case "testimonials":
            return (
                <MarketingTestimonials variant={section.variant} anchorId={anchorId} {...section.content} />
            )
        case "pricing":
            return <MarketingPricing variant={section.variant} anchorId={anchorId} {...section.content} />
        case "faq":
            return <MarketingFaq variant={section.variant} anchorId={anchorId} {...section.content} />
        case "showcase":
            return <MarketingShowcase variant={section.variant} anchorId={anchorId} {...section.content} />
        case "highlights":
            return <MarketingHighlights variant={section.variant} anchorId={anchorId} {...section.content} />
        case "content-split":
            return (
                <MarketingContentSplit variant={section.variant} anchorId={anchorId} {...section.content} />
            )
        case "rich-prose":
            return <MarketingRichProse variant={section.variant} anchorId={anchorId} {...section.content} />
        case "card-grid":
            return <MarketingCardGrid variant={section.variant} anchorId={anchorId} {...section.content} />
        case "carousel":
            return <MarketingCarousel variant={section.variant} anchorId={anchorId} {...section.content} />
        case "gallery":
            return <MarketingGallery variant={section.variant} anchorId={anchorId} {...section.content} />
        case "logos":
            return <MarketingLogos variant={section.variant} anchorId={anchorId} {...section.content} />
        case "stats":
            return <MarketingStats variant={section.variant} anchorId={anchorId} {...section.content} />
        case "comparison":
            return <MarketingComparison variant={section.variant} anchorId={anchorId} {...section.content} />
        case "schedule":
            return <MarketingSchedule variant={section.variant} anchorId={anchorId} {...section.content} />
        case "team":
            return <MarketingTeam variant={section.variant} anchorId={anchorId} {...section.content} />
        case "blog-list":
            return <MarketingBlogList variant={section.variant} anchorId={anchorId} {...section.content} />
        case "cta-banner":
            return <MarketingCtaBanner variant={section.variant} anchorId={anchorId} {...section.content} />
        case "lead-form":
            return (
                <MarketingLeadForm
                    variant={section.variant}
                    anchorId={anchorId}
                    {...section.content}
                    joined={joined}
                    onSubmit={onJoin}
                />
            )
        case "footer":
            return <MarketingFooter variant={section.variant} anchorId={anchorId} {...section.content} />
    }
}
