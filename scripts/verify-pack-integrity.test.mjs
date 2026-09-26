import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { verifyPackIntegrity } from "./verify-pack-integrity.mjs"

const SCRIPT = fileURLToPath(new URL("./verify-pack-integrity.mjs", import.meta.url))
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const ACTIVE_PACK_SOURCE = [
    "export type PackKey =",
    '    | "blank"',
    '    | "chess"',
    "",
    "export interface ActivePack {}",
].join("\n")

const CLEAN = {
    activePackSource: ACTIVE_PACK_SOURCE,
    packDirs: ["blank", "chess", "chess-vintage"],
    catalogs: {
        blank: JSON.stringify({ homeViewDir: "web/app/src/View/HomePage" }),
        chess: JSON.stringify({ homeViewDir: "web/app/src/View/Games/Chess" }),
        // A derived template: no homeViewDir, not in PackKey — by design.
        "chess-vintage": JSON.stringify({
            remixOf: "chess",
            contentSeed: "web/app/src/View/Games/Chess/vintageRemix.content.ts",
        }),
    },
    homeViewHasFiles: () => true,
    fileExists: () => true,
    activeKey: "blank",
}

test("the real repository passes", () => {
    const stdout = execFileSync(process.execPath, [SCRIPT, REPO_ROOT], { encoding: "utf8" })
    assert.match(stdout, /OK/)
})

test("a complete pack set passes", () => {
    assert.deepEqual(verifyPackIntegrity(CLEAN), [])
})

// Negative test: the observed drift — an agent "cleans up" an inactive pack.
test("deleting an inactive pack directory is a violation", () => {
    const failures = verifyPackIntegrity({
        ...CLEAN,
        packDirs: ["blank"],
        catalogs: { blank: CLEAN.catalogs.blank },
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /packs\/chess\/ is registered in PackKey but missing on disk/)
    assert.match(failures[0], /never be deleted/, "failure must state the invariant")
    assert.match(failures[0], /packs\/active\.json/, "failure must point at the sanctioned path")
})

test("removing a pack's catalog is a violation", () => {
    const failures = verifyPackIntegrity({ ...CLEAN, catalogs: { ...CLEAN.catalogs, chess: null } })
    // Two: the missing catalog itself, and the derived template it strands.
    assert.equal(failures.length, 2)
    assert.match(failures[0], /packs\/chess\/catalog\.json is missing/)
    assert.match(failures[1], /packs\/chess-vintage: remixOf "chess" has no pack directory or catalog/)
})

// Negative test: pack hollowed out — folder stays, views deleted.
test("a missing or empty home view directory is a violation", () => {
    const failures = verifyPackIntegrity({
        ...CLEAN,
        homeViewHasFiles: (viewDir) => viewDir !== "web/app/src/View/Games/Chess",
    })
    assert.equal(failures.length, 1)
    assert.match(
        failures[0],
        /packs\/chess: homeViewDir "web\/app\/src\/View\/Games\/Chess" is missing or empty/,
    )
})

test("a catalog without homeViewDir is a violation", () => {
    const failures = verifyPackIntegrity({
        ...CLEAN,
        catalogs: { ...CLEAN.catalogs, chess: JSON.stringify({ name: "Chess" }) },
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /declares no homeViewDir/)
})

test("a pack directory missing from the PackKey union is a violation", () => {
    const failures = verifyPackIntegrity({
        ...CLEAN,
        packDirs: ["blank", "chess", "poker"],
        catalogs: { ...CLEAN.catalogs, poker: JSON.stringify({ homeViewDir: "web/app/src/View/Poker" }) },
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /packs\/poker\/ exists but is not in the PackKey union/)
})

test("active.json pointing at a deleted pack is a violation", () => {
    const failures = verifyPackIntegrity({ ...CLEAN, activeKey: "ghost" })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /active\.json points at "ghost"/)
})

// Derived templates (packs/README.md "Derived templates"): a remix carries
// no homeViewDir and stays out of PackKey by design — CLEAN passing above
// pins that a remix dir is NOT a violation. Its own completeness is the
// remix chain: the base pack and the content seed.

// Negative test: the observed product drift — a derived template whose seed
// module is gone composes (and flips) wearing the BASE pack's content.
test("a derived template with a missing content seed is a violation", () => {
    const failures = verifyPackIntegrity({
        ...CLEAN,
        fileExists: (file) => file !== "web/app/src/View/Games/Chess/vintageRemix.content.ts",
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /packs\/chess-vintage: contentSeed .* is missing on disk/)
    assert.match(failures[0], /wearing the base pack's content/)
})

test("a derived template declaring no content seed is a violation", () => {
    const failures = verifyPackIntegrity({
        ...CLEAN,
        catalogs: { ...CLEAN.catalogs, "chess-vintage": JSON.stringify({ remixOf: "chess" }) },
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /packs\/chess-vintage: contentSeed undefined is missing on disk/)
})

test("a derived template whose base pack is gone is a violation", () => {
    const failures = verifyPackIntegrity({
        ...CLEAN,
        catalogs: {
            ...CLEAN.catalogs,
            "chess-vintage": JSON.stringify({
                remixOf: "checkers",
                contentSeed: "web/app/src/View/Games/Chess/vintageRemix.content.ts",
            }),
        },
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /packs\/chess-vintage: remixOf "checkers" has no pack directory or catalog/)
})

// The remix active.json rule: the checkout always presents as the BASE pack
// (routers and document stamps only know real packs) — a composer writing
// the remix key here is exactly the flip drift this gate now catches.
test("active.json pointing at a derived template is a violation", () => {
    const failures = verifyPackIntegrity({ ...CLEAN, activeKey: "chess-vintage" })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /active\.json points at "chess-vintage", a derived template/)
    assert.match(failures[0], /BASE pack key \(here "chess"\)/)
})
