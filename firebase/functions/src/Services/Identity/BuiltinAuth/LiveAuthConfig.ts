/**
 * Live auth config: the platform maintains a per-environment Secret Manager
 * secret (named by the AUTH_EMAIL_CONFIG_SECRET env var — the name is
 * historical; the secret carries the whole live auth config) holding the
 * current email template overrides, sender, and enabled sign-in methods,
 * and updates it the moment any of them change on the dashboard. Reading it
 * here at request time — instead of only the env values baked in at deploy —
 * makes those changes apply within the cache TTL, no redeploy.
 *
 * Sandbox workspaces have no Secret Manager access, so the platform gives
 * them the same payload through a local file instead: AUTH_CONFIG_FILE
 * names a JSON file the workspace runtime writes at boot and overwrites on
 * every dashboard change. The file source wins when both are set (it can
 * only be present where the platform provisioned it).
 *
 * Fail-safe by construction: any fetch or parse problem resolves to
 * undefined and callers fall back to the deploy-time env config, which is
 * exactly the pre-live behavior. Failures are cached for the same TTL so an
 * outage costs one attempt per window, not one per request.
 */

import { readFile, stat } from "node:fs/promises"
import { AuthEmailTemplate, AuthEmailType } from "./AuthEmailTemplates.js"

export interface LiveAuthSender {
    email: string
    name: string
}

/**
 * Every method key the kernel can render and wire; mirrors web/core's
 * AuthMethods.ts. Used to validate the live methods list so a malformed
 * secret can never break sign-in.
 */
export const knownAuthMethodKeys = [
    "email-code",
    "password",
    "google",
    "apple",
    "github",
    "facebook",
    "discord",
    "x",
    "linkedin",
    "anonymous",
] as const

export interface LiveAuthConfig {
    /**
     * Current template overrides. Authoritative when the config is present:
     * a type missing here means "use the kernel default" — NOT the (possibly
     * stale) deploy-time AUTH_EMAIL_TEMPLATES value, so removing an override
     * on the dashboard also applies without a redeploy.
     */
    templates: Partial<Record<AuthEmailType, AuthEmailTemplate>>
    /** Current sender; undefined means the deploy-time SMTP_SENDER_* env applies. */
    sender?: LiveAuthSender
    /**
     * Enabled sign-in methods in render order, validated and deduped.
     * Undefined means the deploy-time (VITE_)AUTH_METHODS value applies —
     * the project has never live-toggled methods.
     */
    methods?: string[]
}

const CACHE_TTL_MS = 60_000
const FETCH_TIMEOUT_MS = 3_000
const METADATA_TOKEN_URL =
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"

let cache: { value: LiveAuthConfig | undefined; fetchedAt: number; fileMtimeMs?: number } | undefined

type SecretFetcher = (gcpProjectId: string, secretName: string) => Promise<string>
let fetcherForTests: SecretFetcher | undefined

/** Test-only: substitutes the Secret Manager fetch and clears the cache. */
export function setLiveAuthConfigFetcherForTests(fetcher: SecretFetcher | undefined): void {
    fetcherForTests = fetcher
    cache = undefined
}

/**
 * The current live config, or undefined when the environment has no live
 * source (neither the deployed secret nor the sandbox's AUTH_CONFIG_FILE
 * — auth-less deploys, kernels predating the platform feature) or the
 * read failed — callers then use the env-baked config.
 */
export async function resolveLiveAuthConfig(): Promise<LiveAuthConfig | undefined> {
    const configFile = process.env.AUTH_CONFIG_FILE ?? ""
    const secretName = process.env.AUTH_EMAIL_CONFIG_SECRET ?? ""
    const gcpProjectId = process.env.GCP_PROJECT_ID ?? ""
    if (configFile === "" && (secretName === "" || gcpProjectId === "")) {
        return undefined
    }
    const now = Date.now()
    if (cache !== undefined && now - cache.fetchedAt < CACHE_TTL_MS) {
        // The TTL exists to bound Secret Manager traffic. The sandbox's
        // file source is overwritten in place the moment sign-in methods
        // change on the dashboard, and the platform reloads the preview
        // right after the push — so honor file pushes immediately via a
        // cheap mtime check instead of serving up to a minute of stale
        // config to the freshly reloaded login page.
        if (configFile === "" || (await fileMtimeMs(configFile)) === cache.fileMtimeMs) {
            return cache.value
        }
    }
    let value: LiveAuthConfig | undefined
    let fileMtime: number | undefined
    try {
        const raw =
            configFile !== ""
                ? await readFile(configFile, "utf8")
                : await (fetcherForTests ?? fetchSecretValue)(gcpProjectId, secretName)
        if (configFile !== "") {
            fileMtime = await fileMtimeMs(configFile)
        }
        value = parseLiveAuthConfig(raw)
    } catch (error) {
        console.warn(
            "Live auth config unavailable; using the deploy-time env config.",
            error instanceof Error ? error.message : error,
        )
        value = undefined
    }
    cache = { value, fetchedAt: now, fileMtimeMs: fileMtime }
    return value
}

/** The config file's mtime, or undefined when it cannot be statted. */
async function fileMtimeMs(path: string): Promise<number | undefined> {
    try {
        return (await stat(path)).mtimeMs
    } catch {
        return undefined
    }
}

/**
 * Secret Manager access with the runtime service account's token from the
 * GCE metadata server (no client library needed). The platform grants the
 * runtime identity secretAccessor on this one secret at provision time.
 */
async function fetchSecretValue(gcpProjectId: string, secretName: string): Promise<string> {
    const tokenResponse = await fetchWithTimeout(METADATA_TOKEN_URL, {
        headers: { "Metadata-Flavor": "Google" },
    })
    if (!tokenResponse.ok) {
        throw new Error(`metadata_token_failed_${tokenResponse.status}`)
    }
    const token = ((await tokenResponse.json()) as { access_token?: string }).access_token
    if (!token) {
        throw new Error("metadata_token_missing")
    }
    const secretResponse = await fetchWithTimeout(
        `https://secretmanager.googleapis.com/v1/projects/${gcpProjectId}/secrets/${encodeURIComponent(secretName)}/versions/latest:access`,
        { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!secretResponse.ok) {
        throw new Error(`secret_access_failed_${secretResponse.status}`)
    }
    const payload = ((await secretResponse.json()) as { payload?: { data?: string } }).payload
    if (!payload?.data) {
        throw new Error("secret_payload_missing")
    }
    return Buffer.from(payload.data, "base64").toString("utf8")
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
        return await fetch(url, { ...init, signal: controller.signal })
    } finally {
        clearTimeout(timeout)
    }
}

/** Keeps only well-formed entries; a malformed secret never breaks sign-in. */
function parseLiveAuthConfig(raw: string): LiveAuthConfig {
    const parsed = JSON.parse(raw) as {
        templates?: Record<string, { subject?: unknown; html?: unknown } | undefined>
        sender?: { email?: unknown; name?: unknown } | null
        methods?: unknown
    }
    const templates: Partial<Record<AuthEmailType, AuthEmailTemplate>> = {}
    for (const type of ["magicLink", "confirmation", "recovery"] as const) {
        const entry = parsed.templates?.[type]
        if (
            entry !== undefined &&
            typeof entry.subject === "string" &&
            entry.subject.length > 0 &&
            typeof entry.html === "string" &&
            entry.html.length > 0
        ) {
            templates[type] = { subject: entry.subject, html: entry.html }
        }
    }
    const sender =
        parsed.sender &&
        typeof parsed.sender.email === "string" &&
        parsed.sender.email.length > 0 &&
        typeof parsed.sender.name === "string"
            ? { email: parsed.sender.email, name: parsed.sender.name }
            : undefined
    return { templates, sender, methods: parseLiveAuthMethods(parsed.methods) }
}

/**
 * Validates a live methods list with the same semantics every client's
 * resolveAuthMethods uses: trim, lowercase, drop unknown names, dedupe,
 * preserve order. An absent or entirely-invalid list resolves to undefined
 * (deploy-time config applies) rather than an empty sign-in surface.
 */
export function parseLiveAuthMethods(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
        return undefined
    }
    const known = new Set<string>(knownAuthMethodKeys)
    const resolved: string[] = []
    for (const raw of value) {
        if (typeof raw !== "string") {
            continue
        }
        const name = raw.trim().toLowerCase()
        if (known.has(name) && !resolved.includes(name)) {
            resolved.push(name)
        }
    }
    return resolved.length > 0 ? resolved : undefined
}
