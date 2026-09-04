/**
 * Marks the brief GraphQL harness as emulator-equivalent so sandbox
 * AUTH_MODE=local / PAYMENTS_MODE=local (from .env.local) pass validatedEnv.
 * Must run before any kernel module import. Idempotent; safe to call twice.
 *
 * Plain .mjs so both the tsx brief-gql script and node --test can import it
 * without a compile step.
 */
export function primeBriefGqlSandboxEnv() {
    if (process.env.FUNCTIONS_EMULATOR !== "true") {
        process.env.FUNCTIONS_EMULATOR = "true"
    }
}
