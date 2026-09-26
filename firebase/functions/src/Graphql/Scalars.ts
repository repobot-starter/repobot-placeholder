import { GraphQLScalarType, Kind } from "graphql"
import { RpcError } from "../Utils/RpcError.js"

/**
 * A point in time, serialized as an RFC 3339 / ISO 8601 UTC string.
 */
export const instantScalar = new GraphQLScalarType<Date | string, string>({
    name: "Instant",
    description: "A point in time, encoded as an RFC 3339 / ISO 8601 UTC string.",
    serialize(value) {
        if (value instanceof Date) {
            return value.toISOString()
        }
        if (typeof value === "string") {
            return new Date(value).toISOString()
        }
        throw new RpcError("INTERNAL", `Cannot serialize value as Instant: ${String(value)}`)
    },
    parseValue(value) {
        if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
            throw new RpcError("INVALID_ARGUMENT", "Instant must be an ISO 8601 string.")
        }
        return new Date(value)
    },
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING || Number.isNaN(Date.parse(ast.value))) {
            throw new RpcError("INVALID_ARGUMENT", "Instant must be an ISO 8601 string.")
        }
        return new Date(ast.value)
    },
})

/**
 * Globally unique, prefixed row id (for example "proj_5f0c..."). Passed
 * through as a string.
 */
export const idScalar = new GraphQLScalarType<string, string>({
    name: "Id",
    description: 'A globally unique, prefixed row id (for example "proj_5f0c...").',
    serialize(value) {
        if (typeof value !== "string") {
            throw new RpcError("INTERNAL", `Cannot serialize value as Id: ${String(value)}`)
        }
        return value
    },
    parseValue(value) {
        if (typeof value !== "string" || value.length === 0) {
            throw new RpcError("INVALID_ARGUMENT", "Id must be a non-empty string.")
        }
        return value
    },
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING || ast.value.length === 0) {
            throw new RpcError("INVALID_ARGUMENT", "Id must be a non-empty string.")
        }
        return ast.value
    },
})
