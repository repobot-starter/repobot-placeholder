import { sql } from "drizzle-orm"
import { check, index, text, timestamp, unique } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

export const allJobRunStatuses = ["RUNNING", "SUCCEEDED", "FAILED"] as const
export type JobRunStatus = (typeof allJobRunStatuses)[number]

/**
 * The scheduled-jobs run ledger (docs/jobs.md). One row per (job, due time);
 * the unique constraint IS the run-once lock: a tick claims a due time with
 * INSERT ... ON CONFLICT DO NOTHING, so of any number of concurrent ticks
 * exactly one wins the claim and runs the handler. The row then records the
 * outcome (SUCCEEDED, or FAILED with the error) for the jobRuns query.
 */
export const jobRunsTable = baseTable(
    "job_runs",
    {
        /** The registry name of the job (src/Jobs/JobsRegistry.ts). */
        jobName: text("job_name").notNull(),
        /** The cron due time this run claimed (UTC, minute precision). */
        scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
        startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
        finishedAt: timestamp("finished_at", { withTimezone: true }),
        status: text("status", { enum: allJobRunStatuses }).notNull(),
        /** The thrown error's message when status is FAILED. */
        error: text("error"),
    },
    (table) => [
        unique("job_runs_job_name_scheduled_for_unique").on(table.jobName, table.scheduledFor),
        index("job_runs_job_name_idx").on(table.jobName),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("job_runs_status_check", sql`${table.status} IN ('RUNNING', 'SUCCEEDED', 'FAILED')`),
    ],
)

export type JobRun = typeof jobRunsTable.$inferSelect
export type NewJobRun = typeof jobRunsTable.$inferInsert
