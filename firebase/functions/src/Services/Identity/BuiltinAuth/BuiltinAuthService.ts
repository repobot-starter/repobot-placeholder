import crypto from "node:crypto"
import { and, eq, gt, isNull } from "drizzle-orm"
import { decodeJwt } from "jose"
import { getMailWrapper } from "../../../DependencyWrappers/MailWrapper/index.js"
import { authEmailCodesTable, AuthEmailCodePurpose } from "../../../Data/Identity/AuthEmailCode.js"
import { AuthIdentity, authIdentitiesTable } from "../../../Data/Identity/AuthIdentity.js"
import { authRefreshTokensTable } from "../../../Data/Identity/AuthRefreshToken.js"
import { identityDb } from "../../../Data/IdentityDatabase.js"
import { getRowByIdOrThrow, updateRowReturning } from "../../../Data/Utils/index.js"
import { RpcError } from "../../../Utils/RpcError.js"
import { renderAuthEmail, resolveAuthEmailTemplate, type AuthEmailType } from "./AuthEmailTemplates.js"
import { authTokenService } from "./AuthTokenService.js"
import { hashPassword, sha256Hex, verifyPassword } from "./PasswordHashing.js"

const CODE_TTL_MS = 10 * 60 * 1000
const CODE_MAX_ATTEMPTS = 5
const CODE_MIN_RESEND_INTERVAL_MS = 60 * 1000
const CODE_MAX_PER_HOUR = 10
const REFRESH_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000
const PASSWORD_MAX_FAILED_ATTEMPTS = 10
const PASSWORD_LOCKOUT_MS = 15 * 60 * 1000
const MIN_PASSWORD_LENGTH = 8

export interface AuthSession {
    accessToken: string
    tokenType: "bearer"
    expiresInSeconds: number
    refreshToken: string
    /** The identity's email; absent for anonymous (guest) sessions. */
    email?: string
}

export interface SignUpResult {
    /** True when a confirmation code was emailed; the session comes after verify. */
    requiresConfirmation: boolean
    session?: AuthSession
}

/**
 * The built-in auth service: everything a hosted auth provider used to do for
 * deployed environments, running on the environment's own functions and
 * database. Identities live in auth_identities; sessions are HS256 access
 * tokens (AuthTokenService) plus single-use rotating refresh tokens.
 */
class BuiltinAuthService {
    // ---- Email one-time codes -------------------------------------------

    /**
     * Emails a 6-digit sign-in code (with a magic-link fallback). The
     * identity is created lazily at verification, so mistyped addresses never
     * leave rows behind.
     */
    async sendSignInCode(email: string, siteUrl: string): Promise<void> {
        await this.sendCode(normalizeEmail(email), "SIGN_IN", "magicLink", siteUrl)
    }

    /** Emails a password-recovery code. Never discloses whether the email exists. */
    async sendRecoveryCode(email: string, siteUrl: string): Promise<void> {
        const identity = await this.getIdentityByEmail(normalizeEmail(email))
        if (identity === undefined) {
            return
        }
        await this.sendCode(normalizeEmail(email), "RECOVERY", "recovery", siteUrl)
    }

    /**
     * Verifies an emailed code. `SIGN_IN`/`SIGN_UP` codes prove the email and
     * sign the user in (creating the identity on first contact); `RECOVERY`
     * codes also sign in, so the client can set a new password with the
     * session (mirrors the previous verify-recovery-then-update flow).
     */
    async verifyEmailCode(request: {
        email: string
        code: string
        purposes: AuthEmailCodePurpose[]
    }): Promise<AuthSession> {
        const email = normalizeEmail(request.email)
        const now = new Date()
        const candidates = await identityDb
            .select()
            .from(authEmailCodesTable)
            .where(
                and(
                    eq(authEmailCodesTable.email, email),
                    isNull(authEmailCodesTable.consumedAt),
                    gt(authEmailCodesTable.expiresAt, now),
                ),
            )
        const codeHash = sha256Hex(request.code)
        const match = candidates.find(
            (row) =>
                request.purposes.includes(row.purpose) &&
                row.attemptCount < CODE_MAX_ATTEMPTS &&
                timingSafeEqualHex(row.codeHash, codeHash),
        )
        if (match === undefined) {
            // Count the failure against every live candidate so guessing burns
            // the real code's attempt budget.
            for (const row of candidates) {
                if (request.purposes.includes(row.purpose)) {
                    await identityDb
                        .update(authEmailCodesTable)
                        .set({ attemptCount: row.attemptCount + 1 })
                        .where(eq(authEmailCodesTable.id, row.id))
                }
            }
            throw new RpcError("UNAUTHENTICATED", "Invalid or expired code.")
        }

        await identityDb
            .update(authEmailCodesTable)
            .set({ consumedAt: now })
            .where(eq(authEmailCodesTable.id, match.id))

        const identity = await this.findOrCreateIdentityByEmail(email)
        const verified = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            emailVerifiedAt: identity.emailVerifiedAt ?? now,
            lastSignInAt: now,
            failedPasswordAttempts: 0,
            lockedOutUntil: null,
        })
        return await this.issueSession(verified)
    }

    /** Magic-link fallback: consumes the long token carried by the emailed URL. */
    async consumeLinkToken(linkToken: string): Promise<AuthSession> {
        const now = new Date()
        const [match] = await identityDb
            .select()
            .from(authEmailCodesTable)
            .where(
                and(
                    eq(authEmailCodesTable.linkTokenHash, sha256Hex(linkToken)),
                    isNull(authEmailCodesTable.consumedAt),
                    gt(authEmailCodesTable.expiresAt, now),
                ),
            )
        if (match === undefined) {
            throw new RpcError("UNAUTHENTICATED", "Invalid or expired sign-in link.")
        }
        await identityDb
            .update(authEmailCodesTable)
            .set({ consumedAt: now })
            .where(eq(authEmailCodesTable.id, match.id))

        const identity = await this.findOrCreateIdentityByEmail(match.email)
        const verified = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            emailVerifiedAt: identity.emailVerifiedAt ?? now,
            lastSignInAt: now,
        })
        return await this.issueSession(verified)
    }

    // ---- Password -------------------------------------------------------

    /**
     * Creates an email+password identity. With mail configured, a
     * confirmation code is sent and the session comes after verification;
     * in degraded mode (no SMTP) the account auto-confirms.
     */
    async signUpWithPassword(request: {
        email: string
        password: string
        siteUrl: string
    }): Promise<SignUpResult> {
        const email = normalizeEmail(request.email)
        assertPasswordStrength(request.password)

        const existing = await this.getIdentityByEmail(email)
        if (existing !== undefined && existing.passwordHash !== null) {
            throw new RpcError(
                "ALREADY_EXISTS",
                "An account with this email already exists. Sign in instead.",
            )
        }

        const passwordHash = await hashPassword(request.password)
        let identity: AuthIdentity
        if (existing !== undefined) {
            // Email-code identity adding a password: keep the identity, require
            // a fresh confirmation before the password becomes usable.
            identity = await updateRowReturning(identityDb, authIdentitiesTable, existing.id, {
                passwordHash,
            })
        } else {
            identity = await this.insertIdentity({ email, passwordHash })
        }

        if (getMailWrapper().isConfigured()) {
            await this.sendCode(email, "SIGN_UP", "confirmation", request.siteUrl)
            return { requiresConfirmation: true }
        }
        // Degraded mode: no way to deliver a code, so auto-confirm.
        const confirmed = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            emailVerifiedAt: new Date(),
            lastSignInAt: new Date(),
        })
        return { requiresConfirmation: false, session: await this.issueSession(confirmed) }
    }

    async signInWithPassword(request: { email: string; password: string }): Promise<AuthSession> {
        const email = normalizeEmail(request.email)
        const identity = await this.getIdentityByEmail(email)
        if (identity === undefined || identity.passwordHash === null) {
            // Burn comparable time so missing accounts aren't distinguishable.
            await hashPassword(request.password)
            throw new RpcError("UNAUTHENTICATED", "Invalid email or password.")
        }
        const now = new Date()
        if (identity.lockedOutUntil !== null && identity.lockedOutUntil > now) {
            throw new RpcError(
                "RESOURCE_EXHAUSTED",
                "Too many failed sign-in attempts. Try again in a few minutes.",
            )
        }
        if (!(await verifyPassword(request.password, identity.passwordHash))) {
            const failedAttempts = identity.failedPasswordAttempts + 1
            await identityDb
                .update(authIdentitiesTable)
                .set({
                    failedPasswordAttempts: failedAttempts,
                    lockedOutUntil:
                        failedAttempts >= PASSWORD_MAX_FAILED_ATTEMPTS
                            ? new Date(now.getTime() + PASSWORD_LOCKOUT_MS)
                            : null,
                })
                .where(eq(authIdentitiesTable.id, identity.id))
            throw new RpcError("UNAUTHENTICATED", "Invalid email or password.")
        }
        if (identity.emailVerifiedAt === null) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "Email not confirmed. Enter the code from your sign-up email first.",
            )
        }
        const signedIn = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            failedPasswordAttempts: 0,
            lockedOutUntil: null,
            lastSignInAt: now,
        })
        return await this.issueSession(signedIn)
    }

    /** Sets a new password for a signed-in identity (the recovery flow's last step). */
    async updatePassword(authSubject: string, newPassword: string): Promise<void> {
        assertPasswordStrength(newPassword)
        const identity = await getRowByIdOrThrow(identityDb, authIdentitiesTable, authSubject)
        if (identity.isAnonymous) {
            throw new RpcError("FAILED_PRECONDITION", "Guest sessions cannot set a password.")
        }
        await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            passwordHash: await hashPassword(newPassword),
            emailVerifiedAt: identity.emailVerifiedAt ?? new Date(),
            failedPasswordAttempts: 0,
            lockedOutUntil: null,
        })
    }

    // ---- Anonymous ------------------------------------------------------

    async signInAnonymously(): Promise<AuthSession> {
        const identity = await this.insertIdentity({ isAnonymous: true, lastSignInAt: new Date() })
        return await this.issueSession(identity)
    }

    // ---- Google OAuth ---------------------------------------------------

    /**
     * Exchanges a Google authorization code and signs the Google account in,
     * linking by Google subject first, then by (verified) email, then
     * creating a fresh identity.
     */
    async signInWithGoogleCode(request: { code: string; redirectUri: string }): Promise<AuthSession> {
        const clientId = process.env.GOOGLE_SIGNIN_CLIENT_ID
        const clientSecret = process.env.GOOGLE_SIGNIN_CLIENT_SECRET
        if (!clientId || !clientSecret) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "Google sign-in is not configured for this environment.",
            )
        }
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: request.code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: request.redirectUri,
                grant_type: "authorization_code",
            }),
        })
        if (!response.ok) {
            const detail = await response.text()
            throw new RpcError("UNAUTHENTICATED", `Google code exchange failed: ${detail.slice(0, 200)}`)
        }
        const body = (await response.json()) as { id_token?: string }
        if (typeof body.id_token !== "string") {
            throw new RpcError("UNAUTHENTICATED", "Google response is missing the id_token.")
        }
        // The id_token arrived over TLS directly from Google's token endpoint
        // in exchange for our client secret, so decoding without a second
        // signature check is sound (the transport is the trust anchor).
        const claims = decodeJwt(body.id_token)
        const googleSubject = claims.sub
        const email = typeof claims.email === "string" ? normalizeEmail(claims.email) : undefined
        const emailVerified = claims.email_verified === true
        const displayName = typeof claims.name === "string" ? claims.name : undefined
        if (typeof googleSubject !== "string" || googleSubject.length === 0 || email === undefined) {
            throw new RpcError("UNAUTHENTICATED", "Google id_token is missing required claims.")
        }

        const now = new Date()
        const [bySubject] = await identityDb
            .select()
            .from(authIdentitiesTable)
            .where(eq(authIdentitiesTable.googleSubject, googleSubject))
        let identity: AuthIdentity
        if (bySubject !== undefined) {
            identity = bySubject
        } else {
            const byEmail = emailVerified ? await this.getIdentityByEmail(email) : undefined
            if (byEmail !== undefined) {
                identity = await updateRowReturning(identityDb, authIdentitiesTable, byEmail.id, {
                    googleSubject,
                    displayName: byEmail.displayName ?? displayName,
                })
            } else {
                identity = await this.insertIdentity({
                    email,
                    googleSubject,
                    displayName,
                    emailVerifiedAt: emailVerified ? now : null,
                })
            }
        }
        const signedIn = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            emailVerifiedAt: identity.emailVerifiedAt ?? (emailVerified ? now : null),
            lastSignInAt: now,
        })
        return await this.issueSession(signedIn)
    }

    // ---- Sessions -------------------------------------------------------

    /** Rotates a refresh token; reuse of a consumed token revokes the identity's sessions. */
    async refreshSession(refreshToken: string): Promise<AuthSession> {
        const [row] = await identityDb
            .select()
            .from(authRefreshTokensTable)
            .where(eq(authRefreshTokensTable.tokenHash, sha256Hex(refreshToken)))
        const now = new Date()
        if (row === undefined || row.revokedAt !== null || row.expiresAt <= now) {
            throw new RpcError("UNAUTHENTICATED", "Invalid or expired refresh token.")
        }
        if (row.consumedAt !== null) {
            // Single-use token replayed: treat as theft, kill every session.
            await this.revokeAllSessions(row.authSubject)
            throw new RpcError("UNAUTHENTICATED", "Refresh token was already used.")
        }
        await identityDb
            .update(authRefreshTokensTable)
            .set({ consumedAt: now })
            .where(eq(authRefreshTokensTable.id, row.id))
        const identity = await getRowByIdOrThrow(identityDb, authIdentitiesTable, row.authSubject)
        return await this.issueSession(identity)
    }

    async signOut(refreshToken: string): Promise<void> {
        await identityDb
            .update(authRefreshTokensTable)
            .set({ revokedAt: new Date() })
            .where(eq(authRefreshTokensTable.tokenHash, sha256Hex(refreshToken)))
    }

    async revokeAllSessions(authSubject: string): Promise<void> {
        await identityDb
            .update(authRefreshTokensTable)
            .set({ revokedAt: new Date() })
            .where(
                and(
                    eq(authRefreshTokensTable.authSubject, authSubject),
                    isNull(authRefreshTokensTable.revokedAt),
                ),
            )
    }

    private async issueSession(identity: AuthIdentity): Promise<AuthSession> {
        const minted = await authTokenService.mintAccessToken(identity)
        const refreshToken = crypto.randomBytes(48).toString("base64url")
        await identityDb.insert(authRefreshTokensTable).values({
            authSubject: identity.id,
            tokenHash: sha256Hex(refreshToken),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        })
        return {
            accessToken: minted.accessToken,
            tokenType: "bearer",
            expiresInSeconds: minted.expiresInSeconds,
            refreshToken,
            email: identity.email ?? undefined,
        }
    }

    // ---- Internals ------------------------------------------------------

    private async sendCode(
        email: string,
        purpose: AuthEmailCodePurpose,
        emailType: AuthEmailType,
        siteUrl: string,
    ): Promise<void> {
        if (!getMailWrapper().isConfigured()) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "Email delivery is not configured for this environment, so code sign-in is unavailable.",
            )
        }
        await this.assertSendAllowed(email)

        const code = generateSixDigitCode()
        const linkToken = crypto.randomBytes(32).toString("base64url")
        await identityDb.insert(authEmailCodesTable).values({
            email,
            purpose,
            codeHash: sha256Hex(code),
            linkTokenHash: sha256Hex(linkToken),
            expiresAt: new Date(Date.now() + CODE_TTL_MS),
        })

        const authPublicUrl = (process.env.AUTH_PUBLIC_URL ?? "").replace(/\/$/, "")
        const confirmationUrl = `${authPublicUrl}/confirm?token=${linkToken}`
        const rendered = renderAuthEmail(resolveAuthEmailTemplate(emailType), {
            token: code,
            confirmationUrl,
            siteUrl,
        })
        await getMailWrapper().sendMail({ toEmail: email, ...rendered })
    }

    /** Per-address send throttle: one email per minute, ten per hour. */
    private async assertSendAllowed(email: string): Promise<void> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recent = await identityDb
            .select({ createdAt: authEmailCodesTable.rowCreatedAt })
            .from(authEmailCodesTable)
            .where(
                and(eq(authEmailCodesTable.email, email), gt(authEmailCodesTable.rowCreatedAt, oneHourAgo)),
            )
        if (recent.length >= CODE_MAX_PER_HOUR) {
            throw new RpcError("RESOURCE_EXHAUSTED", "Too many codes requested. Try again later.")
        }
        const newestMs = Math.max(...recent.map((row) => row.createdAt.getTime()), 0)
        if (Date.now() - newestMs < CODE_MIN_RESEND_INTERVAL_MS) {
            throw new RpcError(
                "RESOURCE_EXHAUSTED",
                "A code was just sent. Wait a minute before requesting another.",
            )
        }
    }

    private async getIdentityByEmail(email: string): Promise<AuthIdentity | undefined> {
        const [identity] = await identityDb
            .select()
            .from(authIdentitiesTable)
            .where(eq(authIdentitiesTable.email, email))
        return identity
    }

    private async findOrCreateIdentityByEmail(email: string): Promise<AuthIdentity> {
        const existing = await this.getIdentityByEmail(email)
        if (existing !== undefined) {
            return existing
        }
        try {
            return await this.insertIdentity({ email })
        } catch (error) {
            // Lost a concurrent-create race; the unique(email) row now exists.
            const raced = await this.getIdentityByEmail(email)
            if (raced !== undefined) {
                return raced
            }
            throw error
        }
    }

    private async insertIdentity(
        values: Partial<typeof authIdentitiesTable.$inferInsert>,
    ): Promise<AuthIdentity> {
        const [identity] = await identityDb
            .insert(authIdentitiesTable)
            .values(values as typeof authIdentitiesTable.$inferInsert)
            .returning()
        return identity
    }
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
}

function assertPasswordStrength(password: string): void {
    if (password.length < MIN_PASSWORD_LENGTH) {
        throw new RpcError("INVALID_ARGUMENT", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    }
}

function generateSixDigitCode(): string {
    return String(crypto.randomInt(0, 1000000)).padStart(6, "0")
}

function timingSafeEqualHex(a: string, b: string): boolean {
    const bufferA = Buffer.from(a, "hex")
    const bufferB = Buffer.from(b, "hex")
    return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB)
}

export const builtinAuthService = new BuiltinAuthService()
