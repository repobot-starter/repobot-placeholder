/**
 * Client half of the managed booking kernel: deployed sites talk to their
 * own origin (/__booking/availability | book — same-origin, so no CORS and
 * no baked-in site ids), where the platform's site router resolves the site
 * from the Host header and forwards to the control plane. Booking state of
 * record is control-plane Postgres; the static site only ever reads
 * availability and posts bookings.
 *
 * Outside a deployed site (sandbox dev server, workspace preview) the
 * reserved path does not exist, so the client switches to SANDBOX
 * SIMULATION: availability is computed from the page's own schedule data,
 * bookings record into localStorage, and the visitor's interaction
 * completes exactly like production — no request ever reaches a real door.
 */

/** Reserved same-origin paths the site router listens on. */
export const BOOKING_AVAILABILITY_PATH = "/__booking/availability"
export const BOOKING_BOOK_PATH = "/__booking/book"
export const BOOKING_APPOINTMENTS_PATH = "/__booking/appointments"

/**
 * The honeypot field name, same convention as the forms pipeline: rendered
 * as a visually hidden input humans never fill; the platform silently
 * drops bookings where it is non-empty.
 */
export const BOOKING_HONEYPOT_FIELD = "_trap"

/** Where sandbox-mode bookings live in localStorage. */
export const BOOKING_SANDBOX_STORAGE_KEY = "rb.booking.sandbox"

/** How many weeks of occurrences the booking window offers. */
export const BOOKING_WEEKS_AHEAD = 3

/** What the widget needs to know about a class to simulate availability. */
export interface BookingSandboxSession {
    sessionId: string
    /** Weekday 0 (Sunday) – 6 (Saturday). */
    day: number
    /** Confirmed-seat ceiling; null when capacity is not tracked. */
    capacity: number | null
}

export interface BookingOccurrence {
    /** The occurrence's calendar date, YYYY-MM-DD. */
    date: string
    /** Seats left; null when the class does not track capacity. */
    remaining: number | null
    full: boolean
}

export interface BookingSessionAvailability {
    sessionId: string
    capacity: number | null
    occurrences: BookingOccurrence[]
}

export interface BookingAvailability {
    /** True when the real door was unreachable and this is the simulation. */
    sandbox: boolean
    sessions: BookingSessionAvailability[]
}

export interface BookSeatRequest {
    sessionId: string
    /** The occurrence's calendar date, YYYY-MM-DD. */
    date: string
    name: string
    email: string
    /** The honeypot input's value; forwarded so the platform can drop bots. */
    honeypot?: string
}

export type BookSeatResult =
    | { status: "confirmed"; remaining: number | null; sandbox: boolean }
    | { status: "full" }
    | { status: "already-booked" }
    | { status: "error" }

/** A local YYYY-MM-DD (the visitor's own calendar, not UTC). */
function localDateIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${date.getFullYear()}-${month}-${day}`
}

/**
 * The next occurrence dates of a weekly slot in the visitor's local time,
 * today included — the sandbox counterpart of the server's occurrence
 * window (the real door's availability response carries its own dates).
 */
export function nextOccurrenceDates(
    day: number,
    weeks: number = BOOKING_WEEKS_AHEAD,
    from: Date = new Date(),
): string[] {
    const offsetToFirst = (((day - from.getDay()) % 7) + 7) % 7
    return Array.from({ length: weeks }, (_, week) => {
        const occurrence = new Date(from)
        occurrence.setDate(from.getDate() + offsetToFirst + week * 7)
        return localDateIso(occurrence)
    })
}

interface SandboxBooking {
    sessionId: string
    date: string
    email: string
    /**
     * Appointment-mode extras: the provider and slot interval, so the
     * simulation can hold cross-type overlaps against the provider's
     * whole day exactly like the platform's transaction does. Absent on
     * class bookings.
     */
    providerId?: string
    start?: number
    end?: number
}

function readSandboxBookings(): SandboxBooking[] {
    try {
        const raw = localStorage.getItem(BOOKING_SANDBOX_STORAGE_KEY)
        const parsed: unknown = raw === null ? [] : JSON.parse(raw)
        return Array.isArray(parsed) ? (parsed as SandboxBooking[]) : []
    } catch {
        return []
    }
}

function writeSandboxBooking(booking: SandboxBooking): void {
    try {
        localStorage.setItem(BOOKING_SANDBOX_STORAGE_KEY, JSON.stringify([...readSandboxBookings(), booking]))
    } catch {
        // Storage full or blocked — the confirm state still shows.
    }
}

/** The simulation: the page's own schedule minus locally recorded bookings. */
export function sandboxAvailability(
    sessions: BookingSandboxSession[],
    from: Date = new Date(),
): BookingAvailability {
    const booked = readSandboxBookings()
    return {
        sandbox: true,
        sessions: sessions.map((session) => ({
            sessionId: session.sessionId,
            capacity: session.capacity,
            occurrences: nextOccurrenceDates(session.day, BOOKING_WEEKS_AHEAD, from).map((date) => {
                const taken = booked.filter(
                    (b) => b.sessionId === session.sessionId && b.date === date,
                ).length
                const remaining = session.capacity === null ? null : Math.max(0, session.capacity - taken)
                return { date, remaining, full: remaining !== null && remaining <= 0 }
            }),
        })),
    }
}

/**
 * Live availability from the site's own origin, or the sandbox simulation
 * when no door answers (dev server, workspace preview, door not rolled
 * out). Never throws.
 */
export async function fetchBookingAvailability(
    sandboxSessions: BookingSandboxSession[],
): Promise<BookingAvailability> {
    try {
        const response = await fetch(BOOKING_AVAILABILITY_PATH)
        if (response.ok) {
            const body = (await response.json()) as {
                sessions?: {
                    sessionId: string
                    capacity: number | null
                    occurrences: BookingOccurrence[]
                }[]
            }
            return {
                sandbox: false,
                sessions: (body.sessions ?? []).map((session) => ({
                    sessionId: session.sessionId,
                    capacity: session.capacity ?? null,
                    occurrences: session.occurrences ?? [],
                })),
            }
        }
    } catch {
        // Network failure — same as a non-2xx below.
    }
    return sandboxAvailability(sandboxSessions)
}

/**
 * Books one seat. Real-door domain outcomes come back as states the widget
 * renders (full / already booked); only an unreachable or unconfigured
 * door falls back to the sandbox simulation — a genuine "class full" must
 * never turn into a fake confirmation.
 */
export async function bookSeat(
    request: BookSeatRequest,
    sandboxSession?: BookingSandboxSession,
): Promise<BookSeatResult> {
    let doorAnswered = false
    try {
        const response = await fetch(BOOKING_BOOK_PATH, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                sessionId: request.sessionId,
                date: request.date,
                name: request.name,
                email: request.email,
                [BOOKING_HONEYPOT_FIELD]: request.honeypot ?? "",
            }),
        })
        if (response.ok) {
            const body = (await response.json()) as { booking?: { remaining?: number | null } }
            return {
                status: "confirmed",
                remaining: body.booking?.remaining ?? null,
                sandbox: false,
            }
        }
        // The door spoke: its domain outcomes are answers, not failures.
        if (
            response.status === 409 ||
            response.status === 429 ||
            response.status === 400 ||
            response.status === 410
        ) {
            doorAnswered = true
            const body = (await response.json().catch(() => ({}))) as { error?: string }
            if (body.error === "class_full") {
                return { status: "full" }
            }
            if (body.error === "already_booked") {
                return { status: "already-booked" }
            }
            return { status: "error" }
        }
    } catch {
        // Network failure — treated as no door below.
    }
    if (doorAnswered) {
        return { status: "error" }
    }
    // No door (sandbox dev server, workspace preview): simulate. The
    // localStorage record makes repeat availability reads consistent.
    if (sandboxSession) {
        const current = sandboxAvailability([sandboxSession])
        const occurrence = current.sessions[0]?.occurrences.find(
            (candidate) => candidate.date === request.date,
        )
        if (occurrence?.full === true) {
            return { status: "full" }
        }
        writeSandboxBooking({
            sessionId: request.sessionId,
            date: request.date,
            email: request.email.trim().toLowerCase(),
        })
        const remaining =
            occurrence?.remaining === null || occurrence === undefined
                ? null
                : Math.max(0, occurrence.remaining - 1)
        return { status: "confirmed", remaining, sandbox: true }
    }
    return { status: "error" }
}

// --------------------------------------------------------------- appointments
// Booking mode 2: capacity-1 appointment slots generated from provider
// availability windows x visit types (the contract's appointments domain).
// Same door, same sandbox discipline: a real door's domain outcomes are
// always relayed; only an unreachable door simulates.

/**
 * One weekly appointment slot as the page derives it from its own
 * contract (the kernel's generateAppointmentSlots) — the simulation's
 * input, and the descriptor bookAppointment needs to hold provider
 * overlaps locally.
 */
export interface AppointmentSandboxSlot {
    sessionId: string
    providerId: string
    typeId: string
    /** Weekday 0 (Sunday) – 6 (Saturday). */
    day: number
    /** Slot interval, minutes since midnight. */
    start: number
    end: number
}

/** One OPEN bookable slot occurrence: a concrete provider x date x time. */
export interface AppointmentSlotOccurrence {
    sessionId: string
    providerId: string
    typeId: string
    /** The occurrence's calendar date, YYYY-MM-DD. */
    date: string
    start: number
    end: number
}

export interface AppointmentAvailability {
    /** True when the real door was unreachable and this is the simulation. */
    sandbox: boolean
    /** Open slots only — a taken or overlapped slot simply isn't offered. */
    slots: AppointmentSlotOccurrence[]
}

export interface BookAppointmentRequest {
    sessionId: string
    /** The occurrence's calendar date, YYYY-MM-DD. */
    date: string
    name: string
    email: string
    /** Optional callback number; never required. */
    phone?: string
    /**
     * New or returning patient — the ONLY visit fact the form carries.
     * The booking schema is deliberately clinically empty: no free-text
     * reason, no symptoms, no health questions, ever.
     */
    patientStatus: "NEW" | "RETURNING"
    honeypot?: string
}

export type BookAppointmentResult =
    | { status: "confirmed"; sandbox: boolean }
    | { status: "slot-taken" }
    | { status: "already-booked" }
    | { status: "error" }

/** Whether two same-day minute intervals overlap. */
function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    return aStart < bEnd && bStart < aEnd
}

/**
 * The simulation: every slot's upcoming occurrences, minus any that
 * overlap a locally recorded booking for the same provider on that date —
 * the platform transaction's overlap rule, held in localStorage.
 */
export function sandboxAppointmentAvailability(
    slots: AppointmentSandboxSlot[],
    from: Date = new Date(),
): AppointmentAvailability {
    const booked = readSandboxBookings()
    const open: AppointmentSlotOccurrence[] = []
    for (const slot of slots) {
        for (const date of nextOccurrenceDates(slot.day, BOOKING_WEEKS_AHEAD, from)) {
            const taken = booked.some(
                (booking) =>
                    booking.date === date &&
                    (booking.sessionId === slot.sessionId ||
                        (booking.providerId === slot.providerId &&
                            booking.start !== undefined &&
                            booking.end !== undefined &&
                            intervalsOverlap(slot.start, slot.end, booking.start, booking.end))),
            )
            if (!taken) {
                open.push({
                    sessionId: slot.sessionId,
                    providerId: slot.providerId,
                    typeId: slot.typeId,
                    date,
                    start: slot.start,
                    end: slot.end,
                })
            }
        }
    }
    return { sandbox: true, slots: open }
}

/**
 * Live open slots from the site's own origin, or the sandbox simulation
 * when no door answers. Never throws.
 */
export async function fetchAppointmentAvailability(
    sandboxSlots: AppointmentSandboxSlot[],
): Promise<AppointmentAvailability> {
    try {
        const response = await fetch(BOOKING_APPOINTMENTS_PATH)
        if (response.ok) {
            const body = (await response.json()) as { slots?: AppointmentSlotOccurrence[] }
            return {
                sandbox: false,
                slots: (body.slots ?? []).filter(
                    (slot) =>
                        typeof slot.sessionId === "string" &&
                        typeof slot.date === "string" &&
                        typeof slot.start === "number" &&
                        typeof slot.end === "number",
                ),
            }
        }
    } catch {
        // Network failure — same as a non-2xx below.
    }
    return sandboxAppointmentAvailability(sandboxSlots)
}

/**
 * Books one appointment slot. Same relay discipline as bookSeat: the real
 * door's domain outcomes (slot taken, duplicate booking) come back as
 * states, and only an unreachable door falls into the simulation — a
 * genuinely taken slot must never turn into a fake confirmation. The
 * request carries exactly the clinically-empty schema: name, contact,
 * the slot (which encodes the appointment type), and new/returning.
 */
export async function bookAppointment(
    request: BookAppointmentRequest,
    sandboxSlot?: AppointmentSandboxSlot,
): Promise<BookAppointmentResult> {
    let doorAnswered = false
    try {
        const response = await fetch(BOOKING_BOOK_PATH, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                sessionId: request.sessionId,
                date: request.date,
                name: request.name,
                email: request.email,
                ...(request.phone !== undefined && request.phone.trim() !== ""
                    ? { phone: request.phone }
                    : {}),
                patientStatus: request.patientStatus,
                [BOOKING_HONEYPOT_FIELD]: request.honeypot ?? "",
            }),
        })
        if (response.ok) {
            return { status: "confirmed", sandbox: false }
        }
        if (
            response.status === 409 ||
            response.status === 429 ||
            response.status === 400 ||
            response.status === 410
        ) {
            doorAnswered = true
            const body = (await response.json().catch(() => ({}))) as { error?: string }
            if (body.error === "slot_taken" || body.error === "class_full") {
                return { status: "slot-taken" }
            }
            if (body.error === "already_booked") {
                return { status: "already-booked" }
            }
            return { status: "error" }
        }
    } catch {
        // Network failure — treated as no door below.
    }
    if (doorAnswered) {
        return { status: "error" }
    }
    if (sandboxSlot) {
        const current = sandboxAppointmentAvailability([sandboxSlot])
        const stillOpen = current.slots.some(
            (slot) => slot.sessionId === request.sessionId && slot.date === request.date,
        )
        if (!stillOpen) {
            return { status: "slot-taken" }
        }
        writeSandboxBooking({
            sessionId: request.sessionId,
            date: request.date,
            email: request.email.trim().toLowerCase(),
            providerId: sandboxSlot.providerId,
            start: sandboxSlot.start,
            end: sandboxSlot.end,
        })
        return { status: "confirmed", sandbox: true }
    }
    return { status: "error" }
}
