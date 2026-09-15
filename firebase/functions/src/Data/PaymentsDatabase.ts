import { createDomainDatabase } from "./BaseDatabase.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"
import { checkoutSessionsTable } from "./Payments/CheckoutSession.js"
import { purchasesTable } from "./Payments/Purchase.js"
import { subscriptionsTable } from "./Payments/Subscription.js"

// The payments kernel's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const paymentsDb = createDomainDatabase({
    checkoutSessionsTable,
    purchasesTable,
    subscriptionsTable,
    idempotencyKeysTable,
})

export type PaymentsDatabase = typeof paymentsDb
