// drizzle-kit is a devDependency used ONLY for schema drift verification
// (scripts/drift-check.sh). Migrations are hand-written SQL under migrations/
// and applied by scripts/migrate.ts; drizzle-kit never manages the schema.
import { defineConfig } from "drizzle-kit"

export default defineConfig({
    dialect: "postgresql",
    schema: ["./src/Data/Identity/*.ts", "./src/Data/Project/*.ts", "./src/Data/IdempotencyKeys.ts"],
    dbCredentials: {
        url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5432/postgres",
    },
    // Only compare application tables; the migration runner owns schema_migrations.
    tablesFilter: [
        "accounts",
        "users",
        "auth_identities",
        "auth_email_codes",
        "auth_refresh_tokens",
        "projects",
        "project_memberships",
        "idempotency_keys",
    ],
})
