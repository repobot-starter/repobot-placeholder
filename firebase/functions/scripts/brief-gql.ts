// GraphQL adapter for the brief runner (scripts/brief/check.mjs — see
// docs/brief-spec.md). Executes query-returns / mutation-roundtrip
// assertions against the in-process Apollo server (the same
// buildPendingGraphqlServer the blackbox tests use) and the dev database.
//
// Input: one argv argument — a JSON array of assertion objects.
// Output: exactly one JSON array on the final stdout line, aligned by index:
//   [{ "status": "pass" | "fail" | "blocked", "detail"?: string }, ...]
//
// An unreachable database reports every assertion "blocked", never "fail".
import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import pg from "pg"
import { primeBriefGqlSandboxEnv } from "./brief-gql-env.mjs"

const functionsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
dotenv.config({ path: path.join(functionsDir, ".env.local") })

// Sandbox .env.local uses AUTH_MODE=local / PAYMENTS_MODE=local. validatedEnv
// (and LocalTokenVerifier) only allow those inside the Firebase emulator or
// tests. This harness is an in-process sandbox runner — not a deploy — so it
// needs the same allowance *before* any kernel module imports. Without it,
// createCheckoutSession fails project setup's PAYMENTS mutation-roundtrip with
// "Environment validation failed" and the storefront ask shows as broken.
primeBriefGqlSandboxEnv()

interface GqlAssertion {
    assert: "query-returns" | "mutation-roundtrip"
    operation: string
    variables?: Record<string, unknown>
    expectCount?: number
}

interface AssertionResult {
    status: "pass" | "fail" | "blocked"
    detail?: string
}

async function main(): Promise<void> {
    const assertions = JSON.parse(process.argv[2] ?? "[]") as GqlAssertion[]
    if (assertions.length === 0) {
        emit([])
        return
    }

    const blockedReason = await probeDatabase()
    if (blockedReason !== undefined) {
        emit(assertions.map(() => ({ status: "blocked", detail: blockedReason })))
        return
    }

    // Imported only after the DB probe: pulling in src modules builds pools
    // and validates env, which should surface as "blocked", not a crash.
    let executeAssertion: (assertion: GqlAssertion) => Promise<AssertionResult>
    try {
        executeAssertion = await buildExecutor()
    } catch (error) {
        const detail = `GraphQL server failed to boot: ${errorMessage(error)}`
        emit(assertions.map(() => ({ status: "blocked", detail })))
        return
    }

    const results: AssertionResult[] = []
    for (const assertion of assertions) {
        results.push(await executeAssertion(assertion))
    }
    emit(results)
}

/** Returns a blocked-reason when the dev database is unreachable. */
async function probeDatabase(): Promise<string | undefined> {
    const databaseUrl = process.env.DATABASE_URL
    if (databaseUrl === undefined || databaseUrl === "") {
        return "DATABASE_URL is not set (npm run bootstrap:env, then npm run dev:up)"
    }
    const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 3000 })
    try {
        await client.connect()
        await client.query("SELECT 1")
        return undefined
    } catch (error) {
        return `database unreachable: ${errorMessage(error)} (start it with: npm run dev:up)`
    } finally {
        await client.end().catch(() => undefined)
    }
}

async function buildExecutor(): Promise<(assertion: GqlAssertion) => Promise<AssertionResult>> {
    const { buildPendingGraphqlServer, GraphqlRequestContext } =
        await import("../src/Graphql/GraphqlServer.js")
    const { apolloServer } = buildPendingGraphqlServer()

    // Authenticated (passes the execution gate) but with no application user,
    // mirroring the test harness principal; per-resource role checks still
    // apply in services, exactly as for a real caller.
    const principal = { authSubject: "brief:runner", email: "brief-runner@local.invalid" }

    const execute = async (query: string, variables: Record<string, unknown>) =>
        await apolloServer.executeOperation(
            { query, variables },
            { contextValue: new GraphqlRequestContext(principal) },
        )

    return async (assertion) => {
        const documents = candidateDocuments(assertion)
        if (typeof documents === "string") {
            return { status: "fail", detail: documents }
        }
        let lastError: string | undefined
        for (const document of documents) {
            const response = await execute(document, assertion.variables ?? {})
            if (response.body.kind !== "single") {
                return { status: "fail", detail: "unexpected multi-part GraphQL response" }
            }
            const { data, errors } = response.body.singleResult
            if (errors !== undefined) {
                lastError = errors[0]?.message
                // Selection-shape mismatches mean "try the next candidate";
                // anything that reached execution is a real failure.
                if (isSelectionError(lastError)) continue
                return { status: "fail", detail: `${operationLabel(assertion)}: ${lastError}` }
            }
            return checkData(assertion, data ?? {})
        }
        return {
            status: "fail",
            detail: `${operationLabel(assertion)}: ${lastError ?? "no candidate document validated"}`,
        }
    }
}

/**
 * `operation` is either a full GraphQL document (contains braces) or a bare
 * root field name, for which candidate selections are tried in order:
 * connection shape, object shape, then leaf. Variables require a full
 * document (a bare field has no variable definitions to bind them to).
 */
function candidateDocuments(assertion: GqlAssertion): string[] | string {
    const operation = assertion.operation.trim()
    if (operation.includes("{")) {
        return [operation]
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(operation)) {
        return `operation "${operation}" is neither a root field name nor a GraphQL document`
    }
    if (assertion.variables !== undefined && Object.keys(assertion.variables).length > 0) {
        return `operation "${operation}": variables need a full GraphQL document, not a bare field name`
    }
    const keyword = assertion.assert === "mutation-roundtrip" ? "mutation" : "query"
    return [
        `${keyword} BriefCheck { ${operation} { nodes { __typename } } }`,
        `${keyword} BriefCheck { ${operation} { __typename } }`,
        `${keyword} BriefCheck { ${operation} }`,
    ]
}

function isSelectionError(message: string | undefined): boolean {
    if (message === undefined) return false
    return (
        message.includes("Cannot query field") ||
        message.includes("must have a selection of subfields") ||
        message.includes("must not have a selection")
    )
}

function checkData(assertion: GqlAssertion, data: Record<string, unknown>): AssertionResult {
    const fieldName = Object.keys(data)[0]
    const value = fieldName === undefined ? undefined : data[fieldName]
    if (value === null || value === undefined) {
        return { status: "fail", detail: `${operationLabel(assertion)} returned null` }
    }
    if (assertion.expectCount !== undefined) {
        const list = Array.isArray(value)
            ? value
            : Array.isArray((value as Record<string, unknown>).nodes)
              ? ((value as Record<string, unknown>).nodes as unknown[])
              : undefined
        if (list === undefined) {
            return {
                status: "fail",
                detail: `${operationLabel(assertion)}: result is not countable (no list or nodes)`,
            }
        }
        if (list.length !== assertion.expectCount) {
            return {
                status: "fail",
                detail: `${operationLabel(assertion)}: expected ${assertion.expectCount} result(s), got ${list.length}`,
            }
        }
    }
    return { status: "pass" }
}

function operationLabel(assertion: GqlAssertion): string {
    const operation = assertion.operation.trim()
    return operation.includes("{") ? `${assertion.assert} document` : operation
}

function errorMessage(error: unknown): string {
    return (error instanceof Error ? error.message : String(error)).split("\n")[0]
}

function emit(results: AssertionResult[]): void {
    process.stdout.write(`${JSON.stringify(results)}\n`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(errorMessage(error))
        process.exit(1)
    })
