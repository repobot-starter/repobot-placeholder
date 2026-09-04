import { GqlResolvers } from "../../generated/GraphqlResolverTypes.js"
import { aiResolvers } from "./Resolvers/Ai/AiResolvers.js"
import { cfoResolvers } from "./Resolvers/Cfo/CfoResolvers.js"
import { creditResolvers } from "./Resolvers/Credit/CreditResolvers.js"
import { driveResolvers } from "./Resolvers/Drive/DriveResolvers.js"
import { entryResolvers } from "./Resolvers/Entry/EntryResolvers.js"
import { entrySchemaFormResolvers } from "./Resolvers/Entry/EntrySchemaFormResolvers.js"
import { songsResolvers } from "./Resolvers/Songs/SongsResolvers.js"
import { songsSchemaFormResolvers } from "./Resolvers/Songs/SongsSchemaFormResolvers.js"
import { flowResolvers } from "./Resolvers/Flow/FlowResolvers.js"
import { interpretResolvers } from "./Resolvers/Interpret/InterpretResolvers.js"
import { accountResolvers } from "./Resolvers/Identity/AccountResolvers.js"
import { jobsResolvers } from "./Resolvers/Jobs/JobsResolvers.js"
import { userResolvers } from "./Resolvers/Identity/UserResolvers.js"
import { userSchemaFormResolvers } from "./Resolvers/Identity/UserSchemaFormResolvers.js"
import { paymentsResolvers } from "./Resolvers/Payments/PaymentsResolvers.js"
import { pitchResolvers } from "./Resolvers/Pitch/PitchResolvers.js"
import { projectResolvers } from "./Resolvers/Project/ProjectResolvers.js"
import { projectSchemaFormResolvers } from "./Resolvers/Project/ProjectSchemaFormResolvers.js"
import { pushResolvers } from "./Resolvers/Push/PushResolvers.js"
import { quickBooksResolvers } from "./Resolvers/QuickBooks/QuickBooksResolvers.js"
import { saasResolvers } from "./Resolvers/Saas/SaasResolvers.js"
import { shopResolvers } from "./Resolvers/Shop/ShopResolvers.js"
import { storageResolvers } from "./Resolvers/Storage/StorageResolvers.js"
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
        saasResolvers,
        paymentsResolvers,
        quickBooksResolvers,
        cfoResolvers,
        creditResolvers,
        flowResolvers,
        entryResolvers,
        entrySchemaFormResolvers,
        songsResolvers,
        songsSchemaFormResolvers,
        interpretResolvers,
        pitchResolvers,
        storageResolvers,
        driveResolvers,
        jobsResolvers,
        pushResolvers,
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
