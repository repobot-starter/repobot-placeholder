import { GqlResolvers } from "../../../../generated/GraphqlResolverTypes.js"
import { jobsService } from "../../../Services/Jobs/JobsService.js"

/**
 * Jobs kernel resolvers: the run-ledger read surface. Authenticated (never
 * in the public allowlists in GraphqlServer.ts) — run history names internal
 * jobs and their failures, which is owner/agent material, not public. No
 * mutations: ticking happens on the jobs HTTP function, never through
 * GraphQL.
 */
export const jobsResolvers: GqlResolvers = {
    Query: {
        jobRuns: async (_parent, { jobName, limit }) => {
            const runs = await jobsService.listRuns({
                jobName: jobName ?? undefined,
                limit: limit ?? undefined,
            })
            return runs.map((run) => ({
                id: run.id,
                jobName: run.jobName,
                scheduledFor: run.scheduledFor,
                startedAt: run.startedAt,
                finishedAt: run.finishedAt ?? undefined,
                status: run.status,
                error: run.error ?? undefined,
            }))
        },
    },
}
