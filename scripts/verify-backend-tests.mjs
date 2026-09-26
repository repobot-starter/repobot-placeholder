#!/usr/bin/env node
// Mechanical gate: the backend test suite must pass before work promotes.
//
// Until now backend tests only ran in repo CI — post-merge, where a red
// verdict reaches nobody (the first Order Hub build merged 7 straight red
// runs, shipping 12 never-executed tests and real domain bugs). The sandbox
// can run them since embedded Postgres works from a root shell, so this
// script makes them a promotion gate the platform runs mechanically
// (AgentHost kernelGateScripts), same contract as verify-pinned-tests.mjs:
// exit 0 on pass or vacuous skip, stderr carries the canonical fix
// instruction on failure.
//
// Vacuous skips: a clientOnly project whose backend surface is untracked
// and untouched, or a tree without the functions workspace.
import { execFileSync, execSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
process.chdir(repoRoot)

if (!existsSync("firebase/functions/package.json")) {
    process.exit(0)
}

// Same self-guard as check-all.sh: a clientOnly project skips only while the
// backend surface is genuinely untouched.
if (existsSync("repobot.deploy.json")) {
    try {
        const scope = execSync("node scripts/lib/check-scope.mjs", { encoding: "utf8" })
        if (/CHECK_BACKEND=false/.test(scope)) {
            const dirty = execSync("git status --porcelain -- Graphql firebase protobufs", {
                encoding: "utf8",
            }).trim()
            if (!dirty) process.exit(0)
        }
    } catch {
        // Unreadable manifest: check rather than skip.
    }
}

function run(command, args, label, env) {
    try {
        execFileSync(command, args, {
            stdio: ["ignore", "pipe", "pipe"],
            encoding: "utf8",
            ...(env ? { env: { ...process.env, ...env } } : {}),
        })
    } catch (error) {
        const output = `${String(error?.stdout ?? "")}\n${String(error?.stderr ?? "")}`.trim()
        const tail = output.split("\n").slice(-40).join("\n")
        console.error(`[verify-backend-tests] ${label} failed:\n${tail}`)
        console.error(
            "\nFix the code (or your new tests) until `npm run build --workspace firebase/functions && npm run migrate:test && npm test` passes.\n" +
                "Tests are type-checked by the build like all other code - `unknown`-typed GraphQL results need narrowing.\n" +
                "If the drizzle drift check failed: schema changes in src/Data need a matching migrations/*.sql file - migrations are the source of truth, never drizzle-kit.\n" +
                "If the prettier check failed: run `npx prettier --write` on the listed files.\n" +
                "The test database starts with `npm run dev:db:test` (embedded Postgres, no docker needed).\n" +
                "Never weaken or delete template-shipped tests; new behavior gets new test files.",
        )
        process.exit(1)
    }
}

// Build first, exactly like repo CI's "Backend build and test" job: mocha's
// transpile-only runner happily executes tests that `tsc` rejects (the first
// gated run merged green with 9 strict-mode errors in its new test files,
// leaving CI red). The gate must be a superset of CI's backend job.
run("npm", ["run", "build", "--workspace", "firebase/functions"], "backend build (tsc)")

// Lint and formatting, exactly like repo CI's backend job. Cheap, and every
// CI-only step is a rerun spent discovering it: the drift check cost run 5,
// the build cost run 4. Cover the whole job in one pass.
run("npm", ["run", "lint", "--workspace", "firebase/functions"], "backend lint")
run(
    "npx",
    ["prettier", "--check", "firebase/functions/src/**/*.ts", "firebase/functions/test/**/*.ts"],
    "backend prettier check",
)

run("bash", ["scripts/dev-db.sh", "--test"], "test database start")

// Drift check, exactly like repo CI: the TS schema in src/Data must match
// migrations/*.sql. drizzle-kit push MUTATES its target, so it gets a scratch
// database on the test cluster, never the database mocha is about to use.
const scratchUrl = "postgres://postgres:postgres@127.0.0.1:5433/drift_check"
run(
    "node",
    [
        "-e",
        `const{Client}=require("pg");(async()=>{const c=new Client("postgres://postgres:postgres@127.0.0.1:5433/postgres");await c.connect();await c.query("DROP DATABASE IF EXISTS drift_check");await c.query("CREATE DATABASE drift_check");await c.end();})().catch(e=>{console.error(e.message);process.exit(1)})`,
    ],
    "drift-check scratch database",
    {
        NODE_PATH: [
            path.join(repoRoot, "node_modules"),
            path.join(repoRoot, "firebase/functions/node_modules"),
        ].join(":"),
    },
)
run("bash", ["firebase/functions/scripts/drift-check.sh"], "drizzle drift check", {
    DATABASE_URL: scratchUrl,
})

run("npm", ["run", "migrate:test"], "test migrations")
run("npm", ["test", "--workspace", "firebase/functions"], "backend test suite")
console.log("[verify-backend-tests] OK - backend test suite passes.")
