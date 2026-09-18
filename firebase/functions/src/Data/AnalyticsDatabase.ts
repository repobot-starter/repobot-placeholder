import { analyticsEventsTable } from "./Analytics/AnalyticsEvent.js"
import { analyticsDailyTable, analyticsPageDailyTable } from "./Analytics/AnalyticsRollup.js"
import { createDomainDatabase } from "./BaseDatabase.js"

// The analytics kernel's database handle. Shares the common pool today; can
// be pointed at a dedicated database later without touching services.
export const analyticsDb = createDomainDatabase({
    analyticsEventsTable,
    analyticsDailyTable,
    analyticsPageDailyTable,
})

export type AnalyticsDatabase = typeof analyticsDb
