# Scheduled jobs

The jobs kernel: recurring work as **config in a registry**, executed by a
tick with an exactly-once-per-due-time claim. Domains that need something to
happen on a schedule — purging stale rows, sending digests, recomputing
rollups — register a job and never touch timers or schedulers themselves.

| Piece             | Where                                                      | What it is                                                                 |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| Registry          | `firebase/functions/src/Jobs/JobsRegistry.ts`              | `scheduledJobs`: name + cron expression + description + handler            |
| Cron matcher      | `firebase/functions/src/Jobs/CronSchedule.ts`              | Dependency-free 5-field cron subset (UTC); unsupported syntax fails loudly |
| Run ledger        | `firebase/functions/src/Data/Jobs/JobRun.ts`               | `job_runs`: one row per claimed (job, due time) with status and error      |
| Engine            | `firebase/functions/src/Services/Jobs/JobsService.ts`      | `tick()`: compute due times, claim, run, record                            |
| HTTP              | `firebase/functions/src/CloudFunctions/Jobs.ts`            | `jobs__request__api`: `POST /tick`, guarded by `JOBS_TOKEN`                |
| Local ticker      | `firebase/functions/src/Services/Jobs/LocalJobsTicker.ts`  | Emulator-only 60s interval so the sandbox needs no scheduler               |
| Consumer exemplar | `Services/Identity/BuiltinAuth` (`purgeExpiredEmailCodes`) | Hourly purge of long-expired auth email-code rows                          |

## Two modes, one tick

Like payments and storage, jobs run in two modes chosen by `JOBS_MODE`
(see `docs/environments-and-secrets.md`):

- `JOBS_MODE=local` — the sandbox default and the dev-posture fallback.
  An in-process ticker calls `jobsService.tick()` every 60 seconds, started
  with the functions emulator (never in tests, never when deployed).
  Production boot refuses this mode.
- `JOBS_MODE=scheduler` — deployed environments with the `JOBS` capability.
  The platform provisions **one Cloud Scheduler job per environment** that
  `POST`s `/tick` on `jobs__request__api` every 5 minutes with the
  platform-minted `JOBS_TOKEN` as a bearer token. One scheduler job total,
  regardless of how many jobs the registry declares — the registry decides
  what is due.

The tick is identical in both modes:

1. For each registered job, compute the **most recent due time** at or
   before now from its cron expression (UTC, minute precision).
2. Claim it: `INSERT ... ON CONFLICT DO NOTHING` on the unique
   `(job_name, scheduled_for)` of `job_runs`. **The claim is the lock** —
   of any number of concurrent ticks, exactly one wins each due time.
3. Run the winner's handler; record `SUCCEEDED`, or `FAILED` with the
   thrown error. Either way, continue to the next job.

Tick cadence is independent of job schedules: a tick where nothing new is
due only loses claim conflicts and runs nothing, so the 5-minute scheduler
cadence and the 60-second local ticker both work for any registry. A due
time is claimed at most once ever — a job scheduled hourly runs on the
first tick after each top of the hour and no tick in between re-runs it.

## Adding a job

Add an entry to `scheduledJobs` in `src/Jobs/JobsRegistry.ts`: a unique
name, a 5-field cron expression, a one-line description, and a handler that
calls the owning domain's service (the registry orchestrates; domain logic
stays in the domain — the exemplar calls
`builtinAuthService.purgeExpiredEmailCodes()`). Registration validates the
expression at module load, so a typo fails the boot with the exact problem.

The cron subset: `*`, numbers, ranges (`1-5`), steps over `*` or a range
(`10-40/10`), and comma lists — evaluated in UTC. Names (`MON`, `JAN`),
macros (`@hourly`), seconds fields, `?`, `L`, `W`, `#`, and single-value
step anchors are refused at registration (`CronSchedule.ts` documents why).

## Invariants

- **Recurring work is never hand-rolled.** No domain uses
  `setInterval`/`setTimeout` (or a bespoke scheduler) for recurring work —
  it registers a job in the jobs registry. The kernel's own local ticker is
  the machinery underneath, not a precedent.
- **Handlers must be idempotent.** The claim guarantees **at most one run
  per due time**, not exactly-once execution semantics across crashes: a
  process that dies after claiming leaves that due time consumed (the row
  stays `RUNNING`), and the work happens again at the next due time.
  Handlers therefore must be safe to run twice and safe to skip once —
  deletes with cutoffs, upserts, convergent recomputation.
- **A failing job never breaks the tick.** A thrown handler records
  `FAILED` with its error on the run row and the loop moves on; `/tick`
  itself still returns 200.
- `POST /tick` is never open on a deployed environment: a configured
  `JOBS_TOKEN` is enforced (constant-time) everywhere, and a deployed
  environment without one refuses to tick rather than ticking for anyone.

## Observability

`jobRuns(jobName, limit)` (GraphQL, authenticated) returns the run ledger
newest-first: what ran, when it was due, when it started and finished, and
the error when it failed. That is the whole read surface — ticking never
goes through GraphQL.

## Testing

`firebase/functions/test/Jobs/` pins the kernel: cron due-time math
(steps, ranges, lists, the day-of-month/day-of-week OR rule), the claim
running exactly once under a simulated concurrent tick, failure recording
that never breaks the tick, the `/tick` token guard, the auth-code purge
deleting expired rows while leaving live ones, and the production boot
refusal of `JOBS_MODE=local`.
