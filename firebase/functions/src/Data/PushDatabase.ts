import { createDomainDatabase } from "./BaseDatabase.js"
import { pushDevicesTable } from "./Push/PushDevice.js"

// The push kernel's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const pushDb = createDomainDatabase({
    pushDevicesTable,
})

export type PushDatabase = typeof pushDb
