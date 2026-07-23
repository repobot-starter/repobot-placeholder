/**
 * Sets environment defaults for the test process. This module MUST be the
 * first import of test/MochaHooks.ts so it runs before any src module is
 * evaluated (ES module imports execute in import order).
 *
 * Tests always run against the isolated test database on :5433, never the
 * local dev database on :5432.
 */
process.env.NODE_ENV = "test"
process.env.DATABASE_URL ??= "postgres://postgres:postgres@127.0.0.1:5433/postgres"
process.env.AUTH_MODE ??= "local"
process.env.LOCAL_AUTH_SECRET ??= "aa".repeat(32)
process.env.PAYMENTS_MODE ??= "local"

export {}
