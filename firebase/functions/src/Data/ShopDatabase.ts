import { createDomainDatabase } from "./BaseDatabase.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"
import { checkoutSessionsTable } from "./Shop/CheckoutSession.js"

// The Shop domain's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const shopDb = createDomainDatabase({
    checkoutSessionsTable,
    idempotencyKeysTable,
})

export type ShopDatabase = typeof shopDb
