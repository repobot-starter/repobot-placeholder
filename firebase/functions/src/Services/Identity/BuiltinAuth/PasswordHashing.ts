import crypto from "node:crypto"

/**
 * Password hashing for the built-in auth service: scrypt from node:crypto —
 * memory-hard, no native/npm dependency. Parameters are encoded into the
 * stored string so they can be raised later without invalidating existing
 * hashes.
 *
 * Format: "scrypt$N$r$p$<salt base64>$<hash base64>"
 */
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LENGTH = 32
const SALT_LENGTH = 16

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(SALT_LENGTH)
    const hash = await scrypt(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P)
    return [
        "scrypt",
        String(SCRYPT_N),
        String(SCRYPT_R),
        String(SCRYPT_P),
        salt.toString("base64"),
        hash.toString("base64"),
    ].join("$")
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split("$")
    if (parts.length !== 6 || parts[0] !== "scrypt") {
        return false
    }
    const [, nRaw, rRaw, pRaw, saltBase64, hashBase64] = parts
    const salt = Buffer.from(saltBase64, "base64")
    const expected = Buffer.from(hashBase64, "base64")
    const actual = await scrypt(password, salt, Number(nRaw), Number(rRaw), Number(pRaw))
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        crypto.scrypt(
            password,
            salt,
            KEY_LENGTH,
            { N: n, r, p, maxmem: 128 * n * r * 2 },
            (error, derivedKey) => {
                if (error) reject(error)
                else resolve(derivedKey)
            },
        )
    })
}

/** SHA-256 hex digest, used to store OTP codes and refresh tokens at rest. */
export function sha256Hex(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex")
}
