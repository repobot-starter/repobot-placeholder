// Verifies web/design-system/ is pristine — byte-identical to the manifest
// committed at web/design-system/.pristine-manifest.json.
//
// Why: project customization happens through repobot.theme.json (tokens),
// component props, or ejected copies in web/app/src/Theme/overrides/ — never
// by editing the base design system. A pristine base is what lets the
// platform land design-system updates in customer repos automatically
// without clobbering local customization; drifted files route to an agent
// for a manual merge instead.
//
// Usage:
//   node scripts/verify-ds-pristine.mjs           # verify (exit 1 on drift)
//   node scripts/verify-ds-pristine.mjs --write   # regenerate the manifest
//                                                 # (kernel changes only)

import { createHash } from "node:crypto"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const packageDir = path.join(repoRoot, "web", "design-system")
const manifestPath = path.join(packageDir, ".pristine-manifest.json")

const EXCLUDED_DIRS = new Set(["node_modules", "storybook-static", "dist"])
const EXCLUDED_FILES = new Set([".pristine-manifest.json"])

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!EXCLUDED_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name))
        } else if (!EXCLUDED_FILES.has(entry.name)) {
            yield path.join(dir, entry.name)
        }
    }
}

function computeHashes() {
    const hashes = {}
    for (const filePath of walk(packageDir)) {
        const relativePath = path.relative(packageDir, filePath).split(path.sep).join("/")
        hashes[relativePath] = createHash("sha256").update(readFileSync(filePath)).digest("hex")
    }
    return Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)))
}

const current = computeHashes()

if (process.argv.includes("--write")) {
    writeFileSync(manifestPath, JSON.stringify(current, null, 4) + "\n")
    console.log(
        `Wrote ${Object.keys(current).length} file hashes to ${path.relative(repoRoot, manifestPath)}.`,
    )
    process.exit(0)
}

let manifest
try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
} catch {
    console.error(
        "Missing or unreadable web/design-system/.pristine-manifest.json — run " +
            "`node scripts/verify-ds-pristine.mjs --write` in the kernel to create it.",
    )
    process.exit(1)
}

const drifted = []
for (const [relativePath, hash] of Object.entries(manifest)) {
    if (current[relativePath] === undefined) drifted.push(`deleted:  ${relativePath}`)
    else if (current[relativePath] !== hash) drifted.push(`modified: ${relativePath}`)
}
for (const relativePath of Object.keys(current)) {
    if (manifest[relativePath] === undefined) drifted.push(`added:    ${relativePath}`)
}

if (drifted.length > 0) {
    console.error("web/design-system/ has drifted from the pristine manifest:\n")
    for (const entry of drifted) console.error(`  ${entry}`)
    console.error(
        "\nCustomize through repobot.theme.json, component props, or ejected copies in " +
            "web/app/src/Theme/overrides/ (see docs/design-system.md). If this is an " +
            "intentional kernel change, refresh the manifest with --write.",
    )
    process.exit(1)
}

console.log(`web/design-system/ is pristine (${Object.keys(current).length} files verified).`)
