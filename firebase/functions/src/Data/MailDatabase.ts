import { createDomainDatabase } from "./BaseDatabase.js"
import { mailSendCountersTable } from "./Mail/MailSendCounter.js"

// The mail kernel's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const mailDb = createDomainDatabase({
    mailSendCountersTable,
})

export type MailDatabase = typeof mailDb
