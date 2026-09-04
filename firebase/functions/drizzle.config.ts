// drizzle-kit is a devDependency used ONLY for schema drift verification
// (scripts/drift-check.sh). Migrations are hand-written SQL under migrations/
// and applied by scripts/migrate.ts; drizzle-kit never manages the schema.
import { defineConfig } from "drizzle-kit"

export default defineConfig({
    dialect: "postgresql",
    // Every domain directory under src/Data plus the top-level infra table.
    // Deliberately open-ended: a new table in a new domain directory is
    // covered by the drift check with no edit here. (The top-level pool and
    // *Database.ts wiring files stay out of the glob — they define no
    // tables and drizzle-kit shouldn't load them.)
    schema: ["./src/Data/*/*.ts", "./src/Data/IdempotencyKeys.ts"],
    dbCredentials: {
        url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/postgres",
    },
    // Compare every table except the migration runner's own ledger. An
    // allowlist here would silently exempt new tables from the drift check
    // (it once hid Payments and QuickBooks entirely) — never add one.
    tablesFilter: ["!schema_migrations"],
})
