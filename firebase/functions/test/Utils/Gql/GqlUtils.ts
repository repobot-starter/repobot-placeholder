/**
 * Low-level GraphQL operations: execute query/mutation documents directly
 * against the Apollo server with an explicit request context, exactly like a
 * real request minus HTTP.
 */
import assert from "node:assert/strict"
import { GraphQLResponse } from "@apollo/server"
import { FormattedExecutionResult } from "graphql"
import { GqlUser } from "../../../generated/GraphqlResolverTypes.js"
import { BaseApolloServer, GraphqlRequestContext } from "../../../src/Graphql/GraphqlServer.js"
import { Principal } from "../../../src/Utils/Principal.js"

/**
 * Builds a test principal acting as the given (already-created) user.
 */
export function asUser(user: Pick<GqlUser, "id" | "email">): Principal {
    return {
        authSubject: `test:${user.id}`,
        email: user.email,
        userId: user.id,
    }
}

/**
 * The default caller for test operations: authenticated (it passes the
 * execution-level authorization gate) but with no application user, so
 * per-resource checks still require an explicit asUser(...) principal.
 * Pass `null` to execute anonymously (for testing the gate itself).
 */
export const testHarnessPrincipal: Principal = {
    authSubject: "test:harness",
    email: "harness@example.test",
}

export async function executeGql(
    server: BaseApolloServer,
    query: string,
    variables: Record<string, unknown>,
    principal: Principal | null = testHarnessPrincipal,
): Promise<GraphQLResponse<Record<string, unknown>>> {
    const context = new GraphqlRequestContext(principal ?? undefined)
    return await server.executeOperation({ query, variables }, { contextValue: context })
}

export async function executeGqlSuccess(
    server: BaseApolloServer,
    query: string,
    variables: Record<string, unknown>,
    principal?: Principal,
): Promise<FormattedExecutionResult<Record<string, unknown>>> {
    const response = await executeGql(server, query, variables, principal)
    assert(response.body.kind === "single")
    const result = response.body.singleResult
    if (result.errors !== undefined) {
        const firstError = result.errors[0]
        const stacktrace = firstError.extensions?.stacktrace
        if (Array.isArray(stacktrace)) {
            console.log(stacktrace.join("\n"))
        }
        throw new Error(`GQL operation failed: ${firstError.message}`)
    }
    return result
}

/**
 * Executes an operation and returns the object at the given response path
 * (for example "createAccount" or "users").
 */
export async function executeGqlAt<T>(
    server: BaseApolloServer,
    query: string,
    variables: Record<string, unknown>,
    responsePath: string,
    principal?: Principal,
): Promise<T> {
    const result = await executeGqlSuccess(server, query, variables, principal)
    assert(result.data != null)
    const value = (result.data as Record<string, unknown>)[responsePath]
    assert(value != null, `Response is missing "${responsePath}"`)
    return value as T
}

/**
 * Extracts the first GraphQL error from a response, asserting one exists.
 */
export function firstGqlError(response: GraphQLResponse<Record<string, unknown>>): {
    message: string
    code: string | undefined
} {
    assert(response.body.kind === "single")
    const errors = response.body.singleResult.errors
    assert(errors !== undefined && errors.length > 0, "Expected the GQL operation to fail.")
    return {
        message: errors[0].message,
        code: errors[0].extensions?.code as string | undefined,
    }
}
