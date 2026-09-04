import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"
import kernelLandingDocument from "../../../../../repobot.landing.json"
import kernelThemeDocument from "../../../../../repobot.theme.json"
import activePack from "../../../../../packs/active.json"
import launchCatalog from "../../../../../packs/launch/catalog.json"
import photographyCatalog from "../../../../../packs/photography/catalog.json"
import saasCatalog from "../../../../../packs/saas/catalog.json"
import weddingCatalog from "../../../../../packs/wedding/catalog.json"
// The composer itself — the ONE overlay implementation every composition
// path runs (compose-pack.sh, the dev/studio switch, the preview builder).
// This suite composes through it, so a merge-semantics change that would
// strand a pack on the kernel default register fails here first.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — dependency-free .mjs, no type declarations.
import { applyPackOverlays } from "../../../../../scripts/lib/pack-switch.mjs"

// The shared shells append the project manifest's marketing pages to every
// nav; pin the manifest empty so this suite asserts pack registers, not
// which composed tree it happens to run inside (see photographyLanding.test).
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"
import { launchLanding } from "../../../src/View/Launch/LaunchPage"
import { homeLanding as photographyHome } from "../../../src/View/Photography/photographyLanding"
import { PACK_REGISTERS } from "../../../src/View/Site/packRegisters.gen"
import { homeLanding as weddingHome } from "../../../src/View/Wedding/weddingLanding"

/**
 * Register conformance: a pack's declared register (catalog.json
 * landing.style.preset — the single authority) must survive the whole
 * chain: the generated code map, the composed landing document, and the
 * resolved home config. Photography once shipped every preview wearing the
 * kernel default (editorial) because one composition path skipped the
 * overlay — this suite pins the chain end to end so that class of failure
 * is a red test, not a user report.
 */

interface RegisteredPack {
    key: keyof typeof PACK_REGISTERS
    catalog: { landing: { style: { preset: string } } }
    /** The pack's code-owned home config; saas is blueprint-driven (none). */
    home?: () => Parameters<typeof applySitePageDocument>[0]
}

const registeredPacks: RegisteredPack[] = [
    { key: "launch", catalog: launchCatalog, home: () => launchLanding },
    { key: "photography", catalog: photographyCatalog, home: () => photographyHome("") },
    { key: "saas", catalog: saasCatalog },
    { key: "wedding", catalog: weddingCatalog, home: () => weddingHome("") },
]

/** Compose the pack's landing document exactly as every composer does. */
function composeLandingDocument(catalog: RegisteredPack["catalog"]): Record<string, unknown> {
    const tree = mkdtempSync(path.join(tmpdir(), "register-conformance-"))
    try {
        writeFileSync(
            path.join(tree, "repobot.landing.json"),
            JSON.stringify(kernelLandingDocument, null, 4) + "\n",
        )
        writeFileSync(
            path.join(tree, "repobot.theme.json"),
            JSON.stringify(kernelThemeDocument, null, 4) + "\n",
        )
        applyPackOverlays(tree, catalog)
        return JSON.parse(readFileSync(path.join(tree, "repobot.landing.json"), "utf8"))
    } finally {
        rmSync(tree, { recursive: true, force: true })
    }
}

// This suite runs inside every COMPOSED tree too (the publish gate replays
// each tree's own suite), and there the imported root document is not the
// kernel default — it is the resident pack's overlaid document, whose preset
// legitimately names that pack's register. The kernel-neutrality assertion
// below is about the kernel default specifically, so it applies only where
// the root document IS the kernel default (the kernel checkout and the blank
// tree) — detected by the resident pack having no register at all, since a
// composed tree's resident may legitimately WEAR a sampled register (single,
// resume-dev, fitness-trainer, and nonprofit all ride monolith, saas's
// register in the sample). The per-pack assertions stay live everywhere:
// applyPackOverlays stamps the catalog's preset regardless of which document
// it starts from.
const residentPackKey = (activePack as { key: string }).key
const rootIsKernelDefault = !(residentPackKey in PACK_REGISTERS)

describe("register conformance", () => {
    it.runIf(rootIsKernelDefault)("the kernel default document does not name any pack's register", () => {
        // The default (the /landing exemplar's skeleton) declaring a
        // pack's register would mask a missed overlay in every assertion
        // below.
        const packPresets = registeredPacks.map((pack) => pack.catalog.landing.style.preset)
        const defaultPreset = (kernelLandingDocument as { style: { preset: string } }).style.preset
        expect(packPresets).not.toContain(defaultPreset)
    })

    for (const pack of registeredPacks) {
        const declared = pack.catalog.landing.style.preset

        it(`${pack.key}: the generated code map matches the catalog`, () => {
            expect(PACK_REGISTERS[pack.key]).toBe(declared)
        })

        it(`${pack.key}: the composed document declares the catalog register`, () => {
            const document = composeLandingDocument(pack.catalog)
            expect((document.style as { preset: string }).preset).toBe(declared)
        })

        if (pack.home !== undefined) {
            const home = pack.home
            it(`${pack.key}: the home config resolves to the catalog register`, () => {
                const document = composeLandingDocument(pack.catalog)
                // In the composed pack's own checkout the stamp matches its
                // active.json; here the resident pack differs, and the
                // pack-stamp isolation gate would (correctly) treat the
                // document as foreign. That gate is pinned in
                // landingDocument.test.ts — this suite is about register
                // merge semantics, so resolve unstamped.
                delete document.pack
                const resolved = applySitePageDocument(home(), "home", document)
                expect(resolved.style.preset).toBe(declared)
            })
        }
    }
})
