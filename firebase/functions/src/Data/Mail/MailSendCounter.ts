import { integer, text, unique } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

/**
 * Per-day counter of outgoing email over the shared platform SMTP account,
 * backing the daily send quota (docs/mail.md). One row per UTC calendar day;
 * the unique day key gives the increment its upsert semantics, exactly like
 * the analytics rollups. Template mail and auth mail count into the same row
 * — they share the SMTP account, so they share the quota.
 */
export const mailSendCountersTable = baseTable(
    "mail_send_counters",
    {
        /** UTC calendar day, 'YYYY-MM-DD'. */
        day: text("day").notNull(),
        /** Sends reserved that day (template + auth mail together). */
        sentCount: integer("sent_count").notNull(),
    },
    (table) => [unique("mail_send_counters_day_unique").on(table.day)],
)

export type MailSendCounter = typeof mailSendCountersTable.$inferSelect
export type NewMailSendCounter = typeof mailSendCountersTable.$inferInsert
