import React, { useEffect, useMemo, useState } from "react"
import {
    bookSeat,
    fetchBookingAvailability,
    type BookingAvailability,
    type BookingOccurrence,
    type BookingSandboxSession,
} from "@base/core"
import type { ScheduleSession } from "./contentDocument"
import { dayNames, formatMinute } from "./hours"
import * as styles from "./BookingWidget.styles.css"

/**
 * The class-booking widget the fitness packs mount under their schedule
 * section: live remaining seats per upcoming occurrence, a name + email
 * form (no visitor accounts), and instant confirmed-or-full states. Talks
 * to the site's own origin through the managed booking kernel
 * (BookingClient in @base/core); in sandboxes and workspace previews the
 * client simulates — the real door is never hit outside a deployed site.
 *
 * Renders only the contract's `bookable: true` sessions, and nothing at
 * all when the schedule has none — pages can mount it unconditionally.
 * Styling rides the marketing token contract, so the widget wears the
 * pack's own register.
 */
export function BookingWidget({
    sessions,
    noun = "class",
}: {
    sessions: ScheduleSession[]
    noun?: string
}): React.ReactElement | null {
    const bookable = useMemo(
        () => sessions.filter((session) => session.bookable === true && session.capacity !== undefined),
        [sessions],
    )
    const sandboxSessions = useMemo<BookingSandboxSession[]>(
        () =>
            bookable.map((session) => ({
                sessionId: session.sessionId,
                day: session.day,
                capacity: session.capacity ?? null,
            })),
        [bookable],
    )
    const [availability, setAvailability] = useState<BookingAvailability | null>(null)
    useEffect(() => {
        if (bookable.length === 0) {
            return
        }
        let alive = true
        void fetchBookingAvailability(sandboxSessions).then((result) => {
            if (alive) {
                setAvailability(result)
            }
        })
        return () => {
            alive = false
        }
    }, [bookable.length, sandboxSessions])

    if (bookable.length === 0) {
        return null
    }

    return (
        <section id="book" className={styles.wrap} aria-label={`Book a ${noun}`}>
            <h2 className={styles.heading}>Book a {noun}</h2>
            <p className={styles.intro}>
                Reserve your spot with just a name and email — you&apos;ll get a confirmation with a one-click
                cancel link. Seats update live.
            </p>
            <ul className={styles.list}>
                {bookable.map((session) => (
                    <BookingCard
                        key={session.sessionId}
                        session={session}
                        sandboxSession={sandboxSessions.find(
                            (candidate) => candidate.sessionId === session.sessionId,
                        )!}
                        occurrences={
                            availability?.sessions.find(
                                (candidate) => candidate.sessionId === session.sessionId,
                            )?.occurrences ?? []
                        }
                        noun={noun}
                        onBooked={() => {
                            // Refresh counts so sibling cards see the seat go.
                            void fetchBookingAvailability(sandboxSessions).then(setAvailability)
                        }}
                    />
                ))}
            </ul>
        </section>
    )
}

type CardState =
    | { kind: "idle" }
    | { kind: "form" }
    | { kind: "sending" }
    | { kind: "confirmed"; sandbox: boolean }
    | { kind: "full" }
    | { kind: "already-booked" }
    | { kind: "error" }

function BookingCard({
    session,
    sandboxSession,
    occurrences,
    noun,
    onBooked,
}: {
    session: ScheduleSession
    sandboxSession: BookingSandboxSession
    occurrences: BookingOccurrence[]
    noun: string
    onBooked: () => void
}): React.ReactElement {
    const [state, setState] = useState<CardState>({ kind: "idle" })
    const [date, setDate] = useState<string>("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [honeypot, setHoneypot] = useState("")

    const openOccurrences = occurrences.filter((occurrence) => !occurrence.full)
    const selectedDate = date !== "" ? date : (openOccurrences[0]?.date ?? "")
    const selected = occurrences.find((occurrence) => occurrence.date === selectedDate)

    const submit = async (): Promise<void> => {
        if (name.trim() === "" || email.trim() === "" || selectedDate === "") {
            return
        }
        setState({ kind: "sending" })
        const result = await bookSeat(
            {
                sessionId: session.sessionId,
                date: selectedDate,
                name: name.trim(),
                email: email.trim(),
                honeypot,
            },
            sandboxSession,
        )
        if (result.status === "confirmed") {
            setState({ kind: "confirmed", sandbox: result.sandbox })
            onBooked()
        } else if (result.status === "full") {
            setState({ kind: "full" })
            onBooked()
        } else if (result.status === "already-booked") {
            setState({ kind: "already-booked" })
        } else {
            setState({ kind: "error" })
        }
    }

    const allFull = occurrences.length > 0 && openOccurrences.length === 0

    return (
        <li className={styles.card}>
            <div className={styles.cardHeader}>
                <div>
                    <p className={styles.cardTitle}>{session.title}</p>
                    <p className={styles.cardMeta}>
                        {dayNames[session.day]}s · {formatMinute(session.start)} – {formatMinute(session.end)}
                        {session.instructor !== "" ? ` · ${session.instructor}` : ""}
                    </p>
                </div>
                {selected !== undefined && selected.remaining !== null ? (
                    <span
                        className={selected.full ? styles.seatsChipFull : styles.seatsChip}
                        aria-live="polite"
                    >
                        {selected.full
                            ? "Full"
                            : `${selected.remaining} ${selected.remaining === 1 ? "seat" : "seats"} left`}
                    </span>
                ) : null}
            </div>

            {state.kind === "confirmed" ? (
                <div>
                    <p className={styles.stateText}>You&apos;re in — see you there.</p>
                    <p className={styles.stateSubtext}>
                        {state.sandbox
                            ? "Preview mode: this booking is simulated and nothing was sent."
                            : "A confirmation with a one-click cancel link is on its way to your inbox."}
                    </p>
                </div>
            ) : state.kind === "full" ? (
                <p className={styles.stateText}>That {noun} just filled up — try another date.</p>
            ) : state.kind === "already-booked" ? (
                <p className={styles.stateText}>You already have a spot in this {noun} — check your inbox.</p>
            ) : state.kind === "error" ? (
                <p className={styles.stateText}>Something went wrong — please try again in a moment.</p>
            ) : allFull ? (
                <p className={styles.stateText}>All upcoming dates are full.</p>
            ) : state.kind === "idle" ? (
                <div className={styles.controlsRow}>
                    <select
                        className={styles.dateSelect}
                        aria-label={`Choose a date for ${session.title}`}
                        value={selectedDate}
                        onChange={(event) => setDate(event.target.value)}
                    >
                        {occurrences.map((occurrence) => (
                            <option key={occurrence.date} value={occurrence.date} disabled={occurrence.full}>
                                {formatOccurrenceOption(occurrence)}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className={styles.bookButton}
                        onClick={() => setState({ kind: "form" })}
                    >
                        Book this {noun}
                    </button>
                </div>
            ) : (
                <form
                    className={styles.controlsRow}
                    onSubmit={(event) => {
                        event.preventDefault()
                        void submit()
                    }}
                >
                    <input
                        className={styles.input}
                        aria-label="Your name"
                        placeholder="Your name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                    <input
                        className={styles.input}
                        type="email"
                        aria-label="Your email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                    {/* The honeypot: humans never see it, bots fill it. */}
                    <input
                        className={styles.honeypot}
                        aria-hidden="true"
                        tabIndex={-1}
                        autoComplete="off"
                        name="_trap"
                        value={honeypot}
                        onChange={(event) => setHoneypot(event.target.value)}
                    />
                    <button type="submit" className={styles.bookButton} disabled={state.kind === "sending"}>
                        {state.kind === "sending"
                            ? "Booking…"
                            : `Confirm — ${formatOccurrenceOption(selected ?? occurrences[0])}`}
                    </button>
                </form>
            )}
        </li>
    )
}

/** "Mon Sep 7" (+ seat hint when capacity is tracked) for the date picker. */
function formatOccurrenceOption(occurrence: BookingOccurrence | undefined): string {
    if (occurrence === undefined) {
        return ""
    }
    const [year, month, day] = occurrence.date.split("-").map(Number)
    const utc = new Date(Date.UTC(year, month - 1, day))
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][utc.getUTCDay()]
    const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
        month - 1
    ]
    const label = `${weekday} ${monthName} ${day}`
    if (occurrence.remaining === null) {
        return label
    }
    return occurrence.full ? `${label} — full` : label
}
