import {
    LANDING_SECTION_VARIANTS,
    type LandingSection,
    type MarketingAccentPlacement,
    type MarketingMedia,
} from "@ui"
import type { MarketingPageEntry, MarketingPageSectionEntry } from "../../Config/projectManifest"

/**
 * Maps a manifest page's `sections[]` scaffold (repobot.project.json,
 * docs/project-ia.md) to landing kernel sections, deterministically and at
 * runtime — the scaffold renders before any agent runs.
 *
 * The user's verbatim copy (headline/body/ctaLabel) and committed artwork
 * land exactly where each section type expects them; everything a section
 * needs beyond that renders as instructive placeholder copy, folding in the
 * section's `description` so the page reads as what it will become. The
 * content pass replaces placeholders but never reorders or drops the
 * user's sections.
 *
 * Unknown section types are skipped (older kernels meeting newer manifests
 * must not crash); unknown variants fall back to the type's default. The
 * legacy `nav`/`footer` types are also skipped — chrome comes from the
 * shell (docs/landing.md "Page chrome").
 */
export function sectionsFromManifest(page: MarketingPageEntry): LandingSection[] | undefined {
    const entries = page.sections ?? []
    if (entries.length === 0) {
        return undefined
    }
    const ctaAnchor = ctaAnchorTarget(entries)
    const secondaryAnchor = secondaryAnchorTarget(entries) ?? ctaAnchor
    const sections = entries
        .map((entry) => sectionFromEntry(entry, ctaAnchor, secondaryAnchor))
        .filter((section): section is LandingSection => section !== undefined)
    return sections.length > 0 ? sections : undefined
}

/**
 * Where scaffold CTAs point. Section types double as anchor ids
 * (LandingRenderer), so this is the page's lead-form when the scaffold has
 * one — otherwise the first content section, an honest "scroll to the
 * story" target. A scaffold without a lead-form must not ship CTAs anchored
 * to one: the dead link reads as a bug the content pass then has to
 * diagnose instead of just restyling.
 */
function ctaAnchorTarget(entries: MarketingPageSectionEntry[]): string | undefined {
    if (entries.some((entry) => entry.type === "lead-form")) {
        return "lead-form"
    }
    return entries.find((entry) => entry.type !== "hero" && entry.type !== "nav" && entry.type !== "footer")
        ?.type
}

/**
 * Where the hero's secondary CTA points: the page's story — the first
 * section that isn't the hero or the primary CTA's conversion target
 * (lead-form), so "See how it works" scrolls to the narrative instead of
 * doubling the primary's jump.
 */
function secondaryAnchorTarget(entries: MarketingPageSectionEntry[]): string | undefined {
    return entries.find(
        (entry) =>
            entry.type !== "hero" &&
            entry.type !== "nav" &&
            entry.type !== "footer" &&
            entry.type !== "lead-form",
    )?.type
}

/** Variants the kernel ships per type (the design system's runtime
 * vocabulary); anything else falls back to the type's default. */
const variantAllowlist: Record<string, readonly string[] | undefined> = LANDING_SECTION_VARIANTS

function knownVariant<T extends string>(entry: MarketingPageSectionEntry): T | undefined {
    const allowed = variantAllowlist[entry.type]
    return entry.variant !== undefined && allowed?.includes(entry.variant) ? (entry.variant as T) : undefined
}

/** The hero's accent grammar from the manifest, when it names a real one. */
function knownAccent(entry: MarketingPageSectionEntry): MarketingAccentPlacement | undefined {
    return (["last-word", "first-word", "none"] as const).find((value) => value === entry.accent)
}

function media(entry: MarketingPageSectionEntry): MarketingMedia | undefined {
    return entry.image !== undefined
        ? { kind: "image", src: entry.image, alt: entry.headline ?? entry.description ?? entry.type }
        : undefined
}

/** The section's rubric as visible placeholder copy, with a fallback instruction. */
function placeholder(entry: MarketingPageSectionEntry, instruction: string): string {
    return entry.description ?? instruction
}

/**
 * One manifest section entry to a kernel section with placeholder content.
 * Exported for the layout document's per-page merge (landingDocument.ts):
 * a section added there as a bare `{ type, variant }` renders through this
 * same scaffold path until the agent's content pass fills it in.
 */
export function sectionFromEntry(
    entry: MarketingPageSectionEntry,
    ctaAnchor: string | undefined,
    secondaryAnchor: string | undefined,
): LandingSection | undefined {
    const image = media(entry)
    switch (entry.type) {
        case "hero":
            return {
                type: "hero",
                variant: knownVariant(entry),
                content: {
                    headline: entry.headline ?? "Name the outcome this delivers",
                    ...(knownAccent(entry) !== undefined ? { accent: knownAccent(entry) } : {}),
                    // The badge and secondary CTA are setup-chosen design
                    // decisions (docs/project-ia.md): absent means bare, not
                    // "fall back to the stock flourishes" — re-injecting
                    // them here would flatten every scaffold back into the
                    // one house hero.
                    ...(entry.badge !== undefined ? { badge: entry.badge } : {}),
                    subheadline: entry.body ?? entry.description,
                    ...(entry.ctaLabel !== undefined
                        ? { primaryCta: { label: entry.ctaLabel, anchor: ctaAnchor } }
                        : {}),
                    ...(entry.secondaryCtaLabel !== undefined
                        ? {
                              secondaryCta: {
                                  label: entry.secondaryCtaLabel,
                                  anchor: secondaryAnchor,
                              },
                          }
                        : {}),
                    // Hero artwork is generated as scene art, so it renders as
                    // the full-bleed backdrop (copy over the scrim) — the
                    // art-directed default. The side-visual variants instead
                    // place it next to the copy: `product-frame` and
                    // `panel-collage` present it as a screenshot in browser
                    // chrome, `split-media` as-is.
                    ...(entry.image !== undefined
                        ? entry.variant === "product-frame" || entry.variant === "panel-collage"
                            ? {
                                  media: {
                                      kind: "browser" as const,
                                      src: entry.image,
                                      alt: entry.headline ?? entry.description ?? "Product screenshot",
                                  },
                              }
                            : entry.variant === "split-media"
                              ? { media: media(entry) }
                              : { backdrop: { src: entry.image } }
                        : {}),
                },
            }
        case "social-proof":
            return {
                type: "social-proof",
                variant: knownVariant(entry),
                content: {
                    label: entry.headline ?? "Trusted by",
                    items: [placeholder(entry, "The names that trust this")],
                },
            }
        case "feature-grid":
            return {
                type: "feature-grid",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline,
                    features: [
                        {
                            emoji: "✦",
                            title: "First feature",
                            description: placeholder(entry, "What it does for the visitor."),
                        },
                        { emoji: "✦", title: "Second feature", description: "What this one solves." },
                        { emoji: "✦", title: "Third feature", description: "The trust or speed angle." },
                    ],
                },
            }
        case "steps":
            return {
                type: "steps",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "How it works",
                    steps: [
                        { title: "Step one", description: placeholder(entry, "The first action.") },
                        { title: "Step two", description: "What happens next." },
                        { title: "Step three", description: "The outcome at the end." },
                    ],
                },
            }
        case "testimonials":
            return {
                type: "testimonials",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "What people say",
                    quotes: [
                        {
                            quote: placeholder(entry, "A short, specific quote from a real customer."),
                            author: "Customer name",
                        },
                        { quote: "A second voice on a different benefit.", author: "Customer name" },
                    ],
                },
            }
        case "pricing":
            return {
                type: "pricing",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "Pick what fits today",
                    tiers: [
                        {
                            name: "Starter",
                            monthly: 0,
                            yearlyPerMonth: 0,
                            description: "For trying it out.",
                            features: ["The core workflow"],
                        },
                        {
                            name: "Pro",
                            monthly: 19,
                            yearlyPerMonth: 15,
                            description: placeholder(entry, "For daily use."),
                            features: ["Everything in Starter"],
                            highlighted: true,
                        },
                    ],
                },
            }
        case "faq":
            return {
                type: "faq",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "Frequently asked",
                    items: [
                        {
                            question: "What should this answer?",
                            answer: placeholder(entry, "Real objections: cost, setup, cancellation."),
                        },
                        { question: "A second real objection", answer: "Its plain answer." },
                    ],
                },
            }
        case "showcase":
            return {
                type: "showcase",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "The work",
                    items: [
                        {
                            title: "First item",
                            description: placeholder(entry, "What belongs in this collection."),
                            ...(image !== undefined ? { media: image } : {}),
                        },
                        { title: "Second item", description: "Another entry." },
                        { title: "Third item", description: "Another entry." },
                    ],
                },
            }
        case "highlights":
            return {
                type: "highlights",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline,
                    highlights: [
                        {
                            headline: entry.headline ?? "The feature, one at a time",
                            body: entry.body ?? placeholder(entry, "Why this matters, told properly."),
                            ...(image !== undefined ? { media: image } : {}),
                        },
                    ],
                },
            }
        case "content-split":
            return {
                type: "content-split",
                variant: knownVariant(entry),
                content: {
                    headline: entry.headline ?? "One claim, told properly",
                    body: entry.body ?? placeholder(entry, "Two or three sentences backing it up."),
                    ...(entry.ctaLabel !== undefined
                        ? { cta: { label: entry.ctaLabel, anchor: ctaAnchor } }
                        : {}),
                    ...(image !== undefined ? { media: image } : {}),
                },
            }
        case "rich-prose":
            return {
                type: "rich-prose",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline,
                    paragraphs: [entry.body ?? placeholder(entry, "The long version, in real paragraphs.")],
                    // Prose artwork is band art: full-bleed behind the text.
                    ...(entry.image !== undefined ? { backdrop: { src: entry.image } } : {}),
                },
            }
        case "card-grid":
            return {
                type: "card-grid",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline,
                    cards: [
                        {
                            title: "First card",
                            body: placeholder(entry, "What's on offer here."),
                            ...(image !== undefined ? { media: image } : {}),
                        },
                        { title: "Second card", body: "Another entry." },
                        { title: "Third card", body: "Another entry." },
                    ],
                },
            }
        case "carousel":
            return {
                type: "carousel",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline,
                    slides: [
                        {
                            title: "First slide",
                            body: placeholder(entry, "What the lineup shows."),
                            ...(image !== undefined ? { media: image } : {}),
                        },
                        { title: "Second slide", body: "Another entry." },
                        { title: "Third slide", body: "Another entry." },
                    ],
                },
            }
        case "gallery":
            return {
                type: "gallery",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline,
                    items:
                        image !== undefined
                            ? [{ media: image, caption: entry.description }]
                            : [
                                  {
                                      media: { kind: "emoji", emoji: "🖼️" },
                                      caption: placeholder(entry, "Show, don't tell."),
                                  },
                                  { media: { kind: "emoji", emoji: "🖼️" } },
                                  { media: { kind: "emoji", emoji: "🖼️" } },
                              ],
                },
            }
        case "logos":
            return {
                type: "logos",
                variant: knownVariant(entry),
                content: {
                    kicker: entry.headline ?? "Trusted by",
                    logos: [
                        { name: "First name" },
                        { name: "Second name" },
                        { name: "Third name" },
                        { name: "Fourth name" },
                    ],
                },
            }
        case "stats":
            return {
                type: "stats",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline,
                    stats: [
                        { value: "—", label: placeholder(entry, "What this number counts") },
                        { value: "—", label: "A second proof point" },
                        { value: "—", label: "A third proof point" },
                    ],
                },
            }
        case "comparison":
            return {
                type: "comparison",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "How this compares",
                    columns: ["", "Us", "Others"],
                    rows: [
                        { label: placeholder(entry, "The first criterion"), values: [true, false] },
                        { label: "A second criterion", values: [true, false] },
                        { label: "A third criterion", values: [true, true] },
                    ],
                },
            }
        case "schedule":
            return {
                type: "schedule",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "The weekly schedule",
                    days: [
                        {
                            label: "Monday",
                            sessions: [
                                {
                                    time: "6:00 AM",
                                    title: placeholder(entry, "The first class"),
                                    detail: "Instructor",
                                },
                            ],
                        },
                        {
                            label: "Wednesday",
                            sessions: [{ time: "6:00 AM", title: "A second class", detail: "Instructor" }],
                        },
                        {
                            label: "Saturday",
                            sessions: [{ time: "9:00 AM", title: "The weekend class", detail: "Instructor" }],
                        },
                    ],
                },
            }
        case "team":
            return {
                type: "team",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "Who's behind this",
                    members: [
                        {
                            name: "Full name",
                            role: "Role",
                            bio: placeholder(entry, "One line on who they are."),
                            ...(image !== undefined ? { media: image } : {}),
                        },
                        { name: "Full name", role: "Role" },
                    ],
                },
            }
        case "blog-list":
            return {
                type: "blog-list",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "Latest writing",
                    posts: [
                        {
                            title: "First post title",
                            excerpt: placeholder(entry, "What the writing covers."),
                            href: "#",
                        },
                        { title: "Second post title", href: "#" },
                        { title: "Third post title", href: "#" },
                    ],
                },
            }
        case "cta-banner":
            return {
                type: "cta-banner",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "Ready when you are",
                    body: entry.body ?? entry.description,
                    cta: { label: entry.ctaLabel ?? "Get started", anchor: ctaAnchor },
                    // Banner artwork renders it as an edge-to-edge band.
                    ...(entry.image !== undefined ? { backdrop: { src: entry.image } } : {}),
                },
            }
        case "lead-form":
            return {
                type: "lead-form",
                variant: knownVariant(entry),
                content: {
                    title: entry.headline ?? "Stay in the loop",
                    ...(entry.body !== undefined || entry.description !== undefined
                        ? { body: entry.body ?? entry.description }
                        : {}),
                    placeholder: "you@example.com",
                    cta: entry.ctaLabel ?? "Join the list",
                    confirmation: "You're on the list — we'll be in touch soon.",
                },
            }
        default:
            // Unknown types (and the legacy nav/footer chrome) are skipped.
            return undefined
    }
}
