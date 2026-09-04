import type { LandingConfig, MarketingPresetName } from "@ui"
import projectManifestJson from "../../../../repobot.project.json"

/**
 * Typed view over `repobot.project.json` — the project's IA contract
 * (docs/project-ia.md). Same pattern as `activePack.ts`: the committed JSON
 * is the source of truth, this module is how the app reads it.
 *
 * Blueprint names are append-only public vocabulary shared with the setup
 * flow (like landing section/preset names, docs/landing-kernel-spec.md §8).
 */

/** Marketing page archetypes; each has a default `LandingConfig` builder in `View/Site/blueprints.ts`. */
export type MarketingPageBlueprint = "landing" | "pricing" | "about" | "contact" | "faq" | "custom"

/** Dashboard destination archetypes; each has a stub template in `scripts/scaffold-ia.mjs`. */
export type DashboardBlueprint = "overview" | "table" | "settings" | "custom"

/**
 * The user's own copy for a page, captured during project setup. Blueprints
 * render every present field verbatim (their placeholder copy only fills
 * gaps) — this is the user's voice, not a suggestion. Append-only, like the
 * blueprint names.
 */
export interface MarketingPageSeed {
    headline?: string
    subheadline?: string
    /** Key points the page must cover; blueprints map them onto sections. */
    bullets?: string[]
    /** Primary call-to-action label. */
    ctaLabel?: string
    /** Servable path of the user's hero image (committed under public/). */
    heroImage?: string
}

/**
 * One section of a page's scaffold, chosen during setup: a landing kernel
 * section type/variant, the user's verbatim copy, a description of what the
 * section must cover (the content pass's rubric — it also renders as
 * placeholder copy until then), and a servable artwork path for
 * image-bearing types. Mapped to a `LandingConfig` at runtime by
 * `View/Site/sectionsFromManifest.ts`.
 */
export interface MarketingPageSectionEntry {
    /** Stable id within the page. */
    id: string
    /** Landing kernel section type (docs/landing.md); unknown types are skipped. */
    type: string
    /** Kernel variant name; unknown variants fall back to the type's default. */
    variant?: string
    /**
     * Hero only: where the headline's accent word lands — "last-word",
     * "first-word", or "none" (pure typography). Unknown values fall back
     * to the preset's own accent grammar.
     */
    accent?: string
    /**
     * Hero only: the pill above the headline ("Now in early access").
     * Absent means no pill — raw and typographic registers read cleaner
     * bare, so this is a per-project design decision, not a default.
     */
    badge?: string
    /**
     * Hero only: a secondary CTA label beside the primary ("See how it
     * works"). It anchors to the page's story section
     * (`sectionsFromManifest` picks the target); absent means one
     * decisive CTA.
     */
    secondaryCtaLabel?: string
    /** What this section covers — the agent's rubric and interim placeholder copy. */
    description?: string
    headline?: string
    body?: string
    ctaLabel?: string
    /** Servable artwork path (committed under `web/app/public/`). */
    image?: string
}

/** One widget of a dashboard destination's scaffold (`scripts/scaffold-ia.mjs`). */
export interface DashboardSectionEntry {
    id: string
    /** Dashboard section type: stat-cards, chart, data-table, activity-feed, detail-form, settings-groups, filters-toolbar, list-detail. */
    type: string
    /** Widget title as it should render, e.g. "Orders this week". */
    title?: string
    /** What it shows / which data it summarizes — the agent's rubric. */
    description?: string
}

export interface MarketingPageEntry {
    /** Stable id; also the scaffolding/config key. Lowercase, no spaces. */
    id: string
    /** Public route path, e.g. "/" or "/pricing". */
    path: string
    /** Nav label and default page heading. */
    title: string
    blueprint: MarketingPageBlueprint
    /** One-line summary; blueprints fold it into the placeholder copy. */
    description?: string
    /** The user's own copy from setup; blueprints render it verbatim. */
    seed?: MarketingPageSeed
    /**
     * The setup-chosen section scaffold, rendered in order
     * (`sectionsFromManifest.ts`); when absent the blueprint decides the
     * stack. Content passes refine copy inside this scaffold and never
     * reorder or drop the user's sections.
     */
    sections?: MarketingPageSectionEntry[]
    /** Full inline page config; wins over the blueprint default and the scaffold. */
    landing?: LandingConfig
}

export interface DashboardDestinationEntry {
    /** Stable id; drives the generated view directory name. Lowercase, no spaces. */
    id: string
    /** Signed-in route path under the app shell, e.g. "/invoices". */
    path: string
    /** Shell nav label. */
    label: string
    blueprint: DashboardBlueprint
    description?: string
    /** The setup-chosen widget scaffold; the stub page lists it, the plan builds it. */
    sections?: DashboardSectionEntry[]
}

/**
 * The setup-chosen chrome variants for the shared marketing shell
 * (`MarketingShell` nav + footer). Variants only: the shell's content
 * (logo, links, CTA) always derives from `siteName` and the page list, so
 * adding a page rewires every nav automatically. Unknown or absent nav
 * variants fall back to the theme contract's `navigation.variant`
 * (`repobot.theme.json`), then `inline`; footers fall back to `simple`.
 */
export interface MarketingShellManifest {
    /**
     * MarketingShellNavVariant: "inline" | "centered" | "burger-overlay" |
     * "full-width" | "split" | "pill-links" | "logo-only".
     */
    navVariant?: string
    /** MarketingShellFooterVariant: "simple" | "multi-column" | "newsletter". */
    footerVariant?: string
}

/**
 * The project's committed brand marks — servable paths under
 * `web/app/public/brand/`, stamped during setup when the user uploads a
 * logo/app icon. The kernel renders them automatically: `BrandMark` (sign-in
 * surface, app shell) and the manifest-driven marketing navs prefer these
 * over the text wordmark, so the whole product carries the real logo without
 * any hand-wiring.
 */
export interface BrandManifest {
    /** The full logo — the transparent-background variant when one derived. */
    logo?: string
    /** The square mark alone, for icon-sized surfaces (shell sidebar). */
    logoMark?: string
    /** The uploaded app icon. */
    icon?: string
    /**
     * The social share card (og:image / twitter:image), ideally 1200×630 —
     * expected at `/brand/social.png`. The SEO kernel (docs/seo.md) uses it
     * as every page's default share image, falling back to `logo`.
     */
    social?: string
}

/**
 * The setup-chosen dashboard shell treatment (`AppShell`). Variants only —
 * the shell's nav content always comes from `shellNavSections.tsx` (plus the
 * scaffolder's managed block). An absent or unknown variant falls back to a
 * pinned `shellLayout` in the binder, then the theme contract's
 * `shell.variant` (`repobot.theme.json`), then `sidebar` — the same
 * precedence as the marketing shell's nav variant.
 */
export interface DashboardShellManifest {
    /**
     * AppShellLayout: "sidebar" | "top-nav" | "minimal" | "sidebar-inset" |
     * "sidebar-topbar" | "sidebar-only" | "logo-rail".
     */
    variant?: string
}

export interface ProjectManifest {
    marketing: {
        /** Style preset applied to every blueprint-built marketing page. */
        preset: MarketingPresetName
        /** Brand name in marketing navs; falls back to the home page title. */
        siteName?: string
        /** Committed brand marks; absent when no logo/icon was uploaded. */
        brand?: BrandManifest
        /** The setup-chosen shell chrome variants; absent means defaults. */
        shell?: MarketingShellManifest
        pages: MarketingPageEntry[]
    }
    dashboard: {
        /** The setup-chosen app shell treatment; absent means defaults. */
        shell?: DashboardShellManifest
        destinations: DashboardDestinationEntry[]
    }
}

export const projectManifest = projectManifestJson as ProjectManifest

/** The manifest page that owns `/`, if any — it takes precedence over the active pack's home. */
export function marketingHomePage(): MarketingPageEntry | undefined {
    return projectManifest.marketing.pages.find((page) => page.path === "/")
}
