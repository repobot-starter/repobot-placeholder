// Decides which check:all sections apply to this tree, from the deploy
// manifest (repobot.deploy.json) compose emits into every composed project.
// The kernel repo itself carries no manifest and checks everything it ships.
//
// This keeps "which checks does this project need?" out of agent judgment:
// check-all.sh evals this script's output, so a clientOnly marketing site
// never pays for functions lint/build, and native builds run exactly when
// the project ships that platform (and the machine has the toolchain).
//
// CLI: node scripts/lib/check-scope.mjs [manifest-path]
// Prints shell variable assignments for check-all.sh to eval.

import { readFileSync } from "node:fs"

/**
 * @param {{ clientOnly?: boolean, platforms?: string[] } | undefined} manifest
 *   Parsed repobot.deploy.json, or undefined when the tree has none (kernel).
 */
export function computeCheckScope(manifest) {
    if (!manifest || typeof manifest !== "object") {
        // No manifest: the kernel itself, or a tree from before compose
        // emitted one. Check the full backend+web surface (native platform
        // checks stay opt-in via their own npm scripts, as before).
        return { checkBackend: true, checkIos: false, checkAndroid: false }
    }
    // `platforms` records the platform choice made during project setup.
    // The IOS/ANDROID entries in `capabilities` must NOT trigger builds:
    // they are shipped-code badges (nearly every pack carries the native
    // twins in-tree), not a statement that this project targets them. A
    // manifest without `platforms` means web-only — the default choice.
    const platforms = Array.isArray(manifest.platforms) ? manifest.platforms : ["WEB"]
    return {
        checkBackend: manifest.clientOnly !== true,
        checkIos: platforms.includes("IOS"),
        checkAndroid: platforms.includes("ANDROID"),
    }
}

function main() {
    const manifestPath = process.argv[2] ?? "repobot.deploy.json"
    let manifest
    try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    } catch {
        manifest = undefined
    }
    const scope = computeCheckScope(manifest)
    process.stdout.write(
        [
            `CHECK_BACKEND=${scope.checkBackend}`,
            `CHECK_IOS=${scope.checkIos}`,
            `CHECK_ANDROID=${scope.checkAndroid}`,
            "",
        ].join("\n"),
    )
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
    main()
}
