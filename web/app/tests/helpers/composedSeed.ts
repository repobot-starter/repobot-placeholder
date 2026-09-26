import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

const repoRoot = path.resolve(__dirname, "../../../..")

/**
 * The pack this tree was composed (or dev-switched) to present as, when
 * that is knowable: compose-pack.sh stamps the composed pack's identity
 * into repobot.deploy.json (`packKey` — the REMIX key for a derived
 * template, where packs/active.json deliberately carries the base key),
 * and the dev-pack switch records its remix in .dev/studio-overlay.json
 * (`activeRemix`). A kernel checkout with no switch active has neither.
 */
function composedPackKey(): string | undefined {
    const statePath = path.join(repoRoot, ".dev", "studio-overlay.json")
    if (existsSync(statePath)) {
        const state = JSON.parse(readFileSync(statePath, "utf8")) as { activeRemix?: string }
        if (state.activeRemix !== undefined) return state.activeRemix
    }
    const deployPath = path.join(repoRoot, "repobot.deploy.json")
    if (!existsSync(deployPath)) return undefined
    return (JSON.parse(readFileSync(deployPath, "utf8")) as { packKey?: string }).packKey
}

/**
 * The catalog content seed that actually applies to a base pack's content
 * module in THIS tree — the seed the module must mirror.
 *
 * A derived template (catalog `remixOf`) is composed by copying the
 * remix's contentSeed module over its base pack's content module AND
 * merging the remix's `content` domains per-key over the base catalog's
 * (resolveCatalog, scripts/lib/pack-switch.mjs) — so in a tree composed
 * for a remix of `baseKey`, the module's twin is the remix's merged seed,
 * not the base catalog's. Everywhere else (the kernel checkout, and trees
 * composed for unrelated packs, where the module rides unswapped) the
 * base catalog's own seed applies.
 *
 * Resolving the ONE seed the composed pack declares keeps the mirror
 * assertion exact: genuine drift between module and seed still fails for
 * whichever pack was actually composed.
 */
export function composedContentSeed<T extends Record<string, unknown>>(baseKey: string, baseContent: T): T {
    const packKey = composedPackKey()
    if (packKey === undefined || packKey === baseKey) return baseContent
    const catalogPath = path.join(repoRoot, "packs", packKey, "catalog.json")
    if (!existsSync(catalogPath)) return baseContent
    const composed = JSON.parse(readFileSync(catalogPath, "utf8")) as {
        remixOf?: string
        content?: Record<string, unknown>
    }
    if (composed.remixOf !== baseKey || composed.content === undefined) return baseContent
    const { $comment: _comment, ...domains } = composed.content
    return { ...baseContent, ...domains }
}

/**
 * The landing seed that actually applies to a base pack's pages in THIS
 * tree — the composedContentSeed of the landing surface. resolveCatalog
 * merges a remix's `landing` SHALLOWLY over its base's, so a remix that
 * pins its own layout (`landing.pages`) replaces the base's page skeletons
 * wholesale and a register override (`landing.style`) replaces the base's
 * style; routes stay the base's. Returns the base landing itself (same
 * reference) everywhere a remix of `baseKey` isn't composed.
 */
export function composedLandingSeed<T extends Record<string, unknown>>(baseKey: string, baseLanding: T): T {
    const packKey = composedPackKey()
    if (packKey === undefined || packKey === baseKey) return baseLanding
    const catalogPath = path.join(repoRoot, "packs", packKey, "catalog.json")
    if (!existsSync(catalogPath)) return baseLanding
    const composed = JSON.parse(readFileSync(catalogPath, "utf8")) as {
        remixOf?: string
        landing?: Record<string, unknown>
    }
    if (composed.remixOf !== baseKey || composed.landing === undefined) return baseLanding
    const { $comment: _comment, ...overlay } = composed.landing
    return { ...baseLanding, ...overlay }
}
