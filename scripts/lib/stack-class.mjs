// Which dev stack this workspace needs. dev-up.sh keys on the answer:
// "client" boots the web dev server ALONE — no functions emulator, no
// database, no migrations/functions build, no graphql readiness probe — and
// publishes .dev/stack-ready the moment Vite answers; "full" keeps the
// complete harness. Exists because static-class templates were paying the
// whole backend boot on shared-CPU sandbox pods (premium-static-sites §6
// "no backend dev-server processes competing for shared CPU"): the
// 2026-09-18 owner repro saw the functions emulator take five minutes to
// even spawn on a static influencer site, the readiness marker gated on it,
// and the preview sat gray while an idle emulator and embedded Postgres
// starved Vite.
//
// The classification mirrors the platform's Applications-class test
// (repobot TemplateRegistry isApplicationTemplate; the static class is its
// complement): a template is an application when its base family is app or
// store (the configurable full-stack families), or when it declares a
// capability that only exists through provisioned infrastructure or a
// custom backend. IOS/ANDROID name where a template ships, not what it
// provisions — a client-only game with app-store targets is still a static
// deploy. The blank starter is exempt despite its historical app base tag:
// it composes the bare kernel and provisions nothing.
//
// Inputs come from repobot.deploy.json, the compose-stamped capability
// manifest agents update in-project when they add or remove capabilities —
// wiring a real backend into a client-only template flips the next dev-up
// back to "full" with no kernel change. A missing or unreadable manifest
// means "full": kernel dev checkouts and pre-manifest repos keep the
// complete harness. REPOBOT_DEV_STACK=full|client overrides for debugging.

import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// Keep in sync with the platform's TemplateRegistry applicationCapabilities
// (everything in the capability vocabulary except the native platform
// targets IOS/ANDROID).
export const applicationCapabilities = new Set([
    "AUTH",
    "DATABASE",
    "EMAIL",
    "BACKEND",
    "PAYMENTS",
    "AI",
    "DOCUMENTS",
    "STORAGE",
    "JOBS",
    "PUSH",
])

/** "client" | "full" for a parsed repobot.deploy.json manifest object. */
export function classifyStackForManifest(manifest) {
    if (!manifest || typeof manifest !== "object") {
        return "full"
    }
    if (manifest.packKey === "blank") {
        return "client"
    }
    if (manifest.base === "app" || manifest.base === "store") {
        return "full"
    }
    const capabilities = Array.isArray(manifest.capabilities) ? manifest.capabilities : []
    if (capabilities.some((capability) => applicationCapabilities.has(capability))) {
        return "full"
    }
    return "client"
}

/** "client" | "full" for the repo at repoRoot, honoring REPOBOT_DEV_STACK. */
export function classifyStackForRepo(repoRoot, env = process.env) {
    const override = env.REPOBOT_DEV_STACK
    if (override === "full" || override === "client") {
        return override
    }
    let manifest
    try {
        manifest = JSON.parse(readFileSync(path.join(repoRoot, "repobot.deploy.json"), "utf8"))
    } catch {
        // No manifest (kernel dev checkout, pre-manifest repo) or an
        // unreadable one: the full harness is the conservative default.
        return "full"
    }
    return classifyStackForManifest(manifest)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const repoRoot = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
    process.stdout.write(classifyStackForRepo(repoRoot) + "\n")
}
