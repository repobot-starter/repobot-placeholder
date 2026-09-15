import express, { type Request, type Response } from "express"
import { onRequest } from "firebase-functions/v2/https"
import { jwtVerify, SignJWT } from "jose"
import { z } from "zod"
import {
    AuthResult,
    AuthSession,
    builtinAuthService,
} from "../Services/Identity/BuiltinAuth/BuiltinAuthService.js"
import {
    isOAuthProviderKey,
    oauthProviders,
    verifyAppleIdentityToken,
    type OAuthProviderKey,
} from "../Services/Identity/BuiltinAuth/OAuthProviders.js"
import { resolveLiveAuthConfig } from "../Services/Identity/BuiltinAuth/LiveAuthConfig.js"
import { builtinAuthJwtSecret, getTokenVerifier } from "../Services/Identity/TokenVerifier.js"
import { httpStatusFromRpcStatus, RpcError } from "../Utils/RpcError.js"

/**
 * The built-in auth API. Clients derive this URL from their GraphQL URL by
 * swapping the trailing function name (auth__request__api), which holds in
 * every environment because the emulator and the platform deployer treat all
 * exports uniformly.
 *
 * JSON endpoints (POST): /otp, /verify, /signup, /token, /anonymous,
 * /recover, /password, /signout, /apple/native (native Sign in with Apple),
 * and the MFA lifecycle /mfa/{enroll,confirm,verify,disable} (+ GET
 * /mfa/status). When an identity has a confirmed second factor, sign-in
 * flows return `{ mfa_required: true, challenge_token }` (JSON) or land
 * `#mfa_challenge=...` on the redirect target instead of a session.
 * GET /config serves the runtime sign-in-method list for login surfaces.
 * Redirect-flow endpoints: GET /<provider>/start and GET /<provider>/callback
 * for every provider in the OAuth registry, POST /apple/callback (Apple's
 * form_post), and GET /confirm (the emailed magic-link fallback).
 */
export const auth__request__api = onRequest({ cors: true }, buildAuthExpressApp())

const emailSchema = z.string().trim().toLowerCase().pipe(z.string().email())

export function buildAuthExpressApp(): express.Express {
    const app = express()
    app.use(express.json())
    // Apple's form_post callback posts application/x-www-form-urlencoded.
    app.use(express.urlencoded({ extended: false }))

    app.post(
        "/otp",
        asyncRoute(async (request, response) => {
            const { email } = z.object({ email: emailSchema }).parse(request.body)
            await builtinAuthService.sendSignInCode(email, resolveSiteUrl(request))
            response.json({})
        }),
    )

    app.post(
        "/verify",
        asyncRoute(async (request, response) => {
            const body = z
                .object({
                    email: emailSchema,
                    code: z.string().trim().min(1),
                    type: z.enum(["email", "recovery"]).default("email"),
                })
                .parse(request.body)
            const result = await builtinAuthService.verifyEmailCode({
                email: body.email,
                code: body.code,
                purposes: body.type === "recovery" ? ["RECOVERY"] : ["SIGN_IN", "SIGN_UP"],
            })
            response.json(authResultJson(result))
        }),
    )

    app.post(
        "/signup",
        asyncRoute(async (request, response) => {
            const body = z.object({ email: emailSchema, password: z.string() }).parse(request.body)
            const result = await builtinAuthService.signUpWithPassword({
                email: body.email,
                password: body.password,
                siteUrl: resolveSiteUrl(request),
            })
            if (result.session !== undefined) {
                response.json({ requires_confirmation: false, ...sessionJson(result.session) })
            } else if (result.mfaChallengeToken !== undefined) {
                response.json({
                    requires_confirmation: false,
                    mfa_required: true,
                    challenge_token: result.mfaChallengeToken,
                })
            } else {
                response.json({ requires_confirmation: true })
            }
        }),
    )

    app.post(
        "/token",
        asyncRoute(async (request, response) => {
            const body = z
                .object({
                    grant_type: z.enum(["password", "refresh_token"]),
                    email: emailSchema.optional(),
                    password: z.string().optional(),
                    refresh_token: z.string().optional(),
                })
                .parse(request.body)
            if (body.grant_type === "password") {
                if (body.email === undefined || body.password === undefined) {
                    throw new RpcError("INVALID_ARGUMENT", "email and password are required.")
                }
                const result = await builtinAuthService.signInWithPassword({
                    email: body.email,
                    password: body.password,
                })
                response.json(authResultJson(result))
            } else {
                if (body.refresh_token === undefined) {
                    throw new RpcError("INVALID_ARGUMENT", "refresh_token is required.")
                }
                const session = await builtinAuthService.refreshSession(body.refresh_token)
                response.json(sessionJson(session))
            }
        }),
    )

    app.post(
        "/anonymous",
        asyncRoute(async (_request, response) => {
            const session = await builtinAuthService.signInAnonymously()
            response.json(sessionJson(session))
        }),
    )

    app.post(
        "/recover",
        asyncRoute(async (request, response) => {
            const { email } = z.object({ email: emailSchema }).parse(request.body)
            await builtinAuthService.sendRecoveryCode(email, resolveSiteUrl(request))
            response.json({})
        }),
    )

    app.post(
        "/password",
        asyncRoute(async (request, response) => {
            const { password } = z.object({ password: z.string() }).parse(request.body)
            const verified = await getTokenVerifier().verify(bearerToken(request))
            await builtinAuthService.updatePassword(verified.authSubject, password)
            response.json({})
        }),
    )

    app.post(
        "/signout",
        asyncRoute(async (request, response) => {
            const { refresh_token } = z.object({ refresh_token: z.string() }).parse(request.body)
            await builtinAuthService.signOut(refresh_token)
            response.json({})
        }),
    )

    // Runtime auth config for login surfaces: the live (dashboard-toggled)
    // sign-in methods, or null when the project has never live-toggled them
    // — clients then keep their build-time (VITE_)AUTH_METHODS value. Same
    // fail-safe posture as the emails: this endpoint never errors a login
    // surface into blankness.
    app.get(
        "/config",
        asyncRoute(async (_request, response) => {
            const live = await resolveLiveAuthConfig()
            response.json({ methods: live?.methods ?? null })
        }),
    )

    // Magic-link fallback: the emailed URL lands here, the token is consumed,
    // and the session rides the redirect's hash fragment (never logged, never
    // sent to the destination server) — the same shape clients already parse.
    app.get(
        "/confirm",
        asyncRoute(async (request, response) => {
            const token = z.string().min(1).parse(request.query.token)
            const result = await builtinAuthService.consumeLinkToken(token)
            const destination = validatedRedirectTarget(firstQueryValue(request.query.redirect_to))
            response.redirect(303, `${destination}${authResultFragment(result)}`)
        }),
    )

    // One start route per registered OAuth provider: signs the destination
    // into a short-lived state JWT and redirects to the provider's
    // authorization page. Adding a provider is a registry entry
    // (OAuthProviders.ts), not a new route. When the platform's callback
    // proxy is configured, the state also carries this environment's own
    // auth origin — the proxy reads it (unverified, by design: it only
    // routes within its allowlist of provisioned environments) to forward
    // the provider's callback back here, where the signature is verified.
    app.get(
        "/:provider/start",
        asyncRoute(async (request, response) => {
            const provider = requireOAuthProvider(request)
            const redirectTo = validatedRedirectTarget(firstQueryValue(request.query.redirect_to))
            const state = await signOAuthStartState(redirectTo)
            const authorizeUrl = await oauthProviders[provider].buildAuthorizeUrl({
                state,
                redirectUri: oauthCallbackUrl(provider),
            })
            response.redirect(303, authorizeUrl.toString())
        }),
    )

    // Provider callbacks land here with an authorization code (or an error,
    // e.g. the user cancelled). Every registry provider redirects with GET
    // except Apple, which posts (form_post is required whenever scopes are
    // requested).
    app.get(
        "/:provider/callback",
        asyncRoute(async (request, response) => {
            const provider = requireOAuthProvider(request)
            await completeOAuthCallback(provider, response, {
                code: firstQueryValue(request.query.code),
                state: firstQueryValue(request.query.state),
                providerError: firstQueryValue(request.query.error),
            })
        }),
    )

    app.post(
        "/apple/callback",
        asyncRoute(async (request, response) => {
            const body = request.body as Record<string, unknown>
            await completeOAuthCallback("apple", response, {
                code: firstQueryValue(body.code),
                state: firstQueryValue(body.state),
                providerError: firstQueryValue(body.error),
                userPayload: firstQueryValue(body.user),
            })
        }),
    )

    // Native Sign in with Apple (ASAuthorizationController): the app sends
    // the identity token it received from Apple; the signature is verified
    // against Apple's JWKS (unlike the redirect flow, the token is relayed
    // by the client). The user's name only exists in the native credential,
    // so it rides along.
    app.post(
        "/apple/native",
        asyncRoute(async (request, response) => {
            const body = z
                .object({
                    identity_token: z.string().min(1),
                    full_name: z.string().optional(),
                })
                .parse(request.body)
            const profile = await verifyAppleIdentityToken(body.identity_token)
            const fullName = body.full_name?.trim()
            const result = await builtinAuthService.signInWithOAuthProfile({
                ...profile,
                displayName: profile.displayName ?? (fullName ? fullName : undefined),
            })
            response.json(authResultJson(result))
        }),
    )

    // ---- Two-factor authentication (see docs/auth.md) --------------------

    app.post(
        "/mfa/enroll",
        asyncRoute(async (request, response) => {
            const verified = await getTokenVerifier().verify(bearerToken(request))
            const enrollment = await builtinAuthService.enrollMfa(verified.authSubject)
            response.json({ secret: enrollment.secret, otpauth_uri: enrollment.otpauthUri })
        }),
    )

    app.post(
        "/mfa/confirm",
        asyncRoute(async (request, response) => {
            const { code } = z.object({ code: z.string().trim().min(1) }).parse(request.body)
            const verified = await getTokenVerifier().verify(bearerToken(request))
            const recoveryCodes = await builtinAuthService.confirmMfa(verified.authSubject, code)
            response.json({ recovery_codes: recoveryCodes })
        }),
    )

    app.post(
        "/mfa/verify",
        asyncRoute(async (request, response) => {
            const body = z
                .object({
                    challenge_token: z.string().min(1),
                    code: z.string().trim().min(1),
                })
                .parse(request.body)
            const session = await builtinAuthService.verifyMfaChallenge(body.challenge_token, body.code)
            response.json(sessionJson(session))
        }),
    )

    app.post(
        "/mfa/disable",
        asyncRoute(async (request, response) => {
            const { code } = z.object({ code: z.string().trim().min(1) }).parse(request.body)
            const verified = await getTokenVerifier().verify(bearerToken(request))
            await builtinAuthService.disableMfa(verified.authSubject, code)
            response.json({})
        }),
    )

    app.get(
        "/mfa/status",
        asyncRoute(async (request, response) => {
            const verified = await getTokenVerifier().verify(bearerToken(request))
            response.json({ enabled: await builtinAuthService.isMfaEnabled(verified.authSubject) })
        }),
    )

    return app
}

/**
 * Finishes a redirect-flow callback: verifies the state, exchanges the code
 * for a profile, signs it in, and lands the session on the destination in
 * the URL fragment. Provider errors (like the user cancelling) redirect back
 * with #error=... — the login surface already renders fragment errors — as
 * long as the state proves the destination; otherwise they fail as JSON.
 */
async function completeOAuthCallback(
    provider: OAuthProviderKey,
    response: Response,
    params: { code?: string; state?: string; providerError?: string; userPayload?: string },
): Promise<void> {
    let redirectTo: string | undefined
    if (params.state !== undefined) {
        try {
            const { payload } = await jwtVerify(params.state, builtinAuthJwtSecret(), {
                algorithms: ["HS256"],
            })
            redirectTo = validatedRedirectTarget(
                typeof payload.redirect_to === "string" ? payload.redirect_to : undefined,
            )
        } catch (error) {
            throw new RpcError("UNAUTHENTICATED", "Invalid OAuth state.", { cause: error })
        }
    }
    if (params.providerError !== undefined && redirectTo !== undefined) {
        response.redirect(303, `${redirectTo}#error=${encodeURIComponent(params.providerError)}`)
        return
    }
    if (params.code === undefined || redirectTo === undefined) {
        throw new RpcError("INVALID_ARGUMENT", "Missing code or state.")
    }
    const profile = await oauthProviders[provider].exchangeCode({
        code: params.code,
        redirectUri: oauthCallbackUrl(provider),
        userPayload: params.userPayload,
        state: params.state,
    })
    const result = await builtinAuthService.signInWithOAuthProfile(profile)
    response.redirect(303, `${redirectTo}${authResultFragment(result)}`)
}

function requireOAuthProvider(request: Request): OAuthProviderKey {
    const provider = request.params.provider
    if (typeof provider !== "string" || !isOAuthProviderKey(provider)) {
        throw new RpcError("NOT_FOUND", "Unknown sign-in provider.")
    }
    return provider
}

type RouteHandler = (request: Request, response: Response) => Promise<void>

function asyncRoute(handler: RouteHandler): RouteHandler {
    return async (request, response) => {
        try {
            await handler(request, response)
        } catch (error) {
            if (error instanceof z.ZodError) {
                response.status(400).json({
                    error: {
                        code: "INVALID_ARGUMENT",
                        message: error.issues[0]?.message ?? "Invalid request.",
                    },
                })
                return
            }
            if (error instanceof RpcError) {
                response
                    .status(httpStatusFromRpcStatus(error.status))
                    .json({ error: { code: error.status, message: error.message } })
                return
            }
            console.error("Unexpected auth API failure.", error)
            response.status(500).json({ error: { code: "INTERNAL", message: "Unexpected auth failure." } })
        }
    }
}

function authResultJson(result: AuthResult): Record<string, unknown> {
    if (result.kind === "mfaChallenge") {
        return { mfa_required: true, challenge_token: result.challengeToken }
    }
    return sessionJson(result.session)
}

function authResultFragment(result: AuthResult): string {
    if (result.kind === "mfaChallenge") {
        return `#${new URLSearchParams({ mfa_challenge: result.challengeToken }).toString()}`
    }
    return sessionFragment(result.session)
}

function sessionJson(session: AuthSession): Record<string, unknown> {
    return {
        access_token: session.accessToken,
        token_type: session.tokenType,
        expires_in: session.expiresInSeconds,
        refresh_token: session.refreshToken,
        ...(session.email !== undefined ? { email: session.email } : {}),
    }
}

function sessionFragment(session: AuthSession): string {
    const params = new URLSearchParams({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        expires_in: String(session.expiresInSeconds),
        token_type: session.tokenType,
    })
    if (session.email !== undefined) {
        params.set("email", session.email)
    }
    return `#${params.toString()}`
}

function bearerToken(request: Request): string {
    const header = request.headers.authorization
    if (typeof header !== "string" || header === "") {
        throw new RpcError("UNAUTHENTICATED", "Missing Authorization header.")
    }
    return header.replace(/^Bearer\s+/i, "")
}

function resolveSiteUrl(request: Request): string {
    const appBaseUrl = process.env.APP_BASE_URL
    if (appBaseUrl !== undefined && appBaseUrl !== "") {
        return appBaseUrl.replace(/\/$/, "")
    }
    const origin = request.headers.origin
    return typeof origin === "string" ? origin : ""
}

/**
 * Where a redirect flow may land: the app's own origin (APP_BASE_URL),
 * localhost for development, or a native deep-link scheme. Anything else
 * falls back to the app origin so emailed links can't be aimed elsewhere.
 */
function validatedRedirectTarget(candidate: string | undefined): string {
    const appBaseUrl = (process.env.APP_BASE_URL ?? "").replace(/\/$/, "")
    if (candidate === undefined || candidate === "") {
        if (appBaseUrl === "") {
            throw new RpcError("FAILED_PRECONDITION", "APP_BASE_URL is not configured.")
        }
        return appBaseUrl
    }
    let parsed: URL
    try {
        parsed = new URL(candidate)
    } catch {
        return appBaseUrl !== "" ? appBaseUrl : candidate
    }
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        const isAppOrigin = appBaseUrl !== "" && candidate.startsWith(appBaseUrl)
        const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
        if (isAppOrigin || isLocalhost) {
            return candidate
        }
        if (appBaseUrl === "") {
            throw new RpcError("FAILED_PRECONDITION", "APP_BASE_URL is not configured.")
        }
        return appBaseUrl
    }
    // Native deep-link scheme (e.g. "app://auth-callback").
    return candidate
}

/**
 * The short-lived state JWT minted by the start route: the destination the
 * callback should land on and — only when the platform's callback proxy is
 * configured — this environment's own auth origin, which the proxy reads
 * (unverified, by design: it only routes within its allowlist of
 * provisioned environments) to forward the provider's callback back here.
 * Exported for tests.
 */
export async function signOAuthStartState(redirectTo: string): Promise<string> {
    return await new SignJWT({
        redirect_to: redirectTo,
        ...(oauthProxyBaseUrl() !== undefined ? { origin: authPublicBaseUrl() } : {}),
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(builtinAuthJwtSecret())
}

/**
 * The redirect_uri handed to providers at authorize time and again at code
 * exchange (they must match). With the platform's callback proxy configured
 * the provider redirects to the proxy — the one stable URL customers
 * whitelist in their OAuth app — which forwards to this environment's
 * /{provider}/callback using the origin claim in the state. Exported for
 * tests.
 */
export function oauthCallbackUrl(provider: OAuthProviderKey): string {
    const base = oauthProxyBaseUrl() ?? authPublicBaseUrl()
    return `${base}/${provider}/callback`
}

function oauthProxyBaseUrl(): string | undefined {
    const proxyUrl = (process.env.AUTH_OAUTH_PROXY_URL ?? "").trim().replace(/\/$/, "")
    return proxyUrl === "" ? undefined : proxyUrl
}

function authPublicBaseUrl(): string {
    const authPublicUrl = (process.env.AUTH_PUBLIC_URL ?? "").trim().replace(/\/$/, "")
    if (authPublicUrl === "") {
        throw new RpcError(
            "FAILED_PRECONDITION",
            "AUTH_PUBLIC_URL is not configured; it is required for OAuth sign-in.",
        )
    }
    return authPublicUrl
}

function firstQueryValue(value: unknown): string | undefined {
    if (typeof value === "string" && value !== "") {
        return value
    }
    if (Array.isArray(value) && typeof value[0] === "string" && value[0] !== "") {
        return value[0]
    }
    return undefined
}
