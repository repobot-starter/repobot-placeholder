import { LocalAuthClient } from "@base/core"
import { afterEach, describe, expect, it } from "vitest"

// Feature packs (PDF generator, interpreter, invoices) sign in anonymously
// from app code — not through the login surface — so the local client must
// simulate that flow itself with the dev-principal token.
describe("LocalAuthClient.signInAnonymously", () => {
    afterEach(() => {
        localStorage.clear()
    })

    it("signs in with the dev token when one is configured", async () => {
        const client = new LocalAuthClient({ localToken: "dev-jwt" })
        await client.signInAnonymously()
        await expect(client.getToken()).resolves.toBe("dev-jwt")
    })

    it("still throws without a token (static demo builds)", async () => {
        const client = new LocalAuthClient()
        await expect(client.signInAnonymously()).rejects.toThrow(
            "Anonymous sign-in is not available in local auth mode.",
        )
    })
})
