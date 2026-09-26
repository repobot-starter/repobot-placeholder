import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

// Pack content tests assert that every media path their content module names
// exists on disk under web/app/public — the promise that a freshly cloned
// template never renders a broken image. Composed templates, however, prune
// OTHER packs' public subtrees (compose-pack.sh via
// scripts/lib/public-assets.mjs): the whole test suite still ships and runs
// in every composed tree, so the estate content test would otherwise fail in
// the band template over imagery that was removed deliberately, not lost.
//
// The prune manifest the composer writes at the tree root records exactly
// which pack-owned subtrees it removed. A missing file whose top-level
// public directory is listed there is a deliberate prune, not a broken
// promise. The active pack's own chain is never pruned (the composer always
// keeps it), so the assertions this helper serves stay at full strength for
// the pack the template actually renders — and in the kernel checkout, where
// no manifest exists, for every pack.

const PUBLIC_DIR = path.resolve(__dirname, "../../public")
const PRUNE_MANIFEST = path.resolve(__dirname, "../../../..", ".repobot-public-prune.json")

function prunedDirs(): Set<string> {
    if (!existsSync(PRUNE_MANIFEST)) return new Set()
    const manifest = JSON.parse(readFileSync(PRUNE_MANIFEST, "utf8")) as { pruned?: string[] }
    return new Set(manifest.pruned ?? [])
}

/**
 * Drop-in for the content tests' `existsSync(path.join(PUBLIC_DIR, src))`:
 * true when the file exists — or when its top-level public directory was
 * pruned from this composed tree, which the prune manifest proves was
 * deliberate. Paths outside web/app/public get plain existence.
 */
export function publicAssetPresent(absolutePath: string): boolean {
    if (existsSync(absolutePath)) return true
    const relative = path.relative(PUBLIC_DIR, absolutePath)
    if (relative.startsWith("..") || path.isAbsolute(relative)) return false
    return prunedDirs().has(relative.split(path.sep)[0])
}
