import { createDomainDatabase } from "./BaseDatabase.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"
import { projectsTable } from "./Project/Project.js"
import { projectMembershipsTable } from "./Project/ProjectMembership.js"

// The Project domain's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const projectDb = createDomainDatabase({
    projectsTable,
    projectMembershipsTable,
    idempotencyKeysTable,
})

export type ProjectDatabase = typeof projectDb
