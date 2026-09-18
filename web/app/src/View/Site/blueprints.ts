import { marketingShellNavVariants } from "@ui"
import type {
    LandingConfig,
    LandingSection,
    MarketingAccentPlacement,
    MarketingBackdropArt,
    MarketingCta,
    MarketingHeroContent,
    MarketingPresetName,
    MarketingShellConfig,
    MarketingShellNavVariant,
} from "@ui"
import type { MarketingPageBlueprint, MarketingPageEntry } from "../../Config/projectManifest"
import { projectManifest } from "../../Config/projectManifest"
import { packSiteChrome } from "./packShell"
import { sectionsFromManifest } from "./sectionsFromManifest"

/**
 * Default `LandingConfig` builders for the marketing page blueprints in
 * `repobot.project.json` (docs/project-ia.md). Each builder produces a
 * complete, presentable page from just `{ title, description }` using the
 * landing kernel vocabulary (docs/landing.md) — placeholder copy the agent
 * replaces during the content pass. Cross-page nav links derive from the
 * manifest's page list, so adding a page rewires every nav automatically.
 *
 * A page's `seed` — the copy and hero image the user wrote during setup —
 * renders verbatim over the placeholders (`seededHero`, `seedKeyPoints`):
 * the user's words appear before any agent runs, and the agent's content
 * pass builds around them instead of inventing.
 *
 * A page with an inline `landing` config bypasses these builders entirely
 * (`landingConfigForPage`); that is the editing surface for custom pages.
 */

interface BlueprintContext {
    page: MarketingPageEntry
    /** All manifest pages, for cross-page nav links. */
    pages: MarketingPageEntry[]
    /** Brand name for nav logos and copy. */
    siteName: string
    /** The site's style preset — blueprints art-direct around it. */
    preset: MarketingPresetName
}

/**
 * Per-preset art direction for the landing blueprint. One shared skeleton
 * wearing eight presets used to produce eight near-identical pages —
 * hero variant, backdrop art, accent grammar, badge, CTA pairing, and
 * section variants now follow the preset's character, so the untouched
 * skeleton already looks like a decision. Media-led hero variants only
 * apply when the seed carries a hero image; an empty split reads as a
 * mistake, not a style.
 */
interface LandingDirection {
    heroVariant: "centered-stack" | "split-media" | "statement"
    /** Generated art behind the landing hero (zero-asset, accent-keyed). */
    heroBackdrop?: MarketingBackdropArt
    /** Where the headline's accent word lands; `none` is pure typography. */
    heroAccent: MarketingAccentPlacement
    /** The pill above the headline; omitted registers read cleaner bare. */
    heroBadge?: string
    /** Whether a secondary CTA rides beside the primary. */
    heroSecondaryCta: boolean
    featureVariant: "cards-3up" | "icon-list"
    stepsVariant: "numbered-cards" | "timeline"
    /**
     * The contact page's form lean: a quick email capture, or the
     * multi-field inquiry form (name/email/company/message). The
     * contact-block variant needs real channels, so only a manifest
     * section (or the agent) chooses it.
     */
    leadFormVariant: "inline-email" | "detail-form"
}

const LANDING_DIRECTIONS: Record<MarketingPresetName, LandingDirection> = {
    "dark-dev": {
        heroVariant: "centered-stack",
        heroBackdrop: "aurora",
        heroAccent: "last-word",
        heroBadge: "Now in early access",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    "soft-saas": {
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroBadge: "Now in early access",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    editorial: {
        // Magazine grammar: the sentence opens on the accent, no pill, one
        // decisive CTA — the typography is the art direction.
        heroVariant: "statement",
        heroAccent: "first-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    brutalist: {
        // Raw ink: no accent color in the headline, no badge, one CTA.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    "warm-boutique": {
        // Sunlit warmth sells itself — the launch-status pill reads salesy.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    "mono-utility": {
        // Spec-sheet restraint: monospace type carries the page bare.
        heroVariant: "centered-stack",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "inline-email",
    },
    "aurora-dark": {
        heroVariant: "centered-stack",
        heroBackdrop: "aurora",
        heroAccent: "last-word",
        heroBadge: "Now in early access",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    "luxe-light": {
        heroVariant: "centered-stack",
        heroBackdrop: "beams",
        heroAccent: "last-word",
        heroBadge: "Now in early access",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    atelier: {
        // Gallery quiet: bare tracked type, no badge, no accent word, one
        // CTA — the page recedes so imagery carries the register. Without
        // a seed image the statement hero holds the wall on type alone.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    heirloom: {
        // Invitation grammar: the serif statement opens like a save-the-date,
        // the closing word set in the register's italic flourish, no pill,
        // one quiet CTA — warmth comes from the paper and the type, never
        // from launch-page dressing.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    tourbook: {
        // Expedition masthead: the uppercase statement is the cover of the
        // tour book; the closing word is set in ink. (The
        // media-led masthead-overlay needs a seed photograph, so the
        // blueprint holds the type-only reading.)
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    monolith: {
        // Monumental type IS the page: the statement at the register's
        // display scale, the closing word stroke-only (the outline
        // treatment), no pill, no second ask, everything ruled in
        // hairlines.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "inline-email",
    },
    lanternlight: {
        // The marquee over the night: serif statement with the italic
        // flourish on the close, one CTA — the white string-light glow
        // and the midnight paper carry the celebration.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    sitework: {
        // Jobsite signage: the split hero shows the work beside stenciled
        // uppercase lettering, the closing word in safety orange. Two
        // asks — trades convert on the call as much as the quote form.
        heroVariant: "split-media",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    brownstone: {
        // The listing sheet opens on the serif statement, the closing
        // word in the register's italic; one quiet CTA — photography
        // carries the register, so the type-only blueprint stays reserved.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    marquee: {
        // The playbill opens on the uppercase statement, the closing word
        // in the register's italic; one CTA — the photographs are the
        // show, so the type-only blueprint stays a title card.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    chalk: {
        // The whiteboard wall: stenciled uppercase statement, no accent
        // word (the monochrome registers read cleaner bare), one hard
        // chalk-plate CTA.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    hymnal: {
        // The midnight service opens on the monumental uppercase
        // statement, the closing word in candle amber — one CTA, ruled in
        // hairlines. Reverence through boldness; the type preaches.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    ballroom: {
        // The engraved invitation: the monumental serif statement with the
        // italic flourish on the close, no pill, one gold-plate ask —
        // the spotlight sweep and the hairline frames carry the evening.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "detail-form",
    },
    picnic: {
        // The party flyer: friendly rounded type front and center, two
        // asks (a party converts on "I'm in" and "tell me more" alike),
        // numbered cards like games on the lawn.
        heroVariant: "centered-stack",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
    broadside: {
        // The poster opens on the masthead statement, bare — uppercase
        // display past the monumental ceiling wants no accent word or
        // badge chrome, the way a bill names the band and nothing else.
        heroVariant: "statement",
        heroAccent: "none",
        heroSecondaryCta: true,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "inline-email",
    },
    crt: {
        // The prompt: centered mono type on the tube, the closing word in
        // phosphor — no pill, one command. Terminals list, so features
        // read as `ls` output and steps as a session transcript.
        heroVariant: "centered-stack",
        heroAccent: "last-word",
        heroSecondaryCta: false,
        featureVariant: "icon-list",
        stepsVariant: "timeline",
        leadFormVariant: "inline-email",
    },
    handheld: {
        // The title screen: chunky uppercase mono, centered like a boot
        // logo, no accent word (four shades of one green — the accent IS
        // the ink), features as cartridge cards, steps as numbered levels.
        heroVariant: "centered-stack",
        heroAccent: "none",
        heroSecondaryCta: false,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    lounge: {
        // The night lounge opens on the statement with the closing word in
        // the accent's glow; two asks — play now, browse the catalog.
        heroVariant: "statement",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "inline-email",
    },
    retroware: {
        // The welcome dialog: centered copy over the accent-washed
        // desktop, the closing word in hyperlink accent, two beveled
        // buttons (OK and the second ask), features as dialog cards.
        heroVariant: "centered-stack",
        heroAccent: "last-word",
        heroSecondaryCta: true,
        featureVariant: "cards-3up",
        stepsVariant: "numbered-cards",
        leadFormVariant: "detail-form",
    },
}

/**
 * The shared page chrome: sticky nav and footer, derived from the manifest's
 * page list so adding a page rewires every nav automatically. The current
 * page drops out of its own links. Variants come from the manifest's
 * `marketing.shell` (chosen during setup); unknown or absent nav values fall
 * back to the preset's nav lean (`NAV_VARIANT_BY_PRESET`), then the theme
 * contract's `navigation.variant` (`repobot.theme.json`, resolved inside
 * `MarketingShell`), then `full-width`; footers fall back to `simple`.
 */
/**
 * The preset's nav lean — the chrome is part of the register's art
 * direction, not one band every site wears. The translucent full-width
 * band (the kernel default) is a tech-product treatment, so the dark
 * tech registers keep it; the others carry the bar treatment their
 * character asks for: brutalist's hard rules and warm-boutique's sunlit
 * warmth want the contained inline card, editorial wants the squared
 * ruled bar, soft-saas the friendly pill cluster, and luxe-light the
 * centered-logo masthead. A manifest-pinned `navVariant` still wins.
 */
const NAV_VARIANT_BY_PRESET: Partial<Record<MarketingPresetName, MarketingShellNavVariant>> = {
    brutalist: "inline",
    "warm-boutique": "inline",
    editorial: "split",
    "soft-saas": "pill-links",
    "luxe-light": "centered",
    // The gallery register wants the quiet centered masthead.
    atelier: "centered",
    // The stationery register reads as a letterhead: wordmark on the left,
    // links ruled off to the right — deliberately apart from atelier's
    // centered gallery masthead.
    heirloom: "split",
    // The tour book opens on a centered masthead, like a poster's title
    // block; lanternlight's marquee reads the same way. Monolith keeps the
    // kernel's translucent full-width band — the dark tech treatment.
    tourbook: "centered",
    lanternlight: "centered",
    // The trades register hangs its nav like a shop sign: the contained
    // inline card, same lean as warm-boutique's counter.
    sitework: "inline",
    // The residential register reads as a letterhead — the agency name on
    // the left, links ruled off to the right, heirloom's lean.
    brownstone: "split",
    // The stage register wants maximal dark: the burger overlay keeps the
    // chrome to a wordmark so the full-bleed frames own the viewport.
    marquee: "burger-overlay",
    // The gala opens on a centered masthead like the program at the door;
    // the picnic wears the friendly pill cluster — name tags on a string,
    // not another contained card.
    ballroom: "centered",
    picnic: "pill-links",
    // The training-floor register hangs its links like the club rules
    // board: squared ruled bar, the free-trial CTA a size up.
    chalk: "split",
    // The midnight-service register hangs its nav like a venue's bar:
    // squared ruled band, the Give CTA a size up on the right.
    hymnal: "split",
    // The poster register rules its nav off like the imprint line at the
    // foot of a bill: squared split bar, ink hairline underneath, the CTA
    // a size up — conversion chrome that still reads as print.
    broadside: "split",
    // The terminal hangs its links like a status bar: wordmark left,
    // links ruled off right — a tmux bar, not a marketing band.
    crt: "split",
    // The handheld's nav is a cartridge label: the contained inline card.
    handheld: "inline",
    // The lounge wears the pill cluster — playlist chips on the rail.
    lounge: "pill-links",
    // The silver machine's nav is a title bar: wordmark left, links
    // right, ruled off in chrome.
    retroware: "split",
}

function shellForContext(context: BlueprintContext): MarketingShellConfig {
    const links: MarketingCta[] = context.pages
        .filter((page) => page.id !== context.page.id)
        .map((page) => ({ label: page.title, href: page.path }))
    // An app-shaped project surfaces its app from the marketing chrome: the
    // nav CTA becomes the first declared dashboard destination (the saas
    // pack's "Sign in" precedent, and the same landing postAuthRoutePath
    // gives sign-ins), so a scaffolded dashboard is one click from the site
    // home — never a route the visitor must know to type. ProtectedRoutes
    // bounces through /login and back when the visitor isn't signed in.
    const appEntry = projectManifest.dashboard.destinations[0]
    const appEntryCta: MarketingCta | undefined =
        appEntry !== undefined ? { label: appEntry.label, href: appEntry.path } : undefined
    const shell = projectManifest.marketing.shell
    const navVariant =
        marketingShellNavVariants.find((variant) => variant === shell?.navVariant) ??
        NAV_VARIANT_BY_PRESET[context.preset]
    const footerVariant = (["simple", "multi-column", "newsletter"] as const).find(
        (variant) => variant === shell?.footerVariant,
    )
    const note = `© ${new Date().getFullYear()} ${context.siteName}`
    return {
        nav: {
            ...(navVariant !== undefined ? { variant: navVariant } : {}),
            content: {
                // The committed brand logo (setup stamps marketing.brand
                // when the user uploads one) rides every derived nav, so
                // manifest pages carry the real mark with no hand-wiring.
                logo: {
                    name: context.siteName,
                    ...(projectManifest.marketing.brand?.logo
                        ? { imageSrc: projectManifest.marketing.brand.logo }
                        : {}),
                },
                links,
                cta: appEntryCta ?? primaryAction(context),
            },
        },
        footer: {
            variant: footerVariant ?? "simple",
            content:
                footerVariant === "multi-column" || footerVariant === "newsletter"
                    ? {
                          blurb: context.siteName,
                          columns: links.length > 0 ? [{ title: "Pages", links }] : [],
                          note,
                          ...(footerVariant === "newsletter"
                              ? {
                                    newsletter: {
                                        title: "Stay in the loop",
                                        placeholder: "you@example.com",
                                        cta: "Subscribe",
                                        confirmation: "Thanks — you're on the list.",
                                    },
                                }
                              : {}),
                      }
                    : {
                          blurb: context.siteName,
                          links: appEntryCta !== undefined ? [...links, appEntryCta] : links,
                          note,
                      },
        },
    }
}

/** The nav CTA: the contact page when one exists, else the on-page lead form. */
function primaryAction(context: BlueprintContext): MarketingCta {
    const contact = context.pages.find((page) => page.blueprint === "contact" && page.id !== context.page.id)
    if (contact !== undefined) {
        return { label: "Get in touch", href: contact.path }
    }
    return { label: "Get started", anchor: "lead-form" }
}

/**
 * The blueprint's default hero with every `seed` field the user wrote
 * applied over it: headline, subheadline, and primary-CTA label replace the
 * placeholders; a pinned hero image fills the hero's media slot (each
 * variant places media sensibly, so the variant itself stays).
 */
function seededHero(
    page: MarketingPageEntry,
    variant: "centered-stack" | "split-media" | "statement" | "form-first" | "product-frame",
    content: MarketingHeroContent,
): LandingSection {
    const seed = page.seed
    return {
        type: "hero",
        variant,
        content: {
            ...content,
            ...(seed?.headline !== undefined ? { headline: seed.headline } : {}),
            ...(seed?.subheadline !== undefined ? { subheadline: seed.subheadline } : {}),
            ...(seed?.ctaLabel !== undefined && content.primaryCta !== undefined
                ? { primaryCta: { ...content.primaryCta, label: seed.ctaLabel } }
                : {}),
            ...(seed?.heroImage !== undefined
                ? { media: { kind: "image" as const, src: seed.heroImage, alt: page.title } }
                : {}),
        },
    }
}

/**
 * The user's key points as a section of their own — rendered as written,
 * replacing (landing) or joining (other blueprints) the placeholder
 * sections. Undefined when the seed has none.
 */
function seedKeyPoints(page: MarketingPageEntry): LandingSection | undefined {
    const bullets = page.seed?.bullets ?? []
    if (bullets.length === 0) {
        return undefined
    }
    return {
        type: "feature-grid",
        variant: "icon-list",
        content: {
            kicker: "On this page",
            features: bullets.slice(0, 8).map((bullet) => ({
                emoji: "✦",
                title: bullet,
                description: "",
            })),
        },
    }
}

function landingBlueprint(context: BlueprintContext): LandingSection[] {
    const { page, siteName } = context
    const keyPoints = seedKeyPoints(page)
    const direction = LANDING_DIRECTIONS[context.preset]
    // Media-led heroes need media: without a seed image, fall back to the
    // centered stack instead of rendering a lopsided empty split.
    const heroVariant =
        direction.heroVariant === "split-media" && page.seed?.heroImage === undefined
            ? "centered-stack"
            : direction.heroVariant
    const hero = seededHero(page, heroVariant, {
        ...(direction.heroBadge !== undefined ? { badge: direction.heroBadge } : {}),
        headline: `Meet ${siteName}`,
        accent: direction.heroAccent,
        subheadline: page.description ?? "One clear sentence about who this helps and how.",
        primaryCta: primaryAction(context),
        ...(direction.heroSecondaryCta
            ? { secondaryCta: { label: "See how it works", anchor: "steps" } }
            : {}),
        // Generated art keyed to the theme accent — the skeleton's hero is
        // never a flat page even before any asset exists. A seeded hero
        // image supersedes it (seededHero fills the media slot; art stays
        // behind as ground).
        ...(direction.heroBackdrop !== undefined ? { backdrop: { art: direction.heroBackdrop } } : {}),
    })
    return [
        hero,
        // The user's own points replace the placeholder pitch wholesale.
        keyPoints ?? {
            type: "feature-grid",
            variant: direction.featureVariant,
            content: {
                kicker: "Why it works",
                title: "Built around three things",
                features: [
                    {
                        emoji: "⚡",
                        title: "Fast to start",
                        description: "Describe the first thing people get value from, in one sentence.",
                    },
                    {
                        emoji: "🎯",
                        title: "Focused by design",
                        description: "Describe what this does better than the way people do it today.",
                    },
                    {
                        emoji: "🔒",
                        title: "Yours to keep",
                        description: "Describe the trust angle — privacy, ownership, or reliability.",
                    },
                ],
            },
        },
        {
            type: "steps",
            variant: direction.stepsVariant,
            content: {
                kicker: "How it works",
                title: "Three steps, no setup",
                steps: [
                    {
                        title: "Sign up",
                        description: "What the very first action is and how little it asks for.",
                    },
                    {
                        title: "Set it up",
                        description: "What happens next and why it takes minutes, not days.",
                    },
                    {
                        title: "See results",
                        description: "The outcome — what the user has at the end of day one.",
                    },
                ],
            },
        },
        {
            type: "lead-form",
            content: {
                kicker: "Stay in the loop",
                title: "Get early access",
                placeholder: "you@example.com",
                cta: "Join the list",
                confirmation: "You're on the list — we'll be in touch soon.",
            },
        },
    ]
}

/** The preset's accent grammar, shared by every page of the site. */
function accentForContext(context: BlueprintContext): MarketingAccentPlacement {
    return LANDING_DIRECTIONS[context.preset].heroAccent
}

function pricingBlueprint(context: BlueprintContext): LandingSection[] {
    const keyPoints = seedKeyPoints(context.page)
    return [
        seededHero(context.page, "statement", {
            headline: "Pricing that stays out of the way",
            accent: accentForContext(context),
            subheadline: context.page.description ?? "Start free, upgrade when it earns it.",
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "pricing",
            content: {
                kicker: "Plans",
                title: "Pick what fits today",
                tiers: [
                    {
                        name: "Starter",
                        monthly: 0,
                        yearlyPerMonth: 0,
                        description: "For trying it out.",
                        features: ["The core workflow", "One project", "Community support"],
                    },
                    {
                        name: "Pro",
                        monthly: 19,
                        yearlyPerMonth: 15,
                        description: "For daily use.",
                        features: ["Everything in Starter", "Unlimited projects", "Priority support"],
                        highlighted: true,
                        badge: "Most popular",
                    },
                    {
                        name: "Team",
                        monthly: 49,
                        yearlyPerMonth: 39,
                        description: "For working together.",
                        features: ["Everything in Pro", "Shared workspaces", "Admin controls"],
                    },
                ],
            },
        },
        {
            type: "faq",
            content: {
                kicker: "Billing",
                title: "Common questions",
                items: [
                    {
                        question: "Can I change plans later?",
                        answer: "Yes — upgrades and downgrades apply at the next billing cycle.",
                    },
                    {
                        question: "Is there a free trial?",
                        answer: "The Starter plan is free forever; paid plans start when you choose one.",
                    },
                    {
                        question: "How do I cancel?",
                        answer: "From your account settings, any time. Your data stays exportable.",
                    },
                ],
            },
        },
        {
            type: "cta-banner",
            content: {
                title: "Ready when you are",
                body: "Start on the free plan — no card required.",
                cta: primaryAction(context),
            },
        },
    ]
}

function aboutBlueprint(context: BlueprintContext): LandingSection[] {
    const { page, siteName } = context
    const keyPoints = seedKeyPoints(page)
    return [
        seededHero(page, "statement", {
            headline: `The story behind ${siteName}`,
            accent: accentForContext(context),
            subheadline: page.description ?? "Two or three sentences on why this exists and who builds it.",
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "steps",
            content: {
                kicker: "What we value",
                title: "How we work",
                steps: [
                    {
                        title: "Keep it simple",
                        description: "A principle about the product — what you refuse to complicate.",
                    },
                    {
                        title: "Earn trust",
                        description: "A principle about the relationship — support, privacy, honesty.",
                    },
                    {
                        title: "Ship steadily",
                        description: "A principle about the craft — how improvements actually arrive.",
                    },
                ],
            },
        },
        {
            type: "cta-banner",
            content: {
                title: "Come say hello",
                body: "Questions, ideas, or just curious — we read everything.",
                cta: primaryAction(context),
            },
        },
    ]
}

function contactBlueprint(context: BlueprintContext): LandingSection[] {
    const { page, siteName } = context
    const keyPoints = seedKeyPoints(page)
    // The form itself follows the preset's lean: a quick email capture for
    // product registers, the multi-field inquiry form (detail-form) for
    // registers whose contact page reads like a conversation opener.
    const variant = LANDING_DIRECTIONS[context.preset].leadFormVariant
    return [
        seededHero(page, "statement", {
            headline: `Talk to ${siteName}`,
            accent: accentForContext(context),
            subheadline:
                page.description ??
                (variant === "detail-form"
                    ? "Tell us a little about what you need and we'll get back to you within a day."
                    : "Leave your email and we'll get back to you within a day."),
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "lead-form",
            variant,
            content: {
                title: "Send us a note",
                placeholder: "you@example.com",
                cta: "Send",
                confirmation: "Thanks — we'll be in touch shortly.",
            },
        },
    ]
}

function faqBlueprint(context: BlueprintContext): LandingSection[] {
    const keyPoints = seedKeyPoints(context.page)
    return [
        seededHero(context.page, "statement", {
            headline: "Questions, answered",
            accent: accentForContext(context),
            subheadline: context.page.description ?? "Everything people usually ask before they start.",
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "faq",
            content: {
                title: "Frequently asked",
                items: [
                    {
                        question: "What is this?",
                        answer: "One plain-language sentence describing the product.",
                    },
                    {
                        question: "Who is it for?",
                        answer: "The audience and the situation where it fits best.",
                    },
                    {
                        question: "How much does it cost?",
                        answer: "The one-line pricing answer, with a pointer to the pricing page.",
                    },
                    {
                        question: "How do I get help?",
                        answer: "Where support lives and how quickly it responds.",
                    },
                ],
            },
        },
        {
            type: "cta-banner",
            content: {
                title: "Still curious?",
                body: "The fastest way to find out is to try it.",
                cta: primaryAction(context),
            },
        },
    ]
}

function customBlueprint(context: BlueprintContext): LandingSection[] {
    const { page } = context
    const keyPoints = seedKeyPoints(page)
    return [
        seededHero(page, "statement", {
            headline: page.title,
            accent: accentForContext(context),
            subheadline: page.description ?? "Describe this page in a sentence, then compose its sections.",
            ...(page.seed?.ctaLabel !== undefined ? { primaryCta: primaryAction(context) } : {}),
        }),
        ...(keyPoints !== undefined ? [keyPoints] : []),
        {
            type: "cta-banner",
            content: {
                title: "This page is a starting point",
                body: "Replace it with real sections from the landing kernel vocabulary.",
                cta: primaryAction(context),
            },
        },
    ]
}

const blueprintBuilders: Record<MarketingPageBlueprint, (context: BlueprintContext) => LandingSection[]> = {
    landing: landingBlueprint,
    pricing: pricingBlueprint,
    about: aboutBlueprint,
    contact: contactBlueprint,
    faq: faqBlueprint,
    custom: customBlueprint,
}

/**
 * A blueprint page rendered outside the manifest: the marketing gallery
 * (/theme/marketing) uses this to show exactly what a fresh project ships
 * for each blueprint, under any preset, without touching the repo's own
 * repobot.project.json. The caller supplies the site fiction (pages, name);
 * sections and shell derive the same way `landingConfigForPage` derives
 * them for real manifest pages.
 */
export function blueprintExemplarConfig(request: {
    page: MarketingPageEntry
    pages: MarketingPageEntry[]
    siteName: string
    preset: MarketingPresetName
}): LandingConfig {
    const context: BlueprintContext = {
        page: request.page,
        pages: request.pages,
        siteName: request.siteName,
        preset: request.preset,
    }
    return {
        style: { preset: request.preset },
        shell: shellForContext(context),
        sections: blueprintBuilders[request.page.blueprint](context),
    }
}

/**
 * Resolve a manifest page to its full config. Precedence: an inline
 * `landing` config wins outright; then the page's `sections[]` scaffold
 * (mapped by `sectionsFromManifest`); then the blueprint default. The
 * shared shell chrome wraps both non-inline paths.
 */
export function landingConfigForPage(page: MarketingPageEntry): LandingConfig {
    if (page.landing !== undefined) {
        return page.landing
    }
    const { marketing } = projectManifest
    // Packs with code-owned site chrome (photography's masthead + atelier
    // register) dress manifest pages in it, so platform-added pages match
    // the site instead of wearing blueprint chrome over a clashing preset.
    const packChrome = packSiteChrome(page.path)
    const preset = packChrome?.preset ?? marketing.preset
    const context: BlueprintContext = {
        page,
        pages: marketing.pages,
        siteName:
            marketing.siteName ?? marketing.pages.find((entry) => entry.path === "/")?.title ?? "Our site",
        preset,
    }
    // Scaffold heroes without their own accent grammar inherit the preset's
    // direction, so a manifest-scaffolded site reads as coherently
    // art-directed as a blueprint-built one.
    const scaffold = sectionsFromManifest(page)?.map((section) =>
        section.type === "hero" && section.content.accent === undefined
            ? { ...section, content: { ...section.content, accent: accentForContext(context) } }
            : section,
    )
    return {
        style: { preset },
        shell: packChrome?.shell ?? shellForContext(context),
        sections: scaffold ?? blueprintBuilders[page.blueprint](context),
    }
}
