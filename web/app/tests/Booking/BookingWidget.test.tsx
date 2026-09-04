import { BOOKING_SANDBOX_STORAGE_KEY } from "@base/core"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { BookingWidget } from "../../src/View/Landing/BookingWidget"
import type { ScheduleSession } from "../../src/View/Landing/contentDocument"

// The suite-wide no-network fetch stub (setupNoNetwork.ts) rejects every
// request — exactly what a sandbox dev server or workspace preview looks
// like to the client, so these tests exercise the simulation mode the
// preview contract requires: no request reaches a real door.

const bookableClass: ScheduleSession = {
    sessionId: "tue-0700-hiit",
    day: 2,
    start: 420,
    end: 480,
    title: "Dawn HIIT",
    instructor: "Marta",
    capacity: 2,
    bookable: true,
}

const unbookableClass: ScheduleSession = {
    sessionId: "wed-1800-open",
    day: 3,
    start: 1080,
    end: 1170,
    title: "Open Gym",
    instructor: "Staff",
}

describe("BookingWidget (sandbox mode)", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it("renders nothing when the schedule has no bookable sessions", () => {
        const { container } = render(<BookingWidget sessions={[unbookableClass]} />)
        expect(container.innerHTML).toBe("")
    })

    it("lists only bookable sessions with simulated seat counts", async () => {
        render(<BookingWidget sessions={[bookableClass, unbookableClass]} />)
        expect(screen.getByText("Dawn HIIT")).toBeDefined()
        expect(screen.queryByText("Open Gym")).toBeNull()
        // Sandbox availability: full capacity remains.
        await waitFor(() => {
            expect(screen.getByText("2 seats left")).toBeDefined()
        })
    })

    it("completes a sandbox booking: form → confirmed, recorded locally", async () => {
        const user = userEvent.setup()
        render(<BookingWidget sessions={[bookableClass]} />)
        await waitFor(() => {
            expect(screen.getByText("2 seats left")).toBeDefined()
        })

        await user.click(screen.getByRole("button", { name: /book this class/i }))
        await user.type(screen.getByLabelText("Your name"), "Ada Lovelace")
        await user.type(screen.getByLabelText("Your email"), "ada@example.com")
        await user.click(screen.getByRole("button", { name: /confirm/i }))

        await waitFor(() => {
            expect(screen.getByText(/you're in/i)).toBeDefined()
        })
        // The sandbox state says so explicitly — no fake "email sent" copy.
        expect(screen.getByText(/preview mode/i)).toBeDefined()

        // The simulation recorded the seat, and the live count depleted.
        const recorded = JSON.parse(localStorage.getItem(BOOKING_SANDBOX_STORAGE_KEY) ?? "[]") as {
            sessionId: string
            email: string
        }[]
        expect(recorded).toHaveLength(1)
        expect(recorded[0]).toMatchObject({
            sessionId: "tue-0700-hiit",
            email: "ada@example.com",
        })
        await waitFor(() => {
            expect(screen.getByText("1 seat left")).toBeDefined()
        })
    })
})
