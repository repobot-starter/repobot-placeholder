import fs from "node:fs"
import path from "node:path"
import {
    ApolloServer,
    ApolloServerPlugin,
    GraphQLRequestContextExecutionDidStart,
    GraphQLRequestExecutionListener,
    GraphQLRequestListener,
} from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import cors from "cors"
import DataLoader from "dataloader"
import express, { Express } from "express"
import { GraphQLFormattedError, OperationTypeNode, SelectionNode } from "graphql"
import { Account } from "../Data/Identity/Account.js"
import { User } from "../Data/Identity/User.js"
import { Project } from "../Data/Project/Project.js"
import { accountService } from "../Services/Identity/AccountService.js"
import { principalService } from "../Services/Identity/PrincipalService.js"
import { userService } from "../Services/Identity/UserService.js"
import { projectService } from "../Services/Project/ProjectService.js"
import { validatedEnv } from "../Utils/Env.js"
import { orderedBatchLoad } from "../Utils/DataLoaderUtils.js"
import { Principal } from "../Utils/Principal.js"
import { RpcError } from "../Utils/RpcError.js"
import { getGraphqlResolvers } from "./GraphqlResolvers.js"

/**
 * The context passed to every GraphQL resolver: the authenticated principal
 * plus per-request dataloaders. The loaders are created fresh per request so
 * their caches never leak across requests, and they delegate to service batch
 * methods so resolvers never touch the database directly.
 */
export class GraphqlRequestContext {
    readonly principal: Principal | undefined

    readonly accountDataloader: DataLoader<string, Account>
    readonly userDataloader: DataLoader<string, User>
    readonly projectDataloader: DataLoader<string, Project>

    constructor(principal: Principal | undefined) {
        this.principal = principal
        this.accountDataloader = orderedBatchLoad((ids) => accountService.orderedBatchLoadAccountsByIds(ids))
        this.userDataloader = orderedBatchLoad((ids) => userService.orderedBatchLoadUsersByIds(ids))
        this.projectDataloader = orderedBatchLoad((ids) => projectService.orderedBatchLoadProjectsByIds(ids))
    }
}

export type BaseApolloServer = ApolloServer<GraphqlRequestContext>

interface PendingGraphqlServer {
    apolloServer: BaseApolloServer
}

/**
 * The GraphQL SDL is the source of truth at /Graphql in the repo root;
 * prebuild.sh copies it into generated/Graphql so it ships with the deploy.
 */
function loadTypeDefs(): string {
    const graphqlDir = path.resolve(process.cwd(), "generated", "Graphql")
    return collectSdlFiles(graphqlDir)
        .map((file) => fs.readFileSync(file, "utf8"))
        .join("\n")
}

function collectSdlFiles(dir: string): string[] {
    return fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) => {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) return collectSdlFiles(fullPath)
            return entry.name.endsWith(".gql") ? [fullPath] : []
        })
        .sort()
}

function formatError(formattedError: GraphQLFormattedError): GraphQLFormattedError {
    // Keep extensions.code (RpcError statuses surface there) but never leak
    // stack traces to clients.
    const extensions = { ...formattedError.extensions }
    delete extensions.stacktrace
    return { ...formattedError, extensions }
}

/**
 * Partially constructs the GraphQL server. Tests execute operations against
 * the returned Apollo server directly (executeOperation with an explicit
 * contextValue); production wraps it in Express via buildGraphqlExpressApp.
 */
export function buildPendingGraphqlServer(): PendingGraphqlServer {
    const apolloServer: BaseApolloServer = new ApolloServer({
        typeDefs: loadTypeDefs(),
        resolvers: getGraphqlResolvers(),
        plugins: [authorizationPlugin],
        introspection: true,
        includeStacktraceInErrorResponses: true,
        formatError,
    })
    return { apolloServer }
}

/**
 * Layer 1 of the two-layer authorization model (see docs/authorization.md):
 * every operation is gated on an authenticated principal before any resolver
 * runs, so no resolver can be reached anonymously by omission. Layer 2 -
 * per-resource checks like project membership - lives in the services.
 *
 * Introspection, the Shop domain, and the Ai voice broker are public. Shop
 * checkout is anonymous by design (buyers never sign in; see
 * docs/payments.md) — its service methods are safe without a principal
 * because prices are server-side and test completion refuses outside
 * PAYMENTS_MODE=local. createAiVoiceSession is likewise safe: the OpenAI key
 * stays server-side and only a short-lived Realtime client secret is minted.
 * To expose another public root field, add it to the matching set below.
 */
const publicQueryRootFields = new Set<string>(["__schema", "__type", "shopProduct", "checkoutSession"])

const publicMutationRootFields = new Set<string>([
    "createCheckoutSession",
    "completeTestCheckoutSession",
    "createAiVoiceSession",
])

const authorizationPlugin: ApolloServerPlugin<GraphqlRequestContext> = {
    requestDidStart: async () => authorizationRequestListener,

    // Errors thrown from executionDidStart surface as opaque "Internal server
    // error" unless rethrown here; this workaround keeps the RpcError's
    // UNAUTHENTICATED code visible to clients. See
    // https://github.com/apollographql/apollo-server/issues/7278#issuecomment-1370386723.
    unexpectedErrorProcessingRequest: async ({ error }) => {
        throw error
    },
}

const authorizationRequestListener: GraphQLRequestListener<GraphqlRequestContext> = {
    async executionDidStart(
        requestContext: GraphQLRequestContextExecutionDidStart<GraphqlRequestContext>,
    ): Promise<GraphQLRequestExecutionListener<GraphqlRequestContext> | void> {
        return authorizeExecution(requestContext)
    },
}

function authorizeExecution(
    requestContext: GraphQLRequestContextExecutionDidStart<GraphqlRequestContext>,
): void {
    if (isPublicOperation(requestContext)) {
        return
    }
    if (requestContext.contextValue.principal === undefined) {
        throw new RpcError("UNAUTHENTICATED", "This operation requires an authenticated caller.")
    }
}

/**
 * An operation is public only when every root field it selects is in the
 * public set for its operation type, so a public field can never smuggle a
 * protected one through in the same document.
 */
function isPublicOperation(
    requestContext: GraphQLRequestContextExecutionDidStart<GraphqlRequestContext>,
): boolean {
    let publicRootFields: Set<string>
    switch (requestContext.operation.operation) {
        case OperationTypeNode.QUERY:
            publicRootFields = publicQueryRootFields
            break
        case OperationTypeNode.MUTATION:
            publicRootFields = publicMutationRootFields
            break
        default:
            return false
    }
    for (const fieldName of rootFieldNames(requestContext)) {
        if (!publicRootFields.has(fieldName)) {
            return false
        }
    }
    return true
}

function rootFieldNames(
    requestContext: GraphQLRequestContextExecutionDidStart<GraphqlRequestContext>,
): Set<string> {
    const fieldNames = new Set<string>()
    const fragmentSelectionsByName = new Map<string, readonly SelectionNode[]>()
    for (const definition of requestContext.document.definitions) {
        if (definition.kind === "FragmentDefinition") {
            fragmentSelectionsByName.set(definition.name.value, definition.selectionSet.selections)
        }
    }
    addFieldNamesFromSelections(
        requestContext.operation.selectionSet.selections,
        fieldNames,
        fragmentSelectionsByName,
    )
    return fieldNames
}

function addFieldNamesFromSelections(
    selections: readonly SelectionNode[],
    fieldNames: Set<string>,
    fragmentSelectionsByName: Map<string, readonly SelectionNode[]>,
): void {
    for (const selection of selections) {
        if (selection.kind === "Field") {
            fieldNames.add(selection.name.value)
            continue
        }
        if (selection.kind === "InlineFragment") {
            addFieldNamesFromSelections(
                selection.selectionSet.selections,
                fieldNames,
                fragmentSelectionsByName,
            )
            continue
        }
        if (selection.kind === "FragmentSpread") {
            const fragmentSelections = fragmentSelectionsByName.get(selection.name.value)
            if (fragmentSelections !== undefined) {
                addFieldNamesFromSelections(fragmentSelections, fieldNames, fragmentSelectionsByName)
            }
        }
    }
}

/**
 * Builds the Express app that graphql__request__api serves. Authentication
 * happens here: the Bearer token is verified and the principal hydrated
 * before any resolver runs.
 */
export function buildGraphqlExpressApp(): Express {
    const { apolloServer } = buildPendingGraphqlServer()
    apolloServer.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests()

    const expressApp = express()
    expressApp.use(
        cors<cors.CorsRequest>(),
        express.json(),
        expressMiddleware(apolloServer, {
            context: async ({ req }) => {
                // Fail fast with an actionable message when env is misconfigured.
                validatedEnv()
                const principal = await principalService.principalFromAuthorizationHeader(
                    req.headers.authorization,
                )
                return new GraphqlRequestContext(principal)
            },
        }),
    )
    return expressApp
}
