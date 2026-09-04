import { readFileSync } from "node:fs"
import path from "node:path"

/**
 * The dev server's pre-optimized dependency surface: every runtime
 * dependency of web/app and its source-consumed workspace packages
 * (@base/core, @base/design-system), derived straight from their
 * package.json files so the list can never drift from what is installed.
 *
 * Why include everything installed, not just what today's pages import:
 * Vite's boot-time dep scan only discovers packages reachable from the
 * current module graph. A composed project ships a SUBSET of the kernel's
 * pages, so a dependency nothing present imports (recharts, reachable only
 * through ChartCard's lazy chunk) stays un-optimized — and the first page
 * that introduces it mid-session (a scaffolded dashboard, or any import an
 * agent hand-writes) forces a mid-session re-optimize that breaks
 * already-loaded dynamic imports: the field failure was a dashboard whose
 * charts died with "Failed to fetch dynamically imported module
 * ChartCardChart.tsx" until the dep cache was rebuilt. Pre-optimizing the
 * whole installed surface at boot (pool-pod preboot idle time) closes the
 * class: an agent can only import what is installed, and everything
 * installed is servable from the cold-boot cache.
 *
 * scripts/dep-cache-coverage.test.mjs holds the invariant from the other
 * side: every bare import in the kernel's web source must be covered here.
 */
export function optimizeDepsInclude(appDir) {
    const packageDirs = [appDir, path.join(appDir, "../core"), path.join(appDir, "../design-system")]
    const include = new Set()
    for (const dir of packageDirs) {
        const manifest = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"))
        for (const name of Object.keys(manifest.dependencies ?? {})) {
            // Workspace packages are consumed as source (resolve.dedupe +
            // workspace links), never pre-bundled.
            if (name.startsWith("@base/")) continue
            // Build-time only: .css.ts files are compiled by the
            // vanilla-extract plugin server-side and never reach the client
            // as modules, so there is nothing to pre-bundle.
            if (name === "@vanilla-extract/css") continue
            include.add(name)
        }
    }
    return [...include].sort()
}
