import { createDomainDatabase } from "./BaseDatabase.js"
import { flowLinesTable } from "./Flow/FlowLine.js"
import { flowTemplatesTable } from "./Flow/FlowTemplate.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"

// The budgeting domain's database handle. Shares the common pool today; can
// be pointed at a dedicated database later without touching services or
// resolvers.
export const flowDb = createDomainDatabase({
    flowTemplatesTable,
    flowLinesTable,
    idempotencyKeysTable,
})

export type FlowDatabase = typeof flowDb
