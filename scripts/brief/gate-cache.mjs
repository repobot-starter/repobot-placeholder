// The gate-pass cache shared by the brief runner and the gate scripts
// themselves. Passing gate runs are recorded keyed by a content hash of the
// working tree, so any later evaluation of the same gate on the identical
// tree can answer from the cache instead of re-spawning minutes of checks.
//
// The brief runner has cached its own gate runs this way since 2026-07
// (second pass was ~19% of a content-tier setup run). This module extends
// the same cache to DIRECT gate runs: agents iterate with `npm run
// check:web` for readable failures, then finish with the full brief:check —
// which used to re-run the identical gate on the identical tree because
// only the runner ever wrote the cache. check-web.sh / check-all.sh now
// record their own passes (via the CLI below), so that final brief:check
// gate assertion is a cache hit and the loop pays for the gate once.
//
// CLI (used from the bash gate scripts; both commands are best-effort):
//   node scripts/brief/gate-cache.mjs hash            -> tree hash on stdout
//   node scripts/brief/gate-cache.mjs record <start-hash> <gate> [gate...]
// `record` re-hashes once and only writes when the tree still matches the
// start hash — a gate that mutated the tree (regenerated output) must not
// cache. Several gates in one call share the single re-hash (check:all
// records itself and check:web, its strict subset).

import { spawnSync } from "node:child_process"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const GATE_CACHE_FILE = ".brief-gate-cache.json"

/**
 * A content hash of the working tree as it stands — tracked and untracked
 * files alike, ignored files excluded — computed through a throwaway git
 * index so nothing in the real repo state is touched. Setup pods never
 * commit mid-run (the platform commits after verification), so a
 * committed-tree hash would never match there; hashing the actual content
 * is what lets the agent's evidence pass and the platform's re-check agree
 * they saw the same tree.
 */
export function cacheableTreeHash(rootDir) {
    const indexFile = path.join(
        os.tmpdir(),
        `brief-gate-index-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    )
    const env = { ...process.env, GIT_INDEX_FILE: indexFile }
    try {
        const add = spawnSync("git", ["add", "-A"], { cwd: rootDir, encoding: "utf8", env })
        if (add.status !== 0) {
            return undefined
        }
        const tree = spawnSync("git", ["write-tree"], { cwd: rootDir, encoding: "utf8", env })
        return tree.status === 0 ? tree.stdout.trim() : undefined
    } finally {
        rmSync(indexFile, { force: true })
    }
}

export function readGateCache(rootDir) {
    try {
        return JSON.parse(readFileSync(path.join(rootDir, GATE_CACHE_FILE), "utf8"))
    } catch {
        return {}
    }
}

/**
 * Records passing gate runs, provided the tree still hashes to what it was
 * when the gate started (startHash). Returns true when recorded. The cache
 * file is gitignored, so writing it never perturbs the hash it is keyed by.
 */
export function recordGatePasses(rootDir, gates, startHash) {
    if (startHash === undefined || startHash === "") {
        return false
    }
    const afterHash = cacheableTreeHash(rootDir)
    if (afterHash !== startHash) {
        return false
    }
    const cache = readGateCache(rootDir)
    const at = new Date().toISOString()
    for (const gate of gates) {
        cache[gate] = { tree: startHash, status: "pass", at }
    }
    try {
        writeFileSync(path.join(rootDir, GATE_CACHE_FILE), `${JSON.stringify(cache, null, 4)}\n`)
    } catch {
        // Cache is an optimization; never fail the gate over it.
        return false
    }
    return true
}

export function recordGatePass(rootDir, gate, startHash) {
    return recordGatePasses(rootDir, [gate], startHash)
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const [command, startHash, ...gates] = process.argv.slice(2)
    if (command === "hash") {
        console.log(cacheableTreeHash(repoRoot) ?? "")
    } else if (command === "record" && gates.length > 0) {
        recordGatePasses(repoRoot, gates, startHash)
    } else {
        console.error("usage: gate-cache.mjs hash | record <start-hash> <gate> [gate...]")
        process.exit(1)
    }
}
