#!/usr/bin/env node
// CI guard: if contract-surface hashes changed, kernel-contract.json version
// must bump in the same commit range.

import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const manifestPath = path.join(repoRoot, "kernel-contract.json")

function sha256(text) {
    return createHash("sha256").update(text).digest("hex")
}

function git(...args) {
    return execFileSync("git", ["-C", repoRoot, ...args], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    }).trim()
}

function gitMaybe(...args) {
    try {
        return git(...args)
    } catch {
        return ""
    }
}

function gitOk(...args) {
    try {
        execFileSync("git", ["-C", repoRoot, ...args], {
            stdio: "ignore",
            maxBuffer: 64 * 1024 * 1024,
        })
        return true
    } catch {
        return false
    }
}

function parseManifest(text, label) {
    let parsed
    try {
        parsed = JSON.parse(text)
    } catch {
        throw new Error(`${label}: kernel-contract.json is not valid JSON`)
    }
    if (parsed?.schema !== "repobot.kernel-contract.v1") {
        throw new Error(`${label}: unsupported schema ${String(parsed?.schema ?? "missing")}`)
    }
    if (!Number.isInteger(parsed.version) || parsed.version < 1) {
        throw new Error(`${label}: version must be an integer >= 1`)
    }
    if (!Number.isInteger(parsed.minCompatibleVersion) || parsed.minCompatibleVersion < 1) {
        throw new Error(`${label}: minCompatibleVersion must be an integer >= 1`)
    }
    if (parsed.minCompatibleVersion > parsed.version) {
        throw new Error(`${label}: minCompatibleVersion cannot exceed version`)
    }
    if (!Array.isArray(parsed.surfacePaths) || parsed.surfacePaths.length === 0) {
        throw new Error(`${label}: surfacePaths must be a non-empty array`)
    }
    return parsed
}

function surfaceDigest(ref, surfacePath) {
    const listing = gitMaybe("ls-tree", "-r", ref, "--", surfacePath)
        .split("\n")
        .filter((line) => line.length > 0)
    if (listing.length === 0) {
        return ""
    }
    return sha256(`${listing.join("\n")}\n`)
}

function resolveBaseRef() {
    const fromArgIndex = process.argv.indexOf("--base")
    if (fromArgIndex !== -1) {
        return process.argv[fromArgIndex + 1] || ""
    }
    const before = String(process.env.GITHUB_EVENT_BEFORE ?? "").trim()
    if (before && !/^0+$/.test(before)) {
        return before
    }
    return "HEAD^"
}

try {
    const current = parseManifest(readFileSync(manifestPath, "utf8"), "current")
    const baseRef = resolveBaseRef()
    if (!baseRef || !gitOk("cat-file", "-e", `${baseRef}^{commit}`)) {
        console.log("kernel-contract guard: no base ref available; skipping bump check")
        process.exit(0)
    }
    const previousManifestText = gitMaybe("show", `${baseRef}:kernel-contract.json`)
    if (!previousManifestText) {
        console.log("kernel-contract guard: kernel-contract.json did not exist at base; skipping bump check")
        process.exit(0)
    }
    const previous = parseManifest(previousManifestText, "base")
    if (current.version < previous.version) {
        throw new Error(
            `kernel-contract version regressed (${previous.version} -> ${current.version}); versions must be monotonic`,
        )
    }

    const changedSurfaces = []
    const allSurfacePaths = [...new Set([...previous.surfacePaths, ...current.surfacePaths])]
    for (const surfacePath of allSurfacePaths) {
        const beforeDigest = surfaceDigest(baseRef, surfacePath)
        const afterDigest = surfaceDigest("HEAD", surfacePath)
        if (beforeDigest !== afterDigest) {
            changedSurfaces.push(surfacePath)
        }
    }

    if (changedSurfaces.length > 0 && current.version === previous.version) {
        throw new Error(
            `kernel-contract surface changed without version bump (still v${current.version}). ` +
                `Changed: ${changedSurfaces.join(", ")}`,
        )
    }

    console.log(
        `kernel-contract guard: ok (base v${previous.version} -> head v${current.version}; ` +
            `${changedSurfaces.length} surface path(s) changed)`,
    )
} catch (error) {
    console.error(`kernel-contract guard: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
}
