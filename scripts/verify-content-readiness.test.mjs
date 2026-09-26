// Unit tests for the content-readiness audit (verify-content-readiness.mjs)
// — the repo-side mirror of the pod content service's resolution rules.
// Each failure class below is a real template bug found in the 2026-09-15
// catalog audit; the tests pin both the rule and the template shape that
// satisfies it, so a content-module refactor that would silently kill the
// workspace Content panel fails here first.

import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
    auditModule,
    auditPack,
    evaluateContentModule,
    normalizeRuntimeContract,
    parseContentPath,
    resolveModulePath,
} from "./verify-content-readiness.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ts = createRequire(path.join(repoRoot, "package.json"))("typescript")

const MODULE_PATH = path.join(repoRoot, "web", "app", "src", "View", "Fake", "content.ts")

/** vm-evaluated values live in another realm (different Object prototype);
 * strict deep equality needs a same-realm copy. */
function plain(value) {
    return JSON.parse(JSON.stringify(value))
}

function sourceFileOf(source) {
    return ts.createSourceFile(MODULE_PATH, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function resolve(source, slotPath) {
    return resolveModulePath(sourceFileOf(source), parseContentPath(slotPath))
}

// ---------------------------------------------------------------------------
// READ side: the vm evaluation mirror.
// ---------------------------------------------------------------------------

test("evaluates default-export, `content`-variable, and named-export module shapes", () => {
    assert.deepEqual(
        plain(evaluateContentModule(MODULE_PATH, "const content = { a: 1 }\nexport default content\n")),
        { a: 1 },
    )
    assert.deepEqual(plain(evaluateContentModule(MODULE_PATH, "export const content = { a: 2 }\n")), { a: 2 })
    const namespace = evaluateContentModule(
        MODULE_PATH,
        'export const gym = { name: "Old Iron" }\nexport const quotes = ["one"]\n',
    )
    assert.equal(namespace.gym.name, "Old Iron")
    assert.deepEqual(plain(namespace.quotes), ["one"])
})

test("type-only imports are erased; helper functions run", () => {
    const value = evaluateContentModule(
        MODULE_PATH,
        [
            'import type { TrackImage } from "../Music/AudioPlayer"',
            "function image(name: string): { src: string; alt: string } {",
            "    return { src: `/x/${name}.webp`, alt: name }",
            "}",
            'export const hero = { photo: image("hero") }',
        ].join("\n"),
    )
    assert.deepEqual(plain(value.hero.photo), { src: "/x/hero.webp", alt: "hero" })
})

test("a VALUE import of another TypeScript module fails evaluation (the repobot-single class)", () => {
    // Node's require cannot load .ts: on the pod this is the Content panel's
    // "load error + zero slots". demoLoops.gen.ts exists — that is the point.
    assert.throws(() =>
        evaluateContentModule(
            MODULE_PATH,
            'import { DEMO_LOOPS } from "../Music/demoLoops.gen"\nexport const record = { seconds: DEMO_LOOPS["single-meridian"].seconds }\n',
        ),
    )
})

// ---------------------------------------------------------------------------
// WRITE side: the AST resolution mirror.
// ---------------------------------------------------------------------------

test("resolves the root literal: default export, default-exported identifier, `content` variable", () => {
    assert.ok(resolve('export default { hero: { title: "t" } }\n', "hero.title"))
    assert.ok(resolve('const c = { hero: { title: "t" } }\nexport default c\n', "hero.title"))
    assert.ok(resolve('export const content = { hero: { title: "t" } }\n', "hero.title"))
})

test("named-export fallback: first path token matches an exported object/array literal", () => {
    const source = 'export const gym = { name: "Old Iron" }\nexport const coaches = [{ name: "Ada" }]\n'
    assert.ok(resolve(source, "gym.name"))
    assert.ok(resolve(source, "coaches[0].name"))
    assert.equal(resolve(source, "missing.name"), undefined)
})

test("a top-level primitive named export resolves as a whole-node leaf (the dispatchBadge class, runtime-side fix 2026-09-15)", () => {
    // The named-export fallback now accepts ANY initializer when the edit
    // path IS the export itself: the writer replaces the whole initializer.
    assert.ok(resolve('export const dispatchBadge = "24/7"\n', "dispatchBadge"))
    assert.ok(resolve('export const business = { dispatchBadge: "24/7" }\n', "business.dispatchBadge"))
    // Deeper walks into a primitive still fail — there is nothing to walk.
    assert.equal(resolve('export const dispatchBadge = "24/7"\n', "dispatchBadge.text"), undefined)
})

test("a top-level call-expression named export resolves as a whole-node leaf (the portrait class)", () => {
    assert.ok(resolve('export const portrait = image("p")\n', "portrait"))
    assert.ok(resolve('export const portrait = { ...image("p") }\n', "portrait"))
    assert.equal(resolve('export const portrait = image("p")\n', "portrait.src"), undefined)
})

test("`satisfies` wrappers are transparent to resolution (the vows/gala/reunion class, runtime-side fix 2026-09-15)", () => {
    // The resolver unwraps satisfies/as/parens at every step; replacements
    // target the inner literal so the wrapper survives edits.
    const wrapped = 'export const story = { chapters: [{ title: "t" }] satisfies Chapter[] }\n'
    const chapters = resolve(wrapped, "story.chapters")
    assert.ok(chapters)
    assert.ok(ts.isArrayLiteralExpression(chapters.node))
    assert.ok(resolve(wrapped, "story.chapters[0].title"))
    const wholeExport = 'export const chapters = [{ title: "t" }] satisfies Chapter[]\n'
    assert.ok(ts.isArrayLiteralExpression(resolve(wholeExport, "chapters").node))
    assert.ok(resolve(wholeExport, "chapters[0].title"))
})

test("only the LEAF may be a non-literal expression", () => {
    // record.cover = image(...) is writable (whole-node replacement) —
    // intermediate tokens must still walk literals.
    const source = 'export const record = { cover: image("c") }\n'
    assert.ok(resolve(source, "record.cover"))
    assert.equal(resolve(source, "record.cover.src"), undefined)
})

// ---------------------------------------------------------------------------
// The audit: one check per failure class the catalog audit found.
// ---------------------------------------------------------------------------

const CONTRACT = normalizeRuntimeContract({
    contentContract: {
        module: "web/app/src/View/Fake/content.ts",
        slots: {
            "hero.title": { kind: "text" },
            portrait: { kind: "media" },
            quotes: { kind: "text[]" },
            coaches: { kind: "collection", item: { name: { kind: "text" }, photo: { kind: "media" } } },
        },
    },
})

const READY_SOURCE = [
    'export const hero = { title: "Title" }',
    'export const portrait = { src: "/p.webp", alt: "p" }',
    'export const quotes = ["one", "two"]',
    "export const coaches = [",
    '    { name: "Ada", photo: { src: "/a.webp", alt: "Ada" } },',
    '    { name: "Blake", photo: { src: "/b.webp", alt: "Blake" } },',
    "]",
].join("\n")

test("a fully resolvable module audits clean", () => {
    const { problems, oddities } = auditModule({
        contract: CONTRACT,
        moduleSource: READY_SOURCE,
        moduleAbsolutePath: MODULE_PATH,
    })
    assert.deepEqual(problems, [])
    assert.deepEqual(oddities, [])
})

test("an optional media slot may be unbound, but its key must still exist for the first write", () => {
    const contract = normalizeRuntimeContract({
        contentContract: {
            module: "m.ts",
            slots: { "home.headline": { kind: "text" }, "home.heroImage": { kind: "media", optional: true } },
        },
    })
    const unbound = auditModule({
        contract,
        moduleSource: 'export const home = { headline: "Hi", heroImage: null }\n',
        moduleAbsolutePath: MODULE_PATH,
    })
    assert.deepEqual(unbound.problems, [])
    assert.match(unbound.oddities.join("\n"), /home\.heroImage': optional media slot is unbound/)

    const keyMissing = auditModule({
        contract,
        moduleSource: 'export const home = { headline: "Hi" }\n',
        moduleAbsolutePath: MODULE_PATH,
    })
    assert.equal(keyMissing.problems.length, 1)
    assert.match(keyMissing.problems[0], /home\.heroImage': not statically resolvable/)

    const required = auditModule({
        contract: normalizeRuntimeContract({
            contentContract: { module: "m.ts", slots: { "home.heroImage": { kind: "media" } } },
        }),
        moduleSource: "export const home = { heroImage: null }\n",
        moduleAbsolutePath: MODULE_PATH,
    })
    assert.match(required.problems.join("\n"), /media slot resolves to no media value/)
})

test("each broken shape is reported: eval failure, unresolvable slot, non-literal collection, missing field", () => {
    const evalBroken = auditModule({
        contract: CONTRACT,
        moduleSource: 'import { X } from "./other"\n' + READY_SOURCE.replace('"Title"', "X"),
        moduleAbsolutePath: MODULE_PATH,
    })
    assert.equal(evalBroken.problems.length, 1)
    assert.match(evalBroken.problems[0], /does not evaluate/)

    // Previously-broken shapes that the hardened resolver now supports:
    // a primitive named-export slot and a satisfies-wrapped collection both
    // audit clean.
    const stringSlot = auditModule({
        contract: normalizeRuntimeContract({
            contentContract: { module: "m.ts", slots: { note: { kind: "text" } } },
        }),
        moduleSource: 'export const note = "loose"\n',
        moduleAbsolutePath: MODULE_PATH,
    })
    assert.deepEqual(stringSlot.problems, [])

    const satisfiesSlot = auditModule({
        contract: normalizeRuntimeContract({
            contentContract: {
                module: "m.ts",
                slots: { "story.chapters": { kind: "collection", item: { title: { kind: "text" } } } },
            },
        }),
        moduleSource: 'export const story = { chapters: [{ title: "t" }] satisfies C[] }\n',
        moduleAbsolutePath: MODULE_PATH,
    })
    assert.deepEqual(satisfiesSlot.problems, [])

    const missingField = auditModule({
        contract: CONTRACT,
        moduleSource: READY_SOURCE.replace(', photo: { src: "/b.webp", alt: "Blake" }', ""),
        moduleAbsolutePath: MODULE_PATH,
    })
    assert.deepEqual(missingField.problems, [])
    assert.ok(missingField.oddities.some((oddity) => oddity.includes("coaches[1].photo")))
})

// ---------------------------------------------------------------------------
// JSON modules — the saas shape: the contract module IS the project manifest,
// read with JSON.parse and written by resolving edit paths against the parsed
// tree (the runtime's readContentModuleValue / writeJsonContentModuleEdits
// JSON branch, added 2026-09-15).
// ---------------------------------------------------------------------------

const JSON_MODULE_PATH = path.join(repoRoot, "repobot.project.json")

const JSON_CONTRACT = normalizeRuntimeContract({
    contentContract: {
        module: "repobot.project.json",
        slots: {
            "marketing.siteName": { kind: "text" },
            "marketing.pages[0].landing.sections[0].content.headline": { kind: "text" },
            "marketing.pages[0].landing.sections[0].content.media": { kind: "media" },
            "marketing.pages[0].landing.sections[1].content.items": { kind: "text[]" },
            "marketing.pages[0].landing.sections[2].content.features": {
                kind: "collection",
                item: { title: { kind: "text" }, description: { kind: "text" } },
            },
        },
    },
})

const JSON_READY_SOURCE = JSON.stringify({
    marketing: {
        siteName: "Outlay",
        pages: [
            {
                id: "home",
                landing: {
                    sections: [
                        {
                            type: "hero",
                            content: {
                                headline: "Move money",
                                media: { src: "/saas/hero.webp", alt: "Hero" },
                            },
                        },
                        { type: "social-proof", content: { items: ["Approvals", "Cards"] } },
                        {
                            type: "feature-grid",
                            content: {
                                features: [
                                    { title: "Fast", description: "Quick" },
                                    { title: "Safe", description: "Sound" },
                                ],
                            },
                        },
                    ],
                },
            },
        ],
    },
})

test("a JSON manifest module audits clean without touching TypeScript", () => {
    const { problems, oddities } = auditModule({
        contract: JSON_CONTRACT,
        moduleSource: JSON_READY_SOURCE,
        moduleAbsolutePath: JSON_MODULE_PATH,
    })
    assert.deepEqual(problems, [])
    assert.deepEqual(oddities, [])
})

test("broken JSON shapes are reported: parse failure, missing path, non-array slot, missing field", () => {
    const parseBroken = auditModule({
        contract: JSON_CONTRACT,
        moduleSource: "{ not json",
        moduleAbsolutePath: JSON_MODULE_PATH,
    })
    assert.equal(parseBroken.problems.length, 1)
    assert.match(parseBroken.problems[0], /does not evaluate in the runtime JSON parser/)

    // The old-saas class: declared paths that don't exist in the manifest.
    const missingPath = auditModule({
        contract: normalizeRuntimeContract({
            contentContract: {
                module: "repobot.project.json",
                slots: { "home.hero.headline": { kind: "text" } },
            },
        }),
        moduleSource: JSON_READY_SOURCE,
        moduleAbsolutePath: JSON_MODULE_PATH,
    })
    assert.ok(missingPath.problems.some((problem) => problem.includes("content_path_missing_in_module")))

    const notArray = auditModule({
        contract: normalizeRuntimeContract({
            contentContract: {
                module: "repobot.project.json",
                slots: { "marketing.siteName": { kind: "text[]" } },
            },
        }),
        moduleSource: JSON_READY_SOURCE,
        moduleAbsolutePath: JSON_MODULE_PATH,
    })
    assert.ok(notArray.problems.some((problem) => problem.includes("no array")))

    const missingField = auditModule({
        contract: JSON_CONTRACT,
        moduleSource: JSON_READY_SOURCE.replace(',"description":"Sound"', ""),
        moduleAbsolutePath: JSON_MODULE_PATH,
    })
    assert.deepEqual(missingField.problems, [])
    assert.ok(missingField.oddities.some((oddity) => oddity.includes("features[1].description")))
})

test("a manifest-module contract audits the pack's stamped copy, not the kernel root manifest", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "content-readiness-json-"))
    try {
        mkdirSync(path.join(root, "packs", "saasish"), { recursive: true })
        // The kernel's root manifest is empty — auditing it would report
        // every slot missing. Compose stamps the pack's own manifest over
        // it, and the audit must follow.
        writeFileSync(
            path.join(root, "repobot.project.json"),
            JSON.stringify({ marketing: { pages: [] }, dashboard: { destinations: [] } }),
        )
        writeFileSync(
            path.join(root, "packs", "saasish", "catalog.json"),
            JSON.stringify({
                key: "saasish",
                templateKey: "repobot-saasish",
                contentContract: {
                    module: "repobot.project.json",
                    slots: { "marketing.siteName": { kind: "text" } },
                },
            }),
        )
        writeFileSync(
            path.join(root, "packs", "saasish", "repobot.project.json"),
            JSON.stringify({ marketing: { siteName: "Outlay", pages: [] } }),
        )
        assert.equal(auditPack(root, "saasish").status, "ready")
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})

test("remix packs audit the contentSeed against the BASE pack's contract", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "content-readiness-"))
    try {
        mkdirSync(path.join(root, "packs", "base"), { recursive: true })
        mkdirSync(path.join(root, "packs", "remix"), { recursive: true })
        mkdirSync(path.join(root, "web", "app", "src", "View", "Base"), { recursive: true })
        writeFileSync(
            path.join(root, "packs", "base", "catalog.json"),
            JSON.stringify({
                key: "base",
                templateKey: "repobot-base-pack",
                contentContract: {
                    module: "web/app/src/View/Base/content.ts",
                    slots: { "hero.title": { kind: "text" } },
                },
            }),
        )
        writeFileSync(
            path.join(root, "packs", "remix", "catalog.json"),
            JSON.stringify({
                key: "remix",
                templateKey: "repobot-remix-pack",
                remixOf: "base",
                contentSeed: "web/app/src/View/Base/remix.content.ts",
            }),
        )
        writeFileSync(
            path.join(root, "web", "app", "src", "View", "Base", "content.ts"),
            'export const hero = { title: "Base" }\n',
        )
        // The seed misses the contract's slot — the remix must be the one
        // reported broken, proving the seed (not the base module) is audited.
        writeFileSync(
            path.join(root, "web", "app", "src", "View", "Base", "remix.content.ts"),
            'export const other = { thing: "x" }\n',
        )
        assert.equal(auditPack(root, "base").status, "ready")
        const remix = auditPack(root, "remix")
        assert.equal(remix.status, "broken")
        assert.ok(remix.problems.some((problem) => problem.includes("hero.title")))
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})
