import { jwtVerify, type JWTPayload } from "jose"
import { isEmulator, isTest } from "../../Utils/Environment.js"
import { RpcError } from "../../Utils/RpcError.js"
import { guestEmailForSubject, isAnonymousClaim } from "./GuestIdentity.js"

/**
 * The identity claims extracted from a verified bearer token.
 */
export interface VerifiedToken {
    authSubject: string
    email: string
}

export interface TokenVerifier {
    verify(token: string): Promise<VerifiedToken>
}

/**
 * Verifies HS256 tokens signed with LOCAL_AUTH_SECRET (issued by
 * `npm run bootstrap:env` for local development).
 *
 * SAFETY: this verifier only exists for the emulator and tests. Constructing
 * it anywhere else throws, so a deployment misconfigured with AUTH_MODE=local
 * crashes at boot instead of accepting locally-forgeable tokens.
 */
export class LocalTokenVerifier implements TokenVerifier {
    private readonly secret: Uint8Array

    constructor() {
        if (!isEmulator() && !isTest()) {
            throw new Error(
                "AUTH_MODE=local is only allowed inside the Firebase emulator or tests. " +
                    "Deployed environments must set AUTH_MODE=builtin (see env.manifest.json).",
            )
        }

        const secretHex = process.env.LOCAL_AUTH_SECRET
        if (secretHex === undefined || secretHex === "") {
            throw new Error(
                "LOCAL_AUTH_SECRET is not set. Run `npm run bootstrap:env` at the repo root " +
                    "to generate firebase/functions/.env.local.",
            )
        }
        this.secret = Buffer.from(secretHex, "hex")
    }

    async verify(token: string): Promise<VerifiedToken> {
        try {
            const { payload } = await jwtVerify(token, this.secret, { algorithms: ["HS256"] })
            return verifiedTokenFromClaims(payload)
        } catch (error) {
            if (error instanceof RpcError) throw error
            throw new RpcError("UNAUTHENTICATED", "Invalid local auth token.", { cause: error })
        }
    }
}

/**
 * Verifies JWTs minted by the built-in auth service (see
 * BuiltinAuth/AuthTokenService.ts). Both sides share the per-environment
 * AUTH_JWT_SECRET, so verification is in-process — no network round trip.
 */
export class BuiltinTokenVerifier implements TokenVerifier {
    private readonly secret: Uint8Array

    constructor() {
        this.secret = builtinAuthJwtSecret()
    }

    async verify(token: string): Promise<VerifiedToken> {
        try {
            const { payload } = await jwtVerify(token, this.secret, { algorithms: ["HS256"] })
            return verifiedTokenFromClaims(payload)
        } catch (error) {
            if (error instanceof RpcError) throw error
            throw new RpcError("UNAUTHENTICATED", "Invalid auth token.", { cause: error })
        }
    }
}

/**
 * The HS256 key AUTH_JWT_SECRET carries (hex-encoded). Shared by the minting
 * side (AuthTokenService) and the verifying side (BuiltinTokenVerifier).
 */
export function builtinAuthJwtSecret(): Uint8Array {
    const secretHex = process.env.AUTH_JWT_SECRET
    if (secretHex === undefined || secretHex === "") {
        throw new RpcError(
            "FAILED_PRECONDITION",
            "AUTH_JWT_SECRET is not set; it is required when AUTH_MODE=builtin. " +
                "Deploys with the AUTH capability receive it from the platform.",
        )
    }
    return Buffer.from(secretHex, "hex")
}

function verifiedTokenFromClaims(payload: JWTPayload): VerifiedToken {
    const sub = payload.sub
    const email = payload.email
    if (typeof sub !== "string" || sub.length === 0) {
        throw new RpcError("UNAUTHENTICATED", "Token is missing the sub claim.")
    }
    if (typeof email === "string" && email.length > 0) {
        return { authSubject: sub, email }
    }
    // Anonymous (guest) sessions carry no email; key them by a synthetic one.
    if (isAnonymousClaim(payload.is_anonymous)) {
        return { authSubject: sub, email: guestEmailForSubject(sub) }
    }
    throw new RpcError("UNAUTHENTICATED", "Token is missing the email claim.")
}

let tokenVerifier: TokenVerifier | undefined

/**
 * Returns the process-wide token verifier for the configured AUTH_MODE.
 */
export function getTokenVerifier(): TokenVerifier {
    if (tokenVerifier === undefined) {
        const authMode = process.env.AUTH_MODE ?? "builtin"
        switch (authMode) {
            case "local":
                tokenVerifier = new LocalTokenVerifier()
                break
            case "builtin":
                tokenVerifier = new BuiltinTokenVerifier()
                break
            default:
                throw new Error(`Unknown AUTH_MODE "${authMode}"; expected "local" or "builtin".`)
        }
    }
    return tokenVerifier
}

/** Test-only: clears the cached verifier so suites can switch AUTH_MODE. */
export function resetTokenVerifierForTests(): void {
    tokenVerifier = undefined
}
