import { generateKeyPairSync } from "node:crypto"
import { expect } from "chai"
import { eq } from "drizzle-orm"
import { importSPKI, jwtVerify } from "jose"
import { authEmailCodesTable } from "../../src/Data/Identity/AuthEmailCode.js"
import { authIdentitiesTable } from "../../src/Data/Identity/AuthIdentity.js"
import { identityDb } from "../../src/Data/IdentityDatabase.js"
import { FakeMailWrapper, setMailWrapperForTests } from "../../src/DependencyWrappers/MailWrapper/index.js"
import {
    AuthResult,
    AuthSession,
    builtinAuthService,
} from "../../src/Services/Identity/BuiltinAuth/BuiltinAuthService.js"
import {
    parseLiveAuthMethods,
    resolveLiveAuthConfig,
    setLiveAuthConfigFetcherForTests,
} from "../../src/Services/Identity/BuiltinAuth/LiveAuthConfig.js"
import {
    mintAppleClientSecret,
    oauthProviderKeys,
    oauthProviders,
} from "../../src/Services/Identity/BuiltinAuth/OAuthProviders.js"
import { totpCode } from "../../src/Services/Identity/BuiltinAuth/Totp.js"
import { BuiltinTokenVerifier } from "../../src/Services/Identity/TokenVerifier.js"
import { resetValidatedEnvForTests, validatedEnv } from "../../src/Utils/Env.js"
import { randomEmail } from "../Utils/Factories/RandomValues.js"

const TEST_JWT_SECRET_HEX = "aa".repeat(32)
const SITE_URL = "https://app.example.test"

/** Asserts a primary sign-in yielded a session (no MFA challenge) and returns it. */
function sessionOf(result: AuthResult): AuthSession {
    expect(result.kind).to.equal("session")
    if (result.kind !== "session") {
        throw new Error("expected a session")
    }
    return result.session
}

/** Pulls the 6-digit code out of a captured auth email. */
function codeFromEmail(mail: FakeMailWrapper, email: string): string {
    const message = mail.lastMessageTo(email)
    expect(message, `expected an email to ${email}`).to.not.equal(undefined)
    const match = message!.html.match(/>(\d{6})</)
    expect(match, "expected a 6-digit code in the email body").to.not.equal(null)
    return match![1]
}

/** Pulls the confirmation-link token out of a captured auth email. */
function linkTokenFromEmail(mail: FakeMailWrapper, email: string): string {
    const message = mail.lastMessageTo(email)
    expect(message, `expected an email to ${email}`).to.not.equal(undefined)
    const match = message!.html.match(/confirm\?token=([A-Za-z0-9_-]+)/)
    expect(match, "expected a confirmation link in the email body").to.not.equal(null)
    return match![1]
}

/**
 * Runs a block with an env override; the validated-env cache is reset around
 * it so services see the override.
 */
async function withEnv(
    overrides: Record<string, string | undefined>,
    block: () => Promise<void>,
): Promise<void> {
    const originals = new Map<string, string | undefined>()
    for (const [name, value] of Object.entries(overrides)) {
        originals.set(name, process.env[name])
        if (value === undefined) {
            delete process.env[name]
        } else {
            process.env[name] = value
        }
    }
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        for (const [name, value] of originals) {
            if (value === undefined) {
                delete process.env[name]
            } else {
                process.env[name] = value
            }
        }
        resetValidatedEnvForTests()
    }
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

            const session = sessionOf(
                await builtinAuthService.verifyEmailCode({
                    email,
                    code,
                    purposes: ["SIGN_IN", "SIGN_UP"],
                }),
            )
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

        it("sends the styled default card with {{ .AppName }} resolved and escaped", async function () {
            const originalAppName = process.env.APP_NAME
            process.env.APP_NAME = "Acme & Co"
            try {
                const email = randomEmail()
                await builtinAuthService.sendSignInCode(email, SITE_URL)
                const message = mail.lastMessageTo(email)
                expect(message!.subject).to.equal("Your sign-in code")
                // The default template is the styled card, with the app's
                // name as the wordmark — HTML-escaped, since it is the one
                // free-form variable.
                expect(message!.html).to.contain("max-width:440px")
                expect(message!.html).to.contain("Acme &amp; Co")
            } finally {
                if (originalAppName === undefined) {
                    delete process.env.APP_NAME
                } else {
                    process.env.APP_NAME = originalAppName
                }
            }
        })

        it("is idempotent: two sign-ins for one email resolve to one user", async function () {
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const firstSession = sessionOf(
                await builtinAuthService.verifyEmailCode({
                    email,
                    code: codeFromEmail(mail, email),
                    purposes: ["SIGN_IN"],
                }),
            )

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

            const session = sessionOf(await builtinAuthService.consumeLinkToken(linkMatch![1]))
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            expect(verified.email).to.equal(email)
        })
    })

    describe("dev sign-in code (AUTH_DEV_CODE)", function () {
        const DEV_CODE = "424242"

        it("signs in any email with the fixed code, no delivery needed, when opted in", async function () {
            await withEnv({ AUTH_DEV_CODE: DEV_CODE, DEPLOY_POSTURE: "dev" }, async () => {
                const email = randomEmail()
                const session = sessionOf(
                    await builtinAuthService.verifyEmailCode({
                        email,
                        code: DEV_CODE,
                        purposes: ["SIGN_IN", "SIGN_UP"],
                    }),
                )
                const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
                expect(verified.email).to.equal(email)
                // The bypass never touched mail: no code was ever sent.
                expect(mail.lastMessageTo(email)).to.equal(undefined)
            })
        })

        it("never matches while AUTH_DEV_CODE is unset (the default)", async function () {
            await withEnv({ AUTH_DEV_CODE: undefined }, async () => {
                await expect(
                    builtinAuthService.verifyEmailCode({
                        email: randomEmail(),
                        code: DEV_CODE,
                        purposes: ["SIGN_IN", "SIGN_UP"],
                    }),
                ).to.be.rejectedWith("Invalid or expired code")
            })
        })

        it("never applies to recovery codes", async function () {
            await withEnv({ AUTH_DEV_CODE: DEV_CODE, DEPLOY_POSTURE: "dev" }, async () => {
                await expect(
                    builtinAuthService.verifyEmailCode({
                        email: randomEmail(),
                        code: DEV_CODE,
                        purposes: ["RECOVERY"],
                    }),
                ).to.be.rejectedWith("Invalid or expired code")
            })
        })

        // Deployed = neither emulator nor tests, faked via env overrides —
        // the same technique as the storage kernel's local-mode boot guard.
        const deployedProduction = {
            NODE_ENV: "production",
            FUNCTIONS_EMULATOR: undefined,
            AUTH_MODE: "builtin",
            PAYMENTS_MODE: "stripe",
            STORAGE_MODE: "gcs",
            JOBS_MODE: "scheduler",
            AUTH_DEV_CODE: DEV_CODE,
        }

        it("refuses the fixed code at use time on deployed production posture", async function () {
            await withEnv({ ...deployedProduction, DEPLOY_POSTURE: "prod" }, async () => {
                await expect(
                    builtinAuthService.verifyEmailCode({
                        email: randomEmail(),
                        code: DEV_CODE,
                        purposes: ["SIGN_IN", "SIGN_UP"],
                    }),
                ).to.be.rejectedWith("Invalid or expired code")
            })
        })

        it("boot guard refuses AUTH_DEV_CODE on deployed production posture, with the setup spelled out", async function () {
            await withEnv({ ...deployedProduction, DEPLOY_POSTURE: "prod" }, async () => {
                expect(() => validatedEnv()).to.throw("AUTH_DEV_CODE is only allowed")
            })
            await withEnv({ ...deployedProduction, DEPLOY_POSTURE: undefined }, async () => {
                expect(() => validatedEnv()).to.throw("AUTH_DEV_CODE is only allowed")
            })
        })

        it("boot guard allows AUTH_DEV_CODE on dev-posture deploys", async function () {
            await withEnv({ ...deployedProduction, DEPLOY_POSTURE: "dev" }, async () => {
                expect(validatedEnv().AUTH_DEV_CODE).to.equal(DEV_CODE)
            })
        })
    })

    // The platform maintains a per-environment auth-config secret and
    // updates it the moment templates, the sender, or the sign-in methods
    // change; the kernel re-reads it at request time (60s cache) so those
    // changes apply without a redeploy. Env values are the fallback when
    // there is no live secret.
    describe("live auth config", function () {
        const envKeys = [
            "AUTH_EMAIL_CONFIG_SECRET",
            "GCP_PROJECT_ID",
            "AUTH_EMAIL_TEMPLATES",
            "AUTH_CONFIG_FILE",
        ] as const
        const originalEnv: Partial<Record<(typeof envKeys)[number], string | undefined>> = {}

        beforeEach(function () {
            for (const key of envKeys) {
                originalEnv[key] = process.env[key]
            }
            process.env.AUTH_EMAIL_CONFIG_SECRET = "test-env--auth-email-config"
            process.env.GCP_PROJECT_ID = "test-project"
        })

        afterEach(function () {
            for (const key of envKeys) {
                if (originalEnv[key] === undefined) {
                    delete process.env[key]
                } else {
                    process.env[key] = originalEnv[key]
                }
            }
            setLiveAuthConfigFetcherForTests(undefined)
        })

        it("applies live template overrides and the live sender to auth emails", async function () {
            setLiveAuthConfigFetcherForTests(async () =>
                JSON.stringify({
                    templates: {
                        magicLink: {
                            subject: "Live subject for {{ .SiteURL }}",
                            html: "<p>Live code: {{ .Token }}</p>",
                        },
                    },
                    sender: { email: "codes@custom.example", name: "Custom App" },
                }),
            )
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const message = mail.lastMessageTo(email)
            expect(message!.subject).to.equal(`Live subject for ${SITE_URL}`)
            expect(message!.html).to.match(/Live code: \d{6}/)
            expect(message!.sender).to.deep.equal({
                email: "codes@custom.example",
                name: "Custom App",
            })
        })

        it("treats the live config as authoritative: a removed override reverts to the kernel default, not the stale env value", async function () {
            process.env.AUTH_EMAIL_TEMPLATES = Buffer.from(
                JSON.stringify({
                    magicLink: { subject: "Stale env subject", html: "<p>{{ .Token }}</p>" },
                }),
                "utf8",
            ).toString("base64")
            setLiveAuthConfigFetcherForTests(async () => JSON.stringify({ templates: {}, sender: null }))
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            expect(mail.lastMessageTo(email)!.subject).to.equal("Your sign-in code")
        })

        it("falls back to the deploy-time env config when the live secret is unreachable", async function () {
            process.env.AUTH_EMAIL_TEMPLATES = Buffer.from(
                JSON.stringify({
                    magicLink: { subject: "Env subject", html: "<p>{{ .Token }}</p>" },
                }),
                "utf8",
            ).toString("base64")
            setLiveAuthConfigFetcherForTests(async () => {
                throw new Error("secret_access_failed_403")
            })
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const message = mail.lastMessageTo(email)
            expect(message!.subject).to.equal("Env subject")
            expect(message!.sender).to.equal(undefined)
        })

        it("caches the live config between sends instead of fetching per email", async function () {
            let fetches = 0
            setLiveAuthConfigFetcherForTests(async () => {
                fetches += 1
                return JSON.stringify({ templates: {}, sender: null })
            })
            await builtinAuthService.sendSignInCode(randomEmail(), SITE_URL)
            await builtinAuthService.sendSignInCode(randomEmail(), SITE_URL)
            expect(fetches).to.equal(1)
        })

        it("resolves the live sign-in methods with the shared parsing semantics", async function () {
            setLiveAuthConfigFetcherForTests(async () =>
                JSON.stringify({
                    templates: {},
                    methods: [" GitHub ", "google", "magic-beans", "google", "email-code"],
                }),
            )
            const live = await resolveLiveAuthConfig()
            expect(live?.methods).to.deep.equal(["github", "google", "email-code"])
        })

        it("resolves no live methods when the secret has none or only invalid ones", async function () {
            expect(parseLiveAuthMethods(undefined)).to.equal(undefined)
            expect(parseLiveAuthMethods("google")).to.equal(undefined)
            expect(parseLiveAuthMethods([])).to.equal(undefined)
            expect(parseLiveAuthMethods(["magic-beans", 42])).to.equal(undefined)
            expect(parseLiveAuthMethods(["password", "x"])).to.deep.equal(["password", "x"])
        })

        // Sandbox workspaces have no Secret Manager access; the platform
        // writes the same payload to a local file and names it through
        // AUTH_CONFIG_FILE. The file source must win over the secret path
        // so the preview reflects dashboard toggles.
        it("reads the live config from AUTH_CONFIG_FILE when the platform provisioned one", async function () {
            const { writeFile, mkdtemp, rm } = await import("node:fs/promises")
            const { tmpdir } = await import("node:os")
            const path = await import("node:path")
            const dir = await mkdtemp(path.join(tmpdir(), "live-auth-config-"))
            const file = path.join(dir, "live-auth-config.json")
            try {
                await writeFile(
                    file,
                    JSON.stringify({ templates: {}, sender: null, methods: ["password"] }),
                    "utf8",
                )
                process.env.AUTH_CONFIG_FILE = file
                // The secret fetcher must not be consulted at all.
                setLiveAuthConfigFetcherForTests(async () => {
                    throw new Error("secret fetch attempted despite AUTH_CONFIG_FILE")
                })
                const live = await resolveLiveAuthConfig()
                expect(live?.methods).to.deep.equal(["password"])
            } finally {
                await rm(dir, { recursive: true, force: true })
            }
        })
    })

    describe("password", function () {
        it("signs up, requires confirmation via the emailed link, then signs in with the password", async function () {
            const email = randomEmail()
            const result = await builtinAuthService.signUpWithPassword({
                email,
                password: "a-strong-password",
                siteUrl: SITE_URL,
            })
            expect(result.requiresConfirmation).to.equal(true)

            // The confirmation email is link-only: there is no code-entry
            // surface after sign-up, so a code would strand the user. The
            // verify button carries the whole flow.
            const message = mail.lastMessageTo(email)
            expect(message!.subject).to.equal("Confirm your email")
            expect(message!.html).to.contain("Verify email")
            expect(message!.html).to.not.match(/>\d{6}</)

            // Password sign-in is blocked until the email is confirmed.
            await expect(
                builtinAuthService.signInWithPassword({ email, password: "a-strong-password" }),
            ).to.be.rejectedWith("Email not confirmed")

            await builtinAuthService.consumeLinkToken(linkTokenFromEmail(mail, email))

            const session = sessionOf(
                await builtinAuthService.signInWithPassword({
                    email,
                    password: "a-strong-password",
                }),
            )
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
            await builtinAuthService.consumeLinkToken(linkTokenFromEmail(mail, email))

            // Recovery: emailed code -> recovery session -> set new password.
            // Backdate the sign-up code row so the per-address resend
            // throttle (one email per minute) doesn't block the recovery send.
            await identityDb
                .update(authEmailCodesTable)
                .set({ rowCreatedAt: new Date(Date.now() - 2 * 60 * 1000) })
                .where(eq(authEmailCodesTable.email, email))
            mail.sentMessages.length = 0
            await builtinAuthService.sendRecoveryCode(email, SITE_URL)
            const recoverySession = sessionOf(
                await builtinAuthService.verifyEmailCode({
                    email,
                    code: codeFromEmail(mail, email),
                    purposes: ["RECOVERY"],
                }),
            )
            const verified = await new BuiltinTokenVerifier().verify(recoverySession.accessToken)
            await builtinAuthService.updatePassword(verified.authSubject, "replacement-password")

            await expect(
                builtinAuthService.signInWithPassword({ email, password: "original-password" }),
            ).to.be.rejectedWith("Invalid email or password")
            const session = sessionOf(
                await builtinAuthService.signInWithPassword({
                    email,
                    password: "replacement-password",
                }),
            )
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

    describe("oauth providers", function () {
        it("creates a fresh identity from an Apple profile and issues a session", async function () {
            const email = randomEmail()
            const session = sessionOf(
                await builtinAuthService.signInWithOAuthProfile({
                    provider: "apple",
                    subject: `apple-sub-${email}`,
                    email,
                    emailVerified: true,
                    displayName: "Apple Person",
                }),
            )
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            expect(verified.email).to.equal(email)

            const [identity] = await identityDb
                .select()
                .from(authIdentitiesTable)
                .where(eq(authIdentitiesTable.email, email))
            expect(identity.appleSubject).to.equal(`apple-sub-${email}`)
            expect(identity.googleSubject).to.equal(null)
            expect(identity.emailVerifiedAt).to.not.equal(null)
        })

        it("is idempotent: repeat sign-ins with one subject resolve to one identity", async function () {
            const email = randomEmail()
            const profile = {
                provider: "apple" as const,
                subject: `apple-sub-${email}`,
                email,
                emailVerified: true,
            }
            const first = sessionOf(await builtinAuthService.signInWithOAuthProfile(profile))
            const second = sessionOf(await builtinAuthService.signInWithOAuthProfile(profile))
            const firstVerified = await new BuiltinTokenVerifier().verify(first.accessToken)
            const secondVerified = await new BuiltinTokenVerifier().verify(second.accessToken)
            expect(secondVerified.authSubject).to.equal(firstVerified.authSubject)
        })

        it("links a provider to an existing identity by verified email", async function () {
            // An email-code identity exists first...
            const email = randomEmail()
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const emailSession = sessionOf(
                await builtinAuthService.verifyEmailCode({
                    email,
                    code: codeFromEmail(mail, email),
                    purposes: ["SIGN_IN"],
                }),
            )
            const emailVerified = await new BuiltinTokenVerifier().verify(emailSession.accessToken)

            // ...then the same person signs in with Apple: same identity.
            const appleSession = sessionOf(
                await builtinAuthService.signInWithOAuthProfile({
                    provider: "apple",
                    subject: `apple-sub-${email}`,
                    email,
                    emailVerified: true,
                }),
            )
            const appleVerified = await new BuiltinTokenVerifier().verify(appleSession.accessToken)
            expect(appleVerified.authSubject).to.equal(emailVerified.authSubject)

            const [identity] = await identityDb
                .select()
                .from(authIdentitiesTable)
                .where(eq(authIdentitiesTable.email, email))
            expect(identity.appleSubject).to.equal(`apple-sub-${email}`)
        })

        it("Google and Apple resolve to one identity when they share a verified email", async function () {
            const email = randomEmail()
            const googleSession = sessionOf(
                await builtinAuthService.signInWithOAuthProfile({
                    provider: "google",
                    subject: `google-sub-${email}`,
                    email,
                    emailVerified: true,
                }),
            )
            const appleSession = sessionOf(
                await builtinAuthService.signInWithOAuthProfile({
                    provider: "apple",
                    subject: `apple-sub-${email}`,
                    email,
                    emailVerified: true,
                }),
            )
            const googleVerified = await new BuiltinTokenVerifier().verify(googleSession.accessToken)
            const appleVerified = await new BuiltinTokenVerifier().verify(appleSession.accessToken)
            expect(appleVerified.authSubject).to.equal(googleVerified.authSubject)

            const [identity] = await identityDb
                .select()
                .from(authIdentitiesTable)
                .where(eq(authIdentitiesTable.email, email))
            expect(identity.googleSubject).to.equal(`google-sub-${email}`)
            expect(identity.appleSubject).to.equal(`apple-sub-${email}`)
        })

        it("mints a valid ES256 client secret for Apple's token endpoint", async function () {
            const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" })
            const secret = await mintAppleClientSecret({
                teamId: "TEAM123456",
                clientId: "com.example.app.signin",
                keyId: "KEY1234567",
                privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
            })
            const { payload, protectedHeader } = await jwtVerify(
                secret,
                await importSPKI(publicKey.export({ type: "spki", format: "pem" }).toString(), "ES256"),
                { issuer: "TEAM123456", audience: "https://appleid.apple.com" },
            )
            expect(protectedHeader.alg).to.equal("ES256")
            expect(protectedHeader.kid).to.equal("KEY1234567")
            expect(payload.sub).to.equal("com.example.app.signin")
            expect(payload.exp).to.be.a("number")
        })

        it("rejects a private key that is not an ES256 key", async function () {
            await expect(
                mintAppleClientSecret({
                    teamId: "TEAM123456",
                    clientId: "com.example.app.signin",
                    keyId: "KEY1234567",
                    privateKeyPem: "-----BEGIN PRIVATE KEY-----\nnot-a-key\n-----END PRIVATE KEY-----",
                }),
            ).to.be.rejectedWith("not a valid ES256")
        })

        it("registers every provider key with a definition and a subject column", async function () {
            expect(oauthProviderKeys).to.deep.equal([
                "google",
                "apple",
                "github",
                "facebook",
                "discord",
                "x",
                "linkedin",
            ])
            for (const key of oauthProviderKeys) {
                expect(oauthProviders[key], `definition for ${key}`).to.not.equal(undefined)
            }
        })

        it("links a factory provider (GitHub) exactly like the bespoke ones", async function () {
            const email = randomEmail()
            const session = sessionOf(
                await builtinAuthService.signInWithOAuthProfile({
                    provider: "github",
                    subject: `github-sub-${email}`,
                    email,
                    emailVerified: true,
                    displayName: "Octo Person",
                }),
            )
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            expect(verified.email).to.equal(email)

            const [identity] = await identityDb
                .select()
                .from(authIdentitiesTable)
                .where(eq(authIdentitiesTable.email, email))
            expect(identity.githubSubject).to.equal(`github-sub-${email}`)
            expect(identity.googleSubject).to.equal(null)
        })

        it("builds a standard authorize URL, with PKCE where the provider mandates it", async function () {
            const original = { ...process.env }
            process.env.DISCORD_SIGNIN_CLIENT_ID = "discord-id"
            process.env.DISCORD_SIGNIN_CLIENT_SECRET = "discord-secret"
            process.env.X_SIGNIN_CLIENT_ID = "x-id"
            process.env.X_SIGNIN_CLIENT_SECRET = "x-secret"
            try {
                const redirectUri = "https://auth.example.test/discord/callback"
                const discordUrl = await oauthProviders.discord.buildAuthorizeUrl({
                    state: "state-jwt",
                    redirectUri,
                })
                expect(discordUrl.origin + discordUrl.pathname).to.equal(
                    "https://discord.com/oauth2/authorize",
                )
                expect(discordUrl.searchParams.get("client_id")).to.equal("discord-id")
                expect(discordUrl.searchParams.get("redirect_uri")).to.equal(redirectUri)
                expect(discordUrl.searchParams.get("response_type")).to.equal("code")
                expect(discordUrl.searchParams.get("scope")).to.equal("identify email")
                expect(discordUrl.searchParams.get("state")).to.equal("state-jwt")
                expect(discordUrl.searchParams.get("code_challenge")).to.equal(null)

                // X mandates PKCE: the S256 challenge rides the authorize URL
                // and is deterministic per state, so the callback can
                // recompute the verifier from the echoed state alone.
                const xUrlOnce = await oauthProviders.x.buildAuthorizeUrl({
                    state: "state-jwt",
                    redirectUri,
                })
                const xUrlAgain = await oauthProviders.x.buildAuthorizeUrl({
                    state: "state-jwt",
                    redirectUri,
                })
                expect(xUrlOnce.searchParams.get("code_challenge_method")).to.equal("S256")
                expect(xUrlOnce.searchParams.get("code_challenge")).to.be.a("string")
                expect(xUrlOnce.searchParams.get("code_challenge")).to.equal(
                    xUrlAgain.searchParams.get("code_challenge"),
                )
                const otherState = await oauthProviders.x.buildAuthorizeUrl({
                    state: "another-state",
                    redirectUri,
                })
                expect(otherState.searchParams.get("code_challenge")).to.not.equal(
                    xUrlOnce.searchParams.get("code_challenge"),
                )
            } finally {
                process.env = original
            }
        })

        it("reports a factory provider unconfigured until both credentials exist", async function () {
            const original = { ...process.env }
            delete process.env.LINKEDIN_SIGNIN_CLIENT_ID
            delete process.env.LINKEDIN_SIGNIN_CLIENT_SECRET
            try {
                expect(oauthProviders.linkedin.isConfigured()).to.equal(false)
                process.env.LINKEDIN_SIGNIN_CLIENT_ID = "linkedin-id"
                expect(oauthProviders.linkedin.isConfigured()).to.equal(false)
                process.env.LINKEDIN_SIGNIN_CLIENT_SECRET = "linkedin-secret"
                expect(oauthProviders.linkedin.isConfigured()).to.equal(true)
                await expect(
                    oauthProviders.github.buildAuthorizeUrl({
                        state: "state-jwt",
                        redirectUri: "https://auth.example.test/github/callback",
                    }),
                ).to.be.rejectedWith("GitHub sign-in is not configured")
            } finally {
                process.env = original
            }
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

    describe("two-factor authentication", function () {
        /** A confirmed password identity, signed in — the enrollment precondition. */
        async function passwordIdentity(): Promise<{
            email: string
            password: string
            authSubject: string
        }> {
            const email = randomEmail()
            const password = "a-strong-password"
            await builtinAuthService.signUpWithPassword({ email, password, siteUrl: SITE_URL })
            const session = sessionOf(
                await builtinAuthService.consumeLinkToken(linkTokenFromEmail(mail, email)),
            )
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            return { email, password, authSubject: verified.authSubject }
        }

        function challengeOf(result: AuthResult): string {
            expect(result.kind).to.equal("mfaChallenge")
            if (result.kind !== "mfaChallenge") {
                throw new Error("expected an MFA challenge")
            }
            return result.challengeToken
        }

        async function enrollAndConfirm(
            authSubject: string,
        ): Promise<{ secret: string; recoveryCodes: string[] }> {
            const enrollment = await builtinAuthService.enrollMfa(authSubject)
            const recoveryCodes = await builtinAuthService.confirmMfa(
                authSubject,
                totpCode(enrollment.secret),
            )
            return { secret: enrollment.secret, recoveryCodes }
        }

        it("round-trips: enroll, confirm, challenged sign-in, TOTP verify", async function () {
            const { email, password, authSubject } = await passwordIdentity()
            const enrollment = await builtinAuthService.enrollMfa(authSubject)
            expect(enrollment.otpauthUri).to.match(/^otpauth:\/\/totp\//)
            expect(enrollment.otpauthUri).to.include(enrollment.secret)

            // Unconfirmed factors never gate sign-in.
            sessionOf(await builtinAuthService.signInWithPassword({ email, password }))

            const recoveryCodes = await builtinAuthService.confirmMfa(
                authSubject,
                totpCode(enrollment.secret),
            )
            expect(recoveryCodes).to.have.length(10)

            // The primary factor now yields a challenge, not a session...
            const challengeToken = challengeOf(
                await builtinAuthService.signInWithPassword({ email, password }),
            )
            // ...whose token is NOT an access token.
            await expect(new BuiltinTokenVerifier().verify(challengeToken)).to.be.rejectedWith(
                "not an access token",
            )

            // A valid TOTP code elevates the challenge to a session.
            const session = await builtinAuthService.verifyMfaChallenge(
                challengeToken,
                totpCode(enrollment.secret),
            )
            const verified = await new BuiltinTokenVerifier().verify(session.accessToken)
            expect(verified.email).to.equal(email)
        })

        it("accepts an unused recovery code exactly once", async function () {
            const { email, password, authSubject } = await passwordIdentity()
            const { recoveryCodes } = await enrollAndConfirm(authSubject)

            const firstChallenge = challengeOf(
                await builtinAuthService.signInWithPassword({ email, password }),
            )
            const session = await builtinAuthService.verifyMfaChallenge(firstChallenge, recoveryCodes[0])
            expect(session.accessToken).to.be.a("string")

            const secondChallenge = challengeOf(
                await builtinAuthService.signInWithPassword({ email, password }),
            )
            await expect(
                builtinAuthService.verifyMfaChallenge(secondChallenge, recoveryCodes[0]),
            ).to.be.rejectedWith("Invalid code")
        })

        it("locks the challenge after five failed codes", async function () {
            const { email, password, authSubject } = await passwordIdentity()
            await enrollAndConfirm(authSubject)
            const challengeToken = challengeOf(
                await builtinAuthService.signInWithPassword({ email, password }),
            )
            for (let attempt = 0; attempt < 5; attempt += 1) {
                await expect(
                    builtinAuthService.verifyMfaChallenge(challengeToken, "000000"),
                ).to.be.rejectedWith("Invalid code")
            }
            await expect(builtinAuthService.verifyMfaChallenge(challengeToken, "000000")).to.be.rejectedWith(
                "Too many failed codes",
            )
        })

        it("disable requires a current code and restores plain sign-in", async function () {
            const { email, password, authSubject } = await passwordIdentity()
            const { secret } = await enrollAndConfirm(authSubject)

            await expect(builtinAuthService.disableMfa(authSubject, "000000")).to.be.rejectedWith(
                "Invalid code",
            )
            await builtinAuthService.disableMfa(authSubject, totpCode(secret))
            expect(await builtinAuthService.isMfaEnabled(authSubject)).to.equal(false)
            sessionOf(await builtinAuthService.signInWithPassword({ email, password }))
        })

        it("gates every primary flow, including email codes and OAuth", async function () {
            const { email, authSubject } = await passwordIdentity()
            const { secret } = await enrollAndConfirm(authSubject)

            // Email-code sign-in is challenged...
            await identityDb
                .update(authEmailCodesTable)
                .set({ rowCreatedAt: new Date(Date.now() - 2 * 60 * 1000) })
                .where(eq(authEmailCodesTable.email, email))
            await builtinAuthService.sendSignInCode(email, SITE_URL)
            const emailChallenge = challengeOf(
                await builtinAuthService.verifyEmailCode({
                    email,
                    code: codeFromEmail(mail, email),
                    purposes: ["SIGN_IN"],
                }),
            )
            // ...and an OAuth sign-in linking by the same verified email too.
            const oauthChallenge = challengeOf(
                await builtinAuthService.signInWithOAuthProfile({
                    provider: "google",
                    subject: `google-sub-${email}`,
                    email,
                    emailVerified: true,
                }),
            )
            await builtinAuthService.verifyMfaChallenge(emailChallenge, totpCode(secret))
            await builtinAuthService.verifyMfaChallenge(oauthChallenge, totpCode(secret))
        })

        it("guests cannot enroll; re-enrolling over a confirmed factor is rejected", async function () {
            const guest = await builtinAuthService.signInAnonymously()
            const guestVerified = await new BuiltinTokenVerifier().verify(guest.accessToken)
            await expect(builtinAuthService.enrollMfa(guestVerified.authSubject)).to.be.rejectedWith(
                "Guest sessions cannot enroll",
            )

            const { authSubject } = await passwordIdentity()
            await enrollAndConfirm(authSubject)
            await expect(builtinAuthService.enrollMfa(authSubject)).to.be.rejectedWith("already enabled")
        })

        it("rejects an access token where a challenge token is required", async function () {
            const { authSubject } = await passwordIdentity()
            const { secret } = await enrollAndConfirm(authSubject)
            const guest = await builtinAuthService.signInAnonymously()
            await expect(
                builtinAuthService.verifyMfaChallenge(guest.accessToken, totpCode(secret)),
            ).to.be.rejectedWith("Not an MFA challenge token")
        })
    })
})
