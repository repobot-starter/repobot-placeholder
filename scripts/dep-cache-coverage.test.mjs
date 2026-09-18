// The cold-boot dep cache must cover every package the kernel's web source
// can import — statically or through a lazy chunk. Vite only pre-optimizes
// what its boot-time scan reaches, and a composed project ships a subset of
// the kernel's pages, so a package only a lazy chunk imports (recharts via
// ChartCard's chunk) went un-optimized until a scaffolded dashboard first
// pulled it — the mid-session re-optimize then broke the already-loaded
// graph ("Failed to fetch dynamically imported module ChartCardChart.tsx").
// web/app/optimizeDepsInclude.mjs closes that by deriving the include list
// from the installed dependency surface; this test holds the other side:
// no source file may import a package that derivation misses.
//
// Run: node --test scripts/dep-cache-coverage.test.mjs

import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { optimizeDepsInclude } from "../web/app/optimizeDepsInclude.mjs"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const SOURCE_ROOTS = ["web/app/src", "web/core/src", "web/design-system/src"]

// Source-consumed workspace packages: served as source, never pre-bundled.
const WORKSPACE_PACKAGES = new Set(["@base/core", "@base/design-system"])

// Build-time only: .css.ts modules are compiled server-side by the
// vanilla-extract plugin; their imports never reach the client.
const BUILD_TIME_PACKAGES = new Set(["@vanilla-extract/css"])

/** The npm package name of a bare import specifier. */
function packageName(specifier) {
    const parts = specifier.split("/")
    return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

function* walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            yield* walk(full)
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
            yield full
        }
    }
}

/** Every bare (package) import in a source file — static, dynamic, and
 * re-export forms; `import type` is erased at runtime and skipped. */
function bareImports(source) {
    const found = new Set()
    const patterns = [
        /import\s+(?!type[\s{])[^"']*?from\s*["']([^."'][^"']*)["']/g,
        /export\s+(?!type[\s{])[^"']*?from\s*["']([^."'][^"']*)["']/g,
        /import\s*\(\s*["']([^."'][^"']*)["']\s*\)/g,
        /import\s*["']([^."'][^"']*)["']/g,
    ]
    for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) {
            found.add(match[1])
        }
    }
    return found
}

test("every bare import in kernel web source is servable from the cold-boot dep cache", () => {
    const include = new Set(optimizeDepsInclude(path.join(repoRoot, "web/app")))
    const missing = new Map()
    for (const root of SOURCE_ROOTS) {
        for (const file of walk(path.join(repoRoot, root))) {
            // Compiled server-side by the vanilla-extract plugin.
            if (file.endsWith(".css.ts")) continue
            for (const specifier of bareImports(readFileSync(file, "utf8"))) {
                const name = packageName(specifier)
                if (WORKSPACE_PACKAGES.has(name) || BUILD_TIME_PACKAGES.has(name)) continue
                // The @ui alias is the kernel's eject seam, not a package.
                if (name === "@ui") continue
                if (!include.has(name)) {
                    missing.set(name, path.relative(repoRoot, file))
                }
            }
        }
    }
    assert.deepEqual(
        [...missing.entries()],
        [],
        "packages imported by web source but absent from the derived optimizeDeps.include " +
            "(add them to the owning package.json dependencies): " +
            [...missing.entries()].map(([name, file]) => `${name} (${file})`).join(", "),
    )
})

test("the derived include list covers the lazy-chunk dependency that broke in the field", () => {
    const include = optimizeDepsInclude(path.join(repoRoot, "web/app"))
    assert.ok(include.includes("recharts"), "recharts (ChartCard's lazy chunk) must be pre-optimized")
})
