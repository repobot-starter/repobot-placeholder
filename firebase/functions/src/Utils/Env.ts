import { z } from "zod"
import { isEmulator, isTest } from "./Environment.js"

/**
 * Zod-validated view of this package's environment variables.
 *
 * The manifest of record is /env.manifest.json at the repo root; this schema
 * must stay in sync with it (adding a variable touches: manifest, this schema,
 * .env.example). Validation runs once at the first request and fails fast with
 * the exact list of problems, instead of surfacing as a confusing crash later.
 */
const baseEnvSchema = z.object({
    DATABASE_URL: z
        .string()
        .min(1, "DATABASE_URL is required. Run `npm run bootstrap:env` or set it in the environment."),
    AUTH_MODE: z.enum(["local", "builtin"]).default("builtin"),
    LOCAL_AUTH_SECRET: z.string().optional(),
    // Signs and verifies built-in auth JWTs (HS256, hex-encoded). Not required
    // at boot: deploys without the AUTH capability never carry it, and the
    // token paths fail with an actionable message at first use.
    AUTH_JWT_SECRET: z.string().optional(),
    // Public origin of the auth__request__api function; used for OAuth
    // callbacks and the magic-link fallback URLs in auth emails.
    AUTH_PUBLIC_URL: z.string().optional(),
    // Platform OAuth callback proxy: when set, OAuth sign-in flows use
    // this stable control-plane URL as the provider redirect_uri (one URL
    // customers whitelist once) and the proxy forwards callbacks here.
    // Empty/absent = providers redirect straight to AUTH_PUBLIC_URL.
    AUTH_OAUTH_PROXY_URL: z.string().optional(),
    // The environment's live site URL ({{ .SiteURL }} in emails, OAuth
    // redirect allowlist).
    APP_BASE_URL: z.string().optional(),
    // SMTP account for auth emails. Empty host = degraded mode: signups
    // auto-confirm and OTP/recovery emails are unavailable.
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SENDER_EMAIL: z.string().optional(),
    SMTP_SENDER_NAME: z.string().optional(),
    // Daily cap on outgoing email over the shared SMTP account (UTC calendar
    // day; template + auth mail together — see docs/mail.md for the auth
    // carve-out). Staged per environment by the platform. Unset, empty, or
    // "0" means the kernel default (200/day); negative means unlimited.
    MAIL_DAILY_QUOTA: z
        .string()
        .regex(
            /^$|^-?\d+$/,
            "MAIL_DAILY_QUOTA must be an integer (empty or 0 = the 200/day default, negative = unlimited).",
        )
        .optional(),
    // JSON auth email template overrides (see repobot.emails.json).
    AUTH_EMAIL_TEMPLATES: z.string().optional(),
    // Name of the platform-maintained live auth-email-config secret, re-read
    // at request time so template/sender changes apply without a redeploy.
    // Empty disables the live path (env values above apply as-is).
    AUTH_EMAIL_CONFIG_SECRET: z.string().optional(),
    // Dev-only fixed sign-in code: when set, the email-code verify step also
    // accepts this value for any address, so dev-posture deploys (which have
    // no test inbox) can sign in test users without email delivery. Unset by
    // default — the bypass path is unreachable then — and production boot
    // refuses it (see the posture guards below).
    AUTH_DEV_CODE: z.string().optional(),
    // Google OAuth client for the "google" sign-in method.
    GOOGLE_SIGNIN_CLIENT_ID: z.string().optional(),
    GOOGLE_SIGNIN_CLIENT_SECRET: z.string().optional(),
    // Apple Sign-In credentials for the "apple" sign-in method: the Services
    // ID (web client id), developer Team ID, the "Sign in with Apple" key's
    // id, and the key itself (.p8 PEM, or base64 of it — the platform stages
    // base64 so the multiline PEM survives the env file). The optional
    // bundle id is the native apps' identity-token audience; it falls back
    // to the Services ID when unset.
    APPLE_SIGNIN_SERVICES_ID: z.string().optional(),
    APPLE_SIGNIN_TEAM_ID: z.string().optional(),
    APPLE_SIGNIN_KEY_ID: z.string().optional(),
    APPLE_SIGNIN_PRIVATE_KEY: z.string().optional(),
    APPLE_SIGNIN_BUNDLE_ID: z.string().optional(),
    // Deploy posture, injected by the platform: "dev" environments may run
    // the simulated (local) payments/AI modes when the account has no Stripe
    // or OpenAI integration connected yet; "prod" never may. Empty locally.
    DEPLOY_POSTURE: z.enum(["dev", "prod"]).optional(),
    // "stripe" is the safe deployed default. STRIPE_SECRET_KEY is not required
    // at boot: deploys without the PAYMENTS capability never carry it, and the
    // Stripe wrapper fails with an actionable message at first checkout use.
    PAYMENTS_MODE: z.enum(["local", "stripe"]).default("stripe"),
    STRIPE_SECRET_KEY: z.string().optional(),
    // Signing secret ("whsec_...") for the payments webhook endpoint
    // (payments__request__api POST /webhook). Not required at boot: deploys
    // without a configured Stripe webhook simply never receive deliveries,
    // and the endpoint fails with an actionable message if hit while unset.
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    // "openai" is the safe deployed default. OPENAI_API_KEY is not required at
    // boot: deploys without the AI capability never carry it, and the OpenAI
    // wrapper fails with an actionable message at first assistant use.
    // "gateway" runs the same model calls through the platform's AI gateway
    // (keyless deploys, billed to the account's credits) using the
    // AI_GATEWAY_URL/AI_GATEWAY_TOKEN pair injected by the platform.
    AI_MODE: z.enum(["local", "openai", "gateway"]).default("openai"),
    OPENAI_API_KEY: z.string().optional(),
    // Platform AI gateway endpoint + per-environment bearer token, injected
    // by the platform when AI_MODE=gateway. Not required at boot: the OpenAI
    // wrapper fails with an actionable message at first assistant use.
    AI_GATEWAY_URL: z.string().optional(),
    AI_GATEWAY_TOKEN: z.string().optional(),
    // "elevenlabs" is the safe deployed default (own key). "gateway" runs
    // STT/TTS through the platform's AI gateway (same AI_GATEWAY_URL/TOKEN
    // pair as chat). "local" is the sandbox: no ElevenLabs calls; voice
    // turns accept a transcript and skip audio.
    ELEVENLABS_MODE: z.enum(["local", "elevenlabs", "gateway"]).default("elevenlabs"),
    ELEVENLABS_API_KEY: z.string().optional(),
    // Optional override for the spoken voice; empty uses the kernel default.
    ELEVENLABS_VOICE_ID: z.string().optional(),
    // "local" serves the deterministic simulated sample company (see
    // Services/QuickBooks/QuickBooksSimulation.ts) — the sandbox default,
    // and what deploys run while the account has no Intuit integration, so
    // the accounting surface always works. "intuit" runs the real QuickBooks
    // Online API behind the same service interface: connecting goes through
    // the Intuit OAuth flow and reads hit the live company.
    QUICKBOOKS_MODE: z.enum(["local", "intuit"]).default("local"),
    // Intuit app OAuth client credentials, staged by the platform from the
    // account's connected Intuit integration when QUICKBOOKS_MODE=intuit.
    // Not required at boot: local mode never reads them, and the Intuit
    // wrapper fails with an actionable message at first use if missing.
    QUICKBOOKS_CLIENT_ID: z.string().optional(),
    QUICKBOOKS_CLIENT_SECRET: z.string().optional(),
    // Which Intuit environment the app's keys belong to; picks the QBO API
    // host (sandbox-quickbooks vs quickbooks). Ignored in local mode.
    QUICKBOOKS_ENVIRONMENT: z.enum(["sandbox", "production"]).default("production"),
    // "platform" is the safe deployed default. DOCUMENTS_RENDER_URL and
    // DOCUMENTS_TOKEN are not required at boot: deploys without the DOCUMENTS
    // capability never carry them, and the render client fails with an
    // actionable message at first generate use.
    DOCUMENTS_MODE: z.enum(["local", "platform"]).default("platform"),
    DOCUMENTS_RENDER_URL: z.string().optional(),
    DOCUMENTS_TOKEN: z.string().optional(),
    // Local-only override for where the sandbox's Chromium lives; the local
    // renderer probes well-known install paths when unset.
    DOCUMENTS_CHROMIUM_PATH: z.string().optional(),
    // "gcs" is the safe deployed default. STORAGE_BUCKET is not required at
    // boot: deploys without the STORAGE capability never carry it, and the
    // storage wrapper fails with an actionable message at first upload use.
    // "local" stores file bytes on disk under STORAGE_LOCAL_DIR and serves
    // them through the storage function (sandbox + dev-posture fallback).
    STORAGE_MODE: z.enum(["local", "gcs"]).default("gcs"),
    STORAGE_BUCKET: z.string().optional(),
    // Key prefix inside STORAGE_BUCKET (platform injects the environment's
    // slug so environments sharing a bucket never collide). Empty = root.
    STORAGE_PREFIX: z.string().optional(),
    // Local-mode data directory; defaults to .devdata/storage at the repo
    // root (next to the embedded Postgres data dirs).
    STORAGE_LOCAL_DIR: z.string().optional(),
    // "scheduler" is the safe deployed default: the platform's Cloud
    // Scheduler POSTs /tick on jobs__request__api with the JOBS_TOKEN it
    // minted. "local" runs the in-process 60s ticker instead (sandbox +
    // dev-posture fallback), so the emulator needs no scheduler.
    JOBS_MODE: z.enum(["local", "scheduler"]).default("scheduler"),
    // Bearer token guarding POST /tick, minted per environment by the
    // platform's JOBS_SCHEDULER provisioning step. Not required at boot:
    // deploys without the JOBS capability never carry it, and the tick
    // endpoint refuses with an actionable message when hit while unset.
    JOBS_TOKEN: z.string().optional(),
    // "live" is the deployed default: Web Push over the platform-minted
    // VAPID keypair. "local" (sandbox default, and what the platform stages
    // while push is unprovisioned) means no real delivery: the emulator/tests
    // use the in-memory fake, and a deployed environment treats every channel
    // as not configured, so sends degrade to log lines — the same posture as
    // mail with empty SMTP_HOST, deliberately never a boot refusal.
    PUSH_MODE: z.enum(["local", "live"]).default("live"),
    // Per-project VAPID keypair for Web Push, minted by the platform's
    // PUSH_CREDENTIALS provisioning step. Not required at boot: deploys
    // without the PUSH capability never carry them, and the WEB channel
    // simply reports not-configured while either is empty.
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    // APNs token-based auth credentials for the native IOS channel, staged
    // by the platform when the customer connects their Apple push key.
    // Never required at boot: the channel reports not-configured while any
    // is empty. The private key is the .p8 contents, base64-encoded (raw
    // PEM also accepted — the transport normalizes).
    APNS_TEAM_ID: z.string().optional(),
    APNS_KEY_ID: z.string().optional(),
    APNS_PRIVATE_KEY: z.string().optional(),
    APNS_BUNDLE_ID: z.string().optional(),
    // "production" targets api.push.apple.com (App Store / TestFlight
    // builds); "sandbox" targets Apple's sandbox gateway for development
    // builds signed with a development provisioning profile.
    APNS_ENVIRONMENT: z.enum(["production", "sandbox"]).default("production"),
    // FCM HTTP v1 credentials for the native ANDROID channel: a Firebase
    // service-account JSON (client_email + private_key + project_id),
    // base64-encoded. Same posture as APNs: optional, degrades to
    // not-configured while empty.
    FCM_SERVICE_ACCOUNT: z.string().optional(),
})

export type Env = z.infer<typeof baseEnvSchema>

/**
 * Empty string means "unset" for every variable the schema can omit or
 * default: platforms compose env files line by line and `FOO=` is their
 * natural spelling of "no value" — but zod applies .default() only when the
 * key is absent, so without this pass a defaulted enum (say
 * QUICKBOOKS_ENVIRONMENT) staged as "" would fail validation and refuse
 * boot. Required variables (DATABASE_URL) are left alone so their
 * actionable messages still fire on an empty value.
 */
function withEmptyOptionalsDropped(source: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
    const result: NodeJS.ProcessEnv = { ...source }
    for (const [key, schema] of Object.entries(baseEnvSchema.shape)) {
        // isOptional() is true exactly when the schema accepts undefined —
        // .optional() and .default() both do; required schemas don't.
        if (result[key] === "" && schema.isOptional()) {
            delete result[key]
        }
    }
    return result
}

let cached: Env | undefined

/**
 * Parses and returns the validated environment. Throws an aggregated,
 * actionable error when required variables are missing or inconsistent.
 */
export function validatedEnv(): Env {
    if (cached !== undefined) {
        return cached
    }
    const parsed = baseEnvSchema.safeParse(withEmptyOptionalsDropped(process.env))
    if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        throw new Error(`Environment validation failed:\n  - ${details.join("\n  - ")}`)
    }
    const env = parsed.data

    const problems: string[] = []
    if (env.AUTH_MODE === "local") {
        if (!isEmulator() && !isTest()) {
            problems.push(
                "AUTH_MODE=local is only allowed inside the Firebase emulator or tests. " +
                    "Deployed environments must set AUTH_MODE=builtin.",
            )
        }
        if (env.LOCAL_AUTH_SECRET === undefined || env.LOCAL_AUTH_SECRET === "") {
            problems.push("LOCAL_AUTH_SECRET is required when AUTH_MODE=local (run `npm run bootstrap:env`).")
        }
    }
    // AUTH_MODE=builtin with an empty AUTH_JWT_SECRET is a legal boot state:
    // full-stack packs without the AUTH capability (for example shop) deploy
    // with no auth secrets, and their traffic is anonymous. Presenting a
    // bearer token in that state still fails loudly — BuiltinTokenVerifier
    // throws "AUTH_JWT_SECRET is not set" at first verification.
    // Simulated payments/AI are additionally allowed on deployed DEV-posture
    // environments (DEPLOY_POSTURE=dev, injected by the platform): the first
    // deploy ships before Stripe/OpenAI are connected, with the same clearly
    // labeled simulations the sandbox uses. Production posture never may —
    // a live storefront must not fake sessions to PAID.
    const isDevPosture = env.DEPLOY_POSTURE === "dev"
    if (
        env.AUTH_DEV_CODE !== undefined &&
        env.AUTH_DEV_CODE !== "" &&
        !isEmulator() &&
        !isTest() &&
        !isDevPosture
    ) {
        problems.push(
            "AUTH_DEV_CODE is only allowed inside the Firebase emulator, tests, or " +
                "dev-posture deploys (DEPLOY_POSTURE=dev). Production must leave it unset — " +
                "a fixed sign-in code on a live environment is an account-takeover hole.",
        )
    }
    if (env.PAYMENTS_MODE === "local" && !isEmulator() && !isTest() && !isDevPosture) {
        problems.push(
            "PAYMENTS_MODE=local is only allowed inside the Firebase emulator, tests, or " +
                "dev-posture deploys (DEPLOY_POSTURE=dev). Production must set PAYMENTS_MODE=stripe.",
        )
    }
    if (env.AI_MODE === "local" && !isEmulator() && !isTest() && !isDevPosture) {
        problems.push(
            "AI_MODE=local is only allowed inside the Firebase emulator, tests, or " +
                "dev-posture deploys (DEPLOY_POSTURE=dev). Production must set AI_MODE=openai " +
                "(own key) or AI_MODE=gateway (platform-billed).",
        )
    }
    if (env.ELEVENLABS_MODE === "local" && !isEmulator() && !isTest() && !isDevPosture) {
        problems.push(
            "ELEVENLABS_MODE=local is only allowed inside the Firebase emulator, tests, or " +
                "dev-posture deploys (DEPLOY_POSTURE=dev). Production must set " +
                "ELEVENLABS_MODE=elevenlabs (own key) or ELEVENLABS_MODE=gateway (platform-billed).",
        )
    }
    if (env.DOCUMENTS_MODE === "local" && !isEmulator() && !isTest()) {
        problems.push(
            "DOCUMENTS_MODE=local is only allowed inside the Firebase emulator or tests. " +
                "Deployed environments must set DOCUMENTS_MODE=platform.",
        )
    }
    if (env.STORAGE_MODE === "local" && !isEmulator() && !isTest() && !isDevPosture) {
        problems.push(
            "STORAGE_MODE=local is only allowed inside the Firebase emulator, tests, or " +
                "dev-posture deploys (DEPLOY_POSTURE=dev). Production must set STORAGE_MODE=gcs " +
                "with a provisioned STORAGE_BUCKET.",
        )
    }
    if (env.JOBS_MODE === "local" && !isEmulator() && !isTest() && !isDevPosture) {
        problems.push(
            "JOBS_MODE=local is only allowed inside the Firebase emulator, tests, or " +
                "dev-posture deploys (DEPLOY_POSTURE=dev). Production must set JOBS_MODE=scheduler " +
                "with a platform-minted JOBS_TOKEN.",
        )
    }
    if (problems.length > 0) {
        throw new Error(`Environment validation failed:\n  - ${problems.join("\n  - ")}`)
    }

    cached = env
    return cached
}

/** Test-only: clears the cached env so suites can exercise validation paths. */
export function resetValidatedEnvForTests(): void {
    cached = undefined
}
