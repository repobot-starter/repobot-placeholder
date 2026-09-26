import React, { useEffect, useMemo, useState } from "react"
import {
    bookAppointment,
    fetchAppointmentAvailability,
    type AppointmentAvailability,
    type AppointmentSandboxSlot,
} from "@base/core"
import { MarketingImage } from "@ui"
import { formatMinute } from "../Landing/hours"
import { generateAppointmentSlots, type AppointmentsContent } from "../Landing/practiceDocument"
import type { PhotoImage } from "./content"
import * as styles from "./BookingWidget.styles.css"

/**
 * The wedding pack's session-booking widget — the same managed
 * booking kernel the care pack rides (booking mode 2: capacity-1 slots
 * from the photographer's weekly windows x session types), worn in the
 * pack's own editorial register: session cards fronted by photographs,
 * then a date, then a time, then four fields.
 *
 * Talks to the site's own origin through BookingClient (@base/core) —
 * the /__booking doors, consumed exactly as the care pack consumes them,
 * no invented endpoint shapes. In sandboxes and workspace previews the
 * reserved paths don't exist, so the client simulates against the page's
 * own generated slots and the interaction completes exactly like
 * production. The form asks for a name, an email, an optional phone
 * number, and whether it's a first session — nothing more.
 *
 * Session-card photographs render through MarketingImage so their
 * `/photography/…` srcs pick up the Vite base (baked previews live under
 * /previews/photography/). A raw `<img src={image.src}>` 404s there even
 * though the files ship in the pack.
 *
 * Renders nothing when the contract offers no slots, so pages can mount
 * it unconditionally.
 */
export function BookingWidget({
    appointments,
    sessionImages,
    inquireHref,
}: {
    appointments: AppointmentsContent
    /** typeId → the frame on its card (content.ts `booking.sessionImages`). */
    sessionImages: Record<string, PhotoImage | undefined>
    /** Where "the calendar can't hold it" points: the inquiry page. */
    inquireHref: string
}): React.ReactElement | null {
    const slots = useMemo<AppointmentSandboxSlot[]>(
        () => generateAppointmentSlots(appointments),
        [appointments],
    )
    const [availability, setAvailability] = useState<AppointmentAvailability | null>(null)
    useEffect(() => {
        if (slots.length === 0) {
            return
        }
        let alive = true
        void fetchAppointmentAvailability(slots).then((result) => {
            if (alive) {
                setAvailability(result)
            }
        })
        return () => {
            alive = false
        }
    }, [slots])

    const [typeId, setTypeId] = useState<string>("")
    const [date, setDate] = useState<string>("")
    const [slotSessionId, setSlotSessionId] = useState<string>("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    // The door's new/returning field, worn as "first session or not" —
    // the only session fact the form carries.
    const [returning, setReturning] = useState(false)
    const [honeypot, setHoneypot] = useState("")
    const [state, setState] = useState<
        | { kind: "picking" }
        | { kind: "sending" }
        // The confirmed state carries what was booked: after booking, the
        // availability refresh drops the taken slot from the picker, so
        // deriving the confirmation line from live availability would show
        // a different time than the one just held.
        | { kind: "confirmed"; sandbox: boolean; sessionName: string; date: string; start: number }
        | { kind: "slot-taken" }
        | { kind: "already-booked" }
        | { kind: "error" }
    >({ kind: "picking" })

    // Offer only what is actually open: session types with at least one
    // open occurrence, dates and times narrowing with each pick.
    const openSlots = availability?.slots ?? []
    const types = appointments.types.filter((type) => openSlots.some((slot) => slot.typeId === type.typeId))
    const selectedTypeId = types.some((type) => type.typeId === typeId) ? typeId : (types[0]?.typeId ?? "")
    const typeSlots = openSlots.filter((slot) => slot.typeId === selectedTypeId)
    const dates = [...new Set(typeSlots.map((slot) => slot.date))].sort()
    const selectedDate = dates.includes(date) ? date : (dates[0] ?? "")
    const daySlots = typeSlots.filter((slot) => slot.date === selectedDate).sort((a, b) => a.start - b.start)
    const selectedSlot = daySlots.find((slot) => slot.sessionId === slotSessionId) ?? daySlots[0] ?? undefined

    if (slots.length === 0) {
        return null
    }

    const selectedType = types.find((type) => type.typeId === selectedTypeId)

    const submit = async (): Promise<void> => {
        if (selectedSlot === undefined || name.trim() === "" || email.trim() === "") {
            return
        }
        setState({ kind: "sending" })
        const result = await bookAppointment(
            {
                sessionId: selectedSlot.sessionId,
                date: selectedSlot.date,
                name: name.trim(),
                email: email.trim(),
                ...(phone.trim() !== "" ? { phone: phone.trim() } : {}),
                patientStatus: returning ? "RETURNING" : "NEW",
                honeypot,
            },
            slots.find((slot) => slot.sessionId === selectedSlot.sessionId),
        )
        if (result.status === "confirmed") {
            setState({
                kind: "confirmed",
                sandbox: result.sandbox,
                sessionName: selectedType?.name ?? "Your session",
                date: selectedSlot.date,
                start: selectedSlot.start,
            })
        } else if (result.status === "slot-taken") {
            setState({ kind: "slot-taken" })
        } else if (result.status === "already-booked") {
            setState({ kind: "already-booked" })
        } else {
            setState({ kind: "error" })
        }
        // Refresh so a taken time disappears from the picker either way.
        void fetchAppointmentAvailability(slots).then(setAvailability)
    }

    if (state.kind === "confirmed") {
        return (
            <section id="book-widget" className={styles.wrap} aria-label="Booking confirmed">
                <div className={styles.confirmedCard}>
                    <h2 className={styles.confirmedTitle}>It&apos;s on the calendar.</h2>
                    <p className={styles.stateText}>
                        {`${state.sessionName} — ${formatDateLabel(state.date)} at ${formatMinute(state.start)}.`}
                    </p>
                    <p className={styles.stateSubtext}>
                        {state.sandbox
                            ? "Preview mode: this booking is simulated and nothing was sent."
                            : "A confirmation with a one-click cancel link is on its way to your inbox. Location details and a short what-to-expect note follow a few days before."}
                    </p>
                </div>
            </section>
        )
    }

    return (
        <section id="book-widget" className={styles.wrap} aria-label="Book a session">
            {availability !== null && openSlots.length === 0 ? (
                <div className={styles.step}>
                    <p className={styles.stateText}>
                        The calendar is spoken for at the moment. <a href={inquireHref}>Send an inquiry</a>{" "}
                        and we&apos;ll find a time together.
                    </p>
                </div>
            ) : (
                <>
                    <div className={styles.step}>
                        <p className={styles.stepLabel}>The session</p>
                        <div className={styles.sessionGrid} role="group" aria-label="Session type">
                            {types.map((type) => {
                                const image = sessionImages[type.typeId]
                                return (
                                    <button
                                        key={type.typeId}
                                        type="button"
                                        className={
                                            type.typeId === selectedTypeId
                                                ? styles.sessionCardSelected
                                                : styles.sessionCard
                                        }
                                        aria-pressed={type.typeId === selectedTypeId}
                                        onClick={() => {
                                            setTypeId(type.typeId)
                                            setSlotSessionId("")
                                        }}
                                    >
                                        {image !== undefined ? (
                                            <MarketingImage
                                                className={styles.sessionImage}
                                                src={image.src}
                                                srcSet={image.srcSet}
                                                sizes="(max-width: 860px) 100vw, 300px"
                                                alt={image.alt}
                                                width={image.width}
                                                height={image.height}
                                            />
                                        ) : null}
                                        <span className={styles.sessionBody}>
                                            <span className={styles.sessionMeta}>
                                                {type.durationMinutes} minutes
                                            </span>
                                            <span className={styles.sessionTitle}>{type.name}</span>
                                            {type.description !== undefined ? (
                                                <span className={styles.sessionDescription}>
                                                    {type.description}
                                                </span>
                                            ) : null}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className={styles.step}>
                        <p className={styles.stepLabel}>The date</p>
                        <select
                            className={styles.dateSelect}
                            aria-label="Choose a date"
                            value={selectedDate}
                            onChange={(event) => {
                                setDate(event.target.value)
                                setSlotSessionId("")
                            }}
                        >
                            {dates.map((candidate) => (
                                <option key={candidate} value={candidate}>
                                    {formatDateLabel(candidate)}
                                </option>
                            ))}
                        </select>
                        <div className={styles.timeRow} role="group" aria-label="Choose a time">
                            {daySlots.map((slot) => (
                                <button
                                    key={slot.sessionId}
                                    type="button"
                                    className={
                                        selectedSlot?.sessionId === slot.sessionId
                                            ? styles.timeChipSelected
                                            : styles.timeChip
                                    }
                                    aria-pressed={selectedSlot?.sessionId === slot.sessionId}
                                    onClick={() => setSlotSessionId(slot.sessionId)}
                                >
                                    {formatMinute(slot.start)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.step}>
                        <p className={styles.stepLabel}>Your details</p>
                        {state.kind === "slot-taken" ? (
                            <p className={styles.stateText}>
                                That time was just taken — pick another and try again.
                            </p>
                        ) : state.kind === "already-booked" ? (
                            <p className={styles.stateText}>
                                You already hold this session — check your inbox for the confirmation.
                            </p>
                        ) : state.kind === "error" ? (
                            <p className={styles.stateText}>
                                Something went wrong — please try again in a moment.
                            </p>
                        ) : null}
                        <form
                            className={styles.form}
                            aria-label="Your details"
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
                            <input
                                className={styles.input}
                                type="tel"
                                aria-label="Phone (optional)"
                                placeholder="Phone (optional)"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                            />
                            <select
                                className={styles.input}
                                aria-label="Have we worked together before?"
                                value={returning ? "RETURNING" : "NEW"}
                                onChange={(event) => setReturning(event.target.value === "RETURNING")}
                            >
                                <option value="NEW">First session together</option>
                                <option value="RETURNING">We&apos;ve worked together before</option>
                            </select>
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
                            <button
                                type="submit"
                                className={styles.bookButton}
                                disabled={state.kind === "sending" || selectedSlot === undefined}
                            >
                                {state.kind === "sending"
                                    ? "Holding the time…"
                                    : selectedSlot !== undefined
                                      ? `Hold this time — ${formatDateLabel(selectedSlot.date)}, ${formatMinute(selectedSlot.start)}`
                                      : "Hold this time"}
                            </button>
                        </form>
                        <p className={styles.finePrint}>
                            Just enough to hold the time — a name, a way to reach you, and the session.
                            Everything about the pictures themselves we&apos;ll talk through beforehand.
                        </p>
                    </div>
                </>
            )}
        </section>
    )
}

/** "Mon Sep 7" for a YYYY-MM-DD, timezone-free. */
function formatDateLabel(date: string): string {
    const [year, month, day] = date.split("-").map(Number)
    const utc = new Date(Date.UTC(year, month - 1, day))
    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][utc.getUTCDay()]
    const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
        month - 1
    ]
    return `${weekday} ${monthName} ${day}`
}
