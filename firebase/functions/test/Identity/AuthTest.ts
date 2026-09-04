import { expect } from "chai"
import { SignJWT } from "jose"
import { GqlUser } from "../../generated/GraphqlResolverTypes.js"
import { LocalTokenVerifier } from "../../src/Services/Identity/TokenVerifier.js"
import { LOCAL_DEV_AUTH_SUBJECT, principalService } from "../../src/Services/Identity/PrincipalService.js"
import { executeGqlAt } from "../Utils/Gql/GqlUtils.js"

async function signLocalToken(claims: { sub: string; email: string }): Promise<string> {
    const secret = Buffer.from(process.env.LOCAL_AUTH_SECRET!, "hex")
    return await new SignJWT({ email: claims.email })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(claims.sub)
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secret)
}

describe("Auth", function () {
    it("LocalTokenVerifier verifies a token signed with LOCAL_AUTH_SECRET", async function () {
        const token = await signLocalToken({ sub: "some-subject", email: "someone@example.test" })

        const verified = await new LocalTokenVerifier().verify(token)
        expect(verified.authSubject).to.equal("some-subject")
        expect(verified.email).to.equal("someone@example.test")
    })

    it("LocalTokenVerifier rejects a token signed with a different secret", async function () {
        const token = await new SignJWT({ email: "attacker@example.test" })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject("attacker")
            .sign(Buffer.from("bb".repeat(32), "hex"))

        await expect(new LocalTokenVerifier().verify(token)).to.be.rejectedWith("Invalid local auth token")
    })

    it("LocalTokenVerifier refuses to construct outside the emulator and tests", function () {
        const originalNodeEnv = process.env.NODE_ENV
        const originalFunctionsEmulator = process.env.FUNCTIONS_EMULATOR
        try {
            process.env.NODE_ENV = "production"
            delete process.env.FUNCTIONS_EMULATOR

            expect(() => new LocalTokenVerifier()).to.throw(
                "AUTH_MODE=local is only allowed inside the Firebase emulator or tests",
            )
        } finally {
            process.env.NODE_ENV = originalNodeEnv
            if (originalFunctionsEmulator !== undefined) {
                process.env.FUNCTIONS_EMULATOR = originalFunctionsEmulator
            }
        }
    })

    it("auto-provisions the local dev principal and serves currentUser", async function () {
        // First hydration of the well-known dev subject creates the "Local
        // Dev" account and user, so a fresh sandbox works with zero setup.
        const principal = await principalService.hydratePrincipal({
            authSubject: LOCAL_DEV_AUTH_SUBJECT,
            email: "dev@local.test",
        })
        expect(principal.userId).to.be.a("string")
        expect(principal.accountId).to.be.a("string")

        // Hydration is idempotent.
        const secondPrincipal = await principalService.hydratePrincipal({
            authSubject: LOCAL_DEV_AUTH_SUBJECT,
            email: "dev@local.test",
        })
        expect(secondPrincipal.userId).to.equal(principal.userId)

        // currentUser resolves the hydrated user, blackbox through GraphQL.
        const currentUser = await executeGqlAt<GqlUser>(
            this.apolloServer,
            `query CurrentUser {
                currentUser {
                    id
                    email
                    displayName
                    status
                    account { id name }
                }
            }`,
            {},
            "currentUser",
            principal,
        )
        expect(currentUser.id).to.equal(principal.userId)
        expect(currentUser.email).to.equal("dev@local.test")
        expect(currentUser.displayName).to.equal("Local Dev")
        expect(currentUser.account?.name).to.equal("Local Dev")
    })

    it("does not auto-provision unknown subjects", async function () {
        const principal = await principalService.hydratePrincipal({
            authSubject: "some-unknown-subject",
            email: "unknown@example.test",
        })
        expect(principal.userId).to.equal(undefined)
    })
})
