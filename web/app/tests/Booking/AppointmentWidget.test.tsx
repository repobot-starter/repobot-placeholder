import { BOOKING_SANDBOX_STORAGE_KEY } from "@base/core"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { AppointmentWidget } from "../../src/View/Landing/AppointmentWidget"
import type { AppointmentsContent } from "../../src/View/Landing/practiceDocument"

// The suite-wide no-network fetch stub (setupNoNetwork.ts) rejects every
// request, so these tests exercise booking mode 2's sandbox simulation:
// slots generated from the page's own contract, bookings recorded locally,
// the provider-overlap rule holding cross-type double-books — and no
// request ever reaching a real door.

const appointments: AppointmentsContent = {
    types: [
        { typeId: "new-patient", name: "New patient visit", durationMinutes: 30 },
        { typeId: "follow-up", name: "Follow-up", durationMinutes: 15 },
    ],
    providers: [
        {
            providerId: "dr-chen",
            name: "Dr. Amara Chen",
            // One hour on every weekday: today always has slots, whatever
            // day the test runs.
            windows: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: 540, end: 600 })),
        },
    ],
}

describe("AppointmentWidget (sandbox mode)", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it("renders nothing when the contract offers no slots", () => {
        const { container } = render(<AppointmentWidget appointments={{ types: [], providers: [] }} />)
        expect(container.innerHTML).toBe("")
    })

    it("offers visit types, the provider, and open times from the simulation", async () => {
        render(<AppointmentWidget appointments={appointments} />)
        expect(screen.getByRole("heading", { name: "Book an appointment" })).toBeDefined()
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /new patient visit/i })).toBeDefined()
        })
        expect(screen.getByRole("button", { name: /follow-up/i })).toBeDefined()
        expect(screen.getByRole("button", { name: "Dr. Amara Chen" })).toBeDefined()
        // The 9:00–10:00 window fits two 30-minute new-patient slots.
        const times = screen.getByRole("group", { name: "Choose a time" })
        expect(within(times).getByRole("button", { name: "9 AM" })).toBeDefined()
        expect(within(times).getByRole("button", { name: "9:30 AM" })).toBeDefined()
    })

    it("keeps the visitor form clinically empty: no free text beyond name/contact", async () => {
        render(<AppointmentWidget appointments={appointments} />)
        await waitFor(() => {
            expect(screen.getByRole("form", { name: "Your details" })).toBeDefined()
        })
        const form = screen.getByRole("form", { name: "Your details" })
        // Exactly the schema: name, email, optional phone, new/returning.
        // No textarea, no reason, no symptoms — deliberate architecture.
        expect(form.querySelectorAll("textarea")).toHaveLength(0)
        const visibleInputs = [...form.querySelectorAll("input")].filter(
            (input) => input.getAttribute("aria-hidden") !== "true",
        )
        expect(visibleInputs.map((input) => input.getAttribute("aria-label"))).toEqual([
            "Your name",
            "Your email",
            "Phone (optional)",
        ])
        expect(screen.getByLabelText("Have you visited us before?")).toBeDefined()
    })

    it("books a slot, records it locally, and the taken time leaves the picker", async () => {
        const user = userEvent.setup()
        render(<AppointmentWidget appointments={appointments} />)
        await waitFor(() => {
            expect(
                within(screen.getByRole("group", { name: "Choose a time" })).getByRole("button", {
                    name: "9 AM",
                }),
            ).toBeDefined()
        })

        await user.type(screen.getByLabelText("Your name"), "Pat Doe")
        await user.type(screen.getByLabelText("Your email"), "pat@example.com")
        await user.selectOptions(screen.getByLabelText("Have you visited us before?"), "RETURNING")
        await user.click(screen.getByRole("button", { name: /^confirm — /i }))

        await waitFor(() => {
            expect(screen.getByText(/you're booked/i)).toBeDefined()
        })
        expect(screen.getByText(/preview mode/i)).toBeDefined()

        const recorded = JSON.parse(localStorage.getItem(BOOKING_SANDBOX_STORAGE_KEY) ?? "[]") as {
            sessionId: string
            providerId: string
            start: number
            end: number
        }[]
        expect(recorded).toHaveLength(1)
        expect(recorded[0]).toMatchObject({
            providerId: "dr-chen",
            start: 540,
            end: 570,
        })
        expect(recorded[0].sessionId.startsWith("ap-dr-chen-new-patient-")).toBe(true)
    })

    it("holds the provider-overlap rule: a booked 9:00 new-patient blocks both 9:00 and 9:15 follow-ups that day", async () => {
        const user = userEvent.setup()
        const { unmount } = render(<AppointmentWidget appointments={appointments} />)
        await waitFor(() => {
            expect(
                within(screen.getByRole("group", { name: "Choose a time" })).getByRole("button", {
                    name: "9 AM",
                }),
            ).toBeDefined()
        })
        await user.type(screen.getByLabelText("Your name"), "Pat Doe")
        await user.type(screen.getByLabelText("Your email"), "pat@example.com")
        await user.click(screen.getByRole("button", { name: /^confirm — /i }))
        await waitFor(() => {
            expect(screen.getByText(/you're booked/i)).toBeDefined()
        })
        unmount()

        // A fresh visitor looking at follow-ups the same day: the 30-minute
        // hold removes the overlapping 9:00 and 9:15 quarter-hours, while
        // 9:30 and 9:45 stay open.
        render(<AppointmentWidget appointments={appointments} />)
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /follow-up/i })).toBeDefined()
        })
        await user.click(screen.getByRole("button", { name: /follow-up/i }))
        const times = screen.getByRole("group", { name: "Choose a time" })
        await waitFor(() => {
            expect(within(times).getByRole("button", { name: "9:30 AM" })).toBeDefined()
        })
        expect(within(times).queryByRole("button", { name: "9 AM" })).toBeNull()
        expect(within(times).queryByRole("button", { name: "9:15 AM" })).toBeNull()
        expect(within(times).getByRole("button", { name: "9:45 AM" })).toBeDefined()
    })
})
