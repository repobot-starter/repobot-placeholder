import React, { useEffect, useMemo, useState } from "react"
import {
    bookAppointment,
    fetchAppointmentAvailability,
    type AppointmentAvailability,
    type AppointmentSandboxSlot,
} from "@base/core"
import { formatMinute } from "../Landing/hours"
import { generateAppointmentSlots, type AppointmentsContent } from "../Landing/practiceDocument"
import * as styles from "./SessionBookingWidget.styles.css"

/**
 * The photographer's session-booking widget — the healthcare pack's
 * appointment machinery (booking MODE 2 on the managed booking kernel)
 * re-dressed for a one-photographer studio: capacity-1 slots generated
 * from the studio's weekly windows x session types, picked as session →
 * date → time, then held with a name and an email.
 *
 * Consumes the SAME /__booking door as the AppointmentWidget, through the
 * same BookingClient (@base/core): live availability on a deploy, sandbox
 * simulation (with the provider-overlap rule) in previews — a taken
 * evening never double-books in either world. The platform's DB-owned
 * schedule source lands behind the same door with no change here.
 *
 * Differences from the healthcare widget are copy and composition, not
 * contract: the provider step hides when the studio has one photographer
 * (it does), the "patient" facts read as "first session / returning
 * family" (the door's NEW/RETURNING vocabulary, re-labeled), and the
 * booking form stays deliberately small — name, email, optional phone.
 * Renders nothing when the contract offers no slots.
 */
export function SessionBookingWidget({
    appointments,
    headline = "Pick a time",
    intro,
    formNote,
}: {
    appointments: AppointmentsContent
    headline?: string
    intro?: string
    formNote?: string
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
    const [providerId, setProviderId] = useState<string>("")
    const [date, setDate] = useState<string>("")
    const [slotSessionId, setSlotSessionId] = useState<string>("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [returning, setReturning] = useState<"NEW" | "RETURNING">("NEW")
    const [honeypot, setHoneypot] = useState("")
    const [state, setState] = useState<
        | { kind: "picking" }
        | { kind: "sending" }
        | { kind: "confirmed"; sandbox: boolean }
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
    const providers = appointments.providers.filter((provider) =>
        typeSlots.some((slot) => slot.providerId === provider.providerId),
    )
    const selectedProviderId = providers.some((provider) => provider.providerId === providerId)
        ? providerId
        : (providers[0]?.providerId ?? "")
    const providerSlots = typeSlots.filter((slot) => slot.providerId === selectedProviderId)
    const dates = [...new Set(providerSlots.map((slot) => slot.date))].sort()
    const selectedDate = dates.includes(date) ? date : (dates[0] ?? "")
    const daySlots = providerSlots
        .filter((slot) => slot.date === selectedDate)
        .sort((a, b) => a.start - b.start)
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
                // The booking door's NEW/RETURNING vocabulary, worn as
                // "first session / returning family" in the copy above.
                patientStatus: returning,
                honeypot,
            },
            slots.find((slot) => slot.sessionId === selectedSlot.sessionId),
        )
        if (result.status === "confirmed") {
            setState({ kind: "confirmed", sandbox: result.sandbox })
        } else if (result.status === "slot-taken") {
            setState({ kind: "slot-taken" })
        } else if (result.status === "already-booked") {
            setState({ kind: "already-booked" })
        } else {
            setState({ kind: "error" })
        }
        // Refresh so a taken slot disappears from the picker either way.
        void fetchAppointmentAvailability(slots).then(setAvailability)
    }

    return (
        <section id="book" className={styles.wrap} aria-label="Book a session">
            <div className={styles.card}>
                <div>
                    <h2 className={styles.heading}>{headline}</h2>
                    {intro !== undefined ? <p className={styles.intro}>{intro}</p> : null}
                </div>

                {state.kind === "confirmed" ? (
                    <div>
                        <p className={styles.stateText}>
                            You&apos;re on the calendar
                            {selectedType !== undefined ? `: ${selectedType.name.toLowerCase()}` : ""}
                            {selectedSlot !== undefined
                                ? ` — ${formatDateLabel(selectedSlot.date)} at ${formatMinute(selectedSlot.start)}`
                                : ""}
                            .
                        </p>
                        <p className={styles.stateSubtext}>
                            {state.sandbox
                                ? "Preview mode: this booking is simulated and nothing was sent."
                                : "A confirmation is on its way to your inbox, with my planning guide close behind."}
                        </p>
                    </div>
                ) : availability !== null && openSlots.length === 0 ? (
                    <p className={styles.stateText}>
                        The calendar is full right now — send an inquiry and we&apos;ll find a time together.
                    </p>
                ) : (
                    <>
                        <div className={styles.step}>
                            <p className={styles.stepLabel}>Session</p>
                            <div className={styles.choiceRow} role="group" aria-label="Session type">
                                {types.map((type) => (
                                    <button
                                        key={type.typeId}
                                        type="button"
                                        className={
                                            type.typeId === selectedTypeId
                                                ? styles.choiceSelected
                                                : styles.choice
                                        }
                                        aria-pressed={type.typeId === selectedTypeId}
                                        onClick={() => {
                                            setTypeId(type.typeId)
                                            setSlotSessionId("")
                                        }}
                                    >
                                        <span className={styles.choiceTitle}>{type.name}</span>
                                        <span className={styles.choiceMeta}>
                                            {type.durationMinutes} min
                                            {type.description !== undefined ? ` · ${type.description}` : ""}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* A one-photographer studio books the photographer;
                            the step only appears if the studio ever grows. */}
                        {providers.length > 1 ? (
                            <div className={styles.step}>
                                <p className={styles.stepLabel}>Photographer</p>
                                <div className={styles.choiceRow} role="group" aria-label="Photographer">
                                    {providers.map((provider) => (
                                        <button
                                            key={provider.providerId}
                                            type="button"
                                            className={
                                                provider.providerId === selectedProviderId
                                                    ? styles.choiceSelected
                                                    : styles.choice
                                            }
                                            aria-pressed={provider.providerId === selectedProviderId}
                                            onClick={() => {
                                                setProviderId(provider.providerId)
                                                setSlotSessionId("")
                                            }}
                                        >
                                            <span className={styles.choiceTitle}>{provider.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className={styles.step}>
                            <p className={styles.stepLabel}>Date & time</p>
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
                            <div className={styles.choiceRow} role="group" aria-label="Choose a time">
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

                        {state.kind === "slot-taken" ? (
                            <p className={styles.stateText}>
                                That time was just taken — pick another and try again.
                            </p>
                        ) : state.kind === "already-booked" ? (
                            <p className={styles.stateText}>
                                You already have this session held — check your inbox for the confirmation.
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
                                aria-label="Have we photographed your family before?"
                                value={returning}
                                onChange={(event) =>
                                    setReturning(event.target.value === "RETURNING" ? "RETURNING" : "NEW")
                                }
                            >
                                <option value="NEW">First session</option>
                                <option value="RETURNING">Returning family</option>
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
                                    ? "Holding your time…"
                                    : selectedSlot !== undefined
                                      ? `Hold it — ${formatDateLabel(selectedSlot.date)}, ${formatMinute(selectedSlot.start)}`
                                      : "Hold it"}
                            </button>
                        </form>
                        {formNote !== undefined ? <p className={styles.formNote}>{formNote}</p> : null}
                    </>
                )}
            </div>
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
