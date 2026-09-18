import { createDomainDatabase } from "./BaseDatabase.js"
import { cfoInvitesTable } from "./Cfo/CfoInvite.js"
import { cfoMembershipsTable } from "./Cfo/CfoMembership.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"

// The CFO practice domain's database handle. Shares the common pool today;
// can be pointed at a dedicated database later without touching services or
// resolvers.
export const cfoDb = createDomainDatabase({
    cfoMembershipsTable,
    cfoInvitesTable,
    idempotencyKeysTable,
})

export type CfoDatabase = typeof cfoDb
