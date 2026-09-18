/**
 * Sets environment defaults for the test process. This module MUST be the
 * first import of test/MochaHooks.ts so it runs before any src module is
 * evaluated (ES module imports execute in import order).
 *
 * Tests always run against the isolated test database on :5433, never the
 * local dev database on :5432.
 */
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

process.env.NODE_ENV = "test"
process.env.DATABASE_URL ??= "postgres://postgres:postgres@127.0.0.1:5433/postgres"
process.env.AUTH_MODE ??= "local"
process.env.LOCAL_AUTH_SECRET ??= "aa".repeat(32)
process.env.PAYMENTS_MODE ??= "local"
process.env.STORAGE_MODE ??= "local"
process.env.JOBS_MODE ??= "local"
process.env.ELEVENLABS_MODE ??= "local"
// Local-mode storage tests exercise real disk; keep it in a per-run temp dir
// so runs never touch .devdata or each other.
process.env.STORAGE_LOCAL_DIR ??= mkdtempSync(join(tmpdir(), "repobot-storage-test-"))

export {}
