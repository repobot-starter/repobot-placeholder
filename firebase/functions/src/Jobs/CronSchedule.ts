/**
 * A dependency-free matcher for classic 5-field cron expressions
 * (minute hour day-of-month month day-of-week), evaluated in UTC.
 *
 * Supported syntax per field: "*", plain numbers ("5"), ranges ("1-5"),
 * steps over the whole range (star followed by "/15") or over a range
 * ("10-40/10"), and comma lists combining any of those ("0,30", "1-5,10").
 *
 * Deliberately UNSUPPORTED (parse fails loudly so a registration typo can
 * never silently mis-schedule a job): month/day names ("JAN", "MON"),
 * macros ("@hourly"), seconds fields (6-field crontabs), "?", "L", "W",
 * "#", and steps anchored on a single value ("5/10"). Use the numeric
 * equivalents instead.
 *
 * Day-of-month and day-of-week follow the classic cron rule: when both are
 * restricted (neither is "*"), a time is due when EITHER matches.
 */

const FIELD_BOUNDS = [
    { name: "minute", min: 0, max: 59 },
    { name: "hour", min: 0, max: 23 },
    { name: "day-of-month", min: 1, max: 31 },
    { name: "month", min: 1, max: 12 },
    // 0 and 7 both mean Sunday; 7 is normalized to 0 at parse time.
    { name: "day-of-week", min: 0, max: 7 },
] as const

export interface CronSchedule {
    /** The original expression, for messages and logs. */
    expression: string
    minutes: Set<number>
    hours: Set<number>
    daysOfMonth: Set<number>
    months: Set<number>
    daysOfWeek: Set<number>
    /** Whether the day-of-month field was anything other than "*". */
    dayOfMonthRestricted: boolean
    /** Whether the day-of-week field was anything other than "*". */
    dayOfWeekRestricted: boolean
}

/**
 * Parses a 5-field cron expression, throwing an actionable Error on any
 * syntax outside the supported subset. Call it at registration time so a
 * bad schedule fails the boot, never a tick.
 */
export function parseCronExpression(expression: string): CronSchedule {
    const fields = expression.trim().split(/\s+/)
    if (fields.length !== 5) {
        throw new Error(
            `Cron expression "${expression}" must have exactly 5 fields ` +
                `(minute hour day-of-month month day-of-week); got ${fields.length}. ` +
                "Seconds fields and @macros are not supported.",
        )
    }
    const [minutes, hours, daysOfMonth, months, daysOfWeek] = fields.map((field, index) =>
        parseField(expression, field, FIELD_BOUNDS[index]),
    )
    return {
        expression,
        minutes,
        hours,
        daysOfMonth,
        months,
        // Normalize 7 (also Sunday) onto 0 so matching uses getUTCDay() 0-6.
        daysOfWeek: new Set([...daysOfWeek].map((day) => (day === 7 ? 0 : day))),
        dayOfMonthRestricted: fields[2] !== "*",
        dayOfWeekRestricted: fields[4] !== "*",
    }
}

/** Whether the given instant's minute (UTC) is due under the schedule. */
export function cronMatches(schedule: CronSchedule, instant: Date): boolean {
    if (!schedule.minutes.has(instant.getUTCMinutes())) {
        return false
    }
    if (!schedule.hours.has(instant.getUTCHours())) {
        return false
    }
    if (!schedule.months.has(instant.getUTCMonth() + 1)) {
        return false
    }
    const dayOfMonthMatches = schedule.daysOfMonth.has(instant.getUTCDate())
    const dayOfWeekMatches = schedule.daysOfWeek.has(instant.getUTCDay())
    // Classic cron: both restricted = OR; otherwise the restricted one decides.
    if (schedule.dayOfMonthRestricted && schedule.dayOfWeekRestricted) {
        return dayOfMonthMatches || dayOfWeekMatches
    }
    if (schedule.dayOfMonthRestricted) {
        return dayOfMonthMatches
    }
    if (schedule.dayOfWeekRestricted) {
        return dayOfWeekMatches
    }
    return true
}

// A valid schedule always matches within a year (366 days covers leap years);
// scanning minute-by-minute is plenty fast for the tick cadence.
const MAX_LOOKBACK_MINUTES = 366 * 24 * 60

/**
 * The schedule's most recent due time at or before `now` (UTC, truncated to
 * the minute). This is the tick's claim key: every tick computes the same
 * value until the next due minute passes, so the (jobName, scheduledFor)
 * unique claim makes concurrent ticks collapse to one run.
 */
export function mostRecentDueTime(schedule: CronSchedule, now: Date): Date {
    const candidate = new Date(now)
    candidate.setUTCSeconds(0, 0)
    for (let i = 0; i < MAX_LOOKBACK_MINUTES; i++) {
        if (cronMatches(schedule, candidate)) {
            return candidate
        }
        candidate.setUTCMinutes(candidate.getUTCMinutes() - 1)
    }
    // Unreachable for parseable schedules (every field set is non-empty and
    // day sets always intersect a real month within a year).
    throw new Error(`Cron expression "${schedule.expression}" has no due time in the last year.`)
}

function parseField(
    expression: string,
    field: string,
    bounds: { name: string; min: number; max: number },
): Set<number> {
    if (field === "*") {
        return rangeSet(bounds.min, bounds.max, 1)
    }
    const values = new Set<number>()
    for (const item of field.split(",")) {
        for (const value of parseItem(expression, item, bounds)) {
            values.add(value)
        }
    }
    return values
}

function parseItem(
    expression: string,
    item: string,
    bounds: { name: string; min: number; max: number },
): Set<number> {
    const fail = (reason: string): never => {
        throw new Error(`Cron expression "${expression}": ${bounds.name} field item "${item}" ${reason}`)
    }
    if (item === "") {
        return fail("is empty.")
    }

    let rangePart = item
    let step = 1
    const stepSplit = item.split("/")
    if (stepSplit.length === 2) {
        rangePart = stepSplit[0]
        step = parseNumber(stepSplit[1]) ?? fail(`has a non-numeric step "${stepSplit[1]}".`)
        if (step < 1) {
            return fail("has a step below 1.")
        }
        if (rangePart !== "*" && !rangePart.includes("-")) {
            // "5/10" is ambiguous shorthand; require "5-59/10" or "*/10".
            return fail('anchors a step on a single value; use "*/n" or "a-b/n".')
        }
    } else if (stepSplit.length > 2) {
        return fail("has more than one step.")
    }

    if (rangePart === "*") {
        return rangeSet(bounds.min, bounds.max, step)
    }
    const rangeSplit = rangePart.split("-")
    if (rangeSplit.length === 2) {
        const start = parseNumber(rangeSplit[0]) ?? fail(`has a non-numeric range start.`)
        const end = parseNumber(rangeSplit[1]) ?? fail(`has a non-numeric range end.`)
        if (start > end) {
            return fail("has a descending range (wrap-around ranges are not supported).")
        }
        if (start < bounds.min || end > bounds.max) {
            return fail(`is outside ${bounds.min}-${bounds.max}.`)
        }
        return rangeSet(start, end, step)
    }
    if (rangeSplit.length > 2) {
        return fail("has more than one range separator.")
    }
    const value =
        parseNumber(rangePart) ??
        fail("is not a number (names like MON/JAN, macros, ?, L, W, and # are not supported).")
    if (value < bounds.min || value > bounds.max) {
        return fail(`is outside ${bounds.min}-${bounds.max}.`)
    }
    return new Set([value])
}

function parseNumber(text: string): number | undefined {
    return /^\d+$/.test(text) ? Number(text) : undefined
}

function rangeSet(start: number, end: number, step: number): Set<number> {
    const values = new Set<number>()
    for (let value = start; value <= end; value += step) {
        values.add(value)
    }
    return values
}
