// Verifies that template-shipped test files under web/app/tests/ are intact —
// byte-identical to the manifest committed at web/app/tests/.pinned-tests.json.
//
// Why: those tests pin the kernel's promises (the seed contract in
// blueprints.test.ts, SEO defaults in PageMeta.test.tsx, …). When one fails
// after a change, the fix is to change the code so the promise still holds —
// weakening, rewriting, or deleting the test is never the fix, and neither is
// editing this manifest. New test files are always welcome and are not
// pinned; only the template's own tests are.
//
// Usage:
//   node scripts/verify-pinned-tests.mjs           # verify (exit 1 on drift)
//   node scripts/verify-pinned-tests.mjs --write   # regenerate the manifest
//                                                  # (kernel changes only)

import { createHash } from "node:crypto"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const testsDir = path.join(repoRoot, "web", "app", "tests")
const manifestPath = path.join(testsDir, ".pinned-tests.json")

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) yield* walk(path.join(dir, entry.name))
        else if (entry.name !== ".pinned-tests.json") yield path.join(dir, entry.name)
    }
}

function computeHashes() {
    const hashes = {}
    for (const filePath of walk(testsDir)) {
        const relativePath = path.relative(testsDir, filePath).split(path.sep).join("/")
        hashes[relativePath] = createHash("sha256").update(readFileSync(filePath)).digest("hex")
    }
    return Object.fromEntries(Object.entries(hashes).sort(([a], [b]) => a.localeCompare(b)))
}

const current = computeHashes()

if (process.argv.includes("--write")) {
    writeFileSync(manifestPath, JSON.stringify(current, null, 4) + "\n")
    console.log(
        `Pinned ${Object.keys(current).length} test files in ${path.relative(repoRoot, manifestPath)}.`,
    )
    process.exit(0)
}

let manifest
try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
} catch {
    console.error(
        "Missing or unreadable web/app/tests/.pinned-tests.json — run " +
            "`node scripts/verify-pinned-tests.mjs --write` in the kernel to create it.",
    )
    process.exit(1)
}

const drifted = []
for (const [relativePath, hash] of Object.entries(manifest)) {
    if (current[relativePath] === undefined) drifted.push(`deleted:  ${relativePath}`)
    else if (current[relativePath] !== hash) drifted.push(`modified: ${relativePath}`)
}
// Added files are welcome — new features deserve new tests. Only the
// template's own tests are pinned.

if (drifted.length > 0) {
    console.error("Template-shipped test files have been changed:\n")
    for (const entry of drifted) console.error(`  ${entry}`)
    console.error(
        "\nThese tests pin the kernel's promises (the seed contract, SEO defaults, …). " +
            "If one fails after your change, change your code so the promise still holds — " +
            "weakening or deleting the test is never the fix, and neither is editing the " +
            "manifest. Add NEW test files for new behavior instead; they are not pinned.",
    )
    process.exit(1)
}

console.log(`Template test files are intact (${Object.keys(current).length} pinned).`)
