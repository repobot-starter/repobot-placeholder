import { BaseApolloServer } from "../../../src/Graphql/GraphqlServer.js"

/**
 * Domain test helpers (test/Identity/IdentityTestHelper.ts, ...) extend this.
 * They wrap GraphQL operations so tests exercise the real API blackbox-style.
 */
export class BaseTestHelper {
    readonly server: BaseApolloServer

    constructor(server: BaseApolloServer) {
        this.server = server
    }
}
