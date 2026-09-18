import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import { verifyAuthSurface } from "./verify-auth-surface.mjs"

const SCRIPT = fileURLToPath(new URL("./verify-auth-surface.mjs", import.meta.url))
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

test("the real repository passes", () => {
    const stdout = execFileSync(process.execPath, [SCRIPT, REPO_ROOT], { encoding: "utf8" })
    assert.match(stdout, /OK/)
})

// Negative test: the observed drift — a page grows its own credential form.
test("a hand-rolled password form outside the kernel is a violation", () => {
    const failures = verifyAuthSurface({
        "web/app/src/View/Members/MembersLogin.tsx": [
            "export const MembersLogin = () => (",
            "    <form>",
            '        <input type="password" autoComplete="current-password" />',
            "    </form>",
            ")",
        ].join("\n"),
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /MembersLogin\.tsx:3/)
    assert.match(failures[0], /AuthCard\/AuthScreen/, "failure must point at the kernel auth components")
})

// Negative test: bespoke sign-in wiring outside LoginPage.
test("calling signInWithPassword from a page is a violation", () => {
    const failures = verifyAuthSurface({
        "web/app/src/View/Portal/PortalPage.tsx":
            "await runtime.authClient.signInWithPassword(email, password)",
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /sign-in call outside View\/LoginPage/)
})

// Negative test: a design-system component can't sneak in a login form either.
test("a new design-system component with password UI is a violation", () => {
    const failures = verifyAuthSurface({
        "web/design-system/src/components/QuickLogin.tsx": '<input type="password" />',
    })
    assert.equal(failures.length, 1)
    assert.match(failures[0], /QuickLogin\.tsx:1/)
})

test("the kernel auth components and LoginPage are sanctioned", () => {
    const failures = verifyAuthSurface({
        "web/design-system/src/components/AuthCard.tsx": '<input type="password" />',
        "web/app/src/View/LoginPage/LoginPage.tsx": "await runtime.authClient.signInWithOAuth(provider)",
        "web/core/src/Auth/BuiltinAuthClient.ts": "async signInWithPassword(email, password) {}",
        "web/app/src/Theme/overrides/AuthCard.tsx": '<input type="password" />',
    })
    assert.deepEqual(failures, [])
})

test("guest-session bootstrap via signInAnonymously is permitted", () => {
    const failures = verifyAuthSurface({
        "web/app/src/View/Invoices/InvoicePage.tsx": "await runtime.authClient.signInAnonymously()",
    })
    assert.deepEqual(failures, [])
})

test("the Settings change-password card stays baselined", () => {
    const failures = verifyAuthSurface({
        "web/app/src/View/Settings/SettingsPage.tsx": '<input type="password" autoComplete="new-password" />',
    })
    assert.deepEqual(failures, [])
})

test("auth-exempt comment suppresses non-credential secret inputs", () => {
    const failures = verifyAuthSurface({
        "web/app/src/View/Settings/ApiKeys.tsx":
            '<input type="password" /> {/* auth-exempt: API key masking, not a credential */}',
    })
    assert.deepEqual(failures, [])
})
