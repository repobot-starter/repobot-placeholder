import { createHash, createHmac } from "node:crypto"
import { createRemoteJWKSet, decodeJwt, importPKCS8, jwtVerify, SignJWT } from "jose"
import { RpcError } from "../../../Utils/RpcError.js"
import { builtinAuthJwtSecret } from "../TokenVerifier.js"

/**
 * The OAuth provider registry: one place that names every redirect-flow
 * sign-in provider the built-in auth service knows how to run, and how to
 * turn its authorization code into a normalized user profile. Adding a
 * standard provider is a `standardOAuth2Provider` config entry here plus a
 * subject column on auth_identities — the HTTP routes in
 * CloudFunctions/Auth.ts and the linking logic in BuiltinAuthService are
 * generic over this registry. Google and Apple predate the factory and keep
 * their bespoke definitions (Apple's flow is genuinely irregular).
 */
export type OAuthProviderKey = "google" | "apple" | "github" | "facebook" | "discord" | "x" | "linkedin"

export const oauthProviderKeys: readonly OAuthProviderKey[] = [
    "google",
    "apple",
    "github",
    "facebook",
    "discord",
    "x",
    "linkedin",
]

export function isOAuthProviderKey(value: string): value is OAuthProviderKey {
    return (oauthProviderKeys as readonly string[]).includes(value)
}

/** What every provider's flow resolves to; BuiltinAuthService links on it. */
export interface OAuthUserProfile {
    provider: OAuthProviderKey
    /** The provider's stable OpenID subject. */
    subject: string
    email: string
    emailVerified: boolean
    displayName?: string
}

interface OAuthProviderDefinition {
    /** Human name for error messages ("Google sign-in is not configured."). */
    displayName: string
    /** Whether the environment carries this provider's credentials. */
    isConfigured(): boolean
    /** The provider authorize URL the /start route redirects to. */
    buildAuthorizeUrl(params: { state: string; redirectUri: string }): Promise<URL>
    /**
     * Exchanges the callback's authorization code for the user profile.
     * `userPayload` carries provider-specific extras from the callback
     * (Apple posts a `user` JSON field on first authorization); `state` is
     * the flow's signed state JWT, which PKCE providers need to recompute
     * their code_verifier.
     */
    exchangeCode(params: {
        code: string
        redirectUri: string
        userPayload?: string
        state?: string
    }): Promise<OAuthUserProfile>
}

// ---- Google -------------------------------------------------------------

const googleProvider: OAuthProviderDefinition = {
    displayName: "Google",

    isConfigured(): boolean {
        return (
            Boolean(process.env.GOOGLE_SIGNIN_CLIENT_ID) && Boolean(process.env.GOOGLE_SIGNIN_CLIENT_SECRET)
        )
    },

    async buildAuthorizeUrl(params): Promise<URL> {
        const clientId = process.env.GOOGLE_SIGNIN_CLIENT_ID
        if (!clientId) {
            throw new RpcError("FAILED_PRECONDITION", "Google sign-in is not configured.")
        }
        const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
        authorizeUrl.searchParams.set("client_id", clientId)
        authorizeUrl.searchParams.set("redirect_uri", params.redirectUri)
        authorizeUrl.searchParams.set("response_type", "code")
        authorizeUrl.searchParams.set("scope", "openid email profile")
        authorizeUrl.searchParams.set("state", params.state)
        return authorizeUrl
    },

    async exchangeCode(params): Promise<OAuthUserProfile> {
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
                code: params.code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: params.redirectUri,
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
        return profileFromIdTokenClaims("google", "Google", claims)
    },
}

// ---- Apple --------------------------------------------------------------

const APPLE_ISSUER = "https://appleid.apple.com"

/**
 * The Apple Sign-In private key (a .p8 in PKCS8 PEM format). The platform
 * stages it base64-encoded so the multiline PEM survives the runtime env
 * file; raw PEM is accepted too for hand-provisioned environments.
 */
function appleSigninPrivateKeyPem(): string {
    const raw = (process.env.APPLE_SIGNIN_PRIVATE_KEY ?? "").trim()
    if (raw === "") {
        return ""
    }
    if (raw.startsWith("-----BEGIN")) {
        return raw
    }
    try {
        const decoded = Buffer.from(raw, "base64").toString("utf8")
        return decoded.includes("-----BEGIN") ? decoded : ""
    } catch {
        return ""
    }
}

function appleSigninConfig(): { servicesId: string; teamId: string; keyId: string; privateKeyPem: string } {
    const servicesId = process.env.APPLE_SIGNIN_SERVICES_ID ?? ""
    const teamId = process.env.APPLE_SIGNIN_TEAM_ID ?? ""
    const keyId = process.env.APPLE_SIGNIN_KEY_ID ?? ""
    const privateKeyPem = appleSigninPrivateKeyPem()
    if (!servicesId || !teamId || !keyId || !privateKeyPem) {
        throw new RpcError("FAILED_PRECONDITION", "Apple sign-in is not configured for this environment.")
    }
    return { servicesId, teamId, keyId, privateKeyPem }
}

/**
 * Apple has no static client secret: each token-endpoint call authenticates
 * with a short-lived ES256 JWT signed by the "Sign in with Apple" key
 * (issuer = team id, subject = the client id the code was issued to).
 */
export async function mintAppleClientSecret(params: {
    teamId: string
    clientId: string
    keyId: string
    privateKeyPem: string
}): Promise<string> {
    let privateKey
    try {
        privateKey = await importPKCS8(params.privateKeyPem, "ES256")
    } catch (error) {
        throw new RpcError(
            "FAILED_PRECONDITION",
            "The Apple sign-in private key is not a valid ES256 (.p8) key.",
            { cause: error },
        )
    }
    return await new SignJWT({})
        .setProtectedHeader({ alg: "ES256", kid: params.keyId })
        .setIssuer(params.teamId)
        .setSubject(params.clientId)
        .setAudience(APPLE_ISSUER)
        .setIssuedAt()
        .setExpirationTime("5m")
        .sign(privateKey)
}

const appleProvider: OAuthProviderDefinition = {
    displayName: "Apple",

    isConfigured(): boolean {
        return (
            Boolean(process.env.APPLE_SIGNIN_SERVICES_ID) &&
            Boolean(process.env.APPLE_SIGNIN_TEAM_ID) &&
            Boolean(process.env.APPLE_SIGNIN_KEY_ID) &&
            appleSigninPrivateKeyPem() !== ""
        )
    },

    async buildAuthorizeUrl(params): Promise<URL> {
        const { servicesId } = appleSigninConfig()
        const authorizeUrl = new URL(`${APPLE_ISSUER}/auth/authorize`)
        authorizeUrl.searchParams.set("client_id", servicesId)
        authorizeUrl.searchParams.set("redirect_uri", params.redirectUri)
        authorizeUrl.searchParams.set("response_type", "code")
        authorizeUrl.searchParams.set("scope", "name email")
        // Apple requires form_post whenever scopes are requested, so the
        // callback route is a POST (see CloudFunctions/Auth.ts).
        authorizeUrl.searchParams.set("response_mode", "form_post")
        authorizeUrl.searchParams.set("state", params.state)
        return authorizeUrl
    },

    async exchangeCode(params): Promise<OAuthUserProfile> {
        const { servicesId, teamId, keyId, privateKeyPem } = appleSigninConfig()
        const clientSecret = await mintAppleClientSecret({
            teamId,
            clientId: servicesId,
            keyId,
            privateKeyPem,
        })
        const response = await fetch(`${APPLE_ISSUER}/auth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code: params.code,
                client_id: servicesId,
                client_secret: clientSecret,
                redirect_uri: params.redirectUri,
                grant_type: "authorization_code",
            }),
        })
        if (!response.ok) {
            const detail = await response.text()
            throw new RpcError("UNAUTHENTICATED", `Apple code exchange failed: ${detail.slice(0, 200)}`)
        }
        const body = (await response.json()) as { id_token?: string }
        if (typeof body.id_token !== "string") {
            throw new RpcError("UNAUTHENTICATED", "Apple response is missing the id_token.")
        }
        // Same trust anchor as Google: the id_token came over TLS from
        // Apple's token endpoint in exchange for our signed client secret.
        const claims = decodeJwt(body.id_token)
        const profile = profileFromIdTokenClaims("apple", "Apple", claims)
        // Apple sends the user's name only once, as a `user` JSON form field
        // on the first authorization — it never appears in the id_token.
        return { ...profile, displayName: profile.displayName ?? appleUserPayloadName(params.userPayload) }
    },
}

/** Parses the `user` form field Apple posts on first authorization. */
function appleUserPayloadName(userPayload: string | undefined): string | undefined {
    if (!userPayload) {
        return undefined
    }
    try {
        const parsed = JSON.parse(userPayload) as { name?: { firstName?: string; lastName?: string } }
        const name = [parsed.name?.firstName, parsed.name?.lastName]
            .filter((part): part is string => typeof part === "string" && part !== "")
            .join(" ")
        return name === "" ? undefined : name
    } catch {
        return undefined
    }
}

// Module-level so key material is fetched once and cached across requests
// (jose refreshes it automatically on unknown-kid signatures).
const appleJwks = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`))

/**
 * Verifies a native Sign in with Apple identity token (from
 * ASAuthorizationController). Unlike the redirect flow's id_token, this one
 * is relayed by the client app, so the signature is verified against
 * Apple's published JWKS and the audience against our app ids: the native
 * app's bundle id (APPLE_SIGNIN_BUNDLE_ID) or the Services ID.
 */
export async function verifyAppleIdentityToken(identityToken: string): Promise<OAuthUserProfile> {
    const servicesId = process.env.APPLE_SIGNIN_SERVICES_ID ?? ""
    const bundleId = process.env.APPLE_SIGNIN_BUNDLE_ID ?? ""
    const audiences = [bundleId, servicesId].filter((value) => value !== "")
    if (audiences.length === 0) {
        throw new RpcError("FAILED_PRECONDITION", "Apple sign-in is not configured for this environment.")
    }
    let claims
    try {
        const { payload } = await jwtVerify(identityToken, appleJwks, {
            issuer: APPLE_ISSUER,
            audience: audiences,
        })
        claims = payload
    } catch (error) {
        throw new RpcError("UNAUTHENTICATED", "Invalid Apple identity token.", { cause: error })
    }
    return profileFromIdTokenClaims("apple", "Apple", claims)
}

// ---- Standard OAuth2/OIDC factory ----------------------------------------

/** What a fetch-based provider's profile endpoint resolves to, pre-normalization. */
interface FetchedProfile {
    subject: string
    email: string | undefined
    emailVerified: boolean
    displayName?: string
}

interface StandardOAuth2Config {
    key: OAuthProviderKey
    displayName: string
    /** Credentials live in `<envPrefix>_CLIENT_ID` / `<envPrefix>_CLIENT_SECRET`. */
    envPrefix: string
    authorizeUrl: string
    tokenUrl: string
    scope: string
    /** Extra fixed params for the authorize URL (e.g. Discord's prompt). */
    authorizeParams?: Record<string, string>
    /**
     * PKCE (S256). X mandates it even for confidential clients. The
     * code_verifier is derived from the signed state JWT (HMAC with the auth
     * secret), so /start stays stateless and the callback recomputes it from
     * the state the provider echoes back. For a confidential client this is
     * the provider's mechanical requirement, not the public-client
     * code-interception defense — the client secret remains the trust anchor.
     */
    usePkce?: boolean
    /** Token-endpoint client auth: credentials in the form body (default) or a Basic header (X). */
    tokenAuth?: "body" | "basic"
    /** How the token response becomes a profile: decode its OIDC id_token, or fetch a profile endpoint. */
    profile:
        | { source: "id_token" }
        | { source: "fetch"; fetchProfile: (accessToken: string) => Promise<FetchedProfile> }
}

function standardClientCredentials(config: StandardOAuth2Config): {
    clientId: string
    clientSecret: string
} {
    const clientId = process.env[`${config.envPrefix}_CLIENT_ID`] ?? ""
    const clientSecret = process.env[`${config.envPrefix}_CLIENT_SECRET`] ?? ""
    if (clientId === "" || clientSecret === "") {
        throw new RpcError(
            "FAILED_PRECONDITION",
            `${config.displayName} sign-in is not configured for this environment.`,
        )
    }
    return { clientId, clientSecret }
}

/** The PKCE code_verifier for a flow, recomputable from its signed state JWT. */
function pkceVerifierFromState(state: string | undefined): string {
    if (state === undefined || state === "") {
        throw new RpcError("INVALID_ARGUMENT", "Missing OAuth state.")
    }
    return createHmac("sha256", Buffer.from(builtinAuthJwtSecret())).update(state).digest("base64url")
}

function pkceChallenge(verifier: string): string {
    return createHash("sha256").update(verifier).digest("base64url")
}

export function standardOAuth2Provider(config: StandardOAuth2Config): OAuthProviderDefinition {
    return {
        displayName: config.displayName,

        isConfigured(): boolean {
            return (
                Boolean(process.env[`${config.envPrefix}_CLIENT_ID`]) &&
                Boolean(process.env[`${config.envPrefix}_CLIENT_SECRET`])
            )
        },

        async buildAuthorizeUrl(params): Promise<URL> {
            const { clientId } = standardClientCredentials(config)
            const authorizeUrl = new URL(config.authorizeUrl)
            authorizeUrl.searchParams.set("client_id", clientId)
            authorizeUrl.searchParams.set("redirect_uri", params.redirectUri)
            authorizeUrl.searchParams.set("response_type", "code")
            authorizeUrl.searchParams.set("scope", config.scope)
            authorizeUrl.searchParams.set("state", params.state)
            for (const [name, value] of Object.entries(config.authorizeParams ?? {})) {
                authorizeUrl.searchParams.set(name, value)
            }
            if (config.usePkce) {
                const verifier = pkceVerifierFromState(params.state)
                authorizeUrl.searchParams.set("code_challenge", pkceChallenge(verifier))
                authorizeUrl.searchParams.set("code_challenge_method", "S256")
            }
            return authorizeUrl
        },

        async exchangeCode(params): Promise<OAuthUserProfile> {
            const { clientId, clientSecret } = standardClientCredentials(config)
            const body = new URLSearchParams({
                code: params.code,
                redirect_uri: params.redirectUri,
                grant_type: "authorization_code",
            })
            const headers: Record<string, string> = {
                "Content-Type": "application/x-www-form-urlencoded",
                // GitHub returns form-encoded unless JSON is requested.
                Accept: "application/json",
            }
            if (config.tokenAuth === "basic") {
                headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`
            } else {
                body.set("client_id", clientId)
                body.set("client_secret", clientSecret)
            }
            if (config.usePkce) {
                body.set("code_verifier", pkceVerifierFromState(params.state))
            }
            const response = await fetch(config.tokenUrl, { method: "POST", headers, body })
            if (!response.ok) {
                const detail = await response.text()
                throw new RpcError(
                    "UNAUTHENTICATED",
                    `${config.displayName} code exchange failed: ${detail.slice(0, 200)}`,
                )
            }
            const tokenBody = (await response.json()) as { access_token?: string; id_token?: string }
            if (config.profile.source === "id_token") {
                if (typeof tokenBody.id_token !== "string") {
                    throw new RpcError(
                        "UNAUTHENTICATED",
                        `${config.displayName} response is missing the id_token.`,
                    )
                }
                // Same trust anchor as Google: the id_token arrived over TLS
                // from the provider's token endpoint for our client secret.
                return profileFromIdTokenClaims(config.key, config.displayName, decodeJwt(tokenBody.id_token))
            }
            if (typeof tokenBody.access_token !== "string") {
                throw new RpcError(
                    "UNAUTHENTICATED",
                    `${config.displayName} response is missing the access_token.`,
                )
            }
            const fetched = await config.profile.fetchProfile(tokenBody.access_token)
            return normalizeFetchedProfile(config.key, config.displayName, fetched)
        },
    }
}

/**
 * Normalizes a profile-endpoint result the same way id_token claims are:
 * a stable subject and an email are required — the linking logic keys on
 * them — so providers where the user can withhold email fail loudly here.
 */
function normalizeFetchedProfile(
    provider: OAuthProviderKey,
    displayName: string,
    fetched: FetchedProfile,
): OAuthUserProfile {
    const email = fetched.email?.trim().toLowerCase()
    if (fetched.subject === "" || email === undefined || email === "") {
        throw new RpcError(
            "UNAUTHENTICATED",
            `${displayName} did not share an email address; an email is required to sign in.`,
        )
    }
    return {
        provider,
        subject: fetched.subject,
        email,
        emailVerified: fetched.emailVerified,
        displayName: fetched.displayName,
    }
}

async function fetchProviderJson<T>(
    url: string,
    accessToken: string,
    displayName: string,
    extraHeaders?: Record<string, string>,
): Promise<T> {
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, ...extraHeaders },
    })
    if (!response.ok) {
        const detail = await response.text()
        throw new RpcError("UNAUTHENTICATED", `${displayName} profile fetch failed: ${detail.slice(0, 200)}`)
    }
    return (await response.json()) as T
}

// ---- GitHub ---------------------------------------------------------------

const githubProvider = standardOAuth2Provider({
    key: "github",
    displayName: "GitHub",
    envPrefix: "GITHUB_SIGNIN",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    profile: {
        source: "fetch",
        async fetchProfile(accessToken): Promise<FetchedProfile> {
            // GitHub's API requires a User-Agent on every request.
            const headers = { "User-Agent": "repobot-auth", Accept: "application/vnd.github+json" }
            const user = await fetchProviderJson<{ id: number; name?: string; login?: string }>(
                "https://api.github.com/user",
                accessToken,
                "GitHub",
                headers,
            )
            // The profile email field can be unset or unverified; the emails
            // endpoint is authoritative. Prefer the primary verified address.
            const emails = await fetchProviderJson<{ email: string; primary: boolean; verified: boolean }[]>(
                "https://api.github.com/user/emails",
                accessToken,
                "GitHub",
                headers,
            )
            const best =
                emails.find((entry) => entry.primary && entry.verified) ??
                emails.find((entry) => entry.verified)
            return {
                subject: String(user.id),
                email: best?.email,
                emailVerified: best !== undefined,
                displayName: user.name ?? user.login,
            }
        },
    },
})

// ---- Facebook -------------------------------------------------------------

const facebookProvider = standardOAuth2Provider({
    key: "facebook",
    displayName: "Facebook",
    envPrefix: "FACEBOOK_SIGNIN",
    authorizeUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scope: "email public_profile",
    profile: {
        source: "fetch",
        async fetchProfile(accessToken): Promise<FetchedProfile> {
            const me = await fetchProviderJson<{ id: string; name?: string; email?: string }>(
                "https://graph.facebook.com/v19.0/me?fields=id,name,email",
                accessToken,
                "Facebook",
            )
            return {
                subject: me.id,
                email: me.email,
                // Facebook only returns reachable, confirmed addresses (the
                // user can withhold email entirely — then sign-in fails in
                // normalizeFetchedProfile).
                emailVerified: me.email !== undefined,
                displayName: me.name,
            }
        },
    },
})

// ---- Discord --------------------------------------------------------------

const discordProvider = standardOAuth2Provider({
    key: "discord",
    displayName: "Discord",
    envPrefix: "DISCORD_SIGNIN",
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scope: "identify email",
    profile: {
        source: "fetch",
        async fetchProfile(accessToken): Promise<FetchedProfile> {
            const me = await fetchProviderJson<{
                id: string
                username?: string
                global_name?: string
                email?: string
                verified?: boolean
            }>("https://discord.com/api/users/@me", accessToken, "Discord")
            return {
                subject: me.id,
                email: me.email,
                emailVerified: me.verified === true,
                displayName: me.global_name ?? me.username,
            }
        },
    },
})

// ---- X (Twitter) ----------------------------------------------------------

// X requires PKCE on every OAuth2 flow and Basic auth at the token endpoint.
// Email needs the users.email scope, the confirmed_email user field, and
// "Request email from users" enabled on the X developer-portal app.
const xProvider = standardOAuth2Provider({
    key: "x",
    displayName: "X",
    envPrefix: "X_SIGNIN",
    authorizeUrl: "https://x.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    scope: "users.read users.email tweet.read",
    usePkce: true,
    tokenAuth: "basic",
    profile: {
        source: "fetch",
        async fetchProfile(accessToken): Promise<FetchedProfile> {
            const me = await fetchProviderJson<{
                data?: { id: string; name?: string; username?: string; confirmed_email?: string }
            }>("https://api.x.com/2/users/me?user.fields=confirmed_email", accessToken, "X")
            return {
                subject: me.data?.id ?? "",
                email: me.data?.confirmed_email,
                // confirmed_email is, by definition, confirmed.
                emailVerified: me.data?.confirmed_email !== undefined,
                displayName: me.data?.name ?? me.data?.username,
            }
        },
    },
})

// ---- LinkedIn -------------------------------------------------------------

// LinkedIn is plain OIDC since 2023: the token response carries an id_token
// with sub, email, email_verified, and name.
const linkedinProvider = standardOAuth2Provider({
    key: "linkedin",
    displayName: "LinkedIn",
    envPrefix: "LINKEDIN_SIGNIN",
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scope: "openid profile email",
    profile: { source: "id_token" },
})

// ---- Shared -------------------------------------------------------------

/**
 * Normalizes OpenID id_token claims into the profile the linking logic
 * consumes. Apple encodes email_verified as the string "true"; Google uses
 * a boolean — both count.
 */
function profileFromIdTokenClaims(
    provider: OAuthProviderKey,
    displayName: string,
    claims: Record<string, unknown>,
): OAuthUserProfile {
    const subject = claims.sub
    const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : undefined
    if (typeof subject !== "string" || subject.length === 0 || email === undefined || email === "") {
        throw new RpcError("UNAUTHENTICATED", `${displayName} id_token is missing required claims.`)
    }
    return {
        provider,
        subject,
        email,
        emailVerified: claims.email_verified === true || claims.email_verified === "true",
        displayName: typeof claims.name === "string" ? claims.name : undefined,
    }
}

export const oauthProviders: Record<OAuthProviderKey, OAuthProviderDefinition> = {
    google: googleProvider,
    apple: appleProvider,
    github: githubProvider,
    facebook: facebookProvider,
    discord: discordProvider,
    x: xProvider,
    linkedin: linkedinProvider,
}
