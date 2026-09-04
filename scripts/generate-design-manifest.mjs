#!/usr/bin/env node
// Generates docs/design-manifest.json — the machine-readable design-space
// manifest (docs/landing-kernel-spec.md's vocabulary, as data). This is what
// data-driven composers consume instead of mirroring kernel sources by hand:
// the platform's remix/compose engines, agents imagining template variants,
// and pack tooling all read this one artifact.
//
//   node scripts/generate-design-manifest.mjs           # write the manifest
//   node scripts/generate-design-manifest.mjs --check   # verify freshness
//
// Everything here is extracted from kernel sources and pack catalogs — never
// hand-listed — so a new variant, preset, theme axis, or pack appears in the
// manifest by existing. A pack is marked compose-ready when its catalog
// declares landing seeds for every routed page (valid against the
// vocabulary) plus a well-formed contentContract (packs/README.md); the
// checklist is computed, never declared.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
    contentContractProblems,
    landingSeedProblems,
    parseDesignVocabulary,
} from "./lib/design-vocabulary.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUTPUT_PATH = path.join(ROOT, "docs/design-manifest.json")
const REGISTERS_PATH = path.join(ROOT, "web/app/src/View/Site/packRegisters.gen.ts")

const vocabulary = parseDesignVocabulary(ROOT)

// ------------------------------------------------------------ landing space

const sections = Object.fromEntries(
    Object.entries(vocabulary.sectionVariants).map(([type, variants]) => [
        type,
        {
            variants,
            orderRole: vocabulary.sectionOrderRoles[type],
            ...(vocabulary.mediaDependentVariants[type] !== undefined
                ? { mediaDependentVariants: vocabulary.mediaDependentVariants[type] }
                : {}),
            ...(vocabulary.mediaEvidenceVariants[type] !== undefined
                ? { mediaEvidenceVariants: vocabulary.mediaEvidenceVariants[type] }
                : {}),
            ...(vocabulary.multiMediaVariants[type] !== undefined
                ? { multiMediaVariants: vocabulary.multiMediaVariants[type] }
                : {}),
            ...(vocabulary.pairedMediaVariants[type] !== undefined
                ? { pairedMediaVariants: vocabulary.pairedMediaVariants[type] }
                : {}),
        },
    ]),
)

// ------------------------------------------------------------------- packs

const packsDir = path.join(ROOT, "packs")
const packs = {}
for (const key of existsSync(packsDir)
    ? readdirSync(packsDir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .filter((name) => existsSync(path.join(packsDir, name, "catalog.json")))
          .sort()
    : []) {
    const catalog = JSON.parse(readFileSync(path.join(packsDir, key, "catalog.json"), "utf8"))
    // A derived template (catalog `remixOf`) is a thin entry pointing at its
    // base: remix engines resolve the design space (register, seeds,
    // contract) through the base's entry rather than a duplicated copy that
    // could drift. compose-readiness is the base's — the remix composes with
    // the base's seeds and contract.
    if (catalog.remixOf !== undefined) {
        const base = JSON.parse(readFileSync(path.join(packsDir, catalog.remixOf, "catalog.json"), "utf8"))
        const baseSeedsValid =
            base.landing?.routes !== undefined &&
            base.landing?.pages !== undefined &&
            landingSeedProblems(base.landing, vocabulary).length === 0
        const baseContractValid =
            base.contentContract !== undefined && contentContractProblems(base.contentContract).length === 0
        packs[key] = {
            title: catalog.title,
            templateKey: catalog.templateKey,
            remixOf: catalog.remixOf,
            contentSeed: catalog.contentSeed,
            base: base.base,
            // A remix may re-register the surface (catalog `landing.style`,
            // merged over the base's landing by resolveCatalog); everything
            // else about its design space still resolves through the base's
            // entry. Only an override is recorded — a remix without one
            // wears the base's register, read from the base's entry.
            ...(catalog.landing?.style?.preset !== undefined
                ? { stylePreset: catalog.landing.style.preset }
                : {}),
            ...(base.category !== undefined ? { category: base.category } : {}),
            capabilities: base.capabilities ?? [],
            clientOnly: base.clientOnly === true,
            // The remix composes the base's app, chrome included.
            ...(base.theme?.shell !== undefined ? { shellChrome: true } : {}),
            composeReady: baseSeedsValid && baseContractValid,
        }
        continue
    }
    const landing = catalog.landing
    const seedsValid =
        landing?.routes !== undefined &&
        landing?.pages !== undefined &&
        landingSeedProblems(landing, vocabulary).length === 0
    const contractValid =
        catalog.contentContract !== undefined && contentContractProblems(catalog.contentContract).length === 0
    packs[key] = {
        title: catalog.title,
        // The platform's template id (the GitHub template repo name): how a
        // platform maps a project's installed template back to its pack block.
        templateKey: catalog.templateKey,
        base: catalog.base,
        ...(catalog.category !== undefined ? { category: catalog.category } : {}),
        capabilities: catalog.capabilities ?? [],
        clientOnly: catalog.clientOnly === true,
        ...(landing?.routes !== undefined ? { routes: landing.routes } : {}),
        ...(landing?.style?.preset !== undefined ? { stylePreset: landing.style.preset } : {}),
        ...(landing?.pages !== undefined ? { pageSeeds: landing.pages } : {}),
        ...(catalog.contentContract !== undefined
            ? { contentContract: stripComments(catalog.contentContract) }
            : {}),
        // Whether the composed app renders AppShell chrome (the catalog
        // theme pins a shell block): the signal remix engines need to keep
        // the shell/content/ui axes live on templates whose BASE alone
        // would mute them — chat is base "content" but wears the shell.
        ...(catalog.theme?.shell !== undefined ? { shellChrome: true } : {}),
        composeReady: seedsValid && contractValid,
    }
}

/** Catalog `$comment` fields are authoring notes, not contract. */
function stripComments(value) {
    if (Array.isArray(value)) {
        return value.map(stripComments)
    }
    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([key]) => key !== "$comment")
                .map(([key, entry]) => [key, stripComments(entry)]),
        )
    }
    return value
}

// ---------------------------------------------------------------- assembly

const manifest = {
    $comment:
        "Generated by scripts/generate-design-manifest.mjs from kernel sources " +
        "and pack catalogs — do not edit by hand. Regenerate with: npm run " +
        "codegen:design-manifest. Vocabulary values are the append-only public " +
        "contract (docs/landing-kernel-spec.md §8).",
    manifestVersion: 1,
    landing: {
        sections,
        stylePresets: vocabulary.stylePresets,
        // Each register's ambition axes (movement idiom, surface treatment
        // flags, display-type scale): what remix engines derive a register's
        // energy from, so a press on a high-drama site stays in its band.
        stylePresetAxes: vocabulary.stylePresetAxes,
        shell: {
            navVariants: vocabulary.shellNavVariants,
            footerVariants: vocabulary.shellFooterVariants,
        },
    },
    theme: vocabulary.theme,
    packs,
}

// ------------------------------------------------- pack register derivation

// The kernel code's pack→preset map, generated so a pack's register is
// declared exactly once (catalog.json landing.style.preset) and every code
// pin (packShell, pack landing builders, proofing pages) derives from it —
// a literal that can drift from the catalog is how photography shipped
// wearing the wrong register.
const registerEntries = Object.entries(packs)
    .filter(([, pack]) => pack.stylePreset !== undefined)
    .map(([key, pack]) => [key, pack.stylePreset])
const registersSource =
    "// Generated by scripts/generate-design-manifest.mjs from each pack's\n" +
    "// catalog.json landing.style.preset — do not edit by hand. Regenerate\n" +
    "// with: npm run codegen:design-manifest.\n" +
    "//\n" +
    "// The catalog is the only authority for a pack's register: compose\n" +
    "// stamps it into the project's landing document, and these constants\n" +
    "// are the code configs' matching fallback pins (the document, carrying\n" +
    "// the user's restyle, still outranks them at resolve time).\n" +
    'import type { MarketingPresetName } from "@ui"\n' +
    "\n" +
    "export const PACK_REGISTERS = {\n" +
    registerEntries
        // Suffixed pack keys ("services-emergency") aren't identifiers.
        .map(([key, preset]) => [/^[A-Za-z_$][\w$]*$/.test(key) ? key : `"${key}"`, preset])
        .map(([key, preset]) => `    ${key}: "${preset}",\n`)
        .join("") +
    "} as const satisfies Record<string, MarketingPresetName>\n" +
    "\n" +
    "export type RegisteredPackKey = keyof typeof PACK_REGISTERS\n"

// check:all runs prettier over the repo, so emit prettier-clean output.
const prettier = await import("prettier")
const prettierConfig = (await prettier.resolveConfig(OUTPUT_PATH)) ?? {}
const serialized = await prettier.format(JSON.stringify(manifest), {
    ...prettierConfig,
    parser: "json",
})
const registersConfig = (await prettier.resolveConfig(REGISTERS_PATH)) ?? {}
const registersSerialized = await prettier.format(registersSource, {
    ...registersConfig,
    parser: "typescript",
})

function checkFresh(outputPath, expected) {
    const relative = path.relative(ROOT, outputPath)
    let existing = ""
    try {
        existing = readFileSync(outputPath, "utf8")
    } catch {
        console.error(`${relative} is missing — run: npm run codegen:design-manifest`)
        process.exit(1)
    }
    if (existing !== expected) {
        console.error(`${relative} is stale — run: npm run codegen:design-manifest`)
        process.exit(1)
    }
    console.log(`${relative} is fresh.`)
}

const isCheck = process.argv.includes("--check")
if (isCheck) {
    checkFresh(OUTPUT_PATH, serialized)
    checkFresh(REGISTERS_PATH, registersSerialized)
} else {
    writeFileSync(OUTPUT_PATH, serialized)
    writeFileSync(REGISTERS_PATH, registersSerialized)
    const ready = Object.entries(packs)
        .filter(([, pack]) => pack.composeReady)
        .map(([key]) => key)
    console.log(
        `Wrote ${path.relative(ROOT, OUTPUT_PATH)} and ${path.relative(ROOT, REGISTERS_PATH)} — ` +
            `${Object.keys(sections).length} section types, ${Object.keys(packs).length} packs ` +
            `(compose-ready: ${ready.join(", ") || "none"}).`,
    )
}
