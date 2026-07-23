import { GqlResolvers } from "../../generated/GraphqlResolverTypes.js"
import { aiResolvers } from "./Resolvers/Ai/AiResolvers.js"
import { accountResolvers } from "./Resolvers/Identity/AccountResolvers.js"
import { userResolvers } from "./Resolvers/Identity/UserResolvers.js"
import { userSchemaFormResolvers } from "./Resolvers/Identity/UserSchemaFormResolvers.js"
import { projectResolvers } from "./Resolvers/Project/ProjectResolvers.js"
import { projectSchemaFormResolvers } from "./Resolvers/Project/ProjectSchemaFormResolvers.js"
import { shopResolvers } from "./Resolvers/Shop/ShopResolvers.js"
import { idScalar, instantScalar } from "./Scalars.js"

/**
 * Merges every domain's resolvers into the single map that the Apollo server
 * is built from.
 */
export function getGraphqlResolvers(): GqlResolvers {
    const domainResolvers = [
        accountResolvers,
        userResolvers,
        userSchemaFormResolvers,
        projectResolvers,
        projectSchemaFormResolvers,
        shopResolvers,
        aiResolvers,
    ]

    const merged: GqlResolvers = {
        Id: idScalar,
        Instant: instantScalar,
        Query: {},
        Mutation: {},
    }

    for (const resolvers of domainResolvers) {
        for (const [typeName, typeResolvers] of Object.entries(resolvers)) {
            const existing = (merged as Record<string, unknown>)[typeName]
            ;(merged as Record<string, unknown>)[typeName] = {
                ...(typeof existing === "object" && existing !== null ? existing : {}),
                ...(typeResolvers as object),
            }
        }
    }

    return merged
}
