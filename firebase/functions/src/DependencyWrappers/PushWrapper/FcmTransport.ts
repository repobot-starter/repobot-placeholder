/**
 * Minimal FCM HTTP v1 client (no firebase-admin dependency): an OAuth2
 * access token minted from the customer's Firebase service account
 * (RS256 JWT → Google's token endpoint, node:crypto + fetch) and one
 * messages:send call per notification. Access tokens are cached until
 * five minutes before expiry.
 */

import { createHash, createSign } from "node:crypto"
import { PushNotification } from "./PushWrapper.js"

export interface FcmServiceAccount {
    projectId: string
    clientEmail: string
    privateKey: string
    tokenUri: string
}

export type FcmSendOutcome = "SENT" | "TOKEN_GONE"

const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"

let tokenCache: { accessToken: string; expiresAt: number; credentialsHash: string } | undefined

/**
 * Parses the staged FCM_SERVICE_ACCOUNT value (service-account JSON,
 * base64-encoded; raw JSON also accepted). Undefined when the value is
 * malformed or missing a required field — the channel then reports
 * not-configured instead of erroring mid-send.
 */
export function parseFcmServiceAccount(raw: string): FcmServiceAccount | undefined {
    try {
        const decoded = raw.trim().startsWith("{")
            ? raw.trim()
            : Buffer.from(raw.trim(), "base64").toString("utf8")
        const parsed = JSON.parse(decoded) as {
            project_id?: unknown
            client_email?: unknown
            private_key?: unknown
            token_uri?: unknown
        }
        if (
            typeof parsed.project_id !== "string" ||
            parsed.project_id === "" ||
            typeof parsed.client_email !== "string" ||
            parsed.client_email === "" ||
            typeof parsed.private_key !== "string" ||
            parsed.private_key === ""
        ) {
            return undefined
        }
        return {
            projectId: parsed.project_id,
            clientEmail: parsed.client_email,
            privateKey: parsed.private_key,
            tokenUri:
                typeof parsed.token_uri === "string" && parsed.token_uri !== ""
                    ? parsed.token_uri
                    : "https://oauth2.googleapis.com/token",
        }
    } catch {
        return undefined
    }
}

export async function sendFcmNotification(
    account: FcmServiceAccount,
    deviceToken: string,
    notification: PushNotification,
): Promise<FcmSendOutcome> {
    const accessToken = await mintAccessToken(account)
    const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.projectId)}/messages:send`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: {
                    token: deviceToken,
                    notification: { title: notification.title, body: notification.body },
                },
            }),
        },
    )
    if (response.ok) {
        return "SENT"
    }
    const body = await response.text()
    // 404 UNREGISTERED = the token is gone (app uninstalled, token rotated);
    // 400 with INVALID_ARGUMENT on the token field reads the same for a
    // stored registration that can never work.
    if (response.status === 404 || body.includes("UNREGISTERED")) {
        return "TOKEN_GONE"
    }
    throw new Error(`fcm_send_failed_${response.status}:${body.slice(0, 300)}`)
}

/** The OAuth2 service-account flow: signed JWT exchanged for a bearer token. */
async function mintAccessToken(account: FcmServiceAccount): Promise<string> {
    const credentialsHash = createHash("sha256")
        .update(`${account.clientEmail}:${account.privateKey}`)
        .digest("hex")
    const now = Date.now()
    if (
        tokenCache &&
        tokenCache.credentialsHash === credentialsHash &&
        tokenCache.expiresAt - now > TOKEN_REFRESH_MARGIN_MS
    ) {
        return tokenCache.accessToken
    }
    const issuedAt = Math.floor(now / 1000)
    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
    const payload = base64Url(
        JSON.stringify({
            iss: account.clientEmail,
            scope: FCM_SCOPE,
            aud: account.tokenUri,
            iat: issuedAt,
            exp: issuedAt + 3600,
        }),
    )
    const signer = createSign("RSA-SHA256")
    signer.update(`${header}.${payload}`)
    const signature = signer.sign(account.privateKey).toString("base64url")
    const assertion = `${header}.${payload}.${signature}`

    const response = await fetch(account.tokenUri, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion,
        }).toString(),
    })
    if (!response.ok) {
        throw new Error(`fcm_token_mint_failed_${response.status}`)
    }
    const tokenBody = (await response.json()) as {
        access_token?: string
        expires_in?: number
    }
    if (!tokenBody.access_token) {
        throw new Error("fcm_token_mint_missing_access_token")
    }
    tokenCache = {
        accessToken: tokenBody.access_token,
        expiresAt: now + (tokenBody.expires_in ?? 3600) * 1000,
        credentialsHash,
    }
    return tokenBody.access_token
}

function base64Url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url")
}
