import { existsSync, mkdirSync, rmSync, statSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, join, normalize, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { validatedEnv } from "../../Utils/Env.js"

/**
 * The local-mode object store (STORAGE_MODE=local): file bytes on disk under
 * a data directory, uploaded and served exclusively by the storage function
 * (see CloudFunctions/Storage.ts). This is the local counterpart of the GCS
 * bucket — same keys, same lifecycle — so StorageService treats both modes
 * identically above this seam.
 *
 * The root is STORAGE_LOCAL_DIR when set (tests point it at a temp dir), and
 * otherwise .devdata/storage at the repo root — next to the embedded
 * Postgres data dirs, already git-ignored.
 */

export interface LocalObjectStat {
    sizeBytes: number
}

export function localStorageRoot(): string {
    const override = validatedEnv().STORAGE_LOCAL_DIR
    if (override !== undefined && override !== "") {
        return resolve(override)
    }
    return join(resolveRepoRoot(), ".devdata", "storage")
}

/**
 * Absolute path for a storage key, refusing keys that would escape the root.
 * Keys are always generated server-side ("uploads/upld_<uuid>"), so a
 * traversal attempt indicates a forged request.
 */
export function localObjectPath(storageKey: string): string {
    const root = localStorageRoot()
    const fullPath = normalize(join(root, storageKey))
    if (fullPath !== root && !fullPath.startsWith(root + sep)) {
        throw new Error(`Storage key escapes the local storage root: ${storageKey}`)
    }
    return fullPath
}

export async function writeLocalObject(storageKey: string, bytes: Buffer): Promise<void> {
    const filePath = localObjectPath(storageKey)
    mkdirSync(dirname(filePath), { recursive: true })
    await writeFile(filePath, bytes)
}

export async function readLocalObject(storageKey: string): Promise<Buffer | undefined> {
    const filePath = localObjectPath(storageKey)
    if (!existsSync(filePath)) {
        return undefined
    }
    return await readFile(filePath)
}

export function statLocalObject(storageKey: string): LocalObjectStat | undefined {
    const filePath = localObjectPath(storageKey)
    if (!existsSync(filePath)) {
        return undefined
    }
    return { sizeBytes: statSync(filePath).size }
}

export function deleteLocalObject(storageKey: string): void {
    const filePath = localObjectPath(storageKey)
    rmSync(filePath, { force: true })
}

/**
 * The repo root relative to this module, found by walking up to the
 * directory that carries env.manifest.json. Two layouts exist: tests run
 * the TypeScript sources (src/Services/Storage) and deployed code runs
 * compiled output (lib/src/Services/Storage); walking up covers both.
 */
function resolveRepoRoot(): string {
    let dir = dirname(fileURLToPath(import.meta.url))
    for (let i = 0; i < 10; i++) {
        if (existsSync(join(dir, "env.manifest.json"))) {
            return dir
        }
        const parent = dirname(dir)
        if (parent === dir) break
        dir = parent
    }
    throw new Error("Could not locate the repo root (env.manifest.json) for local storage.")
}
