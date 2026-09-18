import crypto from "node:crypto"
import { and, eq, gt, isNull, lt } from "drizzle-orm"
import { jwtVerify, SignJWT } from "jose"
import { getMailWrapper } from "../../../DependencyWrappers/MailWrapper/index.js"
import { authEmailCodesTable, AuthEmailCodePurpose } from "../../../Data/Identity/AuthEmailCode.js"
import { AuthIdentity, authIdentitiesTable } from "../../../Data/Identity/AuthIdentity.js"
import {
    AuthMfaFactor,
    authMfaFactorsTable,
    authMfaRecoveryCodesTable,
} from "../../../Data/Identity/AuthMfa.js"
import { authRefreshTokensTable } from "../../../Data/Identity/AuthRefreshToken.js"
import { identityDb } from "../../../Data/IdentityDatabase.js"
import { getRowByIdOrThrow, updateRowReturning } from "../../../Data/Utils/index.js"
import { mailQuotaService } from "../../Mail/MailQuotaService.js"
import { builtinAuthJwtSecret } from "../TokenVerifier.js"
import { isEmulator, isTest } from "../../../Utils/Environment.js"
import { RpcError } from "../../../Utils/RpcError.js"
import {
    defaultAuthEmailTemplates,
    renderAuthEmail,
    resolveAuthEmailTemplate,
    type AuthEmailType,
} from "./AuthEmailTemplates.js"
import { resolveLiveAuthConfig } from "./LiveAuthConfig.js"
import { authTokenService } from "./AuthTokenService.js"
import type { OAuthProviderKey, OAuthUserProfile } from "./OAuthProviders.js"
import { hashPassword, sha256Hex, verifyPassword } from "./PasswordHashing.js"
import { buildOtpauthUri, generateTotpSecret, verifyTotpCode } from "./Totp.js"

const CODE_TTL_MS = 10 * 60 * 1000
const CODE_MAX_ATTEMPTS = 5
const CODE_MIN_RESEND_INTERVAL_MS = 60 * 1000
const CODE_MAX_PER_HOUR = 10
const REFRESH_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000
const PASSWORD_MAX_FAILED_ATTEMPTS = 10
const PASSWORD_LOCKOUT_MS = 15 * 60 * 1000
const MIN_PASSWORD_LENGTH = 8
const MFA_CHALLENGE_TTL_SECONDS = 5 * 60
const MFA_MAX_FAILED_ATTEMPTS = 5
const MFA_LOCKOUT_MS = 15 * 60 * 1000
const MFA_RECOVERY_CODE_COUNT = 10

export interface AuthSession {
    accessToken: string
    tokenType: "bearer"
    expiresInSeconds: number
    refreshToken: string
    /** The identity's email; absent for anonymous (guest) sessions. */
    email?: string
}

/**
 * What a primary sign-in flow yields: a session as before, or — when the
 * identity has a confirmed TOTP factor — an MFA challenge the client must
 * answer at /mfa/verify to get the session (see docs/auth.md, "Two-factor
 * authentication").
 */
export type AuthResult =
    { kind: "session"; session: AuthSession } | { kind: "mfaChallenge"; challengeToken: string }

export interface SignUpResult {
    /** True when a confirmation email was sent; the session comes after the link is clicked. */
    requiresConfirmation: boolean
    session?: AuthSession
    /** Set instead of session when the identity already has a confirmed factor. */
    mfaChallengeToken?: string
}

export interface MfaEnrollment {
    /** The base32 TOTP secret, for manual entry. */
    secret: string
    /** What authenticator apps enroll from (QR on web, opened natively on mobile). */
    otpauthUri: string
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
    }): Promise<AuthResult> {
        const email = normalizeEmail(request.email)
        const now = new Date()

        // Dev bypass: on dev postures with AUTH_DEV_CODE opted in, the fixed
        // code signs in any address without a delivered email — deployed
        // dev environments have no test inbox. devSignInCode() is undefined
        // when the variable is unset (the default) and on production posture,
        // where boot additionally refuses the variable (Utils/Env.ts).
        const devCode = devSignInCode()
        if (
            devCode !== undefined &&
            request.purposes.includes("SIGN_IN") &&
            timingSafeEqualHex(sha256Hex(request.code), sha256Hex(devCode))
        ) {
            const identity = await this.findOrCreateIdentityByEmail(email)
            const verified = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
                emailVerifiedAt: identity.emailVerifiedAt ?? now,
                lastSignInAt: now,
                failedPasswordAttempts: 0,
                lockedOutUntil: null,
            })
            return await this.completeAuth(verified)
        }

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
        return await this.completeAuth(verified)
    }

    /**
     * Consumes the long token carried by an emailed URL (GET /confirm): the
     * primary path for sign-up confirmation (the email's verify button) and
     * the magic-link fallback for code emails.
     */
    async consumeLinkToken(linkToken: string): Promise<AuthResult> {
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
        return await this.completeAuth(verified)
    }

    // ---- Password -------------------------------------------------------

    /**
     * Creates an email+password identity. With mail configured, a
     * confirmation email is sent (a verify-email button/link; see
     * AuthEmailTemplates.ts) and the session comes after the user clicks it;
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
        // Degraded mode: no way to deliver the confirmation email, so auto-confirm.
        const confirmed = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            emailVerifiedAt: new Date(),
            lastSignInAt: new Date(),
        })
        const result = await this.completeAuth(confirmed)
        return result.kind === "session"
            ? { requiresConfirmation: false, session: result.session }
            : { requiresConfirmation: false, mfaChallengeToken: result.challengeToken }
    }

    async signInWithPassword(request: { email: string; password: string }): Promise<AuthResult> {
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
                "Email not confirmed. Click the verification button in your sign-up email first.",
            )
        }
        const signedIn = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            failedPasswordAttempts: 0,
            lockedOutUntil: null,
            lastSignInAt: now,
        })
        return await this.completeAuth(signedIn)
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

    // ---- OAuth providers (Google, Apple) ---------------------------------

    /**
     * Signs an OAuth profile in (see OAuthProviders.ts for how a provider's
     * flow resolves to one), linking by the provider's subject first, then
     * by (verified) email, then creating a fresh identity. Provider-generic:
     * each provider only needs its subject column on auth_identities.
     */
    async signInWithOAuthProfile(profile: OAuthUserProfile): Promise<AuthResult> {
        const subjectField = oauthSubjectFields[profile.provider]
        const email = normalizeEmail(profile.email)
        const now = new Date()
        const [bySubject] = await identityDb
            .select()
            .from(authIdentitiesTable)
            .where(eq(authIdentitiesTable[subjectField], profile.subject))
        let identity: AuthIdentity
        if (bySubject !== undefined) {
            identity = bySubject
        } else {
            const byEmail = profile.emailVerified ? await this.getIdentityByEmail(email) : undefined
            if (byEmail !== undefined) {
                identity = await updateRowReturning(identityDb, authIdentitiesTable, byEmail.id, {
                    [subjectField]: profile.subject,
                    displayName: byEmail.displayName ?? profile.displayName,
                })
            } else {
                identity = await this.insertIdentity({
                    email,
                    [subjectField]: profile.subject,
                    displayName: profile.displayName,
                    emailVerifiedAt: profile.emailVerified ? now : null,
                })
            }
        }
        const signedIn = await updateRowReturning(identityDb, authIdentitiesTable, identity.id, {
            emailVerifiedAt: identity.emailVerifiedAt ?? (profile.emailVerified ? now : null),
            lastSignInAt: now,
        })
        return await this.completeAuth(signedIn)
    }

    // ---- Two-factor authentication (TOTP) --------------------------------

    /**
     * Starts (or restarts) TOTP enrollment for a signed-in identity: stores
     * an unconfirmed factor and returns the secret. Unconfirmed factors never
     * gate sign-in, so an abandoned enrollment is harmless and re-enrolling
     * simply rotates the pending secret.
     */
    async enrollMfa(authSubject: string): Promise<MfaEnrollment> {
        const identity = await getRowByIdOrThrow(identityDb, authIdentitiesTable, authSubject)
        if (identity.isAnonymous) {
            throw new RpcError("FAILED_PRECONDITION", "Guest sessions cannot enroll a second factor.")
        }
        const existing = await this.getMfaFactor(authSubject)
        if (existing?.confirmedAt != null) {
            throw new RpcError(
                "ALREADY_EXISTS",
                "Two-factor authentication is already enabled. Disable it before re-enrolling.",
            )
        }
        const secret = generateTotpSecret()
        const secretEncrypted = encryptMfaSecret(secret)
        if (existing !== undefined) {
            await updateRowReturning(identityDb, authMfaFactorsTable, existing.id, { secretEncrypted })
        } else {
            await identityDb.insert(authMfaFactorsTable).values({ authSubject, secretEncrypted })
        }
        return {
            secret,
            otpauthUri: buildOtpauthUri({
                secretBase32: secret,
                accountName: identity.email ?? authSubject,
                issuer: mfaIssuer(),
            }),
        }
    }

    /**
     * Confirms enrollment with the first valid code and returns the recovery
     * codes — plaintext exactly once; only their hashes are stored.
     */
    async confirmMfa(authSubject: string, code: string): Promise<string[]> {
        const factor = await this.getMfaFactor(authSubject)
        if (factor === undefined) {
            throw new RpcError("FAILED_PRECONDITION", "No enrollment in progress. Enroll first.")
        }
        if (factor.confirmedAt !== null) {
            throw new RpcError("ALREADY_EXISTS", "Two-factor authentication is already enabled.")
        }
        if (!verifyTotpCode(decryptMfaSecret(factor.secretEncrypted), code)) {
            throw new RpcError("UNAUTHENTICATED", "Invalid code. Check your authenticator app.")
        }
        await updateRowReturning(identityDb, authMfaFactorsTable, factor.id, {
            confirmedAt: new Date(),
            failedAttempts: 0,
            lockedUntil: null,
        })
        const recoveryCodes = Array.from({ length: MFA_RECOVERY_CODE_COUNT }, generateRecoveryCode)
        await identityDb
            .delete(authMfaRecoveryCodesTable)
            .where(eq(authMfaRecoveryCodesTable.authSubject, authSubject))
        await identityDb.insert(authMfaRecoveryCodesTable).values(
            recoveryCodes.map((recoveryCode) => ({
                authSubject,
                codeHash: sha256Hex(normalizeRecoveryCode(recoveryCode)),
            })),
        )
        return recoveryCodes
    }

    /**
     * Answers an MFA challenge: a valid TOTP code or an unused recovery code
     * mints the full session. Five failures lock the factor for 15 minutes.
     */
    async verifyMfaChallenge(challengeToken: string, code: string): Promise<AuthSession> {
        const authSubject = await this.verifyChallengeToken(challengeToken)
        const factor = await this.getMfaFactor(authSubject)
        if (factor === undefined || factor.confirmedAt === null) {
            // The factor was disabled between challenge and answer; make the
            // client restart sign-in rather than minting from a stale token.
            throw new RpcError("FAILED_PRECONDITION", "Two-factor authentication is not enabled.")
        }
        const now = new Date()
        if (factor.lockedUntil !== null && factor.lockedUntil > now) {
            throw new RpcError("RESOURCE_EXHAUSTED", "Too many failed codes. Try again in a few minutes.")
        }
        const totpValid = verifyTotpCode(decryptMfaSecret(factor.secretEncrypted), code)
        const recoveryValid = !totpValid && (await this.consumeRecoveryCode(authSubject, code))
        if (!totpValid && !recoveryValid) {
            const failedAttempts = factor.failedAttempts + 1
            await updateRowReturning(identityDb, authMfaFactorsTable, factor.id, {
                failedAttempts,
                lockedUntil:
                    failedAttempts >= MFA_MAX_FAILED_ATTEMPTS
                        ? new Date(now.getTime() + MFA_LOCKOUT_MS)
                        : null,
            })
            throw new RpcError("UNAUTHENTICATED", "Invalid code.")
        }
        await updateRowReturning(identityDb, authMfaFactorsTable, factor.id, {
            failedAttempts: 0,
            lockedUntil: null,
        })
        const identity = await updateRowReturning(identityDb, authIdentitiesTable, authSubject, {
            lastSignInAt: now,
        })
        return await this.issueSession(identity)
    }

    /** Disables MFA. Requires a current TOTP or recovery code, not just a session. */
    async disableMfa(authSubject: string, code: string): Promise<void> {
        const factor = await this.getMfaFactor(authSubject)
        if (factor === undefined) {
            throw new RpcError("FAILED_PRECONDITION", "Two-factor authentication is not enabled.")
        }
        if (factor.confirmedAt !== null) {
            const totpValid = verifyTotpCode(decryptMfaSecret(factor.secretEncrypted), code)
            const recoveryValid = !totpValid && (await this.consumeRecoveryCode(authSubject, code))
            if (!totpValid && !recoveryValid) {
                throw new RpcError("UNAUTHENTICATED", "Invalid code.")
            }
        }
        await identityDb.delete(authMfaFactorsTable).where(eq(authMfaFactorsTable.id, factor.id))
        await identityDb
            .delete(authMfaRecoveryCodesTable)
            .where(eq(authMfaRecoveryCodesTable.authSubject, authSubject))
    }

    /** Whether the identity has a confirmed factor (the Settings surface reads this). */
    async isMfaEnabled(authSubject: string): Promise<boolean> {
        const factor = await this.getMfaFactor(authSubject)
        return factor?.confirmedAt != null
    }

    /**
     * The session-elevation seam every primary flow funnels through: a
     * confirmed factor turns the would-be session into a short-lived
     * challenge token whose only power is /mfa/verify (the token verifier
     * rejects purpose-scoped tokens as access tokens).
     */
    private async completeAuth(identity: AuthIdentity): Promise<AuthResult> {
        const factor = await this.getMfaFactor(identity.id)
        if (factor?.confirmedAt == null) {
            return { kind: "session", session: await this.issueSession(identity) }
        }
        const challengeToken = await new SignJWT({ purpose: "mfa_challenge" })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(identity.id)
            .setIssuer("builtin-auth")
            .setIssuedAt()
            .setExpirationTime(`${MFA_CHALLENGE_TTL_SECONDS}s`)
            .sign(builtinAuthJwtSecret())
        return { kind: "mfaChallenge", challengeToken }
    }

    private async verifyChallengeToken(challengeToken: string): Promise<string> {
        try {
            const { payload } = await jwtVerify(challengeToken, builtinAuthJwtSecret(), {
                algorithms: ["HS256"],
            })
            if (payload.purpose !== "mfa_challenge" || typeof payload.sub !== "string") {
                throw new RpcError("UNAUTHENTICATED", "Not an MFA challenge token.")
            }
            return payload.sub
        } catch (error) {
            if (error instanceof RpcError) throw error
            throw new RpcError("UNAUTHENTICATED", "Invalid or expired challenge. Sign in again.", {
                cause: error,
            })
        }
    }

    private async getMfaFactor(authSubject: string): Promise<AuthMfaFactor | undefined> {
        const [factor] = await identityDb
            .select()
            .from(authMfaFactorsTable)
            .where(eq(authMfaFactorsTable.authSubject, authSubject))
        return factor
    }

    private async consumeRecoveryCode(authSubject: string, code: string): Promise<boolean> {
        const codeHash = sha256Hex(normalizeRecoveryCode(code))
        const rows = await identityDb
            .select()
            .from(authMfaRecoveryCodesTable)
            .where(
                and(
                    eq(authMfaRecoveryCodesTable.authSubject, authSubject),
                    isNull(authMfaRecoveryCodesTable.usedAt),
                ),
            )
        const match = rows.find((row) => timingSafeEqualHex(row.codeHash, codeHash))
        if (match === undefined) {
            return false
        }
        await identityDb
            .update(authMfaRecoveryCodesTable)
            .set({ usedAt: new Date() })
            .where(eq(authMfaRecoveryCodesTable.id, match.id))
        return true
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

        // The environment-wide daily quota (docs/mail.md). Auth mail shares
        // the counter with template mail but is allowed up to twice the
        // quota, so a template flood can't lock users out of sign-in. Unlike
        // the mail kernel's silent degrade, auth surfaces the refusal:
        // claiming a code was sent when it wasn't would strand the user.
        if (!(await mailQuotaService.tryReserveSend("auth"))) {
            throw new RpcError(
                "RESOURCE_EXHAUSTED",
                "This environment's daily email quota is exhausted. Try again later.",
            )
        }

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
        // The live config (platform-maintained secret, ~60s cache) wins so
        // dashboard template saves and sender-domain changes apply without a
        // redeploy. When present it is authoritative — a type it omits means
        // the kernel default, not the deploy-time env override, so removing
        // an override applies immediately too. Env config is the fallback
        // when there is no live secret (sandbox, fetch failure).
        const live = await resolveLiveAuthConfig()
        const template = live
            ? (live.templates[emailType] ?? defaultAuthEmailTemplates[emailType])
            : resolveAuthEmailTemplate(emailType)
        const rendered = renderAuthEmail(template, {
            token: code,
            confirmationUrl,
            siteUrl,
            appName: appDisplayName(siteUrl),
        })
        await getMailWrapper().sendMail({ toEmail: email, sender: live?.sender, ...rendered })
    }

    /**
     * Deletes email-code rows whose expiry is at least `olderThanMs` in the
     * past (consumed or not — verification only ever reads live rows, and
     * the resend throttle only looks one hour back, so long-expired rows
     * are pure dead weight). The jobs registry runs this hourly
     * (src/Jobs/JobsRegistry.ts); the generous cutoff keeps the throttle
     * window and any in-flight verification untouched. Idempotent —
     * deleting nothing is success — as every job handler must be.
     */
    async purgeExpiredEmailCodes(olderThanMs = 24 * 60 * 60 * 1000): Promise<number> {
        const cutoff = new Date(Date.now() - olderThanMs)
        const deleted = await identityDb
            .delete(authEmailCodesTable)
            .where(lt(authEmailCodesTable.expiresAt, cutoff))
            .returning({ id: authEmailCodesTable.id })
        return deleted.length
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

/** Which auth_identities column carries each provider's stable subject. */
const oauthSubjectFields = {
    google: "googleSubject",
    apple: "appleSubject",
    github: "githubSubject",
    facebook: "facebookSubject",
    discord: "discordSubject",
    x: "xSubject",
    linkedin: "linkedinSubject",
} as const satisfies Record<OAuthProviderKey, keyof AuthIdentity>

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

/**
 * What {{ .AppName }} resolves to in auth emails: APP_NAME when set, else
 * the app's hostname (deploy base URL, falling back to the request's site
 * URL) — practically always available, so the default templates' wordmark
 * never renders the generic fallback in a real deploy.
 */
function appDisplayName(siteUrl: string): string {
    const appName = process.env.APP_NAME
    if (appName !== undefined && appName !== "") {
        return appName
    }
    for (const candidate of [process.env.APP_BASE_URL, siteUrl]) {
        if (candidate !== undefined && candidate !== "") {
            try {
                return new URL(candidate).hostname
            } catch {
                // Try the next candidate.
            }
        }
    }
    return "Your app"
}

/** What authenticator apps display next to the account. */
function mfaIssuer(): string {
    const appName = process.env.APP_NAME
    if (appName !== undefined && appName !== "") {
        return appName
    }
    const appBaseUrl = process.env.APP_BASE_URL
    if (appBaseUrl !== undefined && appBaseUrl !== "") {
        try {
            return new URL(appBaseUrl).hostname
        } catch {
            // Fall through to the generic issuer.
        }
    }
    return "App"
}

/** "xxxx-xxxx-xxxx" from an unambiguous lowercase alphabet. */
function generateRecoveryCode(): string {
    const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"
    const group = (): string =>
        Array.from({ length: 4 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("")
    return `${group()}-${group()}-${group()}`
}

function normalizeRecoveryCode(code: string): string {
    return code
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
}

// The TOTP secret is encrypted at rest with a key derived from the
// per-environment AUTH_JWT_SECRET, so a database dump alone cannot mint
// codes. Format: base64url(iv).base64url(tag).base64url(ciphertext).
function mfaSecretCipherKey(): Buffer {
    return crypto
        .createHash("sha256")
        .update("builtin-auth-mfa-secret:")
        .update(Buffer.from(builtinAuthJwtSecret()))
        .digest()
}

function encryptMfaSecret(secretBase32: string): string {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv("aes-256-gcm", mfaSecretCipherKey(), iv)
    const ciphertext = Buffer.concat([cipher.update(secretBase32, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".")
}

function decryptMfaSecret(payload: string): string {
    const [iv, tag, ciphertext] = payload.split(".").map((part) => Buffer.from(part, "base64url"))
    const decipher = crypto.createDecipheriv("aes-256-gcm", mfaSecretCipherKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

/**
 * The fixed dev sign-in code, or undefined whenever the bypass must be off:
 * AUTH_DEV_CODE unset or empty (the default — the bypass path is then
 * unreachable), or a posture that never allows it (deployed production,
 * where the boot guard in Utils/Env.ts also refuses to start).
 */
function devSignInCode(): string | undefined {
    const code = process.env.AUTH_DEV_CODE
    if (code === undefined || code === "") {
        return undefined
    }
    if (!isEmulator() && !isTest() && process.env.DEPLOY_POSTURE !== "dev") {
        return undefined
    }
    return code
}

function timingSafeEqualHex(a: string, b: string): boolean {
    const bufferA = Buffer.from(a, "hex")
    const bufferB = Buffer.from(b, "hex")
    return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB)
}

export const builtinAuthService = new BuiltinAuthService()
