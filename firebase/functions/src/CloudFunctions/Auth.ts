import express, { type Request, type Response } from "express"
import { onRequest } from "firebase-functions/v2/https"
import { jwtVerify, SignJWT } from "jose"
import { z } from "zod"
import { AuthSession, builtinAuthService } from "../Services/Identity/BuiltinAuth/BuiltinAuthService.js"
import { builtinAuthJwtSecret, getTokenVerifier } from "../Services/Identity/TokenVerifier.js"
import { httpStatusFromRpcStatus, RpcError } from "../Utils/RpcError.js"

/**
 * The built-in auth API. Clients derive this URL from their GraphQL URL by
 * swapping the trailing function name (auth__request__api), which holds in
 * every environment because the emulator and the platform deployer treat all
 * exports uniformly.
 *
 * JSON endpoints (POST): /otp, /verify, /signup, /token, /anonymous,
 * /recover, /password, /signout. Redirect endpoints (GET): /google/start,
 * /google/callback, /confirm (the emailed magic-link fallback).
 */
export const auth__request__api = onRequest({ cors: true }, buildAuthExpressApp())

const emailSchema = z.string().trim().toLowerCase().pipe(z.string().email())

export function buildAuthExpressApp(): express.Express {
    const app = express()
    app.use(express.json())

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
            const session = await builtinAuthService.verifyEmailCode({
                email: body.email,
                code: body.code,
                purposes: body.type === "recovery" ? ["RECOVERY"] : ["SIGN_IN", "SIGN_UP"],
            })
            response.json(sessionJson(session))
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
                const session = await builtinAuthService.signInWithPassword({
                    email: body.email,
                    password: body.password,
                })
                response.json(sessionJson(session))
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

    // Magic-link fallback: the emailed URL lands here, the token is consumed,
    // and the session rides the redirect's hash fragment (never logged, never
    // sent to the destination server) — the same shape clients already parse.
    app.get(
        "/confirm",
        asyncRoute(async (request, response) => {
            const token = z.string().min(1).parse(request.query.token)
            const session = await builtinAuthService.consumeLinkToken(token)
            const destination = validatedRedirectTarget(firstQueryValue(request.query.redirect_to))
            response.redirect(303, `${destination}${sessionFragment(session)}`)
        }),
    )

    app.get(
        "/google/start",
        asyncRoute(async (request, response) => {
            const clientId = process.env.GOOGLE_SIGNIN_CLIENT_ID
            if (clientId === undefined || clientId === "") {
                throw new RpcError("FAILED_PRECONDITION", "Google sign-in is not configured.")
            }
            const redirectTo = validatedRedirectTarget(firstQueryValue(request.query.redirect_to))
            const state = await new SignJWT({ redirect_to: redirectTo })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("10m")
                .sign(builtinAuthJwtSecret())
            const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
            authorizeUrl.searchParams.set("client_id", clientId)
            authorizeUrl.searchParams.set("redirect_uri", googleCallbackUrl())
            authorizeUrl.searchParams.set("response_type", "code")
            authorizeUrl.searchParams.set("scope", "openid email profile")
            authorizeUrl.searchParams.set("state", state)
            response.redirect(303, authorizeUrl.toString())
        }),
    )

    app.get(
        "/google/callback",
        asyncRoute(async (request, response) => {
            const code = firstQueryValue(request.query.code)
            const state = firstQueryValue(request.query.state)
            if (code === undefined || state === undefined) {
                throw new RpcError("INVALID_ARGUMENT", "Missing code or state.")
            }
            let redirectTo: string
            try {
                const { payload } = await jwtVerify(state, builtinAuthJwtSecret(), {
                    algorithms: ["HS256"],
                })
                redirectTo = validatedRedirectTarget(
                    typeof payload.redirect_to === "string" ? payload.redirect_to : undefined,
                )
            } catch (error) {
                throw new RpcError("UNAUTHENTICATED", "Invalid OAuth state.", { cause: error })
            }
            const session = await builtinAuthService.signInWithGoogleCode({
                code,
                redirectUri: googleCallbackUrl(),
            })
            response.redirect(303, `${redirectTo}${sessionFragment(session)}`)
        }),
    )

    return app
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

function googleCallbackUrl(): string {
    const authPublicUrl = (process.env.AUTH_PUBLIC_URL ?? "").replace(/\/$/, "")
    if (authPublicUrl === "") {
        throw new RpcError(
            "FAILED_PRECONDITION",
            "AUTH_PUBLIC_URL is not configured; it is required for Google sign-in.",
        )
    }
    return `${authPublicUrl}/google/callback`
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
