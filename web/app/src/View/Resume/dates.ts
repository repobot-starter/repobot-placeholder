/**
 * Date math for the résumé — the computable heart of a CV. Everything a
 * recruiter would check with a calendar is computed at render time from the
 * role dates in `content.ts`: range labels, per-role durations, and the
 * total years of experience in the hero. The owner (or the agent filling
 * the template) edits dates, never math — a résumé that says "6 yrs" next
 * to "2019 – Present" can never drift, because both come from the same
 * two fields.
 *
 * Pure and deterministic: the current time is always passed in (an absent
 * `end` means "present"). Months are counted inclusively, the way LinkedIn
 * and recruiters do — Mar 2019 through Aug 2026 is 7 yrs 6 mos.
 */

export interface DateRanged {
    /** First month on the job, "YYYY-MM". */
    start: string
    /** Last month on the job, "YYYY-MM"; absent = present. */
    end?: string
}

/** "2021-04" → months since year zero (a comparable scalar). */
function monthIndex(value: string): number {
    const [year, month] = value.split("-").map(Number)
    return year * 12 + (month - 1)
}

function nowIndex(now: Date): number {
    return now.getFullYear() * 12 + now.getMonth()
}

/** The year a "YYYY-MM" value falls in. */
export function yearOf(value: string): number {
    return Number(value.split("-")[0])
}

/** Whole months in the range, inclusive of both endpoints (min 1). */
export function monthsBetween(range: DateRanged, now: Date): number {
    const end = range.end !== undefined ? monthIndex(range.end) : nowIndex(now)
    return Math.max(end - monthIndex(range.start) + 1, 1)
}

/** "6 yrs 3 mos" / "6 yrs" / "9 mos" — trimmed, singular-aware. */
export function formatDuration(months: number): string {
    const years = Math.floor(months / 12)
    const rest = months % 12
    const yearPart = years > 0 ? `${years} ${years === 1 ? "yr" : "yrs"}` : ""
    const monthPart = rest > 0 ? `${rest} ${rest === 1 ? "mo" : "mos"}` : ""
    return [yearPart, monthPart].filter((part) => part !== "").join(" ") || "1 mo"
}

/** "2019 – Present" / "2016 – 2019" / "2024" — the résumé range label. */
export function formatRange(range: DateRanged): string {
    const startYear = yearOf(range.start)
    if (range.end === undefined) return `${startYear} – Present`
    const endYear = yearOf(range.end)
    return startYear === endYear ? `${startYear}` : `${startYear} – ${endYear}`
}

/** "2019 – Present · 6 yrs 3 mos" — the line a role wears. */
export function rangeWithDuration(range: DateRanged, now: Date): string {
    return `${formatRange(range)} · ${formatDuration(monthsBetween(range, now))}`
}

/**
 * Total months of experience across all roles, as the union of their
 * intervals: overlapping roles (a side gig beside a day job) never double
 * count, and gaps between roles never inflate the number.
 */
export function totalExperienceMonths(roles: DateRanged[], now: Date): number {
    const present = nowIndex(now)
    const intervals = roles
        .map((role) => ({
            start: monthIndex(role.start),
            end: role.end !== undefined ? monthIndex(role.end) : present,
        }))
        .filter((interval) => interval.end >= interval.start)
        .sort((a, b) => a.start - b.start)
    let total = 0
    let cursor = Number.NEGATIVE_INFINITY
    for (const interval of intervals) {
        const from = Math.max(interval.start, cursor)
        if (interval.end >= from) {
            total += interval.end - from + 1
            cursor = interval.end + 1
        }
    }
    return total
}

/** "10+ yrs" (a started year) / "10 yrs" (exactly) — the hero's number. */
export function experienceLabel(months: number): string {
    const years = Math.floor(months / 12)
    if (years === 0) return formatDuration(months)
    return months % 12 > 0 ? `${years}+ yrs` : `${years} ${years === 1 ? "yr" : "yrs"}`
}

/**
 * Roles in résumé order — most recent first — computed at render time so
 * the owner can append a role anywhere in the array: current roles first
 * (latest start first), then ended roles by how recently they ended.
 */
export function sortRolesByDate<T extends DateRanged>(roles: T[], now: Date): T[] {
    const present = nowIndex(now)
    const key = (role: DateRanged) => {
        const end = role.end !== undefined ? monthIndex(role.end) : present
        return end * 100000 + monthIndex(role.start)
    }
    return [...roles].sort((a, b) => key(b) - key(a))
}
