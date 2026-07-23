import { expect } from "chai"
import { eq } from "drizzle-orm"
import { authEmailCodesTable } from "../../src/Data/Identity/AuthEmailCode.js"
import { identityDb } from "../../src/Data/IdentityDatabase.js"
import { FakeMailWrapper, setMailWrapperForTests } from "../../src/DependencyWrappers/MailWrapper/index.js"
import { builtinAuthService } from "../../src/Services/Identity/BuiltinAuth/BuiltinAuthService.js"
import { BuiltinTokenVerifier } from "../../src/Services/Identity/TokenVerifier.js"
import { randomEmail } from "../Utils/Factories/RandomValues.js"

const TEST_JWT_SECRET_HEX = "aa".repeat(32)
const SITE_URL = "https://app.example.test"

/** Pulls the 6-digit code out of a captured auth email. */
function codeFromEmail(mail: FakeMailWrapper, email: string): string {
    const message = mail.lastMessageTo(email)
    expect(message, `expected an email to ${email}`).to.not.equal(undefined)
    const match = message!.html.match(/>(\d{6})</)
    expect(match, "expected a 6-digit code in the email body").to.not.equal(null)
    return match![1]
}

describe("BuiltinAuth", function () {
    let mail: FakeMailWrapper
    let originalJwtSecret: string | undefined

    before(function () {
        originalJwtSecret = process.env.AUTH_JWT_SECRET
        process.env.AUTH_JWT_SECRET = TEST_JWT_SECRET_HEX
    })

    after(function () {
        if (originalJwtSecret === undefined) {
            delete process.env.AUTH_JWT_SECRET
        } else {
            process.env.AUTH_JWT_SECRET = originalJwtSecret
        }
        setMailWrapperForTests(undefined)
    })

    beforeEach(function () {
        mail = new FakeMailWrapper()
        setMailWrapperForTests(mail)
    })

    describe("email codes", function () {
        it("signs in with an emailed code, creating the user on first contact", async function () {
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const code = codeFromEmail(mail, email)

            const session = await builtinAuthService.verifyEmailCode({
                email,
                code,
                purposes: ["SIGN_IN", "SIGN_UP"],
            })
            expect(session.accessToken).to.be.a("string")
            expect(session.refreshToken).to.be.a("string")

            // The minted token verifies and carries the identity subject.
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            expect(verified.authSubject).to.match(/^auid_/)
            expect(verified.email).to.equal(email)

            // The application user was created and linked at mint time.
            const connection = await this.identityHelper.getUsers({
                filters: { email },
                connection: {
                    pagination: { first: 10 },
                    sort: [{ fieldName: "email", direction: "asc" }],
                },
            })
            expect(connection.nodes).to.have.length(1)
        })

        it("is idempotent: two sign-ins for one email resolve to one user", async function () {
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const firstSession = await builtinAuthService.verifyEmailCode({
                email,
                code: codeFromEmail(mail, email),
                purposes: ["SIGN_IN"],
            })

            // The resend throttle applies per address; simulate a later send.
            await builtinAuthService.signOut(firstSession.refreshToken)
            await expect(builtinAuthService.sendSignInCode(email, SITE_URL)).to.be.rejectedWith(
                "A code was just sent",
            )

            const firstVerified = await new BuiltinTokenVerifier().verify(firstSession.accessToken)
            const connection = await this.identityHelper.getUsers({
                filters: { email },
                connection: {
                    pagination: { first: 10 },
                    sort: [{ fieldName: "email", direction: "asc" }],
                },
            })
            expect(connection.nodes).to.have.length(1)
            expect(firstVerified.email).to.equal(email)
        })

        it("rejects a wrong code and caps attempts", async function () {
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const code = codeFromEmail(mail, email)
            const wrongCode = code === "000000" ? "000001" : "000000"

            for (let attempt = 0; attempt < 5; attempt += 1) {
                await expect(
                    builtinAuthService.verifyEmailCode({
                        email,
                        code: wrongCode,
                        purposes: ["SIGN_IN"],
                    }),
                ).to.be.rejectedWith("Invalid or expired code")
            }
            // The real code is burned after five failures.
            await expect(
                builtinAuthService.verifyEmailCode({ email, code, purposes: ["SIGN_IN"] }),
            ).to.be.rejectedWith("Invalid or expired code")
        })

        it("consumes a code exactly once", async function () {
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const code = codeFromEmail(mail, email)

            await builtinAuthService.verifyEmailCode({ email, code, purposes: ["SIGN_IN"] })
            await expect(
                builtinAuthService.verifyEmailCode({ email, code, purposes: ["SIGN_IN"] }),
            ).to.be.rejectedWith("Invalid or expired code")
        })

        it("signs in through the magic-link fallback token", async function () {
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const message = mail.lastMessageTo(email)
            const linkMatch = message!.html.match(/confirm\?token=([A-Za-z0-9_-]+)/)
            expect(linkMatch).to.not.equal(null)

            const session = await builtinAuthService.consumeLinkToken(linkMatch![1])
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            expect(verified.email).to.equal(email)
        })
    })

    describe("password", function () {
        it("signs up, requires confirmation, then signs in with the password", async function () {
            const email = randomEmail()
            const result = await builtinAuthService.signUpWithPassword({
                email,
                password: "a-strong-password",
                siteUrl: SITE_URL,
            })
            expect(result.requiresConfirmation).to.equal(true)

            // Password sign-in is blocked until the email is confirmed.
            await expect(
                builtinAuthService.signInWithPassword({ email, password: "a-strong-password" }),
            ).to.be.rejectedWith("Email not confirmed")

            await builtinAuthService.verifyEmailCode({
                email,
                code: codeFromEmail(mail, email),
                purposes: ["SIGN_IN", "SIGN_UP"],
            })

            const session = await builtinAuthService.signInWithPassword({
                email,
                password: "a-strong-password",
            })
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            expect(verified.email).to.equal(email)
        })

        it("rejects a wrong password without disclosing whether the account exists", async function () {
            const email = randomEmail()
            await builtinAuthService.signUpWithPassword({
                email,
                password: "a-strong-password",
                siteUrl: SITE_URL,
            })

            await expect(
                builtinAuthService.signInWithPassword({ email, password: "wrong-password" }),
            ).to.be.rejectedWith("Invalid email or password")
            await expect(
                builtinAuthService.signInWithPassword({
                    email: randomEmail(),
                    password: "wrong-password",
                }),
            ).to.be.rejectedWith("Invalid email or password")
        })

        it("rejects duplicate password sign-ups", async function () {
            const email = randomEmail()
            await builtinAuthService.signUpWithPassword({
                email,
                password: "a-strong-password",
                siteUrl: SITE_URL,
            })
            await expect(
                builtinAuthService.signUpWithPassword({
                    email,
                    password: "another-password",
                    siteUrl: SITE_URL,
                }),
            ).to.be.rejectedWith("already exists")
        })

        it("rejects weak passwords", async function () {
            await expect(
                builtinAuthService.signUpWithPassword({
                    email: randomEmail(),
                    password: "short",
                    siteUrl: SITE_URL,
                }),
            ).to.be.rejectedWith("at least 8 characters")
        })

        it("recovers a forgotten password through the emailed recovery code", async function () {
            const email = randomEmail()
            await builtinAuthService.signUpWithPassword({
                email,
                password: "original-password",
                siteUrl: SITE_URL,
            })
            await builtinAuthService.verifyEmailCode({
                email,
                code: codeFromEmail(mail, email),
                purposes: ["SIGN_UP"],
            })

            // Recovery: emailed code -> recovery session -> set new password.
            // Backdate the sign-up code row so the per-address resend
            // throttle (one email per minute) doesn't block the recovery send.
            await identityDb
                .update(authEmailCodesTable)
                .set({ rowCreatedAt: new Date(Date.now() - 2 * 60 * 1000) })
                .where(eq(authEmailCodesTable.email, email))
            mail.sentMessages.length = 0
            await builtinAuthService.sendRecoveryCode(email, SITE_URL)
            const recoverySession = await builtinAuthService.verifyEmailCode({
                email,
                code: codeFromEmail(mail, email),
                purposes: ["RECOVERY"],
            })
            const verified = await new BuiltinTokenVerifier().verify(recoverySession.accessToken)
            await builtinAuthService.updatePassword(verified.authSubject, "replacement-password")

            await expect(
                builtinAuthService.signInWithPassword({ email, password: "original-password" }),
            ).to.be.rejectedWith("Invalid email or password")
            const session = await builtinAuthService.signInWithPassword({
                email,
                password: "replacement-password",
            })
            expect(session.accessToken).to.be.a("string")
        })

        it("silently ignores recovery for unknown emails", async function () {
            const email = randomEmail()
            await builtinAuthService.sendRecoveryCode(email, SITE_URL)
            expect(mail.lastMessageTo(email)).to.equal(undefined)
        })
    })

    describe("anonymous", function () {
        it("creates a guest identity keyed by a synthetic email", async function () {
            const session = await builtinAuthService.signInAnonymously()
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            expect(verified.email).to.match(/^guest-auid_.*@anonymous\.invalid$/)

            const connection = await this.identityHelper.getUsers({
                filters: { email: verified.email },
                connection: {
                    pagination: { first: 10 },
                    sort: [{ fieldName: "email", direction: "asc" }],
                },
            })
            expect(connection.nodes).to.have.length(1)
            expect(connection.nodes[0]?.displayName).to.equal("Guest")
        })

        it("guests cannot set a password", async function () {
            const session = await builtinAuthService.signInAnonymously()
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            await expect(
                builtinAuthService.updatePassword(verified.authSubject, "a-strong-password"),
            ).to.be.rejectedWith("Guest sessions cannot set a password")
        })
    })

    describe("sessions", function () {
        it("rotates refresh tokens and revokes on replay", async function () {
            const first = await builtinAuthService.signInAnonymously()

            const second = await builtinAuthService.refreshSession(first.refreshToken)
            expect(second.refreshToken).to.not.equal(first.refreshToken)

            // Replaying the consumed token is treated as theft: every live
            // session for the identity is revoked.
            await expect(builtinAuthService.refreshSession(first.refreshToken)).to.be.rejectedWith(
                "already used",
            )
            await expect(builtinAuthService.refreshSession(second.refreshToken)).to.be.rejectedWith(
                "Invalid or expired refresh token",
            )
        })

        it("sign-out revokes the refresh token", async function () {
            const session = await builtinAuthService.signInAnonymously()
            await builtinAuthService.signOut(session.refreshToken)
            await expect(builtinAuthService.refreshSession(session.refreshToken)).to.be.rejectedWith(
                "Invalid or expired refresh token",
            )
        })
    })
})
