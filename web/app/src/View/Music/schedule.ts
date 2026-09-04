/**
 * The music category's computed-time mechanics (packs/README.md; the same
 * render-time pattern as the menu pack's open/closed badge): tour dates
 * split upcoming/past from the content file's ISO dates, and a release
 * date becomes a live countdown. Pure functions of (content, now) so the
 * fidelity tests inject clocks and the pages rebuild per render — a show
 * moves itself into the archive at midnight without anyone editing code.
 */

export interface ShowDate {
    /** ISO local date, YYYY-MM-DD. */
    date: string
    city: string
    venue: string
    /** State or country, e.g. "TX" or "Netherlands". */
    region?: string
    /** External ticket link — ticketing itself never lives in the pack. */
    ticketUrl?: string
    /** Small status word: "SOLD OUT", "FESTIVAL", "ALL AGES"… */
    note?: string
}

export interface ShowSchedule<S extends ShowDate = ShowDate> {
    /** Today and later, soonest first. */
    upcoming: S[]
    /** Most recent first. */
    past: S[]
    /** The next show (today counts), highlighted by the pages. */
    next: S | null
    /** "TONIGHT — CITY" when the next show is today, else "ON TOUR" while
     * dates remain, else null (the pages fall back to quiet copy). */
    badge: string | null
}

/** Parse an ISO local date at local midnight (never UTC — a show in
 * Austin happens on Austin's calendar). */
export function parseLocalDate(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number)
    return new Date(y, m - 1, d)
}

function startOfDay(now: Date): Date {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function splitShows<S extends ShowDate>(shows: readonly S[], now: Date): ShowSchedule<S> {
    const today = startOfDay(now).getTime()
    const upcoming = shows
        .filter((show) => parseLocalDate(show.date).getTime() >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
    const past = shows
        .filter((show) => parseLocalDate(show.date).getTime() < today)
        .sort((a, b) => b.date.localeCompare(a.date))
    const next = upcoming[0] ?? null
    const badge =
        next === null
            ? null
            : parseLocalDate(next.date).getTime() === today
              ? `Tonight — ${next.city}`
              : "On tour"
    return { upcoming, past, next, badge }
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "Fri · Mar 14" pieces for the tour table's date column. */
export function formatShowDate(iso: string): { weekday: string; month: string; day: number; year: number } {
    const date = parseLocalDate(iso)
    return {
        weekday: WEEKDAYS[date.getDay()],
        month: MONTHS[date.getMonth()],
        day: date.getDate(),
        year: date.getFullYear(),
    }
}

export interface ReleaseStatus {
    released: boolean
    /** Whole days remaining (0 on release eve). */
    days: number
    /** Hours after the days are taken out, 0–23. */
    hours: number
    /** Minutes after the hours, 0–59. */
    minutes: number
    /** "Out now" once released; "Out Friday" inside the final week; else
     * "Out Mar 14". Display casing belongs to the type layer. */
    label: string
}

/**
 * The release one-pager's countdown, computed from the content file's ISO
 * date (local midnight = the moment it's out). After the date the whole
 * mechanic flips to "Out now" and the pages swap presave for listen links.
 */
export function releaseStatus(releaseDate: string, now: Date): ReleaseStatus {
    const release = parseLocalDate(releaseDate)
    const remainingMs = release.getTime() - now.getTime()
    if (remainingMs <= 0) {
        return { released: true, days: 0, hours: 0, minutes: 0, label: "Out now" }
    }
    const minutesTotal = Math.floor(remainingMs / 60000)
    const days = Math.floor(minutesTotal / (60 * 24))
    const hours = Math.floor((minutesTotal - days * 60 * 24) / 60)
    const minutes = minutesTotal % 60
    const label =
        days < 7
            ? `Out ${WEEKDAYS_LONG[release.getDay()]}`
            : `Out ${MONTHS[release.getMonth()]} ${release.getDate()}`
    return { released: false, days, hours, minutes, label }
}

/** "3:07" from seconds — the players' mono timecode. */
export function formatTimecode(seconds: number): string {
    const whole = Math.max(0, Math.floor(seconds))
    const m = Math.floor(whole / 60)
    const s = whole % 60
    return `${m}:${String(s).padStart(2, "0")}`
}
