import { expect } from "chai"
import { cronMatches, mostRecentDueTime, parseCronExpression } from "../../src/Jobs/CronSchedule.js"

function dueTime(expression: string, nowIso: string): string {
    return mostRecentDueTime(parseCronExpression(expression), new Date(nowIso)).toISOString()
}

describe("CronSchedule", function () {
    describe("mostRecentDueTime", function () {
        it("matches the current minute exactly when due", function () {
            expect(dueTime("* * * * *", "2026-07-31T12:27:45.123Z")).to.equal("2026-07-31T12:27:00.000Z")
            expect(dueTime("0 * * * *", "2026-07-31T12:00:59.000Z")).to.equal("2026-07-31T12:00:00.000Z")
        })

        it("computes the last top-of-hour for an hourly schedule", function () {
            expect(dueTime("0 * * * *", "2026-07-31T12:27:00Z")).to.equal("2026-07-31T12:00:00.000Z")
        })

        it("handles */n steps", function () {
            expect(dueTime("*/15 * * * *", "2026-07-31T12:29:00Z")).to.equal("2026-07-31T12:15:00.000Z")
            expect(dueTime("*/15 * * * *", "2026-07-31T12:14:00Z")).to.equal("2026-07-31T12:00:00.000Z")
        })

        it("handles ranges with steps", function () {
            // Due at :10, :20, :30, :40 of every hour.
            expect(dueTime("10-40/10 * * * *", "2026-07-31T12:05:00Z")).to.equal("2026-07-31T11:40:00.000Z")
            expect(dueTime("10-40/10 * * * *", "2026-07-31T12:25:00Z")).to.equal("2026-07-31T12:20:00.000Z")
        })

        it("handles comma lists", function () {
            expect(dueTime("0,30 * * * *", "2026-07-31T12:29:00Z")).to.equal("2026-07-31T12:00:00.000Z")
            expect(dueTime("0,30 * * * *", "2026-07-31T12:31:00Z")).to.equal("2026-07-31T12:30:00.000Z")
        })

        it("crosses day and month boundaries", function () {
            // Daily at 23:50; shortly after midnight the last due time was
            // yesterday.
            expect(dueTime("50 23 * * *", "2026-08-01T00:05:00Z")).to.equal("2026-07-31T23:50:00.000Z")
            // Monthly on the 1st at 00:00; mid-July the last due time was
            // July 1st.
            expect(dueTime("0 0 1 * *", "2026-07-15T12:00:00Z")).to.equal("2026-07-01T00:00:00.000Z")
        })

        it("handles day-of-week schedules (2026-07-31 is a Friday)", function () {
            // Mondays at 09:00 UTC.
            expect(dueTime("0 9 * * 1", "2026-07-31T12:00:00Z")).to.equal("2026-07-27T09:00:00.000Z")
            // 7 is Sunday, same as 0.
            expect(dueTime("0 9 * * 7", "2026-07-31T12:00:00Z")).to.equal("2026-07-26T09:00:00.000Z")
        })

        it("uses OR semantics when both day fields are restricted", function () {
            const schedule = parseCronExpression("0 0 1 * 1")
            // Wednesday July 1st matches by day-of-month...
            expect(cronMatches(schedule, new Date("2026-07-01T00:00:00Z"))).to.equal(true)
            // ...and Monday July 27th matches by day-of-week.
            expect(cronMatches(schedule, new Date("2026-07-27T00:00:00Z"))).to.equal(true)
            // A plain Thursday matches neither.
            expect(cronMatches(schedule, new Date("2026-07-30T00:00:00Z"))).to.equal(false)
        })

        it("restricts by the single restricted day field otherwise", function () {
            const dayOfMonthOnly = parseCronExpression("0 0 15 * *")
            expect(cronMatches(dayOfMonthOnly, new Date("2026-07-15T00:00:00Z"))).to.equal(true)
            expect(cronMatches(dayOfMonthOnly, new Date("2026-07-27T00:00:00Z"))).to.equal(false)
        })
    })

    describe("registration-time refusals", function () {
        const invalidExpressions: [string, string][] = [
            ["* * * *", "exactly 5 fields"],
            ["* * * * * *", "exactly 5 fields"],
            ["@hourly", "exactly 5 fields"],
            ["60 * * * *", "outside 0-59"],
            ["* 24 * * *", "outside 0-23"],
            ["* * 0 * *", "outside 1-31"],
            ["* * * 13 *", "outside 1-12"],
            ["* * * * 8", "outside 0-7"],
            ["* * * JAN *", "not supported"],
            ["* * * * MON", "not supported"],
            ["? * * * *", "not supported"],
            ["5/10 * * * *", "anchors a step on a single value"],
            ["5-1 * * * *", "descending range"],
            ["1-2-3 * * * *", "more than one range separator"],
            ["*/5/2 * * * *", "more than one step"],
            ["*/0 * * * *", "step below 1"],
            ["1,,2 * * * *", "is empty"],
        ]

        for (const [expression, reason] of invalidExpressions) {
            it(`refuses "${expression}" (${reason})`, function () {
                expect(() => parseCronExpression(expression)).to.throw(reason)
            })
        }
    })
})
