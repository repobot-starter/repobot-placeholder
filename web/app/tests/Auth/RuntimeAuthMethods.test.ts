import { fetchRuntimeAuthMethodsFromUrl, LocalAuthClient } from "@base/core"
import { afterEach, describe, expect, it, vi } from "vitest"

function stubConfigResponse(body: unknown, ok = true): ReturnType<typeof vi.fn> {
    const fetchStub = vi.fn().mockResolvedValue({
        ok,
        json: async () => body,
    })
    vi.stubGlobal("fetch", fetchStub)
    return fetchStub
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe("fetchRuntimeAuthMethodsFromUrl", () => {
    it("returns the live-toggled methods from GET /config", async () => {
        const fetchStub = stubConfigResponse({ methods: ["email-code", "password"] })
        await expect(fetchRuntimeAuthMethodsFromUrl("https://auth.example")).resolves.toEqual([
            "email-code",
            "password",
        ])
        expect(fetchStub).toHaveBeenCalledWith("https://auth.example/config")
    })

    it("returns undefined when the project has never live-toggled (methods null)", async () => {
        stubConfigResponse({ methods: null })
        await expect(fetchRuntimeAuthMethodsFromUrl("https://auth.example")).resolves.toBeUndefined()
    })

    it("drops unknown method names and empties out to undefined", async () => {
        stubConfigResponse({ methods: ["magic-beans", "password"] })
        await expect(fetchRuntimeAuthMethodsFromUrl("https://auth.example")).resolves.toEqual(["password"])
        stubConfigResponse({ methods: ["magic-beans"] })
        await expect(fetchRuntimeAuthMethodsFromUrl("https://auth.example")).resolves.toBeUndefined()
    })

    it("is fail-safe on HTTP errors and network failures", async () => {
        stubConfigResponse({}, false)
        await expect(fetchRuntimeAuthMethodsFromUrl("https://auth.example")).resolves.toBeUndefined()
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
        await expect(fetchRuntimeAuthMethodsFromUrl("https://auth.example")).resolves.toBeUndefined()
    })
})

// Sandbox parity: the local (sandbox) client reads the same runtime method
// list deploys do, so dashboard live-toggles show up in previews.
describe("LocalAuthClient.fetchRuntimeAuthMethods", () => {
    it("fetches the runtime methods when an auth URL is configured", async () => {
        const fetchStub = stubConfigResponse({ methods: ["email-code", "password"] })
        const client = new LocalAuthClient({ authUrl: "https://auth.example" })
        await expect(client.fetchRuntimeAuthMethods()).resolves.toEqual(["email-code", "password"])
        expect(fetchStub).toHaveBeenCalledWith("https://auth.example/config")
    })

    it("keeps build-time methods when no auth URL exists (static demo builds)", async () => {
        const fetchStub = stubConfigResponse({ methods: ["password"] })
        const client = new LocalAuthClient()
        await expect(client.fetchRuntimeAuthMethods()).resolves.toBeUndefined()
        expect(fetchStub).not.toHaveBeenCalled()
    })
})
