import type { LandingConfig } from "@ui"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import activePack from "../../../../../packs/active.json"
import launchCatalog from "../../../../../packs/launch/catalog.json"
import committedDocument from "../../../../../repobot.landing.json"
import { landing } from "../../../src/View/Landing/landing"
import { applyLandingDocument, applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { launchLanding } from "../../../src/View/Launch/LaunchPage"

/**
 * The repobot.landing.json merge semantics (docs/landing.md "The page is a
 * config"): the document owns the skeleton — preset, chrome variants,
 * section order/variants — while code owns the content, and no document a
 * hand or the platform can write may crash the page. The fidelity suite
 * pins the WS-L invariant that the committed defaults are pixel-identical:
 * the seeded document reproduces each exemplar's code skeleton exactly.
 *
 * This suite runs in two kinds of checkout. In the kernel, the root
 * repobot.landing.json IS the kernel default. In a composed template repo
 * (scripts/compose-pack.sh), the root document has been rewritten with the
 * active pack's landing overlay, and the pristine kernel default is kept at
 * packs/.defaults/repobot.landing.json — so the kernel-fidelity assertion
 * reads whichever copy is the default, and a separate assertion pins that
 * the rewrite is exactly the compose merge (default + catalog.landing).
 * Template repos used to fail CI from their very first commit because this
 * suite asserted the root document was the kernel exemplar unconditionally.
 *
 * The compose-merge assertion carries the same trap one commit later: the
 * root document is the PLATFORM'S write surface. Theme "Look" applies write
 * style.preset, the editor writes shell.nav.order / section order / text
 * overrides — all as commits to the project repo. Asserting the committed
 * document still equals the pristine compose merge turns a customer's main
 * red at their first customization, and every production publish then parks
 * behind a CI "fix" whose only possible fix is reverting the user's edit.
 * So the strict merge assertion runs only where the document is known
 * pristine: the kernel checkout, and the template publish gate (which sets
 * REPOBOT_COMPOSE_GATE=1 while testing a freshly composed stage). Composed
 * clones — template repos and every project generated from them — skip it.
 */

const repoRoot = join(__dirname, "../../../../..")
const composedDefaultPath = join(repoRoot, "packs/.defaults/repobot.landing.json")
const kernelDefaultDocument: unknown = existsSync(composedDefaultPath)
    ? JSON.parse(readFileSync(composedDefaultPath, "utf8"))
    : committedDocument

/** True only where the root document cannot have been edited since compose. */
const documentIsPristine = !existsSync(composedDefaultPath) || process.env.REPOBOT_COMPOSE_GATE === "1"

type LandingOverlay = { sections?: unknown; pages?: unknown; routes?: unknown }

/** One landing overlay merged exactly as compose-pack.sh merges it. */
function composeOverlay(overlay: LandingOverlay | undefined): unknown {
    if (!overlay) {
        return kernelDefaultDocument
    }
    const document: Record<string, unknown> = {
        ...(kernelDefaultDocument as Record<string, unknown>),
        ...overlay,
    }
    if (overlay.sections === undefined && (overlay.pages !== undefined || overlay.routes !== undefined)) {
        delete document.sections
    }
    return document
}

/**
 * Every document compose could legitimately have stamped for this
 * active.json: the active pack's own landing overlay (top-level spread; a
 * page-based surface drops the kernel default's root sections) — or, since
 * active.json carries the BASE key when a derived template is composed
 * (scripts/lib/pack-switch.mjs resolveCatalog), any of its remixes' landing
 * overlays merged over the base's. Packs without a landing overlay —
 * including the kernel's own "blank" — leave the document as the kernel
 * default.
 */
function composedDocumentsForActivePack(): unknown[] {
    const catalog = JSON.parse(
        readFileSync(join(repoRoot, "packs", activePack.key, "catalog.json"), "utf8"),
    ) as { landing?: LandingOverlay }
    const candidates = [composeOverlay(catalog.landing)]
    for (const entry of readdirSync(join(repoRoot, "packs"), { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const remixPath = join(repoRoot, "packs", entry.name, "catalog.json")
        if (!existsSync(remixPath)) continue
        const remix = JSON.parse(readFileSync(remixPath, "utf8")) as {
            remixOf?: string
            landing?: LandingOverlay
        }
        if (remix.remixOf !== activePack.key || remix.landing === undefined) continue
        candidates.push(composeOverlay({ ...catalog.landing, ...remix.landing }))
    }
    // Since the pack-isolation change, applyPackOverlays stamps the overlaid
    // document with the active pack key; trees composed before it are
    // unstamped. Both are legitimate compose outputs.
    return candidates.flatMap((candidate) =>
        candidate === kernelDefaultDocument
            ? [candidate]
            : [candidate, { ...(candidate as Record<string, unknown>), pack: activePack.key }],
    )
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("seeded document fidelity", () => {
    it("the kernel default document reproduces the /landing code skeleton", () => {
        expect(applyLandingDocument(landing, kernelDefaultDocument)).toEqual(landing)
        expect(warn).not.toHaveBeenCalled()
    })

    it.runIf(documentIsPristine)(
        "the committed root document is the kernel default under the active pack's landing overlay",
        () => {
            expect(composedDocumentsForActivePack()).toContainEqual(committedDocument)
        },
    )

    it("the launch pack's compose overlay reproduces the launch code skeleton", () => {
        expect(applyLandingDocument(launchLanding, launchCatalog.landing)).toEqual(launchLanding)
        expect(warn).not.toHaveBeenCalled()
    })
})

/** A small synthetic page: two sections plus shell chrome. */
function fixture(): LandingConfig {
    return {
        style: { preset: "editorial", overrides: { "--marketing-font-display": "serif" } },
        shell: {
            nav: { variant: "inline", content: { logo: { name: "Fixture" } } },
            footer: { variant: "simple", content: { blurb: "Fixture" } },
        },
        sections: [
            { id: "hero", type: "hero", variant: "statement", content: { headline: "Hello" } },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: { items: [{ question: "Q", answer: "A" }] },
            },
            {
                type: "lead-form",
                variant: "inline-email",
                content: { cta: "Join", confirmation: "Done" },
            },
        ],
    }
}

describe("applyLandingDocument", () => {
    it("takes preset, chrome variants, section order and variants from the document", () => {
        const merged = applyLandingDocument(fixture(), {
            style: { preset: "dark-dev" },
            shell: { nav: { variant: "split" }, footer: { variant: "multi-column" } },
            sections: [
                { id: "faq", type: "faq" },
                { id: "hero", type: "hero", variant: "centered-stack" },
                { id: "lead-form", type: "lead-form", variant: "contact-block" },
            ],
        })
        expect(merged.style.preset).toBe("dark-dev")
        // Overrides stay with the code config.
        expect(merged.style.overrides).toEqual({ "--marketing-font-display": "serif" })
        expect(merged.shell?.nav?.variant).toBe("split")
        expect(merged.shell?.footer?.variant).toBe("multi-column")
        // Chrome content comes from code.
        expect(merged.shell?.nav?.content.logo.name).toBe("Fixture")
        expect(merged.sections.map((section) => [section.type, section.variant])).toEqual([
            ["faq", "accordion"],
            ["hero", "centered-stack"],
            ["lead-form", "contact-block"],
        ])
        // Section content always comes from code.
        expect(merged.sections[1]?.content).toEqual({ headline: "Hello" })
    })

    it("matches sections by type when the document (or code) has no explicit id", () => {
        const merged = applyLandingDocument(fixture(), {
            sections: [{ type: "lead-form" }, { type: "hero" }, { type: "faq" }],
        })
        expect(merged.sections.map((section) => section.type)).toEqual(["lead-form", "hero", "faq"])
    })

    it("skips a document section with no registered content", () => {
        const merged = applyLandingDocument(fixture(), {
            sections: [
                { id: "pricing", type: "pricing" },
                { id: "hero", type: "hero" },
            ],
        })
        expect(merged.sections.map((section) => section.type)).toEqual(["hero", "faq", "lead-form"])
        expect(warn).toHaveBeenCalledOnce()
    })

    it("appends code sections absent from the document, in code order", () => {
        const merged = applyLandingDocument(fixture(), {
            sections: [{ id: "faq", type: "faq" }],
        })
        expect(merged.sections.map((section) => section.type)).toEqual(["faq", "hero", "lead-form"])
    })

    it("drops duplicate document references to the same section", () => {
        const merged = applyLandingDocument(fixture(), {
            sections: [
                { id: "hero", type: "hero" },
                { id: "hero", type: "hero" },
            ],
        })
        expect(merged.sections.filter((section) => section.type === "hero")).toHaveLength(1)
        expect(merged.sections).toHaveLength(3)
    })

    it("falls back to code values for unknown presets, variants, and chrome variants", () => {
        const merged = applyLandingDocument(fixture(), {
            style: { preset: "vaporwave" },
            shell: { nav: { variant: "mega" }, footer: { variant: 7 } },
            sections: [
                { id: "hero", type: "hero", variant: "jumbotron" },
                { id: "faq", type: "faq", variant: "two-column" },
            ],
        })
        expect(merged.style.preset).toBe("editorial")
        expect(merged.shell?.nav?.variant).toBe("inline")
        expect(merged.shell?.footer?.variant).toBe("simple")
        // "jumbotron" isn't a hero variant; "two-column" isn't a shipped faq
        // variant either — both keep the code config's variant.
        expect(merged.sections[0]?.variant).toBe("statement")
        expect(merged.sections[1]?.variant).toBe("accordion")
        expect(warn).toHaveBeenCalled()
    })

    it("keeps the registered section's type when the document's type disagrees", () => {
        const merged = applyLandingDocument(fixture(), {
            sections: [{ id: "hero", type: "pricing", variant: "tiers" }],
        })
        expect(merged.sections[0]?.type).toBe("hero")
        // The variant is validated against the REGISTERED type, so "tiers"
        // falls back too.
        expect(merged.sections[0]?.variant).toBe("statement")
    })

    it("ignores document chrome when the code config defines none", () => {
        const config: LandingConfig = { style: { preset: "editorial" }, sections: fixture().sections }
        const merged = applyLandingDocument(config, { shell: { nav: { variant: "split" } } })
        expect(merged.shell).toBeUndefined()
    })

    it("applies per-list item order permutations over the code content", () => {
        const config = fixture()
        config.sections[1] = {
            id: "faq",
            type: "faq",
            variant: "accordion",
            content: {
                items: [
                    { question: "Q1", answer: "A1" },
                    { question: "Q2", answer: "A2" },
                    { question: "Q3", answer: "A3" },
                ],
            },
        }
        const merged = applyLandingDocument(config, {
            sections: [
                { id: "hero", type: "hero" },
                { id: "faq", type: "faq", order: { items: [2, 0, 1] } },
                { id: "lead-form", type: "lead-form" },
            ],
        })
        const faq = merged.sections[1]
        expect(
            (faq?.content as { items: { question: string }[] }).items.map((item) => item.question),
        ).toEqual(["Q3", "Q1", "Q2"])
        expect(warn).not.toHaveBeenCalled()
    })

    it("degrades item order gracefully: stale, duplicate, and out-of-range positions drop; unmentioned items append in code order", () => {
        const config = fixture()
        config.sections[1] = {
            id: "faq",
            type: "faq",
            variant: "accordion",
            content: {
                items: [
                    { question: "Q1", answer: "A1" },
                    { question: "Q2", answer: "A2" },
                    { question: "Q3", answer: "A3" },
                ],
            },
        }
        const merged = applyLandingDocument(config, {
            // 9 is stale (content shrank), 1 repeats, -1 and "2" are junk;
            // Q3 is unmentioned so it appends after the ordered items.
            sections: [{ id: "faq", type: "faq", order: { items: [9, 1, 1, -1, "2", 0] } }],
        })
        const faq = merged.sections[0]
        expect(
            (faq?.content as { items: { question: string }[] }).items.map((item) => item.question),
        ).toEqual(["Q2", "Q1", "Q3"])
    })

    it("ignores item order naming a list the section's content doesn't have", () => {
        const merged = applyLandingDocument(fixture(), {
            sections: [{ id: "hero", type: "hero", order: { tiers: [1, 0] } }],
        })
        expect(merged.sections[0]?.content).toEqual({ headline: "Hello" })
        expect(warn).toHaveBeenCalled()
    })

    it("never crashes on malformed item order", () => {
        const config = fixture()
        for (const order of [null, "items", 42, [], { items: "2,1,0" }, { items: { 0: 2 } }]) {
            const merged = applyLandingDocument(config, {
                sections: [{ id: "faq", type: "faq", order }],
            })
            expect(merged.sections[0]?.type).toBe("faq")
            expect((merged.sections[0]?.content as { items: unknown[] }).items).toHaveLength(1)
        }
    })

    it("paints a hero image override onto slides when the hero is a slide reel", () => {
        const config = fixture()
        config.sections[0] = {
            id: "hero",
            type: "hero",
            variant: "full-bleed-media",
            content: {
                headline: "Hello",
                slides: [
                    { kind: "image", src: "/photography/a.webp", alt: "A" },
                    { kind: "image", src: "/photography/b.webp", alt: "B" },
                ],
            },
        }
        const merged = applyLandingDocument(config, {
            sections: [{ id: "hero", type: "hero", image: "/brand/mine.jpg" }],
        })
        const slides = (merged.sections[0]?.content as { slides: { src: string }[] }).slides
        expect(slides.map((slide) => slide.src)).toEqual(["/brand/mine.jpg", "/photography/b.webp"])
        expect(warn).not.toHaveBeenCalled()
    })

    it("drops the old responsive fields when a slide's image is replaced", () => {
        // Photography slides ship a WebP srcSet; browsers pick from srcSet
        // over src, so a replace that kept it left the OLD photo on screen.
        const config = fixture()
        config.sections[0] = {
            id: "hero",
            type: "hero",
            variant: "full-bleed-media",
            content: {
                headline: "Hello",
                slides: [
                    {
                        kind: "image",
                        src: "/photography/a-1600w.webp",
                        alt: "A",
                        width: 1600,
                        height: 1066,
                        srcSet: [{ src: "/photography/a-640w.webp", width: 640 }],
                    },
                ],
            },
        }
        const merged = applyLandingDocument(config, {
            sections: [{ id: "hero", type: "hero", image: "/brand/mine.jpg" }],
        })
        const slide = (merged.sections[0]?.content as { slides: Record<string, unknown>[] }).slides[0]
        expect(slide).toEqual({ kind: "image", src: "/brand/mine.jpg", alt: "A" })
        expect(warn).not.toHaveBeenCalled()
    })

    it("replaces a gallery's photographs wholesale from a media path array", () => {
        const config = fixture()
        config.sections.push({
            id: "selected-work",
            type: "gallery",
            variant: "justified",
            content: {
                items: [
                    { media: { kind: "image", src: "/photography/a.webp", alt: "A" } },
                    { media: { kind: "image", src: "/photography/b.webp", alt: "B" } },
                ],
            },
        })
        const merged = applyLandingDocument(config, {
            sections: [
                { id: "hero", type: "hero" },
                {
                    id: "selected-work",
                    type: "gallery",
                    media: { items: ["/brand/one.jpg", "/brand/two.jpg", "/brand/three.jpg"] },
                },
            ],
        })
        const gallery = merged.sections.find((section) => section.id === "selected-work")
        const items = (gallery?.content as { items: { media: { src: string } }[] }).items
        expect(items.map((item) => item.media.src)).toEqual([
            "/brand/one.jpg",
            "/brand/two.jpg",
            "/brand/three.jpg",
        ])
        expect(warn).not.toHaveBeenCalled()
    })

    it("overlays a single gallery photograph from a sparse media map", () => {
        const config = fixture()
        config.sections.push({
            id: "selected-work",
            type: "gallery",
            variant: "justified",
            content: {
                items: [
                    { media: { kind: "image", src: "/photography/a.webp", alt: "A" } },
                    { media: { kind: "image", src: "/photography/b.webp", alt: "B" } },
                ],
            },
        })
        const merged = applyLandingDocument(config, {
            sections: [
                { id: "hero", type: "hero" },
                { id: "selected-work", type: "gallery", media: { items: { "1": "/brand/swap.jpg" } } },
            ],
        })
        const gallery = merged.sections.find((section) => section.id === "selected-work")
        const items = (gallery?.content as { items: { media: { src: string } }[] }).items
        expect(items.map((item) => item.media.src)).toEqual(["/photography/a.webp", "/brand/swap.jpg"])
    })

    it("never crashes on malformed media overrides", () => {
        const config = fixture()
        for (const media of [null, "items", 42, [], { items: "nope" }, { tiers: ["/brand/x.jpg"] }]) {
            const merged = applyLandingDocument(config, {
                sections: [{ id: "hero", type: "hero", media }],
            })
            expect(merged.sections[0]?.type).toBe("hero")
            expect(merged.sections[0]?.content).toEqual({ headline: "Hello" })
        }
    })

    it("reorders shell nav links by key (shell.nav.order.links)", () => {
        const config = fixture()
        config.shell!.nav!.content.links = [
            { label: "Work", href: "/work" },
            { label: "About", href: "/about" },
            { label: "Inquire", href: "/inquire" },
        ]
        const merged = applyLandingDocument(config, {
            shell: { nav: { order: { links: ["/inquire", "/work"] } } },
        })
        // Listed keys lead in list order; unlisted links follow in code order.
        expect(merged.shell?.nav?.content.links?.map((link) => link.label)).toEqual([
            "Inquire",
            "Work",
            "About",
        ])
        // Everything else about the chrome stands.
        expect(merged.shell?.nav?.variant).toBe("inline")
        expect(warn).not.toHaveBeenCalled()
    })

    it("degrades shell nav order gracefully: unknown keys drop, malformed orders keep code order", () => {
        const config = fixture()
        config.shell!.nav!.content.links = [
            { label: "Work", href: "/work" },
            { label: "About", href: "/about" },
        ]
        const unknownKeys = applyLandingDocument(config, {
            shell: { nav: { order: { links: ["/gone", "/about"] } } },
        })
        expect(unknownKeys.shell?.nav?.content.links?.map((link) => link.label)).toEqual(["About", "Work"])
        for (const order of [42, "about,work", { links: "about" }, { links: [1, 2] }]) {
            const merged = applyLandingDocument(config, { shell: { nav: { order } } })
            expect(merged.shell?.nav?.content.links?.map((link) => link.label)).toEqual(["Work", "About"])
        }
    })

    it("never crashes on malformed documents", () => {
        const config = fixture()
        for (const document of [
            null,
            undefined,
            "not a document",
            42,
            [],
            { style: "editorial" },
            { sections: "hero,faq" },
            { sections: [null, "hero", { variant: "statement" }, {}] },
            { style: { preset: null }, shell: { nav: "inline" }, sections: [{ id: 4, type: 4 }] },
        ]) {
            const merged = applyLandingDocument(config, document)
            expect(merged.style.preset).toBe("editorial")
            expect(merged.sections.map((section) => section.type)).toEqual(["hero", "faq", "lead-form"])
        }
    })
})

/*
 * Pack-stamp isolation: templates are FULLY isolated style-wise. Every
 * writer stamps the document's `pack` with the active pack key; a document
 * stamped for a FOREIGN pack resolves as absent (pristine code config,
 * console warning), so one pack's edits can never wear another pack's page
 * after a template flip. Unstamped documents keep today's behavior.
 */
describe("pack-stamp isolation", () => {
    const foreign = "definitely-not-a-real-pack"

    it("treats a foreign-stamped document as absent and warns", () => {
        const merged = applyLandingDocument(fixture(), {
            pack: foreign,
            style: { preset: "dark-dev" },
            sections: [{ id: "faq", type: "faq" }],
        })
        expect(merged).toEqual(fixture())
        expect(warn).toHaveBeenCalledOnce()
        expect(warn.mock.calls[0]?.[0]).toContain(`stamped for pack "${foreign}"`)
    })

    it("merges a document stamped for the active pack", () => {
        const merged = applyLandingDocument(fixture(), {
            pack: activePack.key,
            style: { preset: "dark-dev" },
        })
        expect(merged.style.preset).toBe("dark-dev")
        expect(warn).not.toHaveBeenCalled()
    })

    it("keeps today's behavior for unstamped and malformed stamps", () => {
        for (const pack of [undefined, null, "", 42, ["launch"]]) {
            const merged = applyLandingDocument(fixture(), {
                ...(pack !== undefined ? { pack } : {}),
                style: { preset: "dark-dev" },
            })
            expect(merged.style.preset).toBe("dark-dev")
        }
    })

    it("gates per-page merges the same way", () => {
        const config = fixture()
        const document = {
            pack: foreign,
            style: { preset: "dark-dev" },
            pages: { home: { sections: [{ id: "faq", type: "faq" }] } },
        }
        expect(applySitePageDocument(config, "home", document)).toEqual(config)
        expect(warn).toHaveBeenCalledOnce()
        const owned = applySitePageDocument(config, "home", { ...document, pack: activePack.key })
        expect(owned.style.preset).toBe("dark-dev")
        expect(owned.sections.map((section) => section.type)).toEqual(["faq"])
    })
})
