import { timingSafeEqual } from "node:crypto"
import express, { type Request, type Response } from "express"
import { onRequest } from "firebase-functions/v2/https"
import { z } from "zod"
import { startLocalJobsTickerIfEligible } from "../Services/Jobs/LocalJobsTicker.js"
import { jobsService } from "../Services/Jobs/JobsService.js"
import { validatedEnv } from "../Utils/Env.js"
import { isEmulator, isTest } from "../Utils/Environment.js"
import { httpStatusFromRpcStatus, RpcError } from "../Utils/RpcError.js"

/**
 * The jobs kernel's HTTP surface (docs/jobs.md). POST /tick evaluates every
 * registered job's due time and runs what this tick wins the claim for.
 *
 * JOBS_MODE=scheduler (deployed): the platform provisions one Cloud
 * Scheduler job per environment that POSTs /tick every 5 minutes with the
 * platform-minted JOBS_TOKEN as a bearer token. The endpoint refuses
 * anything else — including deploys where the token was never provisioned.
 *
 * JOBS_MODE=local (sandbox, dev-posture fallback): the in-process 60s
 * ticker (started below with the emulator's module load) does the same
 * work, so the sandbox needs no scheduler. /tick stays available for
 * manual pokes and accepts emulator/test calls without a token — unless a
 * JOBS_TOKEN is configured, which is then enforced everywhere.
 */
export const jobs__request__api = onRequest({ cors: true }, buildJobsExpressApp())

startLocalJobsTickerIfEligible()

export function buildJobsExpressApp(): express.Express {
    const app = express()
    app.use(express.json({ limit: "16kb" }))

    app.post(
        "/tick",
        asyncRoute(async (request, response) => {
            assertTickAuthorized(request)
            const outcomes = await jobsService.tick()
            response.json({
                outcomes: outcomes.map((outcome) => ({
                    jobName: outcome.jobName,
                    scheduledFor: outcome.scheduledFor.toISOString(),
                    outcome: outcome.outcome,
                    ...(outcome.error === undefined ? {} : { error: outcome.error }),
                })),
            })
        }),
    )

    return app
}

/**
 * The token guard: a configured JOBS_TOKEN is enforced in every mode
 * (constant-time comparison); a missing one is only acceptable inside the
 * emulator or tests — a deployed environment without the platform-minted
 * token refuses with the fix spelled out rather than ticking for anyone.
 */
function assertTickAuthorized(request: Request): void {
    const expected = validatedEnv().JOBS_TOKEN ?? ""
    if (expected === "") {
        if (isEmulator() || isTest()) {
            return
        }
        throw new RpcError(
            "FAILED_PRECONDITION",
            "JOBS_TOKEN is not configured, so /tick is disabled. Deploys with the JOBS " +
                "capability receive it from the platform's JOBS_SCHEDULER provisioning step.",
        )
    }
    const presented = bearerToken(request)
    if (presented === undefined) {
        throw new RpcError("UNAUTHENTICATED", "POST /tick requires a bearer JOBS_TOKEN.")
    }
    const presentedBytes = Buffer.from(presented, "utf8")
    const expectedBytes = Buffer.from(expected, "utf8")
    if (presentedBytes.length !== expectedBytes.length || !timingSafeEqual(presentedBytes, expectedBytes)) {
        throw new RpcError("PERMISSION_DENIED", "The presented JOBS_TOKEN is not valid.")
    }
}

function bearerToken(request: Request): string | undefined {
    const header = request.header("authorization")
    if (header === undefined || !header.toLowerCase().startsWith("bearer ")) {
        return undefined
    }
    const token = header.slice("bearer ".length).trim()
    return token === "" ? undefined : token
}

type RouteHandler = (request: Request, response: Response) => Promise<void>

function asyncRoute(handler: RouteHandler): RouteHandler {
    return async (request, response) => {
        try {
            await handler(request, response)
        } catch (error) {
            if (error instanceof z.ZodError) {
                response.status(400).json({
                    error: {
                        code: "INVALID_ARGUMENT",
                        message: error.issues[0]?.message ?? "Invalid request.",
                    },
                })
                return
            }
            if (error instanceof RpcError) {
                response
                    .status(httpStatusFromRpcStatus(error.status))
                    .json({ error: { code: error.status, message: error.message } })
                return
            }
            console.error("Unexpected jobs API failure.", error)
            response.status(500).json({ error: { code: "INTERNAL", message: "Unexpected jobs failure." } })
        }
    }
}
