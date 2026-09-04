import pg from "pg"

// Long enough for a local Docker postgres that just started; far short of the
// OS-level connect timeout that lets a black-holed host hang a run for minutes.
const PROBE_TIMEOUT_MS = 2_000

/**
 * Fail fast, with an actionable message, when the test database is not
 * usable — instead of letting the first query hang for however long the OS
 * (or the pool's retry behavior) takes to give up. Environments that can
 * never run this suite (a vibe-session pod, a fresh clone without the test
 * DB, a port squatted by another project's postgres with different
 * credentials) got a silent multi-minute stall here; a coding agent once
 * burned 8 minutes of a 9-minute run waiting on exactly that before killing
 * the process. A real handshake plus `select 1` (not just a TCP connect)
 * is required to catch the wrong-credentials and dead-backend cases.
 */
export async function assertTestDatabaseReachable(): Promise<void> {
    const connectionString =
        process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5433/postgres"
    const client = new pg.Client({
        connectionString,
        connectionTimeoutMillis: PROBE_TIMEOUT_MS,
        query_timeout: PROBE_TIMEOUT_MS,
    })
    try {
        await client.connect()
        await client.query("select 1")
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        const target = new URL(connectionString)
        throw new Error(
            [
                `Test database is not usable at ${target.hostname}:${target.port || "5432"} (${reason}).`,
                "This backend suite needs the isolated test Postgres:",
                "    npm run dev:db:test && npm run migrate:test",
                "For web component tests (no database needed): npm run test:web",
            ].join("\n"),
        )
    } finally {
        await client.end().catch(() => undefined)
    }
}
