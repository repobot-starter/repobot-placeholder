import { LocalAuthClient } from "@base/core"
import { afterEach, describe, expect, it } from "vitest"
import { createSandboxAutoSignIn, sandboxAutoSignInToken } from "../../src/Config/sandboxAutoSignIn"

// The sandbox auto-signin (ProtectedRoutes lands workspace previews on the
// signed-in dashboard) and — more importantly — its security boundary: no
// deployed build may ever arm it. Deploys with auth build with
// VITE_AUTH_MODE=builtin, deploys without auth with VITE_AUTH_MODE=disabled,
// and neither carries VITE_LOCAL_AUTH_TOKEN (a local-only variable per
// env.manifest.json); every one of those shapes must resolve to "no token".

const DEV_TOKEN = "dev-principal-jwt"

afterEach(() => {
    localStorage.clear()
})

describe("sandboxAutoSignInToken (the deploy boundary)", () => {
    it("arms in local (sandbox) auth mode when the dev token exists", () => {
        expect(sandboxAutoSignInToken({ VITE_AUTH_MODE: "local", VITE_LOCAL_AUTH_TOKEN: DEV_TOKEN })).toBe(
            DEV_TOKEN,
        )
        // Sandboxes commonly leave the mode unset (local is the default).
        expect(sandboxAutoSignInToken({ VITE_LOCAL_AUTH_TOKEN: DEV_TOKEN })).toBe(DEV_TOKEN)
    })

    it("never arms a builtin-auth deploy, even with a token present", () => {
        expect(
            sandboxAutoSignInToken({
                VITE_AUTH_MODE: "builtin",
                VITE_LOCAL_AUTH_TOKEN: DEV_TOKEN,
            }),
        ).toBeUndefined()
    })

    it("never arms a disabled-auth deploy, even with a token present", () => {
        expect(
            sandboxAutoSignInToken({
                VITE_AUTH_MODE: "disabled",
                VITE_LOCAL_AUTH_TOKEN: DEV_TOKEN,
            }),
        ).toBeUndefined()
    })

    it("never arms without a dev token (the deployed-bundle shape)", () => {
        expect(sandboxAutoSignInToken({})).toBeUndefined()
        expect(sandboxAutoSignInToken({ VITE_LOCAL_AUTH_TOKEN: "" })).toBeUndefined()
        expect(sandboxAutoSignInToken({ VITE_AUTH_MODE: "local" })).toBeUndefined()
    })
})

describe("createSandboxAutoSignIn", () => {
    it("signs the dev principal in when armed", async () => {
        const authClient = new LocalAuthClient()
        const autoSignIn = createSandboxAutoSignIn({ token: DEV_TOKEN, authClient })

        expect(autoSignIn.isArmed()).toBe(true)
        autoSignIn.signIn()
        expect(await authClient.getToken()).toBe(DEV_TOKEN)
    })

    it("stays disarmed without a token", () => {
        const authClient = new LocalAuthClient()
        const autoSignIn = createSandboxAutoSignIn({ token: undefined, authClient })
        expect(autoSignIn.isArmed()).toBe(false)
        // A defensive signIn call must not throw or persist anything.
        autoSignIn.signIn()
        expect(localStorage.getItem("base.localAuthToken")).toBeNull()
    })

    it("recover() re-signs the dev principal and reports true while armed", async () => {
        const authClient = new LocalAuthClient()
        const autoSignIn = createSandboxAutoSignIn({ token: DEV_TOKEN, authClient })

        // The recurring sandbox shape: the persisted session degraded (pod
        // recycle rotated the secret) but no sign-out was observed yet —
        // the runtime's UNAUTHENTICATED handling asks for a re-bootstrap.
        await expect(autoSignIn.recover()).resolves.toBe(true)
        expect(await authClient.getToken()).toBe(DEV_TOKEN)
    })

    it("recover() reports false without a token and persists nothing", async () => {
        const authClient = new LocalAuthClient()
        const autoSignIn = createSandboxAutoSignIn({ token: undefined, authClient })

        await expect(autoSignIn.recover()).resolves.toBe(false)
        expect(localStorage.getItem("base.localAuthToken")).toBeNull()
    })

    it("recover() stands down after an observed sign-out, so signing out is not undone", async () => {
        const authClient = new LocalAuthClient()
        const autoSignIn = createSandboxAutoSignIn({ token: DEV_TOKEN, authClient })

        await authClient.signInLocal(DEV_TOKEN)
        await authClient.signOut()

        // A stray in-flight query failing UNAUTHENTICATED after the user
        // signed out must not silently sign them back in.
        await expect(autoSignIn.recover()).resolves.toBe(false)
        expect(await authClient.getToken()).toBeNull()
    })

    it("disarms permanently once a sign-out is observed, so signing out works", async () => {
        const authClient = new LocalAuthClient()
        const autoSignIn = createSandboxAutoSignIn({ token: DEV_TOKEN, authClient })

        autoSignIn.signIn()
        expect(await authClient.getToken()).toBe(DEV_TOKEN)

        // The user presses "Sign out" (or the runtime degrades a stale
        // token): the simulation stands down for the rest of the document.
        await authClient.signOut()
        expect(autoSignIn.isArmed()).toBe(false)
        autoSignIn.signIn()
        expect(await authClient.getToken()).toBeNull()

        // Signing back in through the (simulated) login page does not
        // re-arm the automatic path — the page's own flows own it now.
        await authClient.signInLocal(DEV_TOKEN)
        expect(autoSignIn.isArmed()).toBe(false)
    })
})
