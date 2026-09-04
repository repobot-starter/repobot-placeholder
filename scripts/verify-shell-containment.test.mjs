import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { verifyShellContainment } from "./verify-shell-containment.mjs"

const SCRIPT = fileURLToPath(new URL("./verify-shell-containment.mjs", import.meta.url))
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const PRISTINE_APP_LAYOUT = readFileSync(
    path.join(REPO_ROOT, "web", "app", "src", "View", "Navbar", "AppLayout.tsx"),
    "utf8",
)
const PRISTINE_APP = readFileSync(path.join(REPO_ROOT, "web", "app", "src", "App.tsx"), "utf8")

const CLEAN = {
    "web/app/src/View/Navbar/AppLayout.tsx": PRISTINE_APP_LAYOUT,
    "web/app/src/App.tsx": PRISTINE_APP,
}

test("the real repository passes", () => {
    const stdout = execFileSync(process.execPath, [SCRIPT, REPO_ROOT], { encoding: "utf8" })
    assert.match(stdout, /OK/)
})

test("pristine kernel chrome passes", () => {
    assert.deepEqual(verifyShellContainment(CLEAN), [])
})

// Negative test: the observed drift — an agent swaps the kernel AppShell for
// a bespoke layout component inside AppLayout.
test("replacing AppShell in AppLayout is a violation", () => {
    const bespoke = PRISTINE_APP_LAYOUT.replace(/AppShell/g, "MyCustomShell")
    const failures = verifyShellContainment({ ...CLEAN, "web/app/src/View/Navbar/AppLayout.tsx": bespoke })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /no longer renders the kernel AppShell/)
    assert.match(failures[0], /@ui\s+registry/, "failure must point at the sanctioned eject path")
})

test("deleting AppLayout is a violation", () => {
    const failures = verifyShellContainment({ "web/app/src/App.tsx": PRISTINE_APP })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /AppLayout\.tsx is gone/)
})

// Negative test: protected routes rewired around the shell wrapper.
test("unnesting protected routes from AppLayout is a violation", () => {
    const rewired = PRISTINE_APP.replace(/<Route element=\{<AppLayout \/>\}>/, "<>")
    const failures = verifyShellContainment({ ...CLEAN, "web/app/src/App.tsx": rewired })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /no longer nests the protected routes/)
})

// Negative test: a new page hand-builds a sidebar instead of composing the shell.
test("a new page with its own <aside> and no kernel shell import is a violation", () => {
    const failures = verifyShellContainment({
        ...CLEAN,
        "web/app/src/View/Reports/ReportsPage.tsx": [
            'import { Button } from "@ui"',
            "export const ReportsPage = () => (",
            "    <div>",
            '        <aside className="sidebar">links</aside>',
            "    </div>",
            ")",
        ].join("\n"),
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /ReportsPage\.tsx:4/)
    assert.match(failures[0], /AppShell\/MarketingShell/, "failure must point at the kernel shells")
})

test("a page composing MarketingShell may render nav semantics", () => {
    const failures = verifyShellContainment({
        ...CLEAN,
        "web/app/src/View/About/AboutPage.tsx": [
            'import { MarketingShell } from "@ui"',
            "export const AboutPage = () => (",
            "    <MarketingShell>",
            '        <nav aria-label="sections">…</nav>',
            "    </MarketingShell>",
            ")",
        ].join("\n"),
    })
    assert.deepEqual(failures, [])
})

test("shell-exempt comment suppresses in-page nav semantics", () => {
    const failures = verifyShellContainment({
        ...CLEAN,
        "web/app/src/View/Docs/DocsPage.tsx":
            '<nav aria-label="pagination">…</nav> {/* shell-exempt: in-page pagination */}',
    })
    assert.deepEqual(failures, [])
})

test("the @ui overrides registry is the sanctioned eject seam", () => {
    const failures = verifyShellContainment({
        ...CLEAN,
        "web/app/src/Theme/overrides/AppShell.tsx": "<aside>ejected shell copy</aside>",
    })
    assert.deepEqual(failures, [])
})

test("baselined art-directed pack pages stay green", () => {
    const shopPage = readFileSync(
        path.join(REPO_ROOT, "web", "app", "src", "View", "Shop", "ShopPage.tsx"),
        "utf8",
    )
    const failures = verifyShellContainment({ ...CLEAN, "web/app/src/View/Shop/ShopPage.tsx": shopPage })
    assert.deepEqual(failures, [])
})
