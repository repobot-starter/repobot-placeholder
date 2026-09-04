import { createHash, createHmac, randomBytes } from "node:crypto"
import { count, countDistinct, eq, inArray, lt } from "drizzle-orm"
import { analyticsEventsTable } from "../../Data/Analytics/AnalyticsEvent.js"
import { analyticsDailyTable, analyticsPageDailyTable } from "../../Data/Analytics/AnalyticsRollup.js"
import { analyticsDb } from "../../Data/AnalyticsDatabase.js"
import { validatedEnv } from "../../Utils/Env.js"
import { analyticsConfig } from "./AnalyticsConfig.js"

/** UTC calendar day of an instant, 'YYYY-MM-DD'. */
export function utcDayFor(at: Date): string {
    return at.toISOString().slice(0, 10)
}

/**
 * Normalizes a pageview path for aggregation: leading slash enforced, query
 * and hash stripped, duplicate slashes collapsed, length bounded. Distinct
 * query strings must not fragment the top-pages rollup.
 */
export function normalizePagePath(raw: string): string {
    const withoutQuery = raw.split(/[?#]/, 1)[0] ?? ""
    const prefixed = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`
    const collapsed = prefixed.replace(/\/{2,}/g, "/")
    const trimmed = collapsed.length > 1 ? collapsed.replace(/\/+$/, "") : collapsed
    return trimmed.slice(0, analyticsConfig.maxPathLength)
}

/**
 * A cheap self-declared-bot filter: crawlers and preview fetchers identify
 * themselves in the user agent. Sophisticated bots are indistinguishable
 * from browsers without fingerprinting, which this kernel refuses to do —
 * approximate numbers are the accepted trade-off.
 */
export function isLikelyBot(userAgent: string): boolean {
    if (userAgent.trim() === "") {
        return true
    }
    return /bot|crawl|spider|slurp|preview|monitor|headless|curl|wget|python-requests/i.test(userAgent)
}

// When no environment secret exists (a bare sandbox), a per-process random
// seed keeps uniques approximately right while staying unlinkable. Never a
// hard-coded constant: that would make hashes reproducible by anyone.
const fallbackSeed = randomBytes(32).toString("hex")

function hashSeed(): string {
    const env = validatedEnv()
    const secret = [env.AUTH_JWT_SECRET, env.LOCAL_AUTH_SECRET].find(
        (value) => value !== undefined && value !== "",
    )
    return secret ?? fallbackSeed
}

/**
 * The cookieless visitor identity: sha256 of the visitor's IP + user agent,
 * salted with an HMAC of the UTC day under the environment's secret. The
 * salt rotation makes hashes unlinkable across days (a visitor gets a fresh
 * hash every day), and neither the IP nor the user agent is ever stored.
 */
export function visitorHashFor(request: { day: string; ip: string; userAgent: string }): string {
    const salt = createHmac("sha256", hashSeed()).update(request.day).digest("hex")
    return createHash("sha256")
        .update(`${salt}|${request.ip}|${request.userAgent}`)
        .digest("hex")
        .slice(0, 32)
}

/**
 * First-party, cookieless pageview analytics (docs/analytics.md). The beacon
 * endpoint records raw events here; the analytics-rollup job (jobs kernel)
 * recomputes the daily tables the platform's dashboard reads and enforces
 * retention. No cookies, no fingerprinting, no raw IP storage — privacy is
 * enforced at the write, not by a later cleanup.
 */
class AnalyticsService {
    /**
     * Records one pageview ping. Self-declared bots are dropped; the raw
     * row stores only the day, the normalized path, and the daily-salted
     * visitor hash.
     */
    async recordPageview(request: {
        path: string
        ip: string
        userAgent: string
        now?: Date
    }): Promise<void> {
        if (isLikelyBot(request.userAgent)) {
            return
        }
        const day = utcDayFor(request.now ?? new Date())
        await analyticsDb.insert(analyticsEventsTable).values({
            day,
            path: normalizePagePath(request.path),
            visitorHash: visitorHashFor({ day, ip: request.ip, userAgent: request.userAgent }),
        })
    }

    /**
     * The rollup job's handler: recomputes the last rollupWindowDays UTC
     * days from raw events, then prunes expired raw events (7 days) and
     * expired rollups (90 days). Convergent by construction — each day is
     * recomputed from scratch inside a transaction — so the jobs kernel's
     * at-most-once-per-due-time semantics are all it needs.
     */
    async rollupAndPrune(now = new Date()): Promise<void> {
        for (let offset = 0; offset < analyticsConfig.rollupWindowDays; offset += 1) {
            const day = utcDayFor(new Date(now.getTime() - offset * DAY_MS))
            await this.recomputeDay(day)
        }
        const rawCutoff = utcDayFor(new Date(now.getTime() - analyticsConfig.rawRetentionDays * DAY_MS))
        const aggregateCutoff = utcDayFor(
            new Date(now.getTime() - analyticsConfig.aggregateRetentionDays * DAY_MS),
        )
        // 'YYYY-MM-DD' compares correctly as text.
        await analyticsDb.delete(analyticsEventsTable).where(lt(analyticsEventsTable.day, rawCutoff))
        await analyticsDb.delete(analyticsDailyTable).where(lt(analyticsDailyTable.day, aggregateCutoff))
        await analyticsDb
            .delete(analyticsPageDailyTable)
            .where(lt(analyticsPageDailyTable.day, aggregateCutoff))
    }

    /**
     * Total raw pageviews recorded for the given UTC day and the one before
     * it — the one number the push kernel's digest exemplar reads. Raw events
     * are retained for 7 days, comfortably covering the window.
     */
    async recentPageviewCount(now = new Date()): Promise<number> {
        const today = utcDayFor(now)
        const yesterday = utcDayFor(new Date(now.getTime() - DAY_MS))
        const [totals] = await analyticsDb
            .select({ pageviews: count() })
            .from(analyticsEventsTable)
            .where(inArray(analyticsEventsTable.day, [yesterday, today]))
        return totals?.pageviews ?? 0
    }

    private async recomputeDay(day: string): Promise<void> {
        const [totals] = await analyticsDb
            .select({
                pageviews: count(),
                uniqueVisitors: countDistinct(analyticsEventsTable.visitorHash),
            })
            .from(analyticsEventsTable)
            .where(eq(analyticsEventsTable.day, day))
        const perPath = await analyticsDb
            .select({
                path: analyticsEventsTable.path,
                pageviews: count(),
                uniqueVisitors: countDistinct(analyticsEventsTable.visitorHash),
            })
            .from(analyticsEventsTable)
            .where(eq(analyticsEventsTable.day, day))
            .groupBy(analyticsEventsTable.path)

        await analyticsDb.transaction(async (tx) => {
            // Delete-then-insert (not upsert) so a day whose events expired
            // or shrank converges instead of keeping stale rows around.
            await tx.delete(analyticsDailyTable).where(eq(analyticsDailyTable.day, day))
            await tx.delete(analyticsPageDailyTable).where(eq(analyticsPageDailyTable.day, day))
            if (totals === undefined || totals.pageviews === 0) {
                return
            }
            await tx.insert(analyticsDailyTable).values({
                day,
                pageviews: totals.pageviews,
                uniqueVisitors: totals.uniqueVisitors,
            })
            await tx.insert(analyticsPageDailyTable).values(
                perPath.map((row) => ({
                    day,
                    path: row.path,
                    pageviews: row.pageviews,
                    uniqueVisitors: row.uniqueVisitors,
                })),
            )
        })
    }
}

const DAY_MS = 24 * 60 * 60 * 1000

export const analyticsService = new AnalyticsService()
