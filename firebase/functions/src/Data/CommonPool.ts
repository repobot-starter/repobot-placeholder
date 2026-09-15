import pg from "pg"

let pool: pg.Pool | undefined

/**
 * The shared Postgres connection pool, lazily initialized from DATABASE_URL.
 *
 * Lazy initialization matters: the test harness (test/MochaHooks.ts) sets
 * environment defaults and patches pg for transactional tests before the
 * first query, and deployed functions read DATABASE_URL at first use rather
 * than at module load.
 */
export function commonPool(): pg.Pool {
    if (pool === undefined) {
        const databaseUrl = process.env.DATABASE_URL
        if (databaseUrl === undefined || databaseUrl === "") {
            throw new Error(
                "DATABASE_URL is not set. Run `npm run bootstrap:env` at the repo root to generate " +
                    "firebase/functions/.env.local, or set it in the deployment environment.",
            )
        }
        pool = new pg.Pool({ connectionString: databaseUrl })
    }
    return pool
}
