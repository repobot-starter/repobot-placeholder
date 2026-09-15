import crypto from "node:crypto"
import { RpcError } from "../../Utils/RpcError.js"

/** Reject webhook deliveries whose signature timestamp is older than this. */
const DEFAULT_TOLERANCE_SECONDS = 5 * 60

/**
 * Verifies a Stripe webhook signature (the `stripe-signature` header) against
 * the raw request body, implementing Stripe's v1 scheme directly so the
 * kernel carries no Stripe SDK dependency: the header is
 * `t=<unix>,v1=<hex hmac>` (possibly several v1 entries during secret
 * rotation) and the signed payload is `<t>.<raw body>` under HMAC-SHA256.
 *
 * Throws PERMISSION_DENIED when the signature is missing, malformed, stale,
 * or does not match — callers must not process the event in that case.
 */
export function verifyStripeWebhookSignature(request: {
    /** The exact raw request body bytes Stripe signed. */
    payload: string
    /** The `stripe-signature` header value. */
    signatureHeader: string | undefined
    /** The endpoint's signing secret ("whsec_..."). */
    secret: string
    nowEpochSeconds?: number
    toleranceSeconds?: number
}): void {
    const { payload, signatureHeader, secret } = request
    if (signatureHeader === undefined || signatureHeader === "") {
        throw new RpcError("PERMISSION_DENIED", "Missing stripe-signature header.")
    }

    let timestamp: number | undefined
    const candidateSignatures: string[] = []
    for (const element of signatureHeader.split(",")) {
        const [key, value] = element.split("=", 2)
        if (key?.trim() === "t" && value !== undefined) {
            timestamp = Number(value)
        }
        if (key?.trim() === "v1" && value !== undefined) {
            candidateSignatures.push(value)
        }
    }
    if (timestamp === undefined || !Number.isFinite(timestamp) || candidateSignatures.length === 0) {
        throw new RpcError("PERMISSION_DENIED", "Malformed stripe-signature header.")
    }

    const now = request.nowEpochSeconds ?? Math.floor(Date.now() / 1000)
    const tolerance = request.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS
    if (Math.abs(now - timestamp) > tolerance) {
        throw new RpcError("PERMISSION_DENIED", "Stripe webhook signature timestamp is outside tolerance.")
    }

    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${payload}`, "utf8")
        .digest("hex")
    const expectedBuffer = Buffer.from(expected, "utf8")
    const matches = candidateSignatures.some((candidate) => {
        const candidateBuffer = Buffer.from(candidate, "utf8")
        return (
            candidateBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(candidateBuffer, expectedBuffer)
        )
    })
    if (!matches) {
        throw new RpcError("PERMISSION_DENIED", "Stripe webhook signature does not match.")
    }
}

/** Builds a valid `stripe-signature` header; test-only helper. */
export function buildStripeSignatureHeaderForTests(request: {
    payload: string
    secret: string
    timestampEpochSeconds: number
}): string {
    const signature = crypto
        .createHmac("sha256", request.secret)
        .update(`${request.timestampEpochSeconds}.${request.payload}`, "utf8")
        .digest("hex")
    return `t=${request.timestampEpochSeconds},v1=${signature}`
}
