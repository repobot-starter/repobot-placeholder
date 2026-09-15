/**
 * Minimal APNs client over token-based auth (no third-party dependency):
 * an ES256 provider token minted from the customer's .p8 key (node:crypto)
 * and one HTTP/2 request per notification (node:http2 — APNs does not
 * speak HTTP/1.1). Provider tokens are cached and reused for ~50 minutes;
 * Apple requires refreshing between 20 and 60.
 */

import { createHash, createSign } from "node:crypto"
import { connect } from "node:http2"
import { PushNotification } from "./PushWrapper.js"

export interface ApnsCredentials {
    teamId: string
    keyId: string
    /** The .p8 file contents: raw PEM or base64-encoded PEM. */
    privateKey: string
    bundleId: string
    environment: "production" | "sandbox"
}

export type ApnsSendOutcome = "SENT" | "TOKEN_GONE"

const PROVIDER_TOKEN_TTL_MS = 50 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10_000

let tokenCache: { token: string; mintedAt: number; credentialsHash: string } | undefined

export async function sendApnsNotification(
    credentials: ApnsCredentials,
    deviceToken: string,
    notification: PushNotification,
): Promise<ApnsSendOutcome> {
    const host =
        credentials.environment === "sandbox"
            ? "https://api.sandbox.push.apple.com"
            : "https://api.push.apple.com"
    const providerToken = mintProviderToken(credentials)
    const body = JSON.stringify({
        aps: {
            alert: { title: notification.title, body: notification.body },
            sound: "default",
        },
    })
    const response = await http2Post({
        origin: host,
        path: `/3/device/${encodeURIComponent(deviceToken)}`,
        headers: {
            authorization: `bearer ${providerToken}`,
            "apns-topic": credentials.bundleId,
            "apns-push-type": "alert",
            "apns-priority": "10",
            "content-type": "application/json",
        },
        body,
    })
    if (response.status === 200) {
        return "SENT"
    }
    // 410 = the device token is no longer active for the topic. 400 with
    // reason BadDeviceToken/DeviceTokenNotForTopic means the stored token
    // can never work — same pruning treatment.
    const reason = parseApnsReason(response.body)
    if (
        response.status === 410 ||
        reason === "BadDeviceToken" ||
        reason === "DeviceTokenNotForTopic" ||
        reason === "Unregistered"
    ) {
        return "TOKEN_GONE"
    }
    throw new Error(`apns_send_failed_${response.status}${reason ? `_${reason}` : ""}`)
}

/**
 * The ES256 provider token (JWT): header {alg, kid}, payload {iss, iat}.
 * Cached per credential set — a different key invalidates the cache.
 */
function mintProviderToken(credentials: ApnsCredentials): string {
    const credentialsHash = createHash("sha256")
        .update(`${credentials.teamId}:${credentials.keyId}:${credentials.privateKey}`)
        .digest("hex")
    const now = Date.now()
    if (
        tokenCache &&
        tokenCache.credentialsHash === credentialsHash &&
        now - tokenCache.mintedAt < PROVIDER_TOKEN_TTL_MS
    ) {
        return tokenCache.token
    }
    const header = base64Url(JSON.stringify({ alg: "ES256", kid: credentials.keyId }))
    const payload = base64Url(JSON.stringify({ iss: credentials.teamId, iat: Math.floor(now / 1000) }))
    const signer = createSign("SHA256")
    signer.update(`${header}.${payload}`)
    const signature = signer
        .sign({ key: normalizePem(credentials.privateKey), dsaEncoding: "ieee-p1363" })
        .toString("base64url")
    const token = `${header}.${payload}.${signature}`
    tokenCache = { token, mintedAt: now, credentialsHash }
    return token
}

/** Accepts the .p8 contents raw or base64-encoded (the staged env form). */
export function normalizePem(privateKey: string): string {
    const trimmed = privateKey.trim()
    if (trimmed.includes("-----BEGIN")) {
        return trimmed
    }
    return Buffer.from(trimmed, "base64").toString("utf8")
}

function parseApnsReason(body: string): string | undefined {
    try {
        const parsed = JSON.parse(body) as { reason?: unknown }
        return typeof parsed.reason === "string" ? parsed.reason : undefined
    } catch {
        return undefined
    }
}

function base64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url")
}

/** One request per send: connect, POST, close. APNs handles this fine at
 * kernel volumes; connection pooling is a scale problem for later. */
function http2Post(request: {
    origin: string
    path: string
    headers: Record<string, string>
    body: string
}): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
        const client = connect(request.origin)
        const timeout = setTimeout(() => {
            client.close()
            reject(new Error("apns_request_timeout"))
        }, REQUEST_TIMEOUT_MS)
        client.on("error", (error) => {
            clearTimeout(timeout)
            reject(error)
        })
        const stream = client.request({
            ":method": "POST",
            ":path": request.path,
            ...request.headers,
        })
        let status = 0
        let body = ""
        stream.on("response", (headers) => {
            status = Number(headers[":status"] ?? 0)
        })
        stream.setEncoding("utf8")
        stream.on("data", (chunk) => {
            body += chunk
        })
        stream.on("end", () => {
            clearTimeout(timeout)
            client.close()
            resolve({ status, body })
        })
        stream.on("error", (error) => {
            clearTimeout(timeout)
            client.close()
            reject(error)
        })
        stream.end(request.body)
    })
}
