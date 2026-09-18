import { isEmulator, isTest } from "../../Utils/Environment.js"
import { validatedEnv } from "../../Utils/Env.js"
import { jobsService } from "./JobsService.js"

const TICK_INTERVAL_MS = 60 * 1000

let ticker: NodeJS.Timeout | undefined

/**
 * The sandbox's scheduler substitute: when JOBS_MODE=local, an in-process
 * interval ticks the jobs service every 60 seconds, so the emulator needs
 * no Cloud Scheduler. Started from the jobs function module load (the
 * emulator loads every CloudFunction module at boot) but ONLY under the
 * emulator — never in tests (they call tick explicitly and forbid timers)
 * and never when deployed (deployed environments are ticked by the
 * platform's Cloud Scheduler; a background interval in a request-scoped
 * runtime would be unreliable anyway).
 *
 * The mode check happens at fire time, not start time: env files are not
 * guaranteed to be loaded during the emulator's module discovery, and
 * validatedEnv() must not run (and cache) that early.
 */
export function startLocalJobsTickerIfEligible(): void {
    if (!isEmulator() || isTest() || ticker !== undefined) {
        return
    }
    ticker = setInterval(() => {
        void runLocalTick()
    }, TICK_INTERVAL_MS)
    // Never hold the emulator process open on our account.
    ticker.unref()
}

async function runLocalTick(): Promise<void> {
    try {
        if (validatedEnv().JOBS_MODE !== "local") {
            return
        }
        await jobsService.tick()
    } catch (error) {
        // The ticker must survive anything (bad env, db not up yet, ...).
        console.error("Local jobs tick failed.", error)
    }
}

/** Test-only: clears the interval so a suite that started one leaks nothing. */
export function stopLocalJobsTickerForTests(): void {
    if (ticker !== undefined) {
        clearInterval(ticker)
        ticker = undefined
    }
}
