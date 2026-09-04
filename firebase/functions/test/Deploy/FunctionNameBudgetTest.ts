import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { expect } from "chai"

// Deployed environments re-export every Cloud Function under
// "{functionPrefix}__{exportName}" (see the platform deployer's
// make-deploy-entry.mjs), and GCP caps function names at 62 characters.
// The prefix is derived from the deploy slug, which caps at 30 characters,
// so every export name here must fit in the remaining budget. A name that
// exceeds it deploys fine locally and in short-named environments, then
// fails other users' deploys at DEPLOYING_BACKEND.
const GCP_FUNCTION_NAME_MAX = 62
const DEPLOY_SLUG_MAX = 30
const PREFIX_SEPARATOR = "__"
const EXPORT_NAME_BUDGET = GCP_FUNCTION_NAME_MAX - DEPLOY_SLUG_MAX - PREFIX_SEPARATOR.length

// Same export discovery the deployer's make-deploy-entry.mjs performs.
function discoverExportedFunctionNames(indexSource: string): string[] {
    const names = new Set<string>()
    for (const match of indexSource.matchAll(/export\s*\{\s*([a-zA-Z0-9_,\s]+?)\s*\}/g)) {
        for (const name of match[1]!.split(",")) {
            const trimmed = name.trim()
            if (trimmed.length > 0) {
                names.add(trimmed)
            }
        }
    }
    for (const match of indexSource.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)/g)) {
        names.add(match[1]!)
    }
    return [...names]
}

describe("Function name budget", function () {
    it("keeps every exported function name deployable under a max-length prefix", function () {
        const indexPath = path.join(
            path.dirname(fileURLToPath(import.meta.url)),
            "..",
            "..",
            "src",
            "index.ts",
        )
        const names = discoverExportedFunctionNames(readFileSync(indexPath, "utf8"))
        expect(names).to.have.length.greaterThan(0)

        const oversized = names.filter((name) => name.length > EXPORT_NAME_BUDGET)
        expect(
            oversized,
            `These exports exceed the ${EXPORT_NAME_BUDGET}-char budget and would fail ` +
                `customer deploys with long deploy slugs: ${oversized.join(", ")}`,
        ).to.deep.equal([])
    })
})
