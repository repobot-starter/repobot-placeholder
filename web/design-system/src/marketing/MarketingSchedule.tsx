import React from "react"
import { marketingHref, type MarketingCta } from "./marketingContent"
import { marketingTextStamp } from "./marketingItemStamp"
import * as styles from "./MarketingSchedule.styles.css"

export type MarketingScheduleVariant = "week-grid" | "day-rows"

export interface MarketingScheduleSession {
    /** Start time label, e.g. "6:00 AM". */
    time: string
    endTime?: string
    title: string
    /** Who leads it — the instructor or coach. */
    detail?: string
    /** Format note, e.g. "All levels" or "Reformer". */
    note?: string
    /**
     * Live state, computed by the caller from the clock (the schedule
     * engine): `now` marks the session in progress, `next` the single
     * upcoming one. The section renders the chips; it never reads a clock.
     */
    state?: "now" | "next"
}

export interface MarketingScheduleDay {
    /** Column header, e.g. "Monday". */
    label: string
    /** Highlights this day's column/row as the current one. */
    today?: boolean
    sessions: MarketingScheduleSession[]
}

export interface MarketingScheduleContent {
    kicker?: string
    title?: string
    intro?: string
    /** Live status chip over the grid, e.g. "Next class: Power Hour · Today 6 AM". */
    badge?: string
    days: MarketingScheduleDay[]
    /** Small print under the grid, e.g. drop-in and booking policy. */
    note?: string
    cta?: MarketingCta
}

export interface MarketingScheduleProps extends MarketingScheduleContent {
    variant?: MarketingScheduleVariant
    anchorId?: string
}

/**
 * The weekly timetable — a studio's class schedule as a real grid, ruled
 * with hairlines rather than boxed into cards. `week-grid` sets the days as
 * ruled columns (the studio wall chart; columns stack on small screens);
 * `day-rows` sets each day as a ruled row with its sessions listed beside
 * it — the quieter read for lighter timetables. "Today" inverts its day
 * label to ink-on-ground; `now`/`next` session chips carry the live state
 * the caller computed. Deliberately monochrome-disciplined: structure comes
 * from rules and type, with the accent reserved for the live chips.
 */
export function MarketingSchedule({
    variant = "week-grid",
    anchorId,
    kicker,
    title,
    intro,
    badge,
    days,
    note,
    cta,
}: MarketingScheduleProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Weekly schedule"}>
            {kicker !== undefined ? (
                <span className={styles.kicker} {...marketingTextStamp("kicker")}>
                    {kicker}
                </span>
            ) : null}
            {title !== undefined ? (
                <h2 className={styles.title} {...marketingTextStamp("title")}>
                    {title}
                </h2>
            ) : null}
            {intro !== undefined ? (
                <p className={styles.intro} {...marketingTextStamp("intro")}>
                    {intro}
                </p>
            ) : null}
            {badge !== undefined ? (
                <span className={styles.badge}>
                    <span className={styles.badgeDot} aria-hidden />
                    {badge}
                </span>
            ) : null}
            {variant === "day-rows" ? (
                <div className={styles.rows}>
                    {days.map((day) => (
                        <div key={day.label} className={styles.row}>
                            <span className={day.today === true ? styles.dayLabelToday : styles.dayLabel}>
                                {day.label}
                            </span>
                            <ul className={styles.rowSessions}>
                                {day.sessions.map((session) => (
                                    <li
                                        key={`${session.time}-${session.title}`}
                                        className={styles.rowSession}
                                    >
                                        <span className={styles.time}>
                                            {session.time}
                                            {session.endTime !== undefined ? ` – ${session.endTime}` : ""}
                                        </span>
                                        <span className={styles.sessionTitle}>{session.title}</span>
                                        {session.detail !== undefined ? (
                                            <span className={styles.detail}>{session.detail}</span>
                                        ) : null}
                                        {session.note !== undefined ? (
                                            <span className={styles.sessionNote}>{session.note}</span>
                                        ) : null}
                                        <SessionState state={session.state} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.grid} role="table" aria-label={title ?? "Weekly schedule"}>
                    {days.map((day) => (
                        <div
                            key={day.label}
                            className={day.today === true ? styles.columnToday : styles.column}
                            role="rowgroup"
                        >
                            <span className={day.today === true ? styles.dayLabelToday : styles.dayLabel}>
                                {day.label}
                            </span>
                            <ul className={styles.columnSessions}>
                                {day.sessions.map((session) => (
                                    <li key={`${session.time}-${session.title}`} className={styles.session}>
                                        <span className={styles.time}>
                                            {session.time}
                                            {session.endTime !== undefined ? ` – ${session.endTime}` : ""}
                                        </span>
                                        <span className={styles.sessionTitle}>{session.title}</span>
                                        {session.detail !== undefined ? (
                                            <span className={styles.detail}>{session.detail}</span>
                                        ) : null}
                                        {session.note !== undefined ? (
                                            <span className={styles.sessionNote}>{session.note}</span>
                                        ) : null}
                                        <SessionState state={session.state} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
            {note !== undefined ? (
                <p className={styles.note} {...marketingTextStamp("note")}>
                    {note}
                </p>
            ) : null}
            {cta !== undefined ? (
                <div className={styles.ctaRow}>
                    <a className={styles.cta} href={marketingHref(cta)} {...marketingTextStamp("cta.label")}>
                        {cta.label}
                    </a>
                </div>
            ) : null}
        </section>
    )
}

function SessionState({ state }: { state?: "now" | "next" }): React.ReactElement | null {
    if (state === undefined) {
        return null
    }
    return (
        <span className={state === "now" ? styles.stateNow : styles.stateNext}>
            {state === "now" ? "In session" : "Next"}
        </span>
    )
}
