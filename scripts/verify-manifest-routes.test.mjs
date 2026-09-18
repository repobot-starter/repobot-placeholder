import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { verifyManifestRoutes } from "./verify-manifest-routes.mjs"

const SCRIPT = fileURLToPath(new URL("./verify-manifest-routes.mjs", import.meta.url))
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// The pristine kernel App.tsx is the reference for an intact dispatch.
const PRISTINE_APP = readFileSync(path.join(REPO_ROOT, "web", "app", "src", "App.tsx"), "utf8")

const HOME_MANIFEST = {
    marketing: { pages: [{ id: "home", path: "/", title: "Home" }] },
}

test("no manifest home: nothing to enforce", () => {
    assert.deepEqual(
        verifyManifestRoutes({
            manifest: { marketing: { pages: [{ id: "about", path: "/about" }] } },
            appSource: "anything at all",
        }),
        { ok: true },
    )
})

test("manifest home with the pristine kernel App.tsx passes", () => {
    assert.deepEqual(verifyManifestRoutes({ manifest: HOME_MANIFEST, appSource: PRISTINE_APP }), { ok: true })
})

test("removing the SitePage dispatch is a bypass", () => {
    // The observed failure mode: an agent reroutes HomePage to a bespoke
    // component and the manifest's home config goes dead.
    const bypassed = PRISTINE_APP.replace(
        /return <SitePage pageId=\{manifestHome\.id\} \/>/,
        "return <CustomLanding />",
    )
    const result = verifyManifestRoutes({ manifest: HOME_MANIFEST, appSource: bypassed })
    assert.equal(result.ok, false)
    assert.match(result.message, /inline `landing` config/)
})

test("removing the home route itself is a bypass", () => {
    const bypassed = PRISTINE_APP.replace(
        /<Route path=\{routes\.home\.path\} element=\{<HomePage \/>\} \/>/,
        "<Route path={routes.home.path} element={<CustomLanding />} />",
    )
    const result = verifyManifestRoutes({ manifest: HOME_MANIFEST, appSource: bypassed })
    assert.equal(result.ok, false)
    assert.match(result.message, /never in route rewiring/)
})

test("CLI passes against the kernel tree (no manifest home declared)", () => {
    const stdout = execFileSync(process.execPath, [SCRIPT, REPO_ROOT], { encoding: "utf8" })
    assert.match(stdout, /OK|nothing to verify/)
})
