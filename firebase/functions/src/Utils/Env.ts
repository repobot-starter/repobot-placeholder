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
    // JSON auth email template overrides (see repobot.emails.json).
    AUTH_EMAIL_TEMPLATES: z.string().optional(),
    // Google OAuth client for the "google" sign-in method.
    GOOGLE_SIGNIN_CLIENT_ID: z.string().optional(),
    GOOGLE_SIGNIN_CLIENT_SECRET: z.string().optional(),
    // "stripe" is the safe deployed default. STRIPE_SECRET_KEY is not required
    // at boot: deploys without the PAYMENTS capability never carry it, and the
    // Stripe wrapper fails with an actionable message at first checkout use.
    PAYMENTS_MODE: z.enum(["local", "stripe"]).default("stripe"),
    STRIPE_SECRET_KEY: z.string().optional(),
    // "openai" is the safe deployed default. OPENAI_API_KEY is not required at
    // boot: deploys without the AI capability never carry it, and the OpenAI
    // wrapper fails with an actionable message at first assistant use.
    AI_MODE: z.enum(["local", "openai"]).default("openai"),
    OPENAI_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof baseEnvSchema>

let cached: Env | undefined

/**
 * Parses and returns the validated environment. Throws an aggregated,
 * actionable error when required variables are missing or inconsistent.
 */
export function validatedEnv(): Env {
    if (cached !== undefined) {
        return cached
    }
    const parsed = baseEnvSchema.safeParse(process.env)
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
    if (env.PAYMENTS_MODE === "local" && !isEmulator() && !isTest()) {
        problems.push(
            "PAYMENTS_MODE=local is only allowed inside the Firebase emulator or tests. " +
                "Deployed environments must set PAYMENTS_MODE=stripe.",
        )
    }
    if (env.AI_MODE === "local" && !isEmulator() && !isTest()) {
        problems.push(
            "AI_MODE=local is only allowed inside the Firebase emulator or tests. " +
                "Deployed environments must set AI_MODE=openai.",
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
