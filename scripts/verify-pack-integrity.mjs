// Blocks pack deletion/hollowing-out drift (AGENTS.md invariant: inactive
// packs are never deleted — they are the template's catalog, not dead code).
// The invariant was prompt-level only; this makes it mechanical:
//
// 1. Every pack key in the PackKey union (web/app/src/Config/activePack.ts)
//    has its packs/<key>/ directory with a catalog.json — deleting an
//    inactive pack's directory or catalog fails here.
// 2. Every packs/<dir>/ directory is a complete pack: catalog.json present
//    and its declared homeViewDir existing with at least one file — a pack
//    can't be hollowed out by removing its views while the folder remains,
//    and a new pack can't land half-scaffolded.
// 3. packs/active.json names a pack that exists, and never a derived
//    template (remixes are worn via their BASE key — routers only know
//    real packs).
// 4. A derived template (catalog `remixOf`, packs/README.md "Derived
//    templates") is complete on its own terms: its base pack's catalog
//    exists and its contentSeed module is on disk. Remixes declare no
//    homeViewDir and are deliberately absent from PackKey — their structure
//    is the base pack's, which rules 1–2 already cover.
//
// Sanctioned path when this fires: to change what the project ships, edit
// packs/active.json (and compose views via scripts/compose-pack.mjs) —
// never delete or gut inactive pack directories. New packs land complete:
// catalog.json + the home view directory it declares.
//
// The current tree is fully clean, so this gate has no baseline: any
// violation is a new violation.
//
// Run: node scripts/verify-pack-integrity.mjs [repoRoot]

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Pure core, exercised by the test.
 *
 * @param {object} input
 * @param {string} input.activePackSource  contents of web/app/src/Config/activePack.ts
 * @param {string[]} input.packDirs        directory names under packs/
 * @param {Record<string, string|null>} input.catalogs  pack dir -> catalog.json text (null = missing)
 * @param {(viewDir: string) => boolean} input.homeViewHasFiles  repo-relative dir -> has >=1 file
 * @param {(relativePath: string) => boolean} input.fileExists  repo-relative file exists
 * @param {string|null} input.activeKey    key from packs/active.json
 */
export function verifyPackIntegrity({
    activePackSource,
    packDirs,
    catalogs,
    homeViewHasFiles,
    fileExists,
    activeKey,
}) {
    const failures = []
    const sanctioned =
        "Inactive packs must never be deleted or gutted — switch packs by editing " +
        "packs/active.json (see packs/README.md); the pack directories are the template's " +
        "catalog and stay intact."

    const unionMatch = activePackSource.match(/export type PackKey\s*=([^]*?)\n\n/)
    const packKeys = unionMatch ? [...unionMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : []
    if (packKeys.length === 0) {
        failures.push(
            "Could not read the PackKey union from web/app/src/Config/activePack.ts — " +
                "the pack registry must keep listing every pack. " +
                sanctioned,
        )
    }

    const dirSet = new Set(packDirs)
    for (const key of packKeys) {
        if (!dirSet.has(key)) {
            failures.push(`packs/${key}/ is registered in PackKey but missing on disk. ${sanctioned}`)
        }
    }

    for (const dir of packDirs) {
        const catalogText = catalogs[dir] ?? null
        if (catalogText === null) {
            failures.push(
                `packs/${dir}/catalog.json is missing — every pack directory ships its catalog. ` +
                    sanctioned,
            )
            continue
        }
        let catalog
        try {
            catalog = JSON.parse(catalogText)
        } catch {
            failures.push(`packs/${dir}/catalog.json is not valid JSON. ${sanctioned}`)
            continue
        }
        if (catalog.remixOf !== undefined) {
            // A derived template (packs/README.md "Derived templates") is a
            // thin catalog wearing its base pack's structure: it declares no
            // homeViewDir (the base's, checked when this loop reaches the
            // base dir) and is deliberately absent from PackKey (routers only
            // know base packs — active.json carries the base key). Its own
            // integrity surface is the remix chain: the base pack it resolves
            // through, and the content seed every composer (compose-pack.sh,
            // the dev/studio switch, the platform's template flip) copies
            // over the base's content module — without that file a
            // composed/flipped tree silently reads as the BASE pack's trade.
            if ((catalogs[catalog.remixOf] ?? null) === null) {
                failures.push(
                    `packs/${dir}: remixOf "${catalog.remixOf}" has no pack directory or ` +
                        `catalog — a derived template needs its base pack intact. ${sanctioned}`,
                )
            }
            if (typeof catalog.contentSeed !== "string" || !fileExists(catalog.contentSeed)) {
                failures.push(
                    `packs/${dir}: contentSeed ${JSON.stringify(catalog.contentSeed)} is missing ` +
                        `on disk — without its seed module a derived template composes and flips ` +
                        `wearing the base pack's content. ${sanctioned}`,
                )
            }
            continue
        }
        const homeViewDir = catalog.homeViewDir
        if (typeof homeViewDir !== "string" || homeViewDir.length === 0) {
            failures.push(
                `packs/${dir}/catalog.json declares no homeViewDir — every pack keeps its home ` +
                    `view wired. ${sanctioned}`,
            )
        } else if (!homeViewHasFiles(homeViewDir)) {
            failures.push(
                `packs/${dir}: homeViewDir "${homeViewDir}" is missing or empty — the pack's home ` +
                    `view has been removed. ${sanctioned}`,
            )
        }
        if (!packKeys.includes(dir) && packKeys.length > 0) {
            failures.push(
                `packs/${dir}/ exists but is not in the PackKey union ` +
                    `(web/app/src/Config/activePack.ts) — register new packs there.`,
            )
        }
    }

    if (activeKey !== null && !dirSet.has(activeKey)) {
        failures.push(`packs/active.json points at "${activeKey}", which has no packs/ directory.`)
    } else if (activeKey !== null) {
        // The remix contract's active.json rule (packs/README.md "Derived
        // templates"): the checkout always presents as the BASE pack —
        // routers, native ActivePack constants, and document stamps only
        // know real packs. A composer that writes the remix key here breaks
        // homePageByPack and every stamped document's pack check.
        let activeCatalog
        try {
            activeCatalog = JSON.parse(catalogs[activeKey] ?? "null")
        } catch {
            activeCatalog = null
        }
        if (activeCatalog?.remixOf !== undefined) {
            failures.push(
                `packs/active.json points at "${activeKey}", a derived template — active.json ` +
                    `always carries the BASE pack key (here "${activeCatalog.remixOf}"); a remix ` +
                    `is worn via its base key plus its catalog overlays and content seed ` +
                    `(packs/README.md "Derived templates").`,
            )
        }
    }

    return failures
}

function main() {
    const repoRoot = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
    const packsRoot = path.join(repoRoot, "packs")
    const packDirs = readdirSync(packsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    const catalogs = {}
    for (const dir of packDirs) {
        const catalogPath = path.join(packsRoot, dir, "catalog.json")
        catalogs[dir] = existsSync(catalogPath) ? readFileSync(catalogPath, "utf8") : null
    }
    const activePackSource = readFileSync(
        path.join(repoRoot, "web", "app", "src", "Config", "activePack.ts"),
        "utf8",
    )
    const activeKey = JSON.parse(readFileSync(path.join(packsRoot, "active.json"), "utf8")).key ?? null

    const failures = verifyPackIntegrity({
        activePackSource,
        packDirs,
        catalogs,
        activeKey,
        homeViewHasFiles: (viewDir) => {
            const absoluteDir = path.join(repoRoot, ...viewDir.split("/"))
            if (!existsSync(absoluteDir) || !statSync(absoluteDir).isDirectory()) return false
            return readdirSync(absoluteDir).length > 0
        },
        fileExists: (relativePath) => existsSync(path.join(repoRoot, ...relativePath.split("/"))),
    })
    if (failures.length > 0) {
        console.error("[verify-pack-integrity] FAIL:\n")
        for (const failure of failures) console.error(failure + "\n")
        process.exit(1)
    }
    console.log(`[verify-pack-integrity] OK - ${packDirs.length} packs complete (catalog + home view).`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
}
