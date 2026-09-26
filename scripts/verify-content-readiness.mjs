// Content-editing readiness gate: statically verifies that every pack whose
// catalog declares a contentContract is actually editable by the platform's
// pod-side content service (the workspace Content panel).
//
// The pod runtime (platform repo, Services/Project/Infra/WebrtcRuntime/src/
// SandboxWorkspace.mjs) resolves a template's content in two independent
// ways, and a pack must satisfy BOTH:
//
//   READ (inventory): the module named by contentContract.module is
//   transpiled per-file (ts.transpileModule -> CommonJS) and evaluated in a
//   bare Node vm whose `require` is Node's own. The exported value is
//   exports.default ?? exports.content ?? the whole namespace object. This
//   means the module cannot VALUE-import other TypeScript files — Node's
//   require cannot load .ts, so the eval throws and the panel shows a load
//   error with zero slots (the repobot-single incident, 2026-09-15).
//
//   WRITE (edits): the module is re-parsed as a TS AST and each edit path is
//   resolved structurally — the root literal is the default-exported
//   object/array literal, a default-exported identifier's initializer, a
//   `content` variable, or (named-export fallback) the first path token
//   matched against an exported variable whose initializer is an object or
//   array literal. Intermediate path tokens must walk object/array LITERALS;
//   only the leaf may be any expression. So a top-level slot whose named
//   export is a helper call (`export const portrait = image(...)`) is
//   readable but not writable.
//
// JSON modules (a contract module ending in .json — the saas shape, whose
// module IS the project manifest) bypass both TS paths on the runtime:
// reads are JSON.parse and writes resolve edit paths against the parsed
// tree (every intermediate token must already exist), then re-serialize.
// The audit mirrors that: a slot is writable iff its path resolves in the
// parsed JSON. And because compose-pack.sh stamps a pack-owned manifest
// (packs/<key>/repobot.project.json) over the kernel's empty root manifest,
// the pack's copy is the source audited when the contract module is the
// manifest itself.
//
// The resolution logic below is a faithful mirror of the runtime's
// (resolveRootLiteral / namedExportLiteral / resolveModulePath /
// resolveLiteralPath, and readContentModuleValue's transpile-and-eval).
// Keep the two in step when the runtime's rules change.
//
// Derived templates (catalog `remixOf` + `contentSeed`) compose as the BASE
// pack — packs/active.json carries the base key and the seed module is
// copied over the base's contentContract.module — so a remix is audited as
// the base pack's contract against the seed module's source.
//
// Usage:  node scripts/verify-content-readiness.mjs [--matrix]
//   --matrix  print the full template readiness matrix (default prints
//             problems only). Exits 1 when any contract-bearing pack fails.

import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"
import vm from "node:vm"

import { isEntrypoint } from "./lib/is-entry.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const requireFromRepo = createRequire(path.join(repoRoot, "package.json"))
const ts = requireFromRepo("typescript")

// ---------------------------------------------------------------------------
// Contract normalization — mirror of the runtime's normalizeContentContract.
// NOTE the runtime's slot-kind vocabulary is a SUBSET of the catalog
// validator's (design-vocabulary.mjs allows "number"; the runtime drops it),
// so a "number" slot silently vanishes from the panel — reported as an
// oddity below.
// ---------------------------------------------------------------------------

const RUNTIME_SLOT_KINDS = new Set(["text", "text[]", "media", "media[]", "collection"])

function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeCollectionItemKinds(slot) {
    const fieldKinds = {}
    const mapped = isRecord(slot.item)
        ? slot.item
        : isRecord(slot.fields)
          ? slot.fields
          : isRecord(slot.itemKinds)
            ? slot.itemKinds
            : undefined
    if (mapped) {
        for (const [field, raw] of Object.entries(mapped)) {
            if (typeof raw === "string" && (raw === "text" || raw === "media")) {
                fieldKinds[field] = raw
            } else if (isRecord(raw) && (raw.kind === "text" || raw.kind === "media")) {
                fieldKinds[field] = raw.kind
            }
        }
    }
    return fieldKinds
}

export function normalizeRuntimeContract(catalog) {
    if (!isRecord(catalog?.contentContract)) {
        return undefined
    }
    const contract = catalog.contentContract
    const modulePath =
        typeof contract.module === "string" && contract.module.length > 0 ? contract.module : undefined
    if (!modulePath) {
        return undefined
    }
    const rawSlots = isRecord(contract.slots)
        ? contract.slots
        : Object.fromEntries(Object.entries(contract).filter(([key]) => key !== "module"))
    const slots = {}
    const droppedKinds = []
    for (const [slotPath, rawSlot] of Object.entries(rawSlots)) {
        if (!isRecord(rawSlot)) {
            continue
        }
        const kind = typeof rawSlot.kind === "string" ? rawSlot.kind : undefined
        if (!kind || !RUNTIME_SLOT_KINDS.has(kind)) {
            if (kind !== undefined && !slotPath.startsWith("$")) {
                droppedKinds.push(`${slotPath} (kind '${kind}')`)
            }
            continue
        }
        slots[slotPath] = {
            kind,
            optional: rawSlot.optional === true,
            collectionItemKinds: kind === "collection" ? normalizeCollectionItemKinds(rawSlot) : undefined,
        }
    }
    if (Object.keys(slots).length === 0) {
        return undefined
    }
    return { modulePath, slots, droppedKinds }
}

// ---------------------------------------------------------------------------
// Slot paths — mirror of the runtime's parseContentPath / readValueAtTokens /
// mediaValueForInventory.
// ---------------------------------------------------------------------------

const contentPathToken = /([A-Za-z0-9_$-]+)|\[(\d+)\]/g

export function parseContentPath(pathValue) {
    if (typeof pathValue !== "string" || pathValue.trim().length === 0) {
        return undefined
    }
    const tokens = []
    const matches = [...pathValue.matchAll(contentPathToken)]
    if (matches.length === 0) {
        return undefined
    }
    for (const match of matches) {
        if (match[1] !== undefined) {
            tokens.push({ kind: "prop", key: match[1] })
        } else if (match[2] !== undefined) {
            tokens.push({ kind: "index", index: Number(match[2]) })
        }
    }
    const canonical = tokens
        .map((token) => (token.kind === "prop" ? token.key : `[${token.index}]`))
        .join(".")
        .replace(/\.\[/g, "[")
    if (canonical !== pathValue) {
        return undefined
    }
    return tokens
}

function readValueAtTokens(value, tokens) {
    let current = value
    for (const token of tokens) {
        if (token.kind === "prop") {
            if (!isRecord(current) && !Array.isArray(current)) {
                return undefined
            }
            current = current[token.key]
            continue
        }
        if (!Array.isArray(current) || token.index < 0 || token.index >= current.length) {
            return undefined
        }
        current = current[token.index]
    }
    return current
}

function mediaValueForInventory(value) {
    if (typeof value === "string" && value.length > 0) {
        return { src: value, alt: "" }
    }
    if (isRecord(value) && typeof value.src === "string" && value.src.length > 0) {
        return { src: value.src, alt: typeof value.alt === "string" ? value.alt : "" }
    }
    return null
}

// ---------------------------------------------------------------------------
// READ side — mirror of the runtime's readContentModuleValue: per-file
// transpile to CommonJS, evaluated in a vm whose require is Node's own
// (so value-imports of sibling .ts files throw MODULE_NOT_FOUND exactly
// like they do on the pod).
// ---------------------------------------------------------------------------

export function evaluateContentModule(absolutePath, source) {
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            esModuleInterop: true,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            jsx: ts.JsxEmit.Preserve,
        },
        fileName: absolutePath,
    })
    const module = { exports: {} }
    const context = {
        module,
        exports: module.exports,
        require: createRequire(absolutePath),
        __dirname: path.dirname(absolutePath),
        __filename: absolutePath,
        process,
        Buffer,
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
    }
    vm.createContext(context)
    const script = new vm.Script(transpiled.outputText, { filename: absolutePath })
    script.runInContext(context)
    const exported = module.exports
    if (isRecord(exported) && "default" in exported) {
        return exported.default
    }
    if (isRecord(exported) && "content" in exported) {
        return exported.content
    }
    return exported
}

// ---------------------------------------------------------------------------
// WRITE side — mirror of the runtime's AST resolution: resolveRootLiteral,
// namedExportLiteral (named-export fallback), resolveModulePath,
// resolveLiteralPath.
// ---------------------------------------------------------------------------

function isNodeExported(node) {
    return (
        Array.isArray(node.modifiers) &&
        node.modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    )
}

function propertyNameText(propertyName) {
    if (propertyName === undefined) {
        return undefined
    }
    if (ts.isIdentifier(propertyName) || ts.isPrivateIdentifier(propertyName)) {
        return propertyName.text
    }
    if (ts.isStringLiteral(propertyName) || ts.isNumericLiteral(propertyName)) {
        return propertyName.text
    }
    return undefined
}

/**
 * Strip type-level wrappers off an expression: `satisfies T`, `as T`, and
 * parentheses — mirror of the runtime's unwrapContentExpression (added
 * 2026-09-15 after the content audit; the runtime edits target the inner
 * literal and the wrapper survives). Guarded isSatisfiesExpression: older
 * TypeScript builds predate 4.9.
 */
function unwrapContentExpression(node) {
    let current = node
    while (
        current &&
        (ts.isSatisfiesExpression?.(current) ||
            ts.isAsExpression(current) ||
            ts.isParenthesizedExpression(current))
    ) {
        current = current.expression
    }
    return current
}

/** The unwrapped initializer, if it is an object/array literal. */
function literalOf(expression) {
    const unwrapped = expression === undefined ? undefined : unwrapContentExpression(expression)
    if (unwrapped && (ts.isObjectLiteralExpression(unwrapped) || ts.isArrayLiteralExpression(unwrapped))) {
        return unwrapped
    }
    return undefined
}

function resolveRootLiteral(sourceFile) {
    const vars = new Map()
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) {
            continue
        }
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.initializer) {
                vars.set(declaration.name.text, declaration.initializer)
            }
        }
    }
    for (const statement of sourceFile.statements) {
        if (ts.isExportAssignment(statement)) {
            if (statement.isExportEquals) {
                continue
            }
            const direct = literalOf(statement.expression)
            if (direct) {
                return direct
            }
            const unwrapped = unwrapContentExpression(statement.expression)
            if (ts.isIdentifier(unwrapped)) {
                const viaVar = literalOf(vars.get(unwrapped.text))
                if (viaVar) {
                    return viaVar
                }
            }
        }
    }
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement) || !isNodeExported(statement)) {
            continue
        }
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === "content") {
                const literal = literalOf(declaration.initializer)
                if (literal) {
                    return literal
                }
            }
        }
    }
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) {
            continue
        }
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === "content") {
                const literal = literalOf(declaration.initializer)
                if (literal) {
                    return literal
                }
            }
        }
    }
    return undefined
}

function namedExportLiteral(sourceFile, name) {
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) {
            continue
        }
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
                const literal = literalOf(declaration.initializer)
                if (literal) {
                    return literal
                }
            }
        }
    }
    return undefined
}

/**
 * A named export whose initializer is anything at all — the primitive-leaf
 * shape (`export const dispatchBadge = "24/7"`). Only consulted when the
 * edit path IS the export itself; mirror of the runtime's
 * namedExportInitializer.
 */
function namedExportInitializer(sourceFile, name) {
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) {
            continue
        }
        for (const declaration of statement.declarationList.declarations) {
            if (
                ts.isIdentifier(declaration.name) &&
                declaration.name.text === name &&
                declaration.initializer
            ) {
                return unwrapContentExpression(declaration.initializer)
            }
        }
    }
    return undefined
}

function lookupPropertyAssignment(objectLiteral, key) {
    for (const property of objectLiteral.properties) {
        if (!ts.isPropertyAssignment(property)) {
            continue
        }
        if (propertyNameText(property.name) === key) {
            return property
        }
    }
    return undefined
}

function resolveLiteralPath(rootNode, tokens) {
    let current = unwrapContentExpression(rootNode)
    let parent
    for (const token of tokens) {
        parent = current
        if (token.kind === "prop") {
            if (!ts.isObjectLiteralExpression(current)) {
                return undefined
            }
            const prop = lookupPropertyAssignment(current, token.key)
            if (!prop) {
                return undefined
            }
            current = unwrapContentExpression(prop.initializer)
        } else {
            if (!ts.isArrayLiteralExpression(current)) {
                return undefined
            }
            const element = current.elements[token.index]
            if (!element) {
                return undefined
            }
            current = unwrapContentExpression(element)
        }
    }
    return { parent, node: current }
}

export function resolveModulePath(sourceFile, tokens) {
    const root = resolveRootLiteral(sourceFile)
    if (root) {
        const resolved = resolveLiteralPath(root, tokens)
        if (resolved) {
            return resolved
        }
    }
    const [head, ...rest] = tokens
    if (head?.kind === "prop") {
        const named = namedExportLiteral(sourceFile, head.key)
        if (named) {
            const resolved = resolveLiteralPath(named, rest)
            if (resolved) {
                return resolved
            }
        }
        if (rest.length === 0) {
            const leaf = namedExportInitializer(sourceFile, head.key)
            if (leaf) {
                return { parent: undefined, node: leaf }
            }
        }
    }
    return undefined
}

// ---------------------------------------------------------------------------
// The audit itself.
// ---------------------------------------------------------------------------

/**
 * Audit one contract-bearing module: `problems` is empty when every declared
 * slot is readable (inventory) AND writable (AST resolution), `oddities`
 * carries non-fatal notes.
 */
export function auditModule({ contract, moduleSource, moduleAbsolutePath }) {
    const problems = []
    const oddities = []
    const isJsonModule = moduleAbsolutePath.endsWith(".json")

    // READ: the module must evaluate, or the panel dies with a load error.
    // JSON modules are read with JSON.parse on the runtime (never the
    // transpile+vm path — TS transpile of JSON dies with "Debug Failure").
    let contentValue
    try {
        contentValue = isJsonModule
            ? JSON.parse(moduleSource)
            : evaluateContentModule(moduleAbsolutePath, moduleSource)
    } catch (error) {
        problems.push(
            `module does not evaluate in the runtime ${isJsonModule ? "JSON parser" : "vm"} (panel load error, zero slots): ${String(error?.message ?? error).split("\n")[0]}`,
        )
        return { problems, oddities }
    }

    const sourceFile = isJsonModule
        ? undefined
        : ts.createSourceFile(
              moduleAbsolutePath,
              moduleSource,
              ts.ScriptTarget.Latest,
              true,
              ts.ScriptKind.TS,
          )

    let rows = 0
    for (const [slotPath, slot] of Object.entries(contract.slots)) {
        const tokens = parseContentPath(slotPath)
        if (!tokens) {
            problems.push(`slot '${slotPath}': path does not parse (skipped by the runtime)`)
            continue
        }
        const value = readValueAtTokens(contentValue, tokens)

        // READ per kind. An optional text/media slot may be unbound (the
        // module declares the key as null/undefined): the panel shows an
        // empty row the owner can fill. The WRITE check below still holds —
        // the key must exist for that first edit to land.
        if (slot.optional && (slot.kind === "text" || slot.kind === "media") && value == null) {
            oddities.push(
                `slot '${slotPath}': optional ${slot.kind} slot is unbound (an empty row in the panel)`,
            )
            rows += 1
        } else if (slot.kind === "text") {
            if (typeof value !== "string") {
                problems.push(`slot '${slotPath}': text slot resolves to no string in the module`)
            }
            rows += 1
        } else if (slot.kind === "media") {
            if (!mediaValueForInventory(value)) {
                problems.push(`slot '${slotPath}': media slot resolves to no media value`)
            }
            rows += 1
        } else {
            if (!Array.isArray(value)) {
                problems.push(`slot '${slotPath}': ${slot.kind} slot resolves to no array`)
            } else if (value.length === 0) {
                oddities.push(`slot '${slotPath}': empty ${slot.kind} (no rows in the panel)`)
            } else {
                rows += value.length
            }
        }

        // WRITE per kind. JSON modules mirror the runtime's resolveJsonPath:
        // an edit path is writable iff it already resolves in the parsed
        // tree (sets replace values, they never create structure), so the
        // read-side value doubles as the write-side resolution.
        if (isJsonModule) {
            if (slot.kind === "text" || slot.kind === "media") {
                if (value === undefined) {
                    problems.push(
                        `slot '${slotPath}': not resolvable in the JSON module — edits throw content_path_missing_in_module`,
                    )
                }
                continue
            }
            if (!Array.isArray(value)) {
                problems.push(
                    `slot '${slotPath}': ${slot.kind} slot is not an array in the JSON module — element edits and deletes fail`,
                )
                continue
            }
            if (slot.kind === "collection") {
                const fields = Object.keys(slot.collectionItemKinds ?? {})
                value.forEach((element, index) => {
                    if (!isRecord(element)) {
                        oddities.push(
                            `slot '${slotPath}[${index}]': element is not an object — field edits fail`,
                        )
                        return
                    }
                    for (const field of fields) {
                        if (!(field in element)) {
                            oddities.push(
                                `slot '${slotPath}[${index}].${field}': field missing from the element — that edit fails`,
                            )
                        }
                    }
                })
            }
            continue
        }
        const resolved = resolveModulePath(sourceFile, tokens)
        if (slot.kind === "text" || slot.kind === "media") {
            if (!resolved) {
                problems.push(
                    `slot '${slotPath}': not statically resolvable — edits throw content_path_missing_in_module`,
                )
            }
            continue
        }
        // Array-backed slots: element writes/deletes resolve `slot[i]`
        // against the slot's array literal.
        if (!resolved || !ts.isArrayLiteralExpression(resolved.node)) {
            problems.push(
                `slot '${slotPath}': ${slot.kind} slot is not an array literal in the module — element edits and deletes fail`,
            )
            continue
        }
        if (slot.kind === "collection") {
            const fields = Object.keys(slot.collectionItemKinds ?? {})
            resolved.node.elements.forEach((element, index) => {
                if (!ts.isObjectLiteralExpression(element)) {
                    oddities.push(
                        `slot '${slotPath}[${index}]': element is not an object literal — field edits fail`,
                    )
                    return
                }
                for (const field of fields) {
                    if (!lookupPropertyAssignment(element, field)) {
                        oddities.push(
                            `slot '${slotPath}[${index}].${field}': field missing from the element literal — that edit fails`,
                        )
                    }
                }
            })
        }
    }
    if (rows === 0) {
        problems.push("inventory is empty (the panel lists no editable content)")
    }
    return { problems, oddities }
}

/** Audit a pack by key; remixes are expanded the way compose does. */
export function auditPack(root, packKey) {
    const catalogPath = path.join(root, "packs", packKey, "catalog.json")
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"))
    const isRemix = typeof catalog.remixOf === "string" && catalog.remixOf.length > 0
    const effective = isRemix
        ? JSON.parse(readFileSync(path.join(root, "packs", catalog.remixOf, "catalog.json"), "utf8"))
        : catalog
    const contract = normalizeRuntimeContract(effective)
    if (!contract) {
        return {
            packKey,
            templateKey: catalog.templateKey,
            status: "no-contract",
            problems: [],
            oddities: [],
        }
    }
    const oddities = []
    if (contract.droppedKinds.length > 0) {
        oddities.push(`slots dropped by the runtime's kind vocabulary: ${contract.droppedKinds.join(", ")}`)
    }
    // A remix composes as the base pack with its contentSeed copied over the
    // base's contract module, so the seed is the source the runtime sees.
    const moduleRelative =
        isRemix && typeof catalog.contentSeed === "string" ? catalog.contentSeed : contract.modulePath
    // A pack may ship its own project manifest (packs/<key>/
    // repobot.project.json); compose-pack.sh stamps it over the kernel's
    // empty manifest at the repo root. When the contract module IS the
    // manifest (the saas shape), the pack's copy — the BASE pack's, for a
    // remix, since packs/active.json carries the base key — is the source
    // the runtime sees, not the repo root's kernel default.
    const stampedManifestPath = path.join(root, "packs", isRemix ? catalog.remixOf : packKey, moduleRelative)
    const moduleAbsolutePath =
        moduleRelative === "repobot.project.json" && existsSync(stampedManifestPath)
            ? stampedManifestPath
            : path.join(root, moduleRelative)
    if (!existsSync(moduleAbsolutePath)) {
        return {
            packKey,
            templateKey: catalog.templateKey,
            status: "broken",
            problems: [`content module missing: ${moduleRelative}`],
            oddities,
        }
    }
    const audit = auditModule({
        contract,
        moduleSource: readFileSync(moduleAbsolutePath, "utf8"),
        moduleAbsolutePath,
    })
    return {
        packKey,
        templateKey: catalog.templateKey,
        status: audit.problems.length > 0 ? "broken" : "ready",
        problems: audit.problems,
        oddities: [...oddities, ...audit.oddities],
    }
}

function main() {
    const matrix = process.argv.includes("--matrix")
    const packsDir = path.join(repoRoot, "packs")
    const packKeys = readdirSync(packsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((key) => existsSync(path.join(packsDir, key, "catalog.json")))

    const results = packKeys.map((key) => auditPack(repoRoot, key))
    const broken = results.filter((result) => result.status === "broken")

    for (const result of results) {
        if (result.status === "broken") {
            console.error(`BROKEN  ${result.packKey} (${result.templateKey ?? "?"})`)
            for (const problem of result.problems) {
                console.error(`        - ${problem}`)
            }
        } else if (matrix) {
            console.log(
                `${result.status === "ready" ? "ready  " : "no-slot"} ${result.packKey} (${result.templateKey ?? "?"})`,
            )
        }
        if (matrix) {
            for (const oddity of result.oddities) {
                console.log(`        ~ ${oddity}`)
            }
        }
    }
    const withContract = results.filter((result) => result.status !== "no-contract")
    console.log(
        `content readiness: ${withContract.length - broken.length}/${withContract.length} contract-bearing packs ready` +
            ` (${results.length - withContract.length} packs without content contracts)`,
    )
    if (broken.length > 0) {
        process.exit(1)
    }
}

if (isEntrypoint(import.meta.url)) {
    main()
}
