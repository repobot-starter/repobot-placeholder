import { createDomainDatabase } from "./BaseDatabase.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"
import { uploadsTable } from "./Storage/Upload.js"

// The storage kernel's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const storageDb = createDomainDatabase({
    uploadsTable,
    idempotencyKeysTable,
})

export type StorageDatabase = typeof storageDb
