import { integer, text, unique } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

/**
 * Daily pageview rollups computed from analytics_events by the
 * analytics-rollup job (docs/analytics.md). These two tables ARE the
 * kernel's reporting contract: the platform's dashboard reads them by name
 * over its environment-database passthrough, exactly like the Files/Users/
 * Jobs operate pages read uploads/users/job_runs. Renaming a table or
 * column here breaks the owner's Analytics page.
 *
 * The unique day keys make the rollup convergent: recomputing a day deletes
 * and reinserts it, so reruns never double-count. Rows older than the
 * aggregate retention window (90 days) are pruned by the same job.
 */
export const analyticsDailyTable = baseTable(
    "analytics_daily",
    {
        /** UTC calendar day, 'YYYY-MM-DD'. */
        day: text("day").notNull(),
        pageviews: integer("pageviews").notNull(),
        /** Distinct daily-salted visitor hashes seen that day. */
        uniqueVisitors: integer("unique_visitors").notNull(),
    },
    (table) => [unique("analytics_daily_day_unique").on(table.day)],
)

export const analyticsPageDailyTable = baseTable(
    "analytics_page_daily",
    {
        /** UTC calendar day, 'YYYY-MM-DD'. */
        day: text("day").notNull(),
        /** Normalized request path: query stripped, bounded length. */
        path: text("path").notNull(),
        pageviews: integer("pageviews").notNull(),
        /** Distinct daily-salted visitor hashes for the path that day. */
        uniqueVisitors: integer("unique_visitors").notNull(),
    },
    (table) => [unique("analytics_page_daily_day_path_unique").on(table.day, table.path)],
)

export type AnalyticsDaily = typeof analyticsDailyTable.$inferSelect
export type AnalyticsPageDaily = typeof analyticsPageDailyTable.$inferSelect
