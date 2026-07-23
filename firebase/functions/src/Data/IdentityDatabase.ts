import { createDomainDatabase } from "./BaseDatabase.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"
import { accountsTable } from "./Identity/Account.js"
import { authEmailCodesTable } from "./Identity/AuthEmailCode.js"
import { authIdentitiesTable } from "./Identity/AuthIdentity.js"
import { authRefreshTokensTable } from "./Identity/AuthRefreshToken.js"
import { usersTable } from "./Identity/User.js"

// The Identity domain's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const identityDb = createDomainDatabase({
    accountsTable,
    usersTable,
    authIdentitiesTable,
    authEmailCodesTable,
    authRefreshTokensTable,
    idempotencyKeysTable,
})

export type IdentityDatabase = typeof identityDb
