// Public-asset ownership for compose-time pruning, shared by compose-pack.sh
// (which prunes the staged tree), scripts/template-pack-ref.sh (the per-pack
// publish stamp hashes exactly what survives pruning), and the composed-tree
// verification gate. One implementation decides what a composed template
// keeps, so the pruner, the stamp, and the safety net can never disagree.
//
// The ownership rule: a top-level web/app/public/<dir> is PACK-OWNED when a
// pack of the same key exists (packs/<dir>/catalog.json) — the repo's
// convention is one imagery subtree per pack, named by the pack key.
// Everything else under public/ (favicons, robots.txt, fonts/, brand/, and
// any subtree no pack claims, e.g. showcase/ or samples/) is kernel-shared
// and ships in every composed tree. A composed tree keeps:
//
//   - every kernel-shared entry,
//   - the active chain's own subtrees (the pack's, plus its remix base's —
//     a derived template IS its base pack wearing different content), and
//   - any pack-owned subtree the tree's LIVE sources actually reference.
//
// "Live sources" are everything that executes or renders for this pack:
// shared kernel code, the chain's view dirs and pack dirs, the root contract
// documents. Other packs' pack dirs, their home view dirs, and other
// remixes' content seeds ship in the tree (compose copies the whole kernel)
// but are dead code behind the pack switch, so a reference that only exists
// there does not pin another pack's imagery into this template. References
// are literal `/<dir>/` path mentions at a string-literal boundary — the
// repo's only convention for public paths (src: "…/hero.webp" and template
// literals rooted at the subtree); when a scan can't prove a subtree is
// unused, the caller keeps it (correctness over minimality).
//
// CLI (what compose-pack.sh and template-pack-ref.sh exec):
//   node scripts/lib/public-assets.mjs plan <pack-key>          keep/prune JSON
//   node scripts/lib/public-assets.mjs pruned <pack-key>        pruned dirs, one per line
//   node scripts/lib/public-assets.mjs prune <pack-key> <tree>  prune a composed tree + write manifest + verify
//   node scripts/lib/public-assets.mjs verify <tree>            re-verify a composed tree

import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const PUBLIC_ROOT = path.join("web", "app", "public")

/** The manifest compose writes into the tree root: which pack-owned public
 * subtrees this composed template kept and which it pruned. Read by the
 * content tests' publicAssetPresent helper (web/app/tests/helpers) so
 * another pack's on-disk existence assertions know the removal was
 * deliberate, and by scripts/lib/public-assets.mjs verify. */
export const PRUNE_MANIFEST = ".repobot-public-prune.json"

// Extensions the reference scan skips: binary payloads can't carry a source
// reference, and reading imagery to look for imagery paths is pure waste.
const BINARY_EXTENSIONS = new Set([
    ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".ico", ".icns",
    ".mp3", ".mp4", ".m4a", ".wav", ".ogg", ".webm", ".mov",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".zip", ".gz", ".zst", ".tar", ".jar", ".pdf", ".keystore", ".jks",
    ".pbxproj", ".xcassets", ".lock",
])

// Directories the scan never enters. web/app/public is the asset store
// itself; web/app/tests assert on-disk existence and read the prune manifest
// instead (a test mentioning a path must not force the asset to ship);
// scripts/ is build/dev tooling that never serves a public path to a
// visitor (and this very file documents the path convention); docs/,
// .github/ and .dev/ are outside the runtime identity entirely
// (kernel-fingerprint.sh excludes them, so they must not influence a stamp
// derived from it).
const SKIPPED_DIRS = new Set([
    ".git", "node_modules", "dist", "build", "tmp",
    ".dev", ".github", "docs", "scripts",
])
const SKIPPED_RELATIVE = new Set([
    PUBLIC_ROOT,
    path.join("web", "app", "tests"),
])

// Mirrors kernel-fingerprint.sh: test files are outside the runtime
// identity, so a path mention in one must not influence what ships (the
// tests' own on-disk assertions go through the prune manifest instead).
const TEST_FILE = /\.test\.(ts|tsx|js|jsx|mjs|mts)$/

function readJson(filePath) {
    return JSON.parse(readFileSync(filePath, "utf8"))
}

/** Every pack key with a catalog, plus the catalog fields the scan needs. */
function listCatalogs(repoRoot) {
    const packsDir = path.join(repoRoot, "packs")
    const catalogs = new Map()
    for (const entry of readdirSync(packsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const catalogPath = path.join(packsDir, entry.name, "catalog.json")
        if (!existsSync(catalogPath)) continue
        catalogs.set(entry.name, readJson(catalogPath))
    }
    return catalogs
}

/** Pack-owned public subtrees: top-level public/ dirs named for a pack. */
export function listOwnedPublicDirs(repoRoot) {
    const publicDir = path.join(repoRoot, PUBLIC_ROOT)
    const catalogs = listCatalogs(repoRoot)
    return readdirSync(publicDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && catalogs.has(entry.name))
        .map((entry) => entry.name)
        .sort()
}

/** The pack plus its remix base (bases can't themselves be remixes —
 * resolveCatalog enforces single-level derivation). */
export function packChain(repoRoot, packKey) {
    const catalogs = listCatalogs(repoRoot)
    const catalog = catalogs.get(packKey)
    if (catalog === undefined) {
        throw new Error(`unknown pack '${packKey}' (no packs/${packKey}/catalog.json)`)
    }
    return catalog.remixOf === undefined ? [packKey] : [packKey, catalog.remixOf]
}

/** A `/<dir>/` mention at a string-literal boundary. The preceding
 * character must not extend a longer path (a mention inside "packs/<dir>/…"
 * or "src/<dir>/…" never matches); the repo's real references all open a
 * string, template literal, markdown link, or CSS url() there. */
function referencePattern(dir) {
    const escaped = dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return new RegExp(`(^|[^\\w.$/-])/${escaped}/`, "m")
}

function* walkFiles(root, relative = "") {
    const absolute = path.join(root, relative)
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
        const entryRelative = relative === "" ? entry.name : `${relative}/${entry.name}`
        if (entry.isDirectory()) {
            if (SKIPPED_DIRS.has(entry.name)) continue
            if (SKIPPED_RELATIVE.has(entryRelative.split("/").join(path.sep))) continue
            yield* walkFiles(root, entryRelative)
        } else if (entry.isFile()) {
            if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue
            if (TEST_FILE.test(entry.name)) continue
            yield entryRelative
        }
    }
}

/**
 * Which pack-owned public dirs the tree's live sources reference, for the
 * pack chain given. `root` may be the kernel checkout (compose and the
 * per-pack stamp plan from it) or a composed tree (the verification gate
 * re-scans what actually shipped) — both carry every catalog, so the
 * exclusion set computes identically.
 */
export function scanReferencedDirs(root, chainKeys, ownedDirs = listOwnedPublicDirs(root)) {
    const catalogs = listCatalogs(root)
    const chain = new Set(chainKeys)
    const chainViewDirs = new Set(
        chainKeys.map((key) => catalogs.get(key)?.homeViewDir).filter(Boolean),
    )
    // Dead surfaces for this pack: other packs' pack dirs and home view
    // dirs, and other packs' content seeds (a seed lives inside its BASE
    // pack's view dir, so the base's own compose would otherwise inherit
    // every remix's imagery).
    const excludedPrefixes = []
    const excludedFiles = new Set()
    for (const [key, catalog] of catalogs) {
        if (chain.has(key)) continue
        excludedPrefixes.push(`packs/${key}/`)
        if (catalog.homeViewDir !== undefined && !chainViewDirs.has(catalog.homeViewDir)) {
            excludedPrefixes.push(`${catalog.homeViewDir}/`)
        }
        if (catalog.contentSeed !== undefined) {
            excludedFiles.add(catalog.contentSeed)
        }
    }

    const patterns = new Map(ownedDirs.map((dir) => [dir, referencePattern(dir)]))
    const referenced = new Map()
    for (const relative of walkFiles(root)) {
        if (excludedFiles.has(relative)) continue
        if (excludedPrefixes.some((prefix) => relative.startsWith(prefix))) continue
        let content
        try {
            content = readFileSync(path.join(root, relative), "utf8")
        } catch {
            continue // unreadable/binary-despite-extension: can't carry a reference
        }
        for (const [dir, pattern] of patterns) {
            if (referenced.has(dir) && referenced.get(dir).length >= 5) continue
            if (pattern.test(content)) {
                referenced.set(dir, [...(referenced.get(dir) ?? []), relative])
            }
        }
    }
    return referenced
}

/**
 * The prune plan for a pack, computed against the kernel checkout: which
 * pack-owned public subtrees the composed tree keeps (its chain's, plus any
 * subtree the live sources reference) and which it prunes. Kernel-shared
 * entries never appear in either list — pruning only ever touches
 * pack-owned dirs, so anything questionable ships.
 */
export function computePrunePlan(repoRoot, packKey) {
    const chainKeys = packChain(repoRoot, packKey)
    const ownedDirs = listOwnedPublicDirs(repoRoot)
    const referenced = scanReferencedDirs(repoRoot, chainKeys)
    const keep = ownedDirs.filter((dir) => chainKeys.includes(dir) || referenced.has(dir))
    const pruned = ownedDirs.filter((dir) => !keep.includes(dir))
    return { packKey, chainKeys, keep, pruned, referenced }
}

/**
 * Verify a composed tree: every pack-owned public dir its live sources
 * reference must exist on disk. This is the safety net that makes pruning
 * trustworthy — it re-derives the referenced set from the tree that actually
 * shipped (post content-seed swap, post overlays), so a pruner bug or a new
 * cross-pack reference fails compose loudly instead of publishing a template
 * with 404 imagery. Returns the missing dirs with sample referencing files.
 */
export function verifyComposedTree(treeRoot) {
    const deployManifest = path.join(treeRoot, "repobot.deploy.json")
    const activeJson = path.join(treeRoot, "packs", "active.json")
    // repobot.deploy.json carries the composed pack's own key (a remix's,
    // where packs/active.json holds the base the routers switch on).
    const packKey = existsSync(deployManifest)
        ? readJson(deployManifest).packKey
        : readJson(activeJson).key
    const chainKeys = packChain(treeRoot, packKey)
    // The owned-dir universe must come from the prune manifest (keep +
    // pruned = every subtree the kernel owned at compose time), NOT from
    // the tree's surviving public/ listing — a wrongly pruned subtree is
    // exactly the one that no longer appears there, and a gate that only
    // checks what survived can't see what it lost.
    const manifestPath = path.join(treeRoot, PRUNE_MANIFEST)
    const ownedDirs = existsSync(manifestPath)
        ? [...readJson(manifestPath).keep, ...readJson(manifestPath).pruned]
        : listOwnedPublicDirs(treeRoot)
    const referenced = scanReferencedDirs(treeRoot, chainKeys, ownedDirs)
    const missing = []
    for (const [dir, files] of referenced) {
        if (!existsSync(path.join(treeRoot, PUBLIC_ROOT, dir))) {
            missing.push({ dir, files })
        }
    }
    return { packKey, missing }
}

/** Prune a composed tree in place and stamp the manifest, then verify. */
export function pruneComposedTree(repoRoot, packKey, treeRoot) {
    const plan = computePrunePlan(repoRoot, packKey)
    for (const dir of plan.pruned) {
        rmSync(path.join(treeRoot, PUBLIC_ROOT, dir), { recursive: true, force: true })
    }
    writeFileSync(
        path.join(treeRoot, PRUNE_MANIFEST),
        JSON.stringify(
            {
                $comment:
                    "Compose-time public/ pruning (scripts/lib/public-assets.mjs): this" +
                    " composed template ships only the pack-owned imagery subtrees its own" +
                    " sources use. `pruned` lists the other packs' web/app/public subtrees" +
                    " removed from this tree — their code still ships (the kernel is whole)" +
                    " but is inert behind the pack switch, and the content tests'" +
                    " publicAssetPresent helper reads this file to keep their on-disk" +
                    " assertions honest. Written by compose-pack.sh; do not edit.",
                packKey: plan.packKey,
                keep: plan.keep,
                pruned: plan.pruned,
            },
            null,
            4,
        ) + "\n",
    )
    const { missing } = verifyComposedTree(treeRoot)
    if (missing.length > 0) {
        const detail = missing
            .map(({ dir, files }) => `  ${PUBLIC_ROOT}/${dir}/ — referenced by ${files.join(", ")}`)
            .join("\n")
        throw new Error(
            `compose pruning removed public subtrees the '${packKey}' tree still references:\n` +
                `${detail}\n` +
                `The composed template would serve 404s for these paths. If the reference is` +
                ` real, the owning rule must learn it (scripts/lib/public-assets.mjs); if it` +
                ` is dead text, move it out of the live source surface.`,
        )
    }
    return plan
}

const isCli =
    process.argv[1] !== undefined &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isCli) {
    const [command, ...args] = process.argv.slice(2)
    const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
    try {
        if (command === "plan" && args.length === 1) {
            const plan = computePrunePlan(repoRoot, args[0])
            console.log(
                JSON.stringify(
                    { ...plan, referenced: Object.fromEntries(plan.referenced) },
                    null,
                    4,
                ),
            )
        } else if (command === "pruned" && args.length === 1) {
            const plan = computePrunePlan(repoRoot, args[0])
            for (const dir of plan.pruned) console.log(dir)
        } else if (command === "prune" && args.length === 2) {
            const plan = pruneComposedTree(repoRoot, args[0], path.resolve(args[1]))
            console.log(
                `pruned ${plan.pruned.length} pack-owned public subtree(s) from the` +
                    ` '${args[0]}' tree (kept: ${plan.keep.join(", ") || "none"})`,
            )
        } else if (command === "verify" && args.length === 1) {
            const treeRoot = path.resolve(args[0])
            const { packKey, missing } = verifyComposedTree(treeRoot)
            if (missing.length > 0) {
                const detail = missing
                    .map(({ dir, files }) => `  ${PUBLIC_ROOT}/${dir}/ — ${files.join(", ")}`)
                    .join("\n")
                console.error(`composed '${packKey}' tree references pruned public dirs:\n${detail}`)
                process.exit(1)
            }
            console.log(`composed '${packKey}' tree references no pruned public dirs.`)
        } else {
            console.error(
                "usage: node scripts/lib/public-assets.mjs" +
                    " plan <pack-key> | pruned <pack-key> | prune <pack-key> <tree-root> | verify <tree-root>",
            )
            process.exit(1)
        }
    } catch (error) {
        console.error(error instanceof Error ? error.message : error)
        process.exit(1)
    }
}
