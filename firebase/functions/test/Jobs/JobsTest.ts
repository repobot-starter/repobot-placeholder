import { createServer, Server } from "node:http"
import { AddressInfo } from "node:net"
import { expect } from "chai"
import { and, eq } from "drizzle-orm"
import { buildJobsExpressApp } from "../../src/CloudFunctions/Jobs.js"
import { authEmailCodesTable } from "../../src/Data/Identity/AuthEmailCode.js"
import { identityDb } from "../../src/Data/IdentityDatabase.js"
import { jobRunsTable } from "../../src/Data/Jobs/JobRun.js"
import { jobsDb } from "../../src/Data/JobsDatabase.js"
import { ScheduledJob, scheduledJobs } from "../../src/Jobs/JobsRegistry.js"
import { jobsService } from "../../src/Services/Jobs/JobsService.js"
import { resetValidatedEnvForTests, validatedEnv } from "../../src/Utils/Env.js"
import { executeGql, executeGqlAt, firstGqlError } from "../Utils/Gql/GqlUtils.js"

const PURGE_JOB_NAME = "purge-expired-auth-email-codes"

const jobRunsQuery = `
    query JobRuns($jobName: String, $limit: Int) {
        jobRuns(jobName: $jobName, limit: $limit) {
            id
            jobName
            scheduledFor
            startedAt
            finishedAt
            status
            error
        }
    }
`

interface GqlJobRunResult {
    id: string
    jobName: string
    scheduledFor: string
    startedAt: string
    finishedAt: string | null
    status: string
    error: string | null
}

/**
 * Runs a block with an env override; the validated-env cache is reset around
 * it so services see the override.
 */
async function withEnv(
    overrides: Record<string, string | undefined>,
    block: () => Promise<void>,
): Promise<void> {
    const originals = new Map<string, string | undefined>()
    for (const [name, value] of Object.entries(overrides)) {
        originals.set(name, process.env[name])
        if (value === undefined) {
            delete process.env[name]
        } else {
            process.env[name] = value
        }
    }
    resetValidatedEnvForTests()
    try {
        await block()
    } finally {
        for (const [name, value] of originals) {
            if (value === undefined) {
                delete process.env[name]
            } else {
                process.env[name] = value
            }
        }
        resetValidatedEnvForTests()
    }
}

/** Prepends a job to the registry for one block, restoring it after. */
async function withRegisteredJob(job: ScheduledJob, block: () => Promise<void>): Promise<void> {
    scheduledJobs.unshift(job)
    try {
        await block()
    } finally {
        scheduledJobs.shift()
    }
}

function emailCodeRow(email: string, expiresAt: Date): typeof authEmailCodesTable.$inferInsert {
    return {
        email,
        purpose: "SIGN_IN",
        codeHash: "aa".repeat(32),
        linkTokenHash: "bb".repeat(32),
        expiresAt,
    }
}

describe("Jobs", function () {
    describe("tick claims", function () {
        it("runs a due job exactly once; later ticks for the same due time are ALREADY_CLAIMED", async function () {
            const now = new Date("2026-07-31T12:27:00Z")

            const first = await jobsService.tick(now)
            const won = first.find((outcome) => outcome.jobName === PURGE_JOB_NAME)
            expect(won?.outcome).to.equal("SUCCEEDED")
            // Hourly job: the most recent due time is the top of the hour.
            expect(won?.scheduledFor.toISOString()).to.equal("2026-07-31T12:00:00.000Z")

            // The same tick again, and a later tick within the same hour,
            // both lose the claim.
            const again = await jobsService.tick(now)
            expect(again.find((outcome) => outcome.jobName === PURGE_JOB_NAME)?.outcome).to.equal(
                "ALREADY_CLAIMED",
            )
            const later = await jobsService.tick(new Date("2026-07-31T12:55:00Z"))
            expect(later.find((outcome) => outcome.jobName === PURGE_JOB_NAME)?.outcome).to.equal(
                "ALREADY_CLAIMED",
            )

            // The ledger holds exactly one finished row for the due time.
            const rows = await jobsDb
                .select()
                .from(jobRunsTable)
                .where(
                    and(
                        eq(jobRunsTable.jobName, PURGE_JOB_NAME),
                        eq(jobRunsTable.scheduledFor, new Date("2026-07-31T12:00:00Z")),
                    ),
                )
            expect(rows).to.have.length(1)
            expect(rows[0].status).to.equal("SUCCEEDED")
            expect(rows[0].finishedAt).to.not.equal(null)
            expect(rows[0].id).to.match(/^jrun_/)
        })

        it("collapses simulated concurrent ticks to one run per due time", async function () {
            const now = new Date("2026-07-31T13:05:00Z")
            const [first, second] = await Promise.all([jobsService.tick(now), jobsService.tick(now)])
            const outcomes = [
                first.find((outcome) => outcome.jobName === PURGE_JOB_NAME)?.outcome,
                second.find((outcome) => outcome.jobName === PURGE_JOB_NAME)?.outcome,
            ]
            expect(outcomes.filter((outcome) => outcome === "SUCCEEDED")).to.have.length(1)
            expect(outcomes.filter((outcome) => outcome === "ALREADY_CLAIMED")).to.have.length(1)
        })

        it("records a failing job as FAILED with its error and finishes the tick", async function () {
            const failingJob: ScheduledJob = {
                name: "always-fails-for-tests",
                schedule: "* * * * *",
                description: "Test-only job whose handler always throws.",
                handler: async () => {
                    throw new Error("boom: intentional test failure")
                },
            }
            await withRegisteredJob(failingJob, async () => {
                const now = new Date("2026-07-31T14:07:00Z")
                const outcomes = await jobsService.tick(now)

                // The failing job (registered first, so it ran first) is
                // FAILED with its error...
                const failed = outcomes.find((outcome) => outcome.jobName === failingJob.name)
                expect(failed?.outcome).to.equal("FAILED")
                expect(failed?.error).to.contain("boom: intentional test failure")

                // ...and did not break the rest of the tick.
                const purge = outcomes.find((outcome) => outcome.jobName === PURGE_JOB_NAME)
                expect(purge?.outcome).to.equal("SUCCEEDED")

                const [row] = await jobsDb
                    .select()
                    .from(jobRunsTable)
                    .where(eq(jobRunsTable.jobName, failingJob.name))
                expect(row.status).to.equal("FAILED")
                expect(row.error).to.contain("boom: intentional test failure")
                expect(row.finishedAt).to.not.equal(null)
            })
        })
    })

    describe("purge-expired-auth-email-codes", function () {
        it("deletes long-expired codes and leaves recent and live ones", async function () {
            const hourMs = 60 * 60 * 1000
            await identityDb
                .insert(authEmailCodesTable)
                .values([
                    emailCodeRow("long-expired@example.test", new Date(Date.now() - 48 * hourMs)),
                    emailCodeRow("recently-expired@example.test", new Date(Date.now() - 2 * hourMs)),
                    emailCodeRow("still-live@example.test", new Date(Date.now() + hourMs)),
                ])

            const outcomes = await jobsService.tick()
            expect(outcomes.find((outcome) => outcome.jobName === PURGE_JOB_NAME)?.outcome).to.equal(
                "SUCCEEDED",
            )

            const remaining = await identityDb
                .select({ email: authEmailCodesTable.email })
                .from(authEmailCodesTable)
            const emails = remaining.map((row) => row.email)
            expect(emails).to.not.contain("long-expired@example.test")
            // Rows expired less than a day keep serving the resend throttle.
            expect(emails).to.contain("recently-expired@example.test")
            expect(emails).to.contain("still-live@example.test")
        })
    })

    describe("HTTP surface (jobs__request__api)", function () {
        let server: Server
        let baseUrl: string

        beforeEach(function (done) {
            server = createServer(buildJobsExpressApp())
            server.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                done()
            })
        })

        afterEach(function (done) {
            server.close(() => done())
        })

        async function postTick(headers: Record<string, string> = {}): Promise<Response> {
            return await fetch(`${baseUrl}/tick`, { method: "POST", headers })
        }

        it("ticks without a token in tests when none is configured", async function () {
            const response = await postTick()
            expect(response.status).to.equal(200)
            const body = (await response.json()) as {
                outcomes: { jobName: string; scheduledFor: string; outcome: string }[]
            }
            const purge = body.outcomes.find((outcome) => outcome.jobName === PURGE_JOB_NAME)
            expect(purge?.outcome).to.equal("SUCCEEDED")
            expect(purge?.scheduledFor).to.match(/T\d\d:00:00\.000Z$/)
        })

        it("enforces a configured JOBS_TOKEN in every mode", async function () {
            await withEnv({ JOBS_TOKEN: "platform-minted-token" }, async () => {
                const missing = await postTick()
                expect(missing.status).to.equal(401)

                const wrong = await postTick({ authorization: "Bearer forged" })
                expect(wrong.status).to.equal(403)

                const right = await postTick({ authorization: "Bearer platform-minted-token" })
                expect(right.status).to.equal(200)
            })
        })

        it("refuses ticks on a deployed environment with no token provisioned", async function () {
            // Deployed = neither emulator nor tests, faked via env overrides;
            // all the kernels' local modes are lifted so env validation
            // passes and only the token guard is under test.
            await withEnv(
                {
                    NODE_ENV: "production",
                    FUNCTIONS_EMULATOR: undefined,
                    AUTH_MODE: "builtin",
                    PAYMENTS_MODE: "stripe",
                    STORAGE_MODE: "gcs",
                    JOBS_MODE: "scheduler",
                    ELEVENLABS_MODE: "gateway",
                    JOBS_TOKEN: undefined,
                },
                async () => {
                    const refused = await postTick()
                    expect(refused.status).to.equal(409)
                    const body = (await refused.json()) as {
                        error: { code: string; message: string }
                    }
                    expect(body.error.code).to.equal("FAILED_PRECONDITION")
                    expect(body.error.message).to.contain("JOBS_TOKEN")
                },
            )
        })
    })

    describe("jobRuns query", function () {
        it("returns run history, optionally filtered by job name", async function () {
            await jobsService.tick(new Date("2026-07-31T15:03:00Z"))

            const all = await executeGqlAt<GqlJobRunResult[]>(this.apolloServer, jobRunsQuery, {}, "jobRuns")
            expect(all.length).to.be.greaterThan(0)

            const filtered = await executeGqlAt<GqlJobRunResult[]>(
                this.apolloServer,
                jobRunsQuery,
                { jobName: PURGE_JOB_NAME },
                "jobRuns",
            )
            expect(filtered).to.have.length(1)
            expect(filtered[0].jobName).to.equal(PURGE_JOB_NAME)
            expect(filtered[0].status).to.equal("SUCCEEDED")
            expect(filtered[0].finishedAt).to.not.equal(null)
            expect(filtered[0].error).to.equal(null)

            const none = await executeGqlAt<GqlJobRunResult[]>(
                this.apolloServer,
                jobRunsQuery,
                { jobName: "no-such-job" },
                "jobRuns",
            )
            expect(none).to.have.length(0)
        })

        it("refuses an out-of-bounds limit", async function () {
            const response = await executeGql(this.apolloServer, jobRunsQuery, { limit: 0 })
            expect(firstGqlError(response).code).to.equal("INVALID_ARGUMENT")
        })

        // The gate throws from the Apollo request pipeline (not a resolver),
        // matching the payments/storage precedent for anonymous callers.
        it("requires an authenticated caller", async function () {
            await expect(executeGql(this.apolloServer, jobRunsQuery, {}, null)).to.be.rejectedWith(
                "This operation requires an authenticated caller.",
            )
        })
    })

    describe("boot guard for the local mode", function () {
        // Deployed = neither emulator nor tests, faked via env overrides. The
        // sibling kernels' local modes are lifted to their deployed values so
        // only the jobs guard is under test.
        const deployedBase = {
            NODE_ENV: "production",
            FUNCTIONS_EMULATOR: undefined,
            AUTH_MODE: "builtin",
            PAYMENTS_MODE: "stripe",
            STORAGE_MODE: "gcs",
            JOBS_MODE: "local",
        }

        it("refuses JOBS_MODE=local on deployed production posture", async function () {
            await withEnv({ ...deployedBase, DEPLOY_POSTURE: "prod" }, async () => {
                expect(() => validatedEnv()).to.throw("Production must set JOBS_MODE=scheduler")
            })
            await withEnv({ ...deployedBase, DEPLOY_POSTURE: undefined }, async () => {
                expect(() => validatedEnv()).to.throw("Production must set JOBS_MODE=scheduler")
            })
        })

        it("allows JOBS_MODE=local on dev-posture deploys (ticker fallback before the scheduler is provisioned)", async function () {
            await withEnv({ ...deployedBase, DEPLOY_POSTURE: "dev" }, async () => {
                expect(validatedEnv().JOBS_MODE).to.equal("local")
            })
        })
    })
})
