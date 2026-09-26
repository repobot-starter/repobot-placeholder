// Verifies the kernel storefront is never signposted while it still sells
// the starter demo: if web/app/src/View/Shop/shopContent.ts (or the catalog
// in Services/Shop/ShopCatalog.ts) still carries "The Lighthouse Letters" /
// "Margaret Hale" stock content, nothing outside the kernel's own wiring may
// link to /shop — no manifest nav entry, no landing CTA, no in-app link.
//
// Why: AGENTS.md's payments invariant says to adapt the storefront to what
// the project sells AND link it — but adapting must come first. The observed
// failure mode is a themed landing page ("Welcome to the cupcake
// wonderland") whose "Shop now" CTA lands on the untouched demo bookshop:
// a door into content that has nothing to do with the project. A CTA into
// unrelated demo content is worse than no CTA.
//
// The stock demo itself is fine — it's the ShopBot template's starting
// point, reachable at /shop for the agent to look at. Only *signposting* it
// from the project's own surfaces trips this check.
//
// Usage:
//   node scripts/verify-shop-integration.mjs [repoRoot]   # exit 1 on a stock-linked shop

import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/** Copy that identifies the untouched starter storefront. */
const STOCK_MARKERS = ["The Lighthouse Letters", "Margaret Hale"]

// A quoted "/shop" path (href/to/navigate targets in TSX, "href": "/shop"
// in the manifest), tolerating a trailing slash, query, or hash.
const SHOP_PATH_LINK = /["'`]\/shop\/?(?:[?#][^"'`]*)?["'`]/
// Linking through the route registry instead of a literal path.
const SHOP_ROUTE_REF = /\broutes\.shop\b/

/**
 * Pure core, exercised directly by the test: given the storefront sources
 * and the sources that could link to it, decide whether the contract holds.
 * Returns { ok: true } or { ok: false, offenders, message }.
 */
export function verifyShopIntegration({ shopSources, linkFiles }) {
    const shopIsStock = shopSources.some((source) => STOCK_MARKERS.some((marker) => source.includes(marker)))
    if (!shopIsStock) {
        return { ok: true }
    }
    const offenders = linkFiles
        .filter(({ source }) => SHOP_PATH_LINK.test(source) || SHOP_ROUTE_REF.test(source))
        .map(({ file }) => file)
    if (offenders.length === 0) {
        return { ok: true }
    }
    return {
        ok: false,
        offenders: offenders,
        message:
            "The storefront still sells the starter demo " +
            '("The Lighthouse Letters" by Margaret Hale), but these files link to /shop: ' +
            `${offenders.join(", ")}. ` +
            "Adapt the storefront to what this project actually sells BEFORE pointing users at it: " +
            "copy in web/app/src/View/Shop/shopContent.ts, product name + price in " +
            "firebase/functions/src/Services/Shop/ShopCatalog.ts (keep bookTitle in sync; " +
            "see docs/payments.md) — or remove the link until the shop is adapted. " +
            "A CTA into unrelated demo content is worse than no CTA.",
    }
}

/**
 * The kernel's own /shop wiring, allowed to reference the route: the shop
 * view itself, the route registry, and App.tsx (which mounts
 * `<Route path={routes.shop.path}>` and the shop pack's home dispatch —
 * route mounting, not a signpost).
 */
function isKernelShopWiring(relativePath) {
    return (
        relativePath.startsWith(path.join("web", "app", "src", "View", "Shop") + path.sep) ||
        relativePath === path.join("web", "app", "src", "Config", "Router.ts") ||
        relativePath === path.join("web", "app", "src", "App.tsx") ||
        relativePath.startsWith(path.join("web", "app", "src", "generated") + path.sep)
    )
}

function collectAppSources(repoRoot) {
    const appSrcRoot = path.join(repoRoot, "web", "app", "src")
    if (!existsSync(appSrcRoot)) {
        return []
    }
    const files = []
    const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                walk(fullPath)
            } else if (/\.(ts|tsx)$/.test(entry.name)) {
                files.push(fullPath)
            }
        }
    }
    walk(appSrcRoot)
    return files.filter((file) => !isKernelShopWiring(path.relative(repoRoot, file)))
}

function main() {
    const repoRoot = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const readIfPresent = (...segments) => {
        const filePath = path.join(repoRoot, ...segments)
        return existsSync(filePath) ? readFileSync(filePath, "utf8") : ""
    }

    const shopSources = [
        readIfPresent("web", "app", "src", "View", "Shop", "shopContent.ts"),
        readIfPresent("firebase", "functions", "src", "Services", "Shop", "ShopCatalog.ts"),
    ]

    const linkFiles = collectAppSources(repoRoot).map((file) => ({
        file: path.relative(repoRoot, file),
        source: readFileSync(file, "utf8"),
    }))
    const manifestPath = path.join(repoRoot, "repobot.project.json")
    if (existsSync(manifestPath)) {
        linkFiles.push({
            file: "repobot.project.json",
            source: readFileSync(manifestPath, "utf8"),
        })
    }

    const result = verifyShopIntegration({ shopSources: shopSources, linkFiles: linkFiles })
    if (!result.ok) {
        console.error(`[verify-shop-integration] FAIL: ${result.message}`)
        process.exit(1)
    }
    console.log("[verify-shop-integration] OK - no links point at a still-stock storefront.")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
}
