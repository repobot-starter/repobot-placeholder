import crypto from "node:crypto"

/**
 * RFC 6238 TOTP (SHA-1, 6 digits, 30-second step) — the profile every
 * authenticator app implements. Implemented on node:crypto so the kernel
 * takes no new dependency for it.
 */

export const TOTP_DIGITS = 6
export const TOTP_STEP_SECONDS = 30
/** Steps of clock skew tolerated on verify (±1 step = ±30 s). */
export const TOTP_SKEW_STEPS = 1

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/** A fresh 160-bit secret, base32-encoded (the format otpauth:// carries). */
export function generateTotpSecret(): string {
    return base32Encode(crypto.randomBytes(20))
}

/** The TOTP code for a secret at a moment in time. */
export function totpCode(secretBase32: string, atMs = Date.now()): string {
    const counter = Math.floor(atMs / 1000 / TOTP_STEP_SECONDS)
    return hotp(base32Decode(secretBase32), counter)
}

/** Constant-time verify with ±TOTP_SKEW_STEPS steps of clock tolerance. */
export function verifyTotpCode(secretBase32: string, code: string, atMs = Date.now()): boolean {
    if (!/^\d{6}$/.test(code)) {
        return false
    }
    const key = base32Decode(secretBase32)
    const counter = Math.floor(atMs / 1000 / TOTP_STEP_SECONDS)
    let matched = false
    for (let offset = -TOTP_SKEW_STEPS; offset <= TOTP_SKEW_STEPS; offset++) {
        const candidate = hotp(key, counter + offset)
        // Check every window (no early exit) to keep timing uniform.
        if (timingSafeEqualString(candidate, code)) {
            matched = true
        }
    }
    return matched
}

/**
 * The otpauth:// URI authenticator apps enroll from (QR contents on web;
 * opened directly on iOS/Android).
 */
export function buildOtpauthUri(params: {
    secretBase32: string
    accountName: string
    issuer: string
}): string {
    const label = `${encodeURIComponent(params.issuer)}:${encodeURIComponent(params.accountName)}`
    const query = new URLSearchParams({
        secret: params.secretBase32,
        issuer: params.issuer,
        algorithm: "SHA1",
        digits: String(TOTP_DIGITS),
        period: String(TOTP_STEP_SECONDS),
    })
    return `otpauth://totp/${label}?${query.toString()}`
}

/** RFC 4226 HOTP with dynamic truncation. */
function hotp(key: Buffer, counter: number): string {
    const counterBuffer = Buffer.alloc(8)
    counterBuffer.writeBigUInt64BE(BigInt(counter))
    const digest = crypto.createHmac("sha1", key).update(counterBuffer).digest()
    const offset = digest[digest.length - 1] & 0x0f
    const binary =
        ((digest[offset] & 0x7f) << 24) |
        (digest[offset + 1] << 16) |
        (digest[offset + 2] << 8) |
        digest[offset + 3]
    return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0")
}

function base32Encode(buffer: Buffer): string {
    let bits = 0
    let value = 0
    let output = ""
    for (const byte of buffer) {
        value = (value << 8) | byte
        bits += 8
        while (bits >= 5) {
            output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
            bits -= 5
        }
    }
    if (bits > 0) {
        output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
    }
    return output
}

function base32Decode(encoded: string): Buffer {
    const clean = encoded.toUpperCase().replace(/=+$/, "")
    let bits = 0
    let value = 0
    const bytes: number[] = []
    for (const char of clean) {
        const index = BASE32_ALPHABET.indexOf(char)
        if (index === -1) {
            throw new Error("Invalid base32 character in TOTP secret.")
        }
        value = (value << 5) | index
        bits += 5
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xff)
            bits -= 8
        }
    }
    return Buffer.from(bytes)
}

function timingSafeEqualString(a: string, b: string): boolean {
    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)
    return bufferA.length === bufferB.length && crypto.timingSafeEqual(bufferA, bufferB)
}
