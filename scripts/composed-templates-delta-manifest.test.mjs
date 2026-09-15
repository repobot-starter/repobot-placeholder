import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"

import {
    COMPOSED_TEMPLATES_DELTA_SCHEMA,
    buildComposedTemplatesDeltaManifest,
    hashTemplateTree,
} from "./lib/composed-templates-delta-manifest.mjs"

async function makeTemplate(root, key, marker) {
    const dir = path.join(root, key)
    await mkdir(path.join(dir, "web"), { recursive: true })
    await writeFile(path.join(dir, ".repobot-template-ref"), "rt-fixture\n")
    await writeFile(path.join(dir, "web", "marker.txt"), `${marker}\n`)
    await writeFile(path.join(dir, "README.md"), `template ${key}\n`)
    return dir
}

test("delta manifest carries ref, schema, and deterministic per-template hashes", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "templates-delta-manifest-"))
    try {
        const trees = {
            "repobot-alpha": await makeTemplate(root, "repobot-alpha", "alpha"),
            "repobot-zeta": await makeTemplate(root, "repobot-zeta", "zeta"),
        }
        const manifest = await buildComposedTemplatesDeltaManifest({
            ref: "rt-fixture",
            sourceCommit: "deadbeef",
            templatesByKey: trees,
        })
        assert.equal(manifest.schema, COMPOSED_TEMPLATES_DELTA_SCHEMA)
        assert.equal(manifest.ref, "rt-fixture")
        assert.equal(manifest.monolithTarball, "templates-rt-fixture.tar.zst")
        assert.equal(manifest.templateCount, 2)
        assert.deepEqual(Object.keys(manifest.templates), ["repobot-alpha", "repobot-zeta"])
        assert.match(manifest.templates["repobot-alpha"].hash, /^sha256:[a-f0-9]{64}$/)
        assert.equal(manifest.templates["repobot-zeta"].tarball, "templates-rt-fixture/repobot-zeta.tar.zst")
        const originalHash = manifest.templates["repobot-alpha"].hash
        await writeFile(path.join(trees["repobot-alpha"], "web", "marker.txt"), "changed\n")
        const changedHash = await hashTemplateTree(trees["repobot-alpha"])
        assert.notEqual(changedHash, originalHash)
    } finally {
        await rm(root, { recursive: true, force: true })
    }
})

test("per-template tarballs extract to trees identical to monolith slices", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "templates-delta-tarball-"))
    try {
        const stage = path.join(root, "stage")
        await mkdir(stage, { recursive: true })
        const keys = ["repobot-alpha", "repobot-beta"]
        const trees = {}
        for (const key of keys) {
            trees[key] = await makeTemplate(stage, key, key)
        }
        const manifest = await buildComposedTemplatesDeltaManifest({
            ref: "rt-fixture",
            sourceCommit: "deadbeef",
            templatesByKey: trees,
        })
        await writeFile(
            path.join(stage, ".repobot-templates-delta-manifest.json"),
            `${JSON.stringify(manifest, null, 4)}\n`,
        )

        const monolith = path.join(root, "templates-rt-fixture.tar.zst")
        execFileSync("tar", ["--zstd", "-cf", monolith, "-C", stage, "."])

        const slicesDir = path.join(root, "slices")
        await mkdir(slicesDir, { recursive: true })
        for (const key of keys) {
            execFileSync("tar", [
                "--zstd",
                "-cf",
                path.join(slicesDir, `${key}.tar.zst`),
                "-C",
                trees[key],
                ".",
            ])
        }

        const monolithExtract = path.join(root, "monolith-extract")
        await mkdir(monolithExtract, { recursive: true })
        execFileSync("tar", ["--zstd", "-xf", monolith, "-C", monolithExtract])

        for (const key of keys) {
            const deltaExtract = path.join(root, `slice-${key}`)
            await mkdir(deltaExtract, { recursive: true })
            execFileSync("tar", ["--zstd", "-xf", path.join(slicesDir, `${key}.tar.zst`), "-C", deltaExtract])
            const fullHash = await hashTemplateTree(path.join(monolithExtract, key))
            const sliceHash = await hashTemplateTree(deltaExtract)
            assert.equal(sliceHash, fullHash, `${key} delta tarball must match monolith tree`)
            assert.equal(
                sliceHash,
                manifest.templates[key].hash,
                `${key} hash in manifest must match extracted content`,
            )
        }

        const manifestRoundTrip = JSON.parse(
            await readFile(path.join(stage, ".repobot-templates-delta-manifest.json"), "utf8"),
        )
        assert.equal(manifestRoundTrip.ref, "rt-fixture")
    } finally {
        await rm(root, { recursive: true, force: true })
    }
})
