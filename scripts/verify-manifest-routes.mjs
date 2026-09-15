// Verifies the manifest home stays wired: when repobot.project.json declares
// a marketing page at "/", web/app/src/App.tsx must still dispatch it through
// the kernel (HomePage -> marketingHomePage() -> <SitePage pageId={manifestHome.id} />).
//
// Why: the IA contract (docs/project-ia.md) makes repobot.project.json the
// source of truth for what renders at "/". An agent that reroutes "/" to a
// bespoke component leaves the manifest describing a page nobody renders —
// brief checks then pass against dead config while users see something else.
// A finished custom home lands in the manifest page's inline `landing` config
// (or its sections), never in a route bypass.
//
// Usage:
//   node scripts/verify-manifest-routes.mjs [repoRoot]   # exit 1 on a bypass

import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// The two anchors of the kernel's home dispatch in App.tsx. Whitespace-
// tolerant so a formatter pass doesn't trip the check; anything that removes
// or rewires either one is a bypass.
const MANIFEST_DISPATCH = /return\s*\(?\s*<SitePage\s+pageId=\{manifestHome\.id\}\s*\/>/
const HOME_ROUTE = /<Route\s+path=\{routes\.home\.path\}\s+element=\{<HomePage\s*\/>\}\s*\/>/

/**
 * Pure core, exercised directly by the test: given the parsed project
 * manifest and the App.tsx source, decide whether the home contract holds.
 * Returns { ok: true } or { ok: false, message }.
 */
export function verifyManifestRoutes({ manifest, appSource }) {
    const pages = manifest?.marketing?.pages
    const manifestHome = Array.isArray(pages) && pages.find((page) => page && page.path === "/")
    if (!manifestHome) {
        // No manifest home: the pack's own home page owns "/" and there is
        // no contract to enforce.
        return { ok: true }
    }
    if (!MANIFEST_DISPATCH.test(appSource)) {
        return {
            ok: false,
            message:
                `repobot.project.json declares a marketing page at "/" (${manifestHome.id ?? "home"}), ` +
                "but web/app/src/App.tsx no longer dispatches it " +
                "(HomePage must keep `return <SitePage pageId={manifestHome.id} />`). " +
                "The manifest is the source of truth for the home page: a custom home design " +
                "goes in that page's inline `landing` config (or its sections) in " +
                "repobot.project.json — never a route that bypasses the manifest. " +
                "Restore the kernel dispatch in App.tsx (see docs/project-ia.md).",
        }
    }
    if (!HOME_ROUTE.test(appSource)) {
        return {
            ok: false,
            message:
                'repobot.project.json declares a marketing page at "/", but the ' +
                "`<Route path={routes.home.path} element={<HomePage />} />` route is gone from " +
                "web/app/src/App.tsx, so the manifest home never renders. " +
                "Restore the kernel home route; custom home design belongs in the manifest " +
                "page's inline `landing` config, never in route rewiring (see docs/project-ia.md).",
        }
    }
    return { ok: true }
}

function main() {
    const repoRoot = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const manifestPath = path.join(repoRoot, "repobot.project.json")
    if (!existsSync(manifestPath)) {
        console.log("[verify-manifest-routes] no repobot.project.json; nothing to verify.")
        return
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    const appPath = path.join(repoRoot, "web", "app", "src", "App.tsx")
    const appSource = existsSync(appPath) ? readFileSync(appPath, "utf8") : ""
    const result = verifyManifestRoutes({ manifest, appSource })
    if (!result.ok) {
        console.error(`[verify-manifest-routes] FAIL: ${result.message}`)
        process.exit(1)
    }
    console.log("[verify-manifest-routes] OK - the manifest home routes stay kernel-dispatched.")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
}
