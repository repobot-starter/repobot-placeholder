import { expect } from "chai"
import { jwtVerify } from "jose"
import { oauthCallbackUrl, signOAuthStartState } from "../../src/CloudFunctions/Auth.js"
import { builtinAuthJwtSecret } from "../../src/Services/Identity/TokenVerifier.js"

/**
 * The platform's stable OAuth callback proxy, from the kernel's side: with
 * AUTH_OAUTH_PROXY_URL set (the platform injects it for deployed
 * environments), providers are handed the proxy as redirect_uri and the
 * state JWT carries this environment's own auth origin so the proxy can
 * forward the callback home. Without it, nothing changes from the classic
 * flow — providers redirect straight to AUTH_PUBLIC_URL.
 */
describe("OAuth callback proxy (kernel side)", function () {
    const originalEnv = { ...process.env }

    beforeEach(function () {
        process.env.AUTH_JWT_SECRET = "a".repeat(64)
        process.env.AUTH_PUBLIC_URL = "https://us-central1-proj.cloudfunctions.net/slug__auth__request__api"
        delete process.env.AUTH_OAUTH_PROXY_URL
    })

    afterEach(function () {
        process.env = { ...originalEnv }
    })

    it("hands providers the environment's own callback when no proxy is configured", function () {
        expect(oauthCallbackUrl("google")).to.equal(
            "https://us-central1-proj.cloudfunctions.net/slug__auth__request__api/google/callback",
        )
    })

    it("hands providers the proxy callback when the platform configured one", function () {
        // Trailing slash tolerated: the platform composes the URL, but a
        // doubled slash in redirect_uri would fail exact-match checks.
        process.env.AUTH_OAUTH_PROXY_URL =
            "https://us-central1-platform.cloudfunctions.net/auth__request__oauth_proxy/"
        expect(oauthCallbackUrl("apple")).to.equal(
            "https://us-central1-platform.cloudfunctions.net/auth__request__oauth_proxy/apple/callback",
        )
    })

    it("mints a plain state without the proxy, and adds the origin claim with it", async function () {
        const plain = await jwtVerify(
            await signOAuthStartState("https://app.example.test/"),
            builtinAuthJwtSecret(),
        )
        expect(plain.payload.redirect_to).to.equal("https://app.example.test/")
        expect(plain.payload.origin).to.equal(undefined)

        process.env.AUTH_OAUTH_PROXY_URL =
            "https://us-central1-platform.cloudfunctions.net/auth__request__oauth_proxy"
        const proxied = await jwtVerify(
            await signOAuthStartState("https://app.example.test/"),
            builtinAuthJwtSecret(),
        )
        expect(proxied.payload.redirect_to).to.equal("https://app.example.test/")
        // The origin is this environment's auth base — the proxy checks it
        // against its allowlist of provisioned environments and forwards.
        expect(proxied.payload.origin).to.equal(process.env.AUTH_PUBLIC_URL)
        expect(proxied.payload.exp).to.be.a("number")
    })
})
