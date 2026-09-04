// SQL-first migration runner.
//
// Applies the files in migrations/ in filename order, each inside its own
// transaction, recording progress in schema_migrations(filename pk, applied_at).
// Re-running is a no-op for already-applied files (idempotent).
//
// Database resolution order:
//   --test flag        -> MIGRATE_TEST_DATABASE_URL or the local test db (:5433)
//   MIGRATE_DATABASE_URL
//   DATABASE_URL       (process env, falling back to .env.local via dotenv)
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import pg from "pg"

const functionsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const migrationsDir = path.join(functionsDir, "migrations")

dotenv.config({ path: path.join(functionsDir, ".env.local") })

const LOCAL_TEST_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/postgres"

function resolveDatabaseUrl(): string {
    if (process.argv.includes("--test")) {
        return process.env.MIGRATE_TEST_DATABASE_URL ?? LOCAL_TEST_DATABASE_URL
    }
    const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL
    if (url === undefined || url === "") {
        throw new Error(
            "migrate: DATABASE_URL is not set. Set it in the environment or in firebase/functions/.env.local " +
                "(npm run bootstrap:env at the repo root generates it).",
        )
    }
    return url
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Whether a failed connect means "Postgres is not ready YET" rather than
 * "Postgres is not there". Sandboxes hit this window for real: the port can
 * be open while the database replays WAL after a non-clean shutdown
 * ("the database system is starting up" / "is in recovery mode", SQLSTATE
 * 57P03), and a backend crash mid-boot makes the postmaster reject
 * connections while it reinitializes. Treating those as instantly fatal
 * failed the whole `workspace up` for a condition that clears in seconds.
 */
function isDatabaseNotReadyError(error: unknown): boolean {
    const code = (error as { code?: string }).code
    if (code === "57P03" || code === "ECONNREFUSED" || code === "ECONNRESET") {
        return true
    }
    const message = error instanceof Error ? error.message : String(error)
    return (
        message.includes("the database system is starting up") ||
        message.includes("the database system is in recovery mode")
    )
}

async function connectWithRetry(databaseUrl: string, timeoutMs = 90_000): Promise<pg.Client> {
    const deadline = Date.now() + timeoutMs
    for (;;) {
        const client = new pg.Client({ connectionString: databaseUrl })
        try {
            await client.connect()
            return client
        } catch (error) {
            await client.end().catch(() => undefined)
            if (!isDatabaseNotReadyError(error) || Date.now() >= deadline) {
                throw error
            }
            const message = error instanceof Error ? error.message : String(error)
            console.log(`migrate: database not ready yet (${message.trim()}); retrying...`)
            await sleep(2_000)
        }
    }
}

async function main(): Promise<void> {
    const databaseUrl = resolveDatabaseUrl()
    const client = await connectWithRetry(databaseUrl)

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename text PRIMARY KEY,
                applied_at timestamptz NOT NULL DEFAULT now()
            )
        `)

        const appliedResult = await client.query<{ filename: string }>(
            "SELECT filename FROM schema_migrations",
        )
        const applied = new Set(appliedResult.rows.map((row) => row.filename))

        const files = fs
            .readdirSync(migrationsDir)
            .filter((file) => file.endsWith(".sql"))
            .sort()

        let appliedCount = 0
        for (const file of files) {
            if (applied.has(file)) continue

            const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8")
            await client.query("BEGIN")
            try {
                await client.query(sql)
                await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file])
                await client.query("COMMIT")
            } catch (error) {
                await client.query("ROLLBACK")
                throw new Error(`migrate: failed to apply ${file}: ${String(error)}`)
            }
            console.log(`migrate: applied ${file}`)
            appliedCount += 1
        }

        if (appliedCount === 0) {
            console.log(`migrate: up to date (${files.length} migrations already applied).`)
        } else {
            console.log(`migrate: applied ${appliedCount} migration(s).`)
        }
    } finally {
        await client.end()
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
})
