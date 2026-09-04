import { createDomainDatabase } from "./BaseDatabase.js"
import { creditDocumentsTable } from "./Credit/CreditDocument.js"
import { creditLcsTable } from "./Credit/CreditLc.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"

// The letter-of-credit domain's database handle. Shares the common pool
// today; can be pointed at a dedicated database later without touching
// services or resolvers.
export const creditDb = createDomainDatabase({
    creditLcsTable,
    creditDocumentsTable,
    idempotencyKeysTable,
})

export type CreditDatabase = typeof creditDb
