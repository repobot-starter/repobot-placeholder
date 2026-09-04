// The pre-built web-bundle key contract (scripts/bake-web-bundles.sh): CI
// bakes each approved client-only template's bundle under a cache key the
// PLATFORM deployer (run-deploy.sh in the platform repo) independently
// computes at publish time. The two computations live in different repos and
// can never import each other, so this suite pins the kernel side against
// (a) an independent JS reimplementation of the documented key spec run over
// a fixture tree, and (b) a shared golden vector the platform's
// CustomerDeployerContractTest pins byte-for-byte from its side. If either
// side drifts, its suite goes red before a single mis-keyed bundle ships.
//
// Run: node --test scripts/bake-web-bundles.test.mjs

import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const bakeScript = path.join(repoRoot, "scripts", "bake-web-bundles.sh")
const treeIdHelper = path.join(repoRoot, "scripts", "lib", "web-tree-id.mjs")

// ---------------------------------------------------------------------------
// The shared golden vectors. The platform's CustomerDeployerContractTest pins
// the SAME inputs to the SAME hashes against run-deploy.sh's printf pipeline;
// these constants moving on either side without the other is the drift alarm.
const GOLDEN = {
    treeId: "v2 0000000000000000000000000000000000000000000000000000000000000000",
    authMode: "disabled",
    authMethods: "email-code",
    nodeMajor: "20",
    key: "template/f84eeeafad61149bb58b7ded149c65abdd98bea18c6afaafa5f00991b2b68ede",
}
const GOLDEN_V3 = {
    treeId: "v3 0000000000000000000000000000000000000000000000000000000000000000",
    key: "template/c678bcbc912f30b3b2947e1069af253e3e77fc592d3cb4e000046f92f35c5b59",
}

// The v3 tree id itself is one shared FILE, not a shared spec: the platform
// deployer ships a byte-identical CustomerDeployer/web-tree-id.mjs and pins
// this same digest. Edit both copies and both pins together, never one.
const WEB_TREE_ID_HELPER_SHA256 = "47d00905d9a8fa73bdad25e94b3d56ed54aab7e536da06976cd1700f5d0c3d97"

// The deployer's v2 exclusion set, restated as the independent spec: the
// three overlaid visual documents, the agent instructions, the two mobile
// ActivePack stamps, and packs/ data except packs/active.json.
function specFilter(lsTreeLine) {
    const filePath = lsTreeLine.split("\t")[1]
    if (
        [
            "repobot.theme.json",
            "repobot.landing.json",
            "repobot.content.json",
            "AGENTS.md",
            "ios/App/Config/ActivePack.swift",
            "android/app/src/main/kotlin/com/baseapp/android/config/ActivePack.kt",
        ].includes(filePath)
    ) {
        return false
    }
    if (filePath.startsWith("packs/") && filePath !== "packs/active.json") {
        return false
    }
    return true
}

function sha256(text) {
    return createHash("sha256").update(text).digest("hex")
}

function specTreeId(repoDir) {
    const listing = execFileSync("git", ["-C", repoDir, "ls-tree", "-r", "HEAD^{tree}"], {
        encoding: "utf8",
    })
    const kept = listing
        .split("\n")
        .filter((line) => line.length > 0 && specFilter(line))
        .map((line) => `${line}\n`)
        .join("")
    return `v2 ${sha256(kept)}`
}

function specCacheKey(treeId, authMode, authMethods, nodeMajor) {
    return `template/${sha256(`${treeId} ${authMode} ${authMethods} node${nodeMajor}`)}`
}

// ---------------------------------------------------------------------------
// Fixture: the smallest tree shaped like a composed client-only template —
// every excluded path represented, plus the pack-ref stamp so both variant
// keys print.
function writeFixtureTree(dir) {
    const write = (relative, contents) => {
        mkdirSync(path.dirname(path.join(dir, relative)), { recursive: true })
        writeFileSync(path.join(dir, relative), contents)
    }
    write(
        "repobot.deploy.json",
        `${JSON.stringify({ templateKey: "repobot-fixture", clientOnly: true, capabilities: [], authMethods: ["email-code"] }, null, 4)}\n`,
    )
    write("repobot.theme.json", '{ "mode": "light" }\n')
    write("repobot.landing.json", '{ "sections": [] }\n')
    write("repobot.content.json", "{}\n")
    write("AGENTS.md", "# Agents\n")
    write("ios/App/Config/ActivePack.swift", 'static let key = "fixture"\n')
    write(
        "android/app/src/main/kotlin/com/baseapp/android/config/ActivePack.kt",
        'const val KEY = "fixture"\n',
    )
    write("packs/active.json", '{ "key": "fixture" }\n')
    write("packs/fixture/catalog.json", '{ "key": "fixture" }\n')
    write("web/app/src/main.tsx", "export {}\n")
    write(
        "web/app/index.html",
        '<html><head><title>Spaceboy</title><meta name="repobot-app" content="repobot-base" /></head><body></body></html>',
    )
    write("web/app/public/favicon.ico", "pristine-icon")
    write("web/design-system/src/theme/runtimeSiteDocuments.ts", "export {}\n")
    write(".repobot-template-ref", "rt-fixture\n")
    write(".repobot-template-pack-ref", "rtp-fixture\n")
    // The exec bit is part of git's tree hash; prove the pipeline keeps it.
    write("scripts/fixture.sh", "#!/usr/bin/env bash\n")
    chmodSync(path.join(dir, "scripts", "fixture.sh"), 0o755)
}

function printKeys(tree) {
    const out = execFileSync("bash", [bakeScript, "--print-keys", tree], { encoding: "utf8" })
    const keys = {}
    for (const line of out.trim().split("\n")) {
        const [variant, key] = line.split(" ")
        keys[variant] = key
    }
    return keys
}

let scratch
function freshTree() {
    scratch = mkdtempSync(path.join(os.tmpdir(), "bake-web-test-"))
    const tree = path.join(scratch, "tree")
    mkdirSync(tree)
    writeFixtureTree(tree)
    return tree
}

test.afterEach(() => {
    if (scratch) rmSync(scratch, { recursive: true, force: true })
})

test("the golden vectors match the platform deployer's key pipeline", () => {
    assert.equal(
        specCacheKey(GOLDEN.treeId, GOLDEN.authMode, GOLDEN.authMethods, GOLDEN.nodeMajor),
        GOLDEN.key,
    )
    assert.equal(
        specCacheKey(GOLDEN_V3.treeId, GOLDEN.authMode, GOLDEN.authMethods, GOLDEN.nodeMajor),
        GOLDEN_V3.key,
    )
    // And the script's own printf pipeline agrees with the spec (and thus
    // with the golden), independent of what tree it hashes.
    const script = readFileSync(bakeScript, "utf8")
    assert.match(
        script,
        /printf '%s %s %s node%s'/,
        "the cache-key printf format is the cross-repo contract; do not reshape it unilaterally",
    )
})

test("the v3 tree-id helper is byte-identical to the platform deployer's copy", () => {
    const digest = createHash("sha256").update(readFileSync(treeIdHelper, "utf8")).digest("hex")
    assert.equal(
        digest,
        WEB_TREE_ID_HELPER_SHA256,
        "scripts/lib/web-tree-id.mjs drifted from the pinned digest — update the platform's " +
            "CustomerDeployer/web-tree-id.mjs and BOTH repos' pins together",
    )
})

test("--print-keys emits the v3 key from the helper, and it survives everything a real first publish adds", () => {
    const tree = freshTree()
    const pristine = printKeys(tree)
    assert.ok(pristine.v3, "--print-keys must emit the v3 tier")
    assert.match(pristine.v3, /^template\/[0-9a-f]{64}$/)
    assert.notEqual(pristine.v3, pristine.artifact, "v3 and v2 are different key spaces")

    // The exact noise a real project carries by the time it first
    // publishes (measured on dev deploy edp_JM9weD74XzYXLQ35Rq3Rax):
    // provisioning stamps, the wizard's shell stamp + favicons + brief,
    // flip residue in a DORMANT pack's seed and public imagery.
    const write = (relative, contents) => {
        mkdirSync(path.dirname(path.join(tree, relative)), { recursive: true })
        writeFileSync(path.join(tree, relative), contents)
    }
    write(".repobot-bake-lockhash", "cafebabe\n")
    write(".repobot-public-prune.json", '{ "keep": [] }\n')
    write("docs/setup-brief.md", "# brief\n")
    write("web/app/.env.example", "VITE_X=1\n")
    write(
        "web/app/index.html",
        '<html><head><title>My App 2</title><meta name="repobot-app" content="my-app-2" /></head><body></body></html>',
    )
    write("web/app/public/favicon.ico", "rebranded")
    write("web/app/public/estate/hero-640w.webp", "leftover")
    write("ios/App/View/Theme/GeneratedTheme.swift", "let accent = 1\n")
    write("web/app/src/View/Beta/content.ts", "export const beta = 'remix residue'\n")
    write(
        "packs/beta/catalog.json",
        '{ "key": "beta", "contentContract": { "module": "web/app/src/View/Beta/content.ts" } }\n',
    )
    const noisy = printKeys(tree)
    assert.equal(noisy.v3, pristine.v3, "first-publish noise must not move the v3 key")
    assert.notEqual(noisy.artifact, pristine.artifact, "…while the v2 tier (correctly) rebuilds")

    // A genuine build input still splits v3: the ACTIVE pack flips.
    write("packs/active.json", '{ "key": "beta" }\n')
    assert.notEqual(printKeys(tree).v3, pristine.v3, "a template flip must split the v3 key")
})

test("--print-keys matches the spec reimplementation for both tree variants", () => {
    const tree = freshTree()
    const keys = printKeys(tree)

    // Independent spec computation over the same fixture bytes.
    const gitDir = path.join(scratch, "spec-repo")
    mkdirSync(gitDir)
    execFileSync("bash", [
        "-c",
        `cd ${JSON.stringify(tree)} && tar -cf - . | tar -xf - -C ${JSON.stringify(gitDir)}`,
    ])
    const git = (...args) => execFileSync("git", ["-C", gitDir, ...args], { encoding: "utf8" })
    git("-c", "init.defaultBranch=main", "init", "--quiet")
    git("add", "-A")
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "--quiet", "--no-verify", "-m", "f")
    const nodeMajor = process.versions.node.split(".")[0]
    assert.equal(keys.artifact, specCacheKey(specTreeId(gitDir), "disabled", "email-code", nodeMajor))

    git("rm", "--quiet", "--cached", ".repobot-template-pack-ref")
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "--quiet", "--no-verify", "-m", "v")
    assert.equal(keys["compose-push"], specCacheKey(specTreeId(gitDir), "disabled", "email-code", nodeMajor))
    assert.notEqual(keys.artifact, keys["compose-push"], "the pack-ref stamp is a keyed file")
})

test("config-document edits never move the key; keyed-manifest edits always do", () => {
    const tree = freshTree()
    const pristine = printKeys(tree)

    // The whole point: a first publish differs from the pristine template in
    // exactly these files, and the key must not see any of them.
    writeFileSync(path.join(tree, "repobot.theme.json"), '{ "mode": "dark", "edited": true }\n')
    writeFileSync(path.join(tree, "repobot.landing.json"), '{ "sections": ["hero"] }\n')
    writeFileSync(path.join(tree, "repobot.content.json"), '{ "schedule": {} }\n')
    writeFileSync(path.join(tree, "AGENTS.md"), "# Agents\n\nEdited.\n")
    writeFileSync(path.join(tree, "packs/fixture/catalog.json"), '{ "key": "fixture", "x": 1 }\n')
    assert.deepEqual(printKeys(tree), pristine)

    // The wizard's platforms/capabilities merge rewrites repobot.deploy.json
    // — a file the bundle genuinely bakes — and must split the key.
    const manifest = JSON.parse(readFileSync(path.join(tree, "repobot.deploy.json"), "utf8"))
    manifest.platforms = ["WEB"]
    writeFileSync(path.join(tree, "repobot.deploy.json"), `${JSON.stringify(manifest, null, 4)}\n`)
    const merged = printKeys(tree)
    assert.notEqual(merged.artifact, pristine.artifact)
    assert.notEqual(merged["compose-push"], pristine["compose-push"])
})

test("every prebuilt-web pack is approved (the artifact carries only approved trees)", () => {
    const approved = JSON.parse(readFileSync(path.join(repoRoot, "packs", "approved.json"), "utf8")).packs
    const prebuilt = JSON.parse(readFileSync(path.join(repoRoot, "packs", "prebuilt-web.json"), "utf8")).packs
    for (const pack of prebuilt) {
        assert.ok(approved.includes(pack), `prebuilt-web pack '${pack}' is not in packs/approved.json`)
    }
    assert.equal(new Set(prebuilt).size, prebuilt.length, "duplicate pack in prebuilt-web.json")
})
