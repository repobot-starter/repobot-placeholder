// Every pack catalog must declare its base-template family: the platform's
// workspace groups projects around ~4 configurable bases and presents
// complete vertical starters separately, and `base` is the catalog field
// that declares which family a pack belongs to (the physical clustering —
// e.g. the View/Site packs — carries no such label on its own). A pack that
// omits it would silently fall out of the workspace taxonomy, so this gate
// makes the field impossible to forget.
//
// The vocabulary is append-only and mirrored by the platform's
// TemplateRegistry (packs/README.md): never rename or remove a value, only
// add. `isBase`, when present, must be exactly `true` — it marks the one
// canonical configurable base of a family; starter projects omit it.
//
// It also gates the design-space conventions (packs/README.md): landing
// seeds must be valid against the kernel vocabulary, contentContract must be
// well-formed when declared, and composeReady is computed by the manifest
// generator — a catalog that hand-declares it fails here.
//
// Exits clean when there is no packs/ directory (nothing to validate).

import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
    contentContractProblems,
    landingSeedProblems,
    parseDesignVocabulary,
} from "./lib/design-vocabulary.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const packsDir = path.join(repoRoot, "packs")

// Append-only; mirrored by the platform's TemplateRegistry.
const BASE_VALUES = ["landing", "app", "store", "game", "content"]

if (!existsSync(packsDir)) process.exit(0)

const packKeys = readdirSync(packsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((key) => existsSync(path.join(packsDir, key, "catalog.json")))

const vocabulary = parseDesignVocabulary(repoRoot)

// A derived template (catalog `remixOf`, packs/README.md "Derived
// templates") is a thin catalog: identity + brand + content seed, everything
// else inherited from the base pack at compose time. Validate exactly that
// thinness — a remix that re-declares inherited surfaces would silently
// diverge from its base the day the base changes.
const REMIX_INHERITED_FIELDS = [
    "base",
    "isBase",
    "isFeature",
    "homeViewDir",
    "homePath",
    "contentContract",
    "clientOnly",
    "capabilities",
    "authMethods",
]
function remixProblems(key, catalog) {
    const found = []
    const basePath = path.join(packsDir, catalog.remixOf, "catalog.json")
    if (!existsSync(basePath)) {
        found.push(`remix '${key}': base pack '${catalog.remixOf}' has no catalog`)
        return found
    }
    const base = JSON.parse(readFileSync(basePath, "utf8"))
    if (base.remixOf !== undefined) {
        found.push(`remix '${key}': base '${catalog.remixOf}' is itself a remix — derive from a real pack`)
    }
    if (typeof catalog.templateKey !== "string" || typeof catalog.title !== "string") {
        found.push(`remix '${key}': must declare its own templateKey and title`)
    }
    if (typeof catalog.contentSeed !== "string") {
        found.push(`remix '${key}': must declare contentSeed (the module composed over the base's content)`)
    } else if (!existsSync(path.join(repoRoot, catalog.contentSeed))) {
        found.push(`remix '${key}': contentSeed '${catalog.contentSeed}' does not exist`)
    } else if (catalog.contentSeed === base.contentContract?.module) {
        found.push(`remix '${key}': contentSeed must be a seed file, not the base's content module itself`)
    }
    for (const field of REMIX_INHERITED_FIELDS) {
        if (field in catalog) {
            found.push(`remix '${key}': '${field}' is inherited from the base pack — remove it`)
        }
    }
    // A remix may re-register its surface: compose (scripts/lib/pack-switch.mjs
    // resolveCatalog) merges a remix's `landing` over the base's, keeping the
    // base's routes and page seeds. So the only landing a remix may carry is
    // the style overlay — a register override, nothing structural.
    if ("landing" in catalog) {
        const overlayKeys = Object.keys(catalog.landing).filter((k) => k !== "$comment")
        const styleOnly = overlayKeys.length === 1 && overlayKeys[0] === "style"
        if (!styleOnly || typeof catalog.landing.style?.preset !== "string") {
            found.push(
                `remix '${key}': 'landing' may only be a register override ` +
                    `({ style: { preset } }, merged over the base's landing by compose) — ` +
                    `routes and pages are inherited from the base pack`,
            )
        }
    }
    return found
}

const problems = []
for (const key of packKeys) {
    const catalog = JSON.parse(readFileSync(path.join(packsDir, key, "catalog.json"), "utf8"))
    if (catalog.remixOf !== undefined) {
        problems.push(...remixProblems(key, catalog))
        continue
    }
    if (!BASE_VALUES.includes(catalog.base)) {
        problems.push(
            `pack '${key}': catalog.json must declare "base" as one of ` +
                `${BASE_VALUES.join(" | ")} (got ${JSON.stringify(catalog.base)})`,
        )
    }
    if ("isBase" in catalog && catalog.isBase !== true) {
        problems.push(`pack '${key}': "isBase" must be exactly true when present (omit it otherwise)`)
    }
    if ("isFeature" in catalog && catalog.isFeature !== true) {
        problems.push(`pack '${key}': "isFeature" must be exactly true when present (omit it otherwise)`)
    }
    if ("composeReady" in catalog) {
        problems.push(
            `pack '${key}': "composeReady" is computed by generate-design-manifest.mjs, ` +
                `never declared — remove it`,
        )
    }
    if (catalog.landing !== undefined) {
        for (const problem of landingSeedProblems(catalog.landing, vocabulary)) {
            problems.push(`pack '${key}': landing ${problem}`)
        }
        // The catalog is the ONLY authority for a pack's register: kernel
        // code derives its pins from packRegisters.gen.ts (generated from
        // this field), compose stamps it into the project's landing
        // document, and remix re-values only a declared preset. A landing
        // surface without one would fall back to the kernel default
        // (editorial) whenever composition is skipped — exactly how
        // photography shipped wearing the wrong register.
        if (catalog.landing.style?.preset === undefined) {
            problems.push(
                `pack '${key}': a landing surface must declare landing.style.preset ` +
                    `(the pack's register — see packs/README.md)`,
            )
        }
    }
    if (catalog.contentContract !== undefined) {
        for (const problem of contentContractProblems(catalog.contentContract)) {
            problems.push(`pack '${key}': ${problem}`)
        }
        if (
            typeof catalog.contentContract.module === "string" &&
            !existsSync(path.join(repoRoot, catalog.contentContract.module))
        ) {
            problems.push(
                `pack '${key}': contentContract.module ` +
                    `'${catalog.contentContract.module}' does not exist`,
            )
        }
    }
}

// Approved packs must be compose-ready: approval puts a pack in the template
// picker, and the Imagine flow (design-space compose) renders only for
// compose-ready packs — approving one that isn't quietly ships a template
// where "imagine your own" goes dark. Compose-readiness is the authoring bar
// (valid landing seeds + a valid content contract, the same derivation
// generate-design-manifest.mjs computes), so this gate makes it part of the
// approval bar rather than a separate thing to remember. Exempt: blank (the
// definitionally content-less starter — its Imagine story is a product
// decision, not an authoring gap), game packs (compose arranges marketing
// documents; a game's product is the game), and feature packs (one-page
// tools — their product is the feature, and the picker presents them as
// features, not as composable marketing sites).
const approvedPath = path.join(repoRoot, "packs", "approved.json")
if (existsSync(approvedPath)) {
    const approved = JSON.parse(readFileSync(approvedPath, "utf8")).packs
    for (const key of approved) {
        if (key === "blank") continue
        const catalogPath = path.join(packsDir, key, "catalog.json")
        if (!existsSync(catalogPath)) {
            problems.push(`approved pack '${key}' has no catalog (${catalogPath})`)
            continue
        }
        let catalog = JSON.parse(readFileSync(catalogPath, "utf8"))
        // An approved derived template is compose-ready exactly when its
        // base pack is: the seeds and contract it composes with are the
        // base's own (the remix branch above already validated the seed).
        if (catalog.remixOf !== undefined) {
            const baseCatalogPath = path.join(packsDir, catalog.remixOf, "catalog.json")
            if (!existsSync(baseCatalogPath)) continue // already reported above
            catalog = JSON.parse(readFileSync(baseCatalogPath, "utf8"))
        }
        if (catalog.base === "game") continue
        if (catalog.isFeature === true) continue
        const seedsValid =
            catalog.landing?.routes !== undefined &&
            catalog.landing?.pages !== undefined &&
            landingSeedProblems(catalog.landing, vocabulary).length === 0
        const contractValid =
            catalog.contentContract !== undefined &&
            contentContractProblems(catalog.contentContract).length === 0
        if (!seedsValid || !contractValid) {
            problems.push(
                `approved pack '${key}' is not compose-ready ` +
                    `(${seedsValid ? "" : "missing/invalid landing seeds"}` +
                    `${!seedsValid && !contractValid ? "; " : ""}` +
                    `${contractValid ? "" : "missing/invalid contentContract"}) — ` +
                    `approval requires the design-space authoring bar (packs/README.md)`,
            )
        }
    }
}

// Approved standalone templates (templates/approved.json — the parallel
// manifest for repos that are not packs on the web kernel, e.g. the Shopify
// themes) must resolve: the platform's publish-templates.sh enumerates its
// default publish set from this file and resolves each key through
// templates/<key>/template.json, so a typo'd or removed key would silently
// drop a template out of the republish lane and hand the config doctor's
// template_sync check a permanently stale repo on the next kernel advance.
const approvedTemplatesPath = path.join(repoRoot, "templates", "approved.json")
if (existsSync(approvedTemplatesPath)) {
    const approvedTemplates = JSON.parse(readFileSync(approvedTemplatesPath, "utf8")).templates
    for (const key of approvedTemplates) {
        const templateJsonPath = path.join(repoRoot, "templates", key, "template.json")
        if (!existsSync(templateJsonPath)) {
            problems.push(`approved standalone template '${key}' has no template.json (${templateJsonPath})`)
            continue
        }
        const template = JSON.parse(readFileSync(templateJsonPath, "utf8"))
        if (typeof template.templateKey !== "string" || template.templateKey.length === 0) {
            problems.push(
                `approved standalone template '${key}': template.json has no templateKey ` +
                    `(publish-templates.sh names the GitHub template repo from it)`,
            )
        }
    }
}

if (problems.length > 0) {
    console.error("Pack catalog taxonomy check failed:\n")
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error("\nSee packs/README.md (catalog.json contract) for the base vocabulary.")
    process.exit(1)
}
