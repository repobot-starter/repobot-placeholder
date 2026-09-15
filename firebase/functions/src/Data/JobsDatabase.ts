import { createDomainDatabase } from "./BaseDatabase.js"
import { jobRunsTable } from "./Jobs/JobRun.js"

// The jobs kernel's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const jobsDb = createDomainDatabase({
    jobRunsTable,
})

export type JobsDatabase = typeof jobsDb
