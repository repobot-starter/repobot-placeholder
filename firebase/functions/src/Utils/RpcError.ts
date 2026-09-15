import { GraphQLError } from "graphql"

// These error statuses match those defined by gRPC.
export type RpcStatus =
    | "OK"
    | "CANCELLED"
    | "UNKNOWN"
    | "INVALID_ARGUMENT"
    | "DEADLINE_EXCEEDED"
    | "NOT_FOUND"
    | "ALREADY_EXISTS"
    | "PERMISSION_DENIED"
    | "UNAUTHENTICATED"
    | "RESOURCE_EXHAUSTED"
    | "FAILED_PRECONDITION"
    | "ABORTED"
    | "OUT_OF_RANGE"
    | "UNIMPLEMENTED"
    | "INTERNAL"
    | "UNAVAILABLE"
    | "DATA_LOSS"

/**
 * The one error type that services and resolvers throw. It is a GraphQLError
 * subclass, so the status code flows to GraphQL clients via extensions.code
 * without any translation layer. Never throw a bare Error.
 */
export class RpcError extends GraphQLError {
    readonly status: RpcStatus

    constructor(status: RpcStatus, message: string, options?: { cause?: unknown }) {
        super(message, {
            extensions: { code: status },
            originalError: options?.cause instanceof Error ? options.cause : undefined,
        })
        this.status = status
        this.name = "RpcError"
    }
}

export function httpStatusFromRpcStatus(status: RpcStatus): number {
    switch (status) {
        case "OK":
            return 200
        case "INVALID_ARGUMENT":
            return 400
        case "UNAUTHENTICATED":
            return 401
        case "PERMISSION_DENIED":
            return 403
        case "NOT_FOUND":
            return 404
        case "FAILED_PRECONDITION":
        case "ALREADY_EXISTS":
        case "RESOURCE_EXHAUSTED":
        case "ABORTED":
        case "OUT_OF_RANGE":
            return 409
        case "UNIMPLEMENTED":
            return 501
        case "UNAVAILABLE":
            return 503
        case "INTERNAL":
        case "DATA_LOSS":
        case "CANCELLED":
        case "UNKNOWN":
        case "DEADLINE_EXCEEDED":
            return 500
    }
}

/**
 * Asserts an invariant, throwing an INTERNAL RpcError when it does not hold.
 */
export function check(condition: boolean, message = "Internal invariant violated."): asserts condition {
    if (!condition) {
        throw new RpcError("INTERNAL", message)
    }
}

/**
 * Validates a caller-supplied argument, throwing INVALID_ARGUMENT when invalid.
 */
export function checkArgument(condition: boolean, message: string): asserts condition {
    if (!condition) {
        throw new RpcError("INVALID_ARGUMENT", message)
    }
}
