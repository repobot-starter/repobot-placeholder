import { analyticsService } from "../Services/Analytics/AnalyticsService.js"
import { builtinAuthService } from "../Services/Identity/BuiltinAuth/BuiltinAuthService.js"
import { pushDigestService } from "../Services/Push/PushDigestService.js"
import { parseCronExpression } from "./CronSchedule.js"

/**
 * The jobs registry: recurring work as config, per the kernel rubric
 * (docs/jobs.md). A job is a name, a 5-field cron expression (UTC), a
 * description, and a handler — never a hand-rolled setInterval/setTimeout
 * in a domain.
 *
 * Handlers must be idempotent: the run ledger's claim guarantees at most
 * one run per due time, but a crash after the claim means that due time is
 * simply skipped — rerunning later must always be safe. A handler that
 * throws is recorded FAILED with its error and never breaks the tick.
 */
export interface ScheduledJob {
    /** Unique registry key; also the job_runs ledger key. */
    name: string
    /** 5-field cron expression, UTC (supported subset: see CronSchedule.ts). */
    schedule: string
    description: string
    handler: () => Promise<void>
}

export const scheduledJobs: ScheduledJob[] = [
    {
        name: "purge-expired-auth-email-codes",
        // Hourly, on the hour.
        schedule: "0 * * * *",
        description:
            "Deletes auth email-code rows expired for over a day (builtin auth keeps " +
            "them briefly for the resend throttle; after that they are dead weight).",
        handler: async () => {
            await builtinAuthService.purgeExpiredEmailCodes()
        },
    },
    {
        name: "analytics-rollup",
        // Hourly at :10, so the dashboard's numbers lag pageviews by at
        // most an hour; each run convergently recomputes today and
        // yesterday (UTC) and enforces the retention windows.
        schedule: "10 * * * *",
        description:
            "Recomputes the first-party analytics daily rollups from raw pageview " +
            "events and prunes expired raw events (7 days) and rollups (90 days).",
        handler: async () => {
            await analyticsService.rollupAndPrune()
        },
    },
    {
        name: "push-activity-digest",
        // Daily at 14:00 UTC — morning in the Americas, evening in Asia.
        schedule: "0 14 * * *",
        description:
            "Sends the push kernel's exemplar digest (recent pageview count from the " +
            "analytics kernel) to every app user with a registered push device.",
        handler: async () => {
            await pushDigestService.sendActivityDigest()
        },
    },
]

// Registration-time validation: a bad cron expression or a duplicate name
// fails the boot with the exact problem, never a silent mis-schedule.
function assertValidScheduledJobs(): void {
    const seen = new Set<string>()
    for (const job of scheduledJobs) {
        if (job.name.trim() === "") {
            throw new Error("A scheduled job has an empty name.")
        }
        if (seen.has(job.name)) {
            throw new Error(`Duplicate scheduled job name "${job.name}".`)
        }
        seen.add(job.name)
        // Throws with an actionable message on unsupported syntax.
        parseCronExpression(job.schedule)
    }
}

assertValidScheduledJobs()
