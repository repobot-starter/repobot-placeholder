import React, { useEffect, useMemo, useState } from "react"
import {
    bookAppointment,
    fetchAppointmentAvailability,
    type AppointmentAvailability,
    type AppointmentSandboxSlot,
} from "@base/core"
import { formatMinute } from "./hours"
import { generateAppointmentSlots, type AppointmentsContent } from "./practiceDocument"
import * as styles from "./AppointmentWidget.styles.css"

/**
 * The appointment-booking widget the healthcare packs mount — booking
 * MODE 2 on the managed booking kernel: capacity-1 slots generated from
 * provider availability windows x visit types (the contract's
 * appointments domain), picked as visit type → provider → date → time,
 * then confirmed with name, contact, and new/returning patient.
 *
 * THE FORM IS CLINICALLY EMPTY BY DESIGN. There is no free-text reason,
 * no symptoms, no health questions — the platform never holds medical
 * information, and this widget is where that promise is kept for
 * visitors. Do not add fields here.
 *
 * Talks to the site's own origin through BookingClient (@base/core); in
 * sandboxes and workspace previews the client simulates against the
 * page's own generated slots, including the provider-overlap rule, so a
 * preview behaves exactly like a deploy. Renders nothing when the
 * contract offers no slots — pages can mount it unconditionally.
 */
export function AppointmentWidget({
    appointments,
    headline = "Book an appointment",
    intro = "Pick a visit type and a time that works — you'll get a confirmation with a one-click cancel link.",
}: {
    appointments: AppointmentsContent
    headline?: string
    intro?: string
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
    const [patientStatus, setPatientStatus] = useState<"NEW" | "RETURNING">("NEW")
    const [honeypot, setHoneypot] = useState("")
    const [state, setState] = useState<
        | { kind: "picking" }
        | { kind: "sending" }
        | { kind: "confirmed"; sandbox: boolean }
        | { kind: "slot-taken" }
        | { kind: "already-booked" }
        | { kind: "error" }
    >({ kind: "picking" })

    // Offer only what is actually open: types and providers with at least
    // one open occurrence, dates and times narrowing with each pick.
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
    const selectedProvider = providers.find((provider) => provider.providerId === selectedProviderId)

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
                patientStatus,
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
        <section id="book" className={styles.wrap} aria-label="Book an appointment">
            <div className={styles.card}>
                <div>
                    <h2 className={styles.heading}>{headline}</h2>
                    <p className={styles.intro}>{intro}</p>
                </div>

                {state.kind === "confirmed" ? (
                    <div>
                        <p className={styles.stateText}>
                            You&apos;re booked
                            {selectedType !== undefined ? `: ${selectedType.name.toLowerCase()}` : ""}
                            {selectedProvider !== undefined ? ` with ${selectedProvider.name}` : ""}
                            {selectedSlot !== undefined
                                ? ` — ${formatDateLabel(selectedSlot.date)} at ${formatMinute(selectedSlot.start)}`
                                : ""}
                            .
                        </p>
                        <p className={styles.stateSubtext}>
                            {state.sandbox
                                ? "Preview mode: this booking is simulated and nothing was sent."
                                : "A confirmation with a one-click cancel link is on its way to your inbox."}
                        </p>
                    </div>
                ) : availability !== null && openSlots.length === 0 ? (
                    <p className={styles.stateText}>
                        Online booking is fully booked right now — please call the office to find a time.
                    </p>
                ) : (
                    <>
                        <div className={styles.step}>
                            <p className={styles.stepLabel}>Visit type</p>
                            <div className={styles.choiceRow} role="group" aria-label="Visit type">
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

                        <div className={styles.step}>
                            <p className={styles.stepLabel}>Provider</p>
                            <div className={styles.choiceRow} role="group" aria-label="Provider">
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
                                You already have this appointment — check your inbox for the confirmation.
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
                                aria-label="Have you visited us before?"
                                value={patientStatus}
                                onChange={(event) =>
                                    setPatientStatus(event.target.value === "RETURNING" ? "RETURNING" : "NEW")
                                }
                            >
                                <option value="NEW">New patient</option>
                                <option value="RETURNING">Returning patient</option>
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
                                    ? "Booking…"
                                    : selectedSlot !== undefined
                                      ? `Confirm — ${formatDateLabel(selectedSlot.date)}, ${formatMinute(selectedSlot.start)}`
                                      : "Confirm"}
                            </button>
                        </form>
                        <p className={styles.privacyNote}>
                            Just the basics to hold your time — no health questions here, ever. Anything about
                            your visit stays between you and your care team at the office.
                        </p>
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
