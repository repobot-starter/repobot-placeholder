import { jwtVerify, SignJWT } from "jose"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"

/**
 * Short-lived capability tokens for the storage function's local-mode
 * surfaces: `PUT /upload` (scope "upload") and PRIVATE `GET /file/<id>`
 * (scope "download"). Each token is bound to one upload id and one scope,
 * so a leaked download link can never write and an upload URL can never
 * read someone else's file.
 *
 * Tokens are HS256 JWTs signed with the environment's existing secret —
 * AUTH_JWT_SECRET when the deploy carries it, else the sandbox's
 * LOCAL_AUTH_SECRET — so the storage kernel introduces no new secret.
 */

export type StorageTokenScope = "upload" | "download"

export interface StorageTokenClaims {
    uploadId: string
    scope: StorageTokenScope
}

export async function mintStorageToken(
    claims: StorageTokenClaims,
    expiresInSeconds: number,
): Promise<string> {
    return await new SignJWT({ scope: claims.scope })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(claims.uploadId)
        .setIssuer("storage")
        .setIssuedAt()
        .setExpirationTime(`${expiresInSeconds}s`)
        .sign(storageTokenSecret())
}

export async function verifyStorageToken(token: string): Promise<StorageTokenClaims> {
    try {
        const { payload } = await jwtVerify(token, storageTokenSecret(), {
            algorithms: ["HS256"],
            issuer: "storage",
        })
        const scope = payload.scope
        if ((scope !== "upload" && scope !== "download") || typeof payload.sub !== "string") {
            throw new RpcError("UNAUTHENTICATED", "Malformed storage token.")
        }
        return { uploadId: payload.sub, scope }
    } catch (error) {
        if (error instanceof RpcError) throw error
        throw new RpcError("UNAUTHENTICATED", "Invalid or expired storage token.", { cause: error })
    }
}

function storageTokenSecret(): Uint8Array {
    const env = validatedEnv()
    const secretHex = firstNonEmpty(env.AUTH_JWT_SECRET, env.LOCAL_AUTH_SECRET)
    if (secretHex === undefined) {
        throw new RpcError(
            "FAILED_PRECONDITION",
            "Storage tokens require AUTH_JWT_SECRET (deployed) or LOCAL_AUTH_SECRET " +
                "(run `npm run bootstrap:env`).",
        )
    }
    return Buffer.from(secretHex, "hex")
}

function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
    return values.find((value) => value !== undefined && value !== "")
}
