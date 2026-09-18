import type { LandingConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { about, profile, projects, socials } from "./content"
import { folioShell } from "./folioShell"

/**
 * The folio pack's portfolio as a landing-kernel config (docs/landing.md).
 * `content.ts` stays the single owner-editable source; this file only maps
 * it into sections. The `editorial` preset is folio's own lineage — serif
 * statement hero with the accent on the last word, hairline rules over
 * cards, ink on paper.
 *
 * Mapping notes: the filterable project grid is the kernel's
 * `showcase filterable-grid` (chips derive from project tags) — cards stay
 * deliberately type-only, an editorial index rather than an image grid (the
 * per-project emoji/accent art fields drive the native apps' cards); the
 * skills cloud becomes the text-logo strip; about + contact merge into the
 * `contact-block`.
 *
 * Every section carries a stable `id`: FolioPage pipes this config through
 * the landing document's per-page merge (`useSitePageConfig`), so the
 * platform's structural editor can reorder / delete / add sections and the
 * ids are what the catalog's landing seed binds to.
 *
 * The builder takes `basePath`: "" when the pack owns the site (manifest
 * extras join the nav) and "/folio" on the preview route (they don't) —
 * same page, both wirings.
 */
/** Whether a social URL names an actual profile — a path beyond the bare
 * platform homepage. Bare homepages are placeholder filler, not links. */
function socialUrlIsProfile(url: string): boolean {
    try {
        return new URL(url).pathname.replace(/\/+$/, "") !== ""
    } catch {
        return false
    }
}

export function folioLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.folio },
        // The shared chrome lives in folioShell.ts (manifest pages wear it too).
        shell: folioShell(basePath, "/"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    badge: profile.availability === "" ? undefined : profile.availability,
                    headline: profile.statement,
                    subheadline: `${profile.role} · ${profile.location}`,
                    primaryCta: { label: "See the work", anchor: "work" },
                    secondaryCta: { label: "Get in touch", href: `mailto:${profile.email}` },
                },
            },
            {
                id: "work",
                type: "showcase",
                variant: "filterable-grid",
                content: {
                    kicker: "Selected work",
                    title: "Things I'm proud of",
                    items: projects.map((project) => ({
                        title: project.title,
                        description: project.description,
                        eyebrow: project.year,
                        tags: project.tags,
                        url: project.url,
                    })),
                },
            },
            {
                id: "toolkit",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: "Toolkit",
                    items: about.skills,
                },
            },
            {
                id: "contact",
                type: "lead-form",
                variant: "contact-block",
                content: {
                    kicker: "About",
                    title: "Let's make something.",
                    body: about.paragraphs.join(" "),
                    channels: [
                        { label: "Email", value: profile.email, href: `mailto:${profile.email}` },
                        // A social only links when its URL names a real
                        // profile (a path beyond the platform homepage);
                        // the shipped bare-homepage placeholders render as
                        // plain text instead of dead-end navigation. Point
                        // content.ts at your actual profiles to go live.
                        ...socials.map((social) => ({
                            label: social.label,
                            value: social.url.replace(/^https?:\/\//, ""),
                            ...(socialUrlIsProfile(social.url) ? { href: social.url } : {}),
                        })),
                    ],
                },
            },
        ],
    }
}
