import { desc, eq } from "drizzle-orm"
import { jobsDb } from "../../Data/JobsDatabase.js"
import { JobRun, jobRunsTable } from "../../Data/Jobs/JobRun.js"
import { mostRecentDueTime, parseCronExpression } from "../../Jobs/CronSchedule.js"
import { ScheduledJob, scheduledJobs } from "../../Jobs/JobsRegistry.js"
import { RpcError } from "../../Utils/RpcError.js"

/** What one tick decided for one registered job. */
export interface JobTickOutcome {
    jobName: string
    /** The due time this tick computed (UTC, minute precision). */
    scheduledFor: Date
    /**
     * SUCCEEDED/FAILED: this tick won the claim and ran the handler.
     * ALREADY_CLAIMED: another tick (or an earlier one) owns this due time.
     */
    outcome: "SUCCEEDED" | "FAILED" | "ALREADY_CLAIMED"
    error?: string
}

const DEFAULT_RUNS_LIMIT = 50
const MAX_RUNS_LIMIT = 200

/**
 * The jobs kernel's engine (docs/jobs.md). A tick computes each registered
 * job's most recent due time from its cron expression and claims it with an
 * INSERT ... ON CONFLICT DO NOTHING on the unique (job_name, scheduled_for)
 * — the claim is the lock, so any number of concurrent ticks (overlapping
 * Cloud Scheduler hits, the local interval ticker, a manual POST /tick)
 * collapse to at most one run per due time. A handler that throws is
 * recorded FAILED with its error and never breaks the rest of the tick.
 */
class JobsService {
    /**
     * Evaluates every registered job once. Cheap when nothing is due: the
     * claim insert conflicts and nothing runs, so tick cadence (60s locally,
     * 5 minutes from Cloud Scheduler) is independent of job schedules.
     */
    async tick(now = new Date()): Promise<JobTickOutcome[]> {
        const outcomes: JobTickOutcome[] = []
        for (const job of scheduledJobs) {
            outcomes.push(await this.tickJob(job, now))
        }
        return outcomes
    }

    /** Run history for the jobRuns query, newest first. */
    async listRuns(request: { jobName?: string; limit?: number }): Promise<JobRun[]> {
        const limit = request.limit ?? DEFAULT_RUNS_LIMIT
        if (!Number.isInteger(limit) || limit < 1 || limit > MAX_RUNS_LIMIT) {
            throw new RpcError(
                "INVALID_ARGUMENT",
                `limit must be an integer between 1 and ${MAX_RUNS_LIMIT}.`,
            )
        }
        const query = jobsDb.select().from(jobRunsTable)
        const filtered = request.jobName ? query.where(eq(jobRunsTable.jobName, request.jobName)) : query
        return await filtered.orderBy(desc(jobRunsTable.scheduledFor)).limit(limit)
    }

    private async tickJob(job: ScheduledJob, now: Date): Promise<JobTickOutcome> {
        // Registration already validated the expression; parsing here is cheap.
        const schedule = parseCronExpression(job.schedule)
        const scheduledFor = mostRecentDueTime(schedule, now)

        // The claim: exactly one insert can win a (job_name, scheduled_for)
        // pair. Losing the conflict means the due time is already owned —
        // running, succeeded, or failed — and this tick must not touch it.
        const [claimed] = await jobsDb
            .insert(jobRunsTable)
            .values({
                jobName: job.name,
                scheduledFor,
                startedAt: new Date(),
                status: "RUNNING",
            })
            .onConflictDoNothing({
                target: [jobRunsTable.jobName, jobRunsTable.scheduledFor],
            })
            .returning()
        if (claimed === undefined) {
            return { jobName: job.name, scheduledFor, outcome: "ALREADY_CLAIMED" }
        }

        try {
            await job.handler()
            await jobsDb
                .update(jobRunsTable)
                .set({ status: "SUCCEEDED", finishedAt: new Date() })
                .where(eq(jobRunsTable.id, claimed.id))
            return { jobName: job.name, scheduledFor, outcome: "SUCCEEDED" }
        } catch (error) {
            // A failing job never breaks the tick: record the error on the
            // run row and move on to the next job.
            const message = error instanceof Error ? error.message : String(error)
            console.error(`Scheduled job "${job.name}" failed.`, error)
            await jobsDb
                .update(jobRunsTable)
                .set({ status: "FAILED", finishedAt: new Date(), error: message })
                .where(eq(jobRunsTable.id, claimed.id))
            return { jobName: job.name, scheduledFor, outcome: "FAILED", error: message }
        }
    }
}

export const jobsService = new JobsService()
