import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const helperPath = path.join(repoRoot, "scripts", "lib", "kernel-contract-fingerprint.mjs")

// Cross-repo pin: platform carries the same vendored helper and pins this
// digest in CustomerDeployerContractTest.
const KERNEL_CONTRACT_HELPER_SHA256 = "29e0a18944eeec9c00da2bfac4bd7ce0565b5005ea6fc049d85ce21fb9d14d49"

const GOLDEN = {
    schema: "repobot.kernel-contract.v1",
    version: 1,
    minCompatibleVersion: 1,
    surfaceHashes: [
        {
            path: "web/design-system/src/theme/runtimeSiteDocuments.ts",
            digest: "0000000000000000000000000000000000000000000000000000000000000000",
        },
        {
            path: "web/app/src/View/Landing/landingDocument.ts",
            digest: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        },
    ],
    fingerprint: "kc1 dc74856402a9f8074380cde2669feda63d15a7941cfb966baf47cfa8645c95b9",
}

function sha256(text) {
    return createHash("sha256").update(text).digest("hex")
}

function specFingerprint(golden) {
    const preimage = [
        `schema ${golden.schema}`,
        `version ${golden.version}`,
        `minCompatibleVersion ${golden.minCompatibleVersion}`,
        ...golden.surfaceHashes.map((entry) => `surface ${entry.path} ${entry.digest}`),
    ].join("\n")
    return `kc1 ${sha256(`${preimage}\n`)}`
}

test("golden vector is stable", () => {
    assert.equal(specFingerprint(GOLDEN), GOLDEN.fingerprint)
})

test("helper digest matches cross-repo pin", () => {
    const digest = createHash("sha256").update(readFileSync(helperPath, "utf8")).digest("hex")
    assert.equal(digest, KERNEL_CONTRACT_HELPER_SHA256)
})

test("helper emits parseable contract metadata", () => {
    const out = execFileSync("node", [helperPath, repoRoot, "--json"], { encoding: "utf8" })
    const parsed = JSON.parse(out)
    assert.equal(parsed.schema, "repobot.kernel-contract.v1")
    assert.match(parsed.fingerprint, /^kc1 [0-9a-f]{64}$/)
    assert.ok(Number.isInteger(parsed.version))
    assert.ok(Number.isInteger(parsed.minCompatibleVersion))
    assert.ok(Array.isArray(parsed.surfaceHashes))
    assert.ok(parsed.surfaceHashes.length > 0)
})
