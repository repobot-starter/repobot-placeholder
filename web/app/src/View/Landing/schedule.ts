import type { MarketingScheduleDay } from "@ui"
import { dayNames, formatMinute } from "./hours"

/**
 * Weekly class-schedule logic — the timetable sibling of the hours engine
 * (`hours.ts`), shared by the fitness packs. Pure and deterministic (the
 * current time is always passed in), so tests pin instants and every
 * consumer — the hero's live badge, the schedule grid's today column and
 * now/next chips — agrees on what the clock means.
 *
 * Sessions are same-day intervals in minutes since midnight (0–1440),
 * one entry per class occurrence per weekday.
 */

export interface ClassSession {
    /** 0 = Sunday … 6 = Saturday, matching JS Date.getDay(). */
    day: number
    /** Minutes since midnight. */
    start: number
    end: number
    title: string
    instructor: string
    /** Optional format note shown under the entry, e.g. "All levels". */
    note?: string
}

export type ScheduleStatus =
    | { kind: "in-session"; session: ClassSession }
    | {
          kind: "next"
          session: ClassSession
          /** Whether the next session still starts on the queried day. */
          today: boolean
      }
    | { kind: "empty" }

const sortedByStart = (sessions: ClassSession[]): ClassSession[] =>
    [...sessions].sort((a, b) => a.start - b.start)

/** Sessions on one weekday, in start order. */
export function sessionsOn(sessions: ClassSession[], day: number): ClassSession[] {
    return sortedByStart(sessions.filter((session) => session.day === ((day % 7) + 7) % 7))
}

/**
 * The live schedule state at a weekday + minute: the class running right
 * now, else the next upcoming class within the coming week (wrapping past
 * midnight and empty days), else empty-schedule.
 */
export function scheduleStatusAt(sessions: ClassSession[], day: number, minute: number): ScheduleStatus {
    const now = sessionsOn(sessions, day).find((session) => minute >= session.start && minute < session.end)
    if (now !== undefined) {
        return { kind: "in-session", session: now }
    }
    for (let offset = 0; offset < 8; offset++) {
        const candidates = sessionsOn(sessions, day + offset).filter(
            (session) => offset > 0 || session.start > minute,
        )
        if (candidates.length > 0) {
            return { kind: "next", session: candidates[0], today: offset === 0 }
        }
    }
    return { kind: "empty" }
}

/**
 * The hero badge, computed like the menu pack's open/closed label:
 * "In session — Power Hour until 7:00 AM" while a class runs,
 * "Next class: Power Hour · Today 6:00 AM" (or the weekday) between them.
 * `noun` names the timetable's unit — "class" for a studio's roster,
 * "session" for a trainer's book.
 */
export function scheduleBadge(
    sessions: ClassSession[],
    day: number,
    minute: number,
    noun: string = "class",
): string {
    const status = scheduleStatusAt(sessions, day, minute)
    if (status.kind === "empty") {
        return "Schedule coming soon"
    }
    if (status.kind === "in-session") {
        return `In session — ${status.session.title} until ${formatMinute(status.session.end)}`
    }
    const when = status.today ? "Today" : dayNames[status.session.day]
    return `Next ${noun}: ${status.session.title} · ${when} ${formatMinute(status.session.start)}`
}

/**
 * The week as schedule-section columns (`MarketingScheduleDay[]`), Monday
 * first, weekdays without sessions dropped: today flagged, the running
 * session marked `now`, and the single next-upcoming session marked `next`
 * (only when it lands inside the rendered week — the grid never marks two).
 */
export function weekColumns(sessions: ClassSession[], day: number, minute: number): MarketingScheduleDay[] {
    const status = scheduleStatusAt(sessions, day, minute)
    const mondayFirst = [1, 2, 3, 4, 5, 6, 0]
    return mondayFirst
        .map((weekday) => ({ weekday, daySessions: sessionsOn(sessions, weekday) }))
        .filter(({ daySessions }) => daySessions.length > 0)
        .map(({ weekday, daySessions }) => ({
            label: dayNames[weekday],
            today: weekday === ((day % 7) + 7) % 7,
            sessions: daySessions.map((session) => ({
                time: formatMinute(session.start),
                endTime: formatMinute(session.end),
                title: session.title,
                detail: session.instructor,
                ...(session.note !== undefined ? { note: session.note } : {}),
                ...(status.kind === "in-session" && status.session === session
                    ? { state: "now" as const }
                    : status.kind === "next" && status.session === session
                      ? { state: "next" as const }
                      : {}),
            })),
        }))
}
