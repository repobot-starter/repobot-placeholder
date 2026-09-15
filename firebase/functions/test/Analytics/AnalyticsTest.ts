import { createServer, Server } from "node:http"
import { AddressInfo } from "node:net"
import { expect } from "chai"
import { eq } from "drizzle-orm"
import { buildAnalyticsExpressApp } from "../../src/CloudFunctions/Analytics.js"
import { analyticsEventsTable } from "../../src/Data/Analytics/AnalyticsEvent.js"
import { analyticsDailyTable, analyticsPageDailyTable } from "../../src/Data/Analytics/AnalyticsRollup.js"
import { analyticsDb } from "../../src/Data/AnalyticsDatabase.js"
import {
    analyticsService,
    isLikelyBot,
    normalizePagePath,
    utcDayFor,
    visitorHashFor,
} from "../../src/Services/Analytics/AnalyticsService.js"

const BROWSER_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/126.0.0.0 Safari/537.36"

describe("Analytics", function () {
    describe("path normalization", function () {
        it("strips queries and hashes, collapses slashes, and bounds length", function () {
            expect(normalizePagePath("/pricing?utm_source=x")).to.equal("/pricing")
            expect(normalizePagePath("/docs#install")).to.equal("/docs")
            expect(normalizePagePath("//a///b/")).to.equal("/a/b")
            expect(normalizePagePath("pricing")).to.equal("/pricing")
            expect(normalizePagePath("/")).to.equal("/")
            expect(normalizePagePath(`/${"x".repeat(2000)}`)).to.have.length(512)
        })
    })

    describe("bot filtering", function () {
        it("drops self-declared crawlers and empty user agents, keeps browsers", function () {
            expect(isLikelyBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).to.equal(true)
            expect(isLikelyBot("curl/8.6.0")).to.equal(true)
            expect(isLikelyBot("")).to.equal(true)
            expect(isLikelyBot(BROWSER_UA)).to.equal(false)
        })
    })

    describe("visitor hashing", function () {
        it("is stable within a day, unlinkable across days, and never stores the inputs", function () {
            const base = { ip: "203.0.113.9", userAgent: BROWSER_UA }
            const monday = visitorHashFor({ day: "2026-07-27", ...base })
            expect(visitorHashFor({ day: "2026-07-27", ...base })).to.equal(monday)
            expect(visitorHashFor({ day: "2026-07-28", ...base })).to.not.equal(monday)
            expect(
                visitorHashFor({ day: "2026-07-27", ip: "203.0.113.10", userAgent: BROWSER_UA }),
            ).to.not.equal(monday)
            expect(monday).to.match(/^[0-9a-f]{32}$/)
            expect(monday).to.not.contain("203")
        })
    })

    describe("the beacon endpoint (analytics__request__api)", function () {
        let server: Server
        let baseUrl: string

        beforeEach(function (done) {
            server = createServer(buildAnalyticsExpressApp())
            server.listen(0, "127.0.0.1", () => {
                const address = server.address() as AddressInfo
                baseUrl = `http://127.0.0.1:${address.port}`
                done()
            })
        })

        afterEach(function (done) {
            server.close(() => done())
        })

        async function postPageview(body: unknown, headers: Record<string, string> = {}): Promise<Response> {
            return await fetch(`${baseUrl}/pageview`, {
                method: "POST",
                headers: { "content-type": "application/json", ...headers },
                body: JSON.stringify(body),
            })
        }

        it("records a raw event with only the day, path, and visitor hash", async function () {
            const response = await postPageview(
                { path: "/pricing?utm_source=newsletter" },
                { "user-agent": BROWSER_UA, "x-forwarded-for": "203.0.113.9, 10.1.2.3" },
            )
            expect(response.status).to.equal(204)

            const rows = await analyticsDb.select().from(analyticsEventsTable)
            expect(rows).to.have.length(1)
            expect(rows[0].day).to.equal(utcDayFor(new Date()))
            expect(rows[0].path).to.equal("/pricing")
            // The stored identity is the daily-salted hash of the FIRST
            // forwarded hop — never the raw IP or user agent.
            expect(rows[0].visitorHash).to.equal(
                visitorHashFor({ day: rows[0].day, ip: "203.0.113.9", userAgent: BROWSER_UA }),
            )
            expect(rows[0].id).to.match(/^aevt_/)
        })

        it("silently drops self-declared bots", async function () {
            const response = await postPageview(
                { path: "/" },
                { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" },
            )
            expect(response.status).to.equal(204)
            expect(await analyticsDb.select().from(analyticsEventsTable)).to.have.length(0)
        })

        it("refuses malformed pings", async function () {
            expect((await postPageview({}, { "user-agent": BROWSER_UA })).status).to.equal(400)
            expect((await postPageview({ path: "" }, { "user-agent": BROWSER_UA })).status).to.equal(400)
            expect(
                (await postPageview({ path: "x".repeat(3000) }, { "user-agent": BROWSER_UA })).status,
            ).to.equal(400)
        })
    })

    describe("rollup and retention", function () {
        const now = new Date("2026-07-31T12:00:00Z")
        const today = "2026-07-31"
        const yesterday = "2026-07-30"

        function event(day: string, path: string, visitor: string): typeof analyticsEventsTable.$inferInsert {
            return { day, path, visitorHash: visitor }
        }

        it("recomputes daily totals and per-path rows convergently", async function () {
            await analyticsDb
                .insert(analyticsEventsTable)
                .values([
                    event(today, "/", "visitor-a"),
                    event(today, "/", "visitor-b"),
                    event(today, "/pricing", "visitor-a"),
                    event(yesterday, "/", "visitor-c"),
                ])

            await analyticsService.rollupAndPrune(now)

            const daily = await analyticsDb
                .select()
                .from(analyticsDailyTable)
                .orderBy(analyticsDailyTable.day)
            expect(daily.map((row) => [row.day, row.pageviews, row.uniqueVisitors])).to.deep.equal([
                [yesterday, 1, 1],
                [today, 3, 2],
            ])

            const pages = await analyticsDb
                .select()
                .from(analyticsPageDailyTable)
                .where(eq(analyticsPageDailyTable.day, today))
                .orderBy(analyticsPageDailyTable.path)
            expect(pages.map((row) => [row.path, row.pageviews, row.uniqueVisitors])).to.deep.equal([
                ["/", 2, 2],
                ["/pricing", 1, 1],
            ])

            // Rerunning converges to the same rows instead of double counting.
            await analyticsService.rollupAndPrune(now)
            const dailyAgain = await analyticsDb.select().from(analyticsDailyTable)
            expect(dailyAgain).to.have.length(2)
            expect(dailyAgain.find((row) => row.day === today)?.pageviews).to.equal(3)
        })

        it("prunes raw events past 7 days and rollups past 90 days", async function () {
            await analyticsDb.insert(analyticsEventsTable).values([
                event("2026-07-20", "/", "old-visitor"), // 11 days old
                event(today, "/", "fresh-visitor"),
            ])
            await analyticsDb.insert(analyticsDailyTable).values([
                { day: "2026-04-01", pageviews: 9, uniqueVisitors: 9 }, // > 90 days
                { day: "2026-07-01", pageviews: 5, uniqueVisitors: 5 },
            ])
            await analyticsDb
                .insert(analyticsPageDailyTable)
                .values([{ day: "2026-04-01", path: "/", pageviews: 9, uniqueVisitors: 9 }])

            await analyticsService.rollupAndPrune(now)

            const events = await analyticsDb.select().from(analyticsEventsTable)
            expect(events.map((row) => row.day)).to.deep.equal([today])

            const daily = await analyticsDb.select().from(analyticsDailyTable)
            expect(daily.map((row) => row.day).sort()).to.deep.equal(["2026-07-01", today])
            expect(await analyticsDb.select().from(analyticsPageDailyTable)).to.have.length(1)
        })
    })
})
