import { index, text } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

/**
 * One raw pageview ping from the analytics beacon (docs/analytics.md).
 * Privacy is structural: the row holds the UTC day, the normalized path, and
 * a daily-salted visitor hash — never the visitor's IP or user agent. The
 * salt rotates per UTC day, so hashes are unlinkable across days, and the
 * rollup job deletes rows older than the raw retention window (7 days).
 */
export const analyticsEventsTable = baseTable(
    "analytics_events",
    {
        /** UTC calendar day of the ping, 'YYYY-MM-DD'. */
        day: text("day").notNull(),
        /** Normalized request path: query stripped, bounded length. */
        path: text("path").notNull(),
        /** sha256(dailySalt(day) || ip || userAgent), hex-truncated. */
        visitorHash: text("visitor_hash").notNull(),
    },
    (table) => [index("analytics_events_day_idx").on(table.day)],
)

export type AnalyticsEvent = typeof analyticsEventsTable.$inferSelect
export type NewAnalyticsEvent = typeof analyticsEventsTable.$inferInsert
