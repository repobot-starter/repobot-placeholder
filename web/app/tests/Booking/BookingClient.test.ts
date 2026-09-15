import {
    BOOKING_AVAILABILITY_PATH,
    BOOKING_BOOK_PATH,
    BOOKING_HONEYPOT_FIELD,
    BOOKING_SANDBOX_STORAGE_KEY,
    bookSeat,
    fetchBookingAvailability,
    nextOccurrenceDates,
    sandboxAvailability,
} from "@base/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const tuesdaySlot = { sessionId: "tue-0700-hiit", day: 2, capacity: 2 }

describe("nextOccurrenceDates (sandbox occurrence window)", () => {
    it("yields the next N local dates on the weekday, today included", () => {
        // Wednesday June 3 2026, local time.
        const from = new Date(2026, 5, 3, 10, 0, 0)
        expect(nextOccurrenceDates(3, 3, from)).toEqual(["2026-06-03", "2026-06-10", "2026-06-17"])
        // Tuesday is 6 days ahead of a Wednesday.
        expect(nextOccurrenceDates(2, 2, from)).toEqual(["2026-06-09", "2026-06-16"])
    })
})

describe("booking client (managed booking kernel)", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("reads live availability from the same-origin door", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                sessions: [
                    {
                        sessionId: "tue-0700-hiit",
                        capacity: 2,
                        occurrences: [{ date: "2026-06-09", remaining: 1, full: false }],
                    },
                ],
            }),
        })
        vi.stubGlobal("fetch", fetchMock)

        const availability = await fetchBookingAvailability([tuesdaySlot])
        expect(fetchMock).toHaveBeenCalledWith(BOOKING_AVAILABILITY_PATH)
        expect(availability.sandbox).toBe(false)
        expect(availability.sessions[0]?.occurrences[0]?.remaining).toBe(1)
    })

    it("simulates availability when no door answers (sandbox / preview)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no router here")))

        const availability = await fetchBookingAvailability([tuesdaySlot])
        expect(availability.sandbox).toBe(true)
        const session = availability.sessions[0]!
        expect(session.sessionId).toBe("tue-0700-hiit")
        expect(session.occurrences).toHaveLength(3)
        for (const occurrence of session.occurrences) {
            expect(occurrence.remaining).toBe(2)
            expect(occurrence.full).toBe(false)
        }
    })

    it("posts a booking with the honeypot field to the door", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ booking: { remaining: 4 } }),
        })
        vi.stubGlobal("fetch", fetchMock)

        const result = await bookSeat({
            sessionId: "tue-0700-hiit",
            date: "2026-06-09",
            name: "Ada",
            email: "ada@example.com",
        })
        expect(result).toEqual({ status: "confirmed", remaining: 4, sandbox: false })
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(url).toBe(BOOKING_BOOK_PATH)
        expect(JSON.parse(init.body as string)[BOOKING_HONEYPOT_FIELD]).toBe("")
    })

    it("relays the door's class_full — never fakes a confirmation", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 409,
                json: async () => ({ error: "class_full" }),
            }),
        )

        const result = await bookSeat(
            {
                sessionId: "tue-0700-hiit",
                date: "2026-06-09",
                name: "Ada",
                email: "ada@example.com",
            },
            tuesdaySlot,
        )
        // Even with a sandbox session available, a real door outcome wins.
        expect(result.status).toBe("full")
        expect(localStorage.getItem(BOOKING_SANDBOX_STORAGE_KEY)).toBeNull()
    })

    it("relays already_booked (duplicate email for the occurrence)", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 409,
                json: async () => ({ error: "already_booked" }),
            }),
        )

        const result = await bookSeat({
            sessionId: "tue-0700-hiit",
            date: "2026-06-09",
            name: "Ada",
            email: "ada@example.com",
        })
        expect(result.status).toBe("already-booked")
    })

    it("simulates the booking when no door answers, and seats deplete", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

        const date = nextOccurrenceDates(tuesdaySlot.day, 1)[0]!
        const first = await bookSeat(
            { sessionId: "tue-0700-hiit", date, name: "Ada", email: "ada@example.com" },
            tuesdaySlot,
        )
        expect(first).toEqual({ status: "confirmed", remaining: 1, sandbox: true })

        const second = await bookSeat(
            { sessionId: "tue-0700-hiit", date, name: "Grace", email: "grace@example.com" },
            tuesdaySlot,
        )
        expect(second).toEqual({ status: "confirmed", remaining: 0, sandbox: true })

        // The simulated class is now full — the third visitor sees "full".
        const third = await bookSeat(
            { sessionId: "tue-0700-hiit", date, name: "Alan", email: "alan@example.com" },
            tuesdaySlot,
        )
        expect(third.status).toBe("full")

        // And availability reads agree with the recorded bookings.
        const availability = sandboxAvailability([tuesdaySlot])
        const occurrence = availability.sessions[0]!.occurrences.find((candidate) => candidate.date === date)
        expect(occurrence?.remaining).toBe(0)
        expect(occurrence?.full).toBe(true)
    })

    it("errors (not sandbox) when the door answered with a server failure", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 429,
                json: async () => ({ error: "rate_limited" }),
            }),
        )

        const result = await bookSeat(
            {
                sessionId: "tue-0700-hiit",
                date: "2026-06-09",
                name: "Ada",
                email: "ada@example.com",
            },
            tuesdaySlot,
        )
        expect(result.status).toBe("error")
        expect(localStorage.getItem(BOOKING_SANDBOX_STORAGE_KEY)).toBeNull()
    })
})
