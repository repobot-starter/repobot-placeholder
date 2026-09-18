import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import {
    applyContentDocumentAppointments,
    applyContentDocumentPractice,
    appointmentSlotId,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    parsePracticeContent,
    type AppointmentsContent,
    type PracticeContent,
} from "../../../src/View/Landing/practiceDocument"

/**
 * The healthcare-practice domains of the business-content contract
 * (practiceDocument.ts): the `practice` sections degrade independently,
 * the `appointments` domain degrades whole (a booking surface must be
 * coherent), and slot generation — the kernel's copy of the platform's
 * booking-mode-2 projection — is pure, deterministic minutes-of-day math.
 *
 * Deliberate absences are part of the contract under test: no section
 * here carries clinical content, and the appointments domain carries only
 * types, durations, and availability windows — the visitor booking form
 * this feeds is clinically empty by schema (name, contact, appointment
 * type, new/returning), with no free-text anywhere.
 */

const codePractice: PracticeContent = {
    providers: [
        {
            providerId: "dr-code",
            name: "Dr. Code Fallback",
            credentials: "MD",
            bio: "The code provider.",
        },
    ],
    services: [{ name: "Preventive care", description: "Annual physicals." }],
    insurance: ["Acme Health"],
    locations: [
        {
            locationId: "main",
            address: "1 Main St, Madison, WI",
            hours: [{ day: 1, open: 480, close: 1020 }],
        },
    ],
    reviews: [{ quote: "Kind and thorough.", name: "A. Patient" }],
    newPatient: [{ title: "Bring your card", body: "Insurance card and photo ID." }],
}

const codeAppointments: AppointmentsContent = {
    types: [
        { typeId: "new-patient", name: "New patient visit", durationMinutes: 30 },
        { typeId: "follow-up", name: "Follow-up", durationMinutes: 15 },
    ],
    providers: [
        {
            providerId: "dr-code",
            name: "Dr. Code Fallback",
            windows: [{ day: 1, start: 540, end: 720 }],
        },
    ],
}

const validDocumentProvider = {
    providerId: "dr-chen",
    name: "Dr. Amara Chen",
    credentials: "MD",
    role: "Family medicine",
    bio: "Board-certified family physician.",
}

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
    warn.mockRestore()
})

describe("parsePracticeContent", () => {
    it("returns nothing for a document without the domain", () => {
        expect(parsePracticeContent({})).toEqual({})
        expect(parsePracticeContent(undefined)).toEqual({})
    })

    it("parses each section independently", () => {
        const parsed = parsePracticeContent({
            practice: {
                providers: [validDocumentProvider],
                insurance: ["Aetna", "Cigna"],
            },
        })
        expect(parsed.providers).toEqual([validDocumentProvider])
        expect(parsed.insurance).toEqual(["Aetna", "Cigna"])
        expect(parsed.services).toBeUndefined()
        expect(parsed.locations).toBeUndefined()
    })

    it("drops invalid entries while keeping the section's valid rest", () => {
        const parsed = parsePracticeContent({
            practice: {
                providers: [
                    validDocumentProvider,
                    { providerId: "NOT VALID ID", name: "X", credentials: "", bio: "" },
                ],
            },
        })
        expect(parsed.providers).toHaveLength(1)
        expect(warn).toHaveBeenCalled()
    })

    it("treats a non-empty section with no valid entry as broken, not cleared", () => {
        const parsed = parsePracticeContent({ practice: { reviews: [{ quote: 42 }] } })
        expect(parsed.reviews).toBeUndefined()
    })

    it("honors an explicitly empty section as an owner's cleared list", () => {
        const parsed = parsePracticeContent({ practice: { reviews: [] } })
        expect(parsed.reviews).toEqual([])
    })

    it("rejects duplicate provider ids (the second entry drops)", () => {
        const parsed = parsePracticeContent({
            practice: { providers: [validDocumentProvider, validDocumentProvider] },
        })
        expect(parsed.providers).toHaveLength(1)
    })

    it("rejects a location whose hours carry an invalid interval", () => {
        const parsed = parsePracticeContent({
            practice: {
                locations: [
                    {
                        locationId: "main",
                        address: "1 Main St",
                        hours: [{ day: 1, open: 600, close: 540 }],
                    },
                ],
            },
        })
        expect(parsed.locations).toBeUndefined()
    })

    it("merges document sections over code content per section", () => {
        const resolved = applyContentDocumentPractice(codePractice, {
            practice: { insurance: ["Blue Cross"] },
        })
        expect(resolved.insurance).toEqual(["Blue Cross"])
        // Sections the document doesn't speak for keep the code content.
        expect(resolved.providers).toBe(codePractice.providers)
        expect(resolved.reviews).toBe(codePractice.reviews)
    })

    it("never crashes on junk documents", () => {
        for (const junk of [null, [], "practice", { practice: 7 }, { practice: { providers: 3 } }]) {
            expect(() => parsePracticeContent(junk)).not.toThrow()
        }
    })
})

describe("parseAppointmentsContent", () => {
    const validDomain = {
        types: [{ typeId: "follow-up", name: "Follow-up", durationMinutes: 15 }],
        providers: [
            {
                providerId: "dr-chen",
                name: "Dr. Amara Chen",
                windows: [{ day: 2, start: 540, end: 720 }],
            },
        ],
    }

    it("parses a valid domain", () => {
        expect(parseAppointmentsContent({ appointments: validDomain })).toEqual(validDomain)
    })

    it("falls back whole when either list is missing or broken", () => {
        expect(parseAppointmentsContent({ appointments: { types: validDomain.types } })).toBeUndefined()
        expect(
            parseAppointmentsContent({
                appointments: { ...validDomain, providers: "not-a-list" },
            }),
        ).toBeUndefined()
        expect(applyContentDocumentAppointments(codeAppointments, { appointments: { types: [] } })).toBe(
            codeAppointments,
        )
    })

    it("rejects out-of-range durations and malformed windows", () => {
        expect(
            parseAppointmentsContent({
                appointments: {
                    ...validDomain,
                    types: [{ typeId: "t", name: "T", durationMinutes: 3 }],
                },
            }),
        ).toBeUndefined()
        expect(
            parseAppointmentsContent({
                appointments: {
                    ...validDomain,
                    providers: [
                        {
                            providerId: "dr-x",
                            name: "Dr. X",
                            windows: [{ day: 9, start: 540, end: 720 }],
                        },
                    ],
                },
            }),
        ).toBeUndefined()
    })

    it("honors an explicitly empty domain (booking cleared)", () => {
        expect(parseAppointmentsContent({ appointments: { types: [], providers: [] } })).toEqual({
            types: [],
            providers: [],
        })
    })
})

describe("generateAppointmentSlots", () => {
    it("packs each window back-to-back per type (windows x types -> slots)", () => {
        const slots = generateAppointmentSlots(codeAppointments)
        // 9:00–12:00 window: 6 x 30-minute new-patient + 12 x 15-minute follow-up.
        expect(slots).toHaveLength(18)
        const newPatientStarts = slots
            .filter((slot) => slot.typeId === "new-patient")
            .map((slot) => slot.start)
        expect(newPatientStarts).toEqual([540, 570, 600, 630, 660, 690])
        const followUp = slots.filter((slot) => slot.typeId === "follow-up")
        expect(followUp[0]).toMatchObject({ start: 540, end: 555, day: 1 })
        expect(followUp[followUp.length - 1]).toMatchObject({ start: 705, end: 720 })
    })

    it("never emits a slot that would overrun its window", () => {
        const slots = generateAppointmentSlots({
            types: [{ typeId: "long", name: "Long visit", durationMinutes: 50 }],
            providers: [{ providerId: "p", name: "P", windows: [{ day: 3, start: 600, end: 720 }] }],
        })
        // 120 minutes fits two 50-minute slots; a third would overrun.
        expect(slots.map((slot) => [slot.start, slot.end])).toEqual([
            [600, 650],
            [650, 700],
        ])
    })

    it("mints the platform's deterministic contract-grammar slot ids", () => {
        const [first] = generateAppointmentSlots(codeAppointments)
        expect(first.sessionId).toBe("ap-dr-code-new-patient-mon-0900")
        expect(appointmentSlotId("dr-chen", "follow-up", 5, 8 * 60 + 15)).toBe(
            "ap-dr-chen-follow-up-fri-0815",
        )
    })

    it("is DST-safe by construction: slots are minutes-of-day, invariant across any calendar date", () => {
        // The whole appointment model is date-only + minutes-of-day: a
        // 9:00 slot is 9:00 on the practice's wall clock on every
        // occurrence date, on either side of a DST transition. There is
        // no timezone input anywhere in the derivation to get it wrong.
        const before = generateAppointmentSlots(codeAppointments)
        const after = generateAppointmentSlots(codeAppointments)
        expect(after).toEqual(before)
        expect(
            before.every((slot) => slot.end - slot.start === (slot.typeId === "follow-up" ? 15 : 30)),
        ).toBe(true)
    })

    it("dedupes slots re-derived by overlapping windows", () => {
        const slots = generateAppointmentSlots({
            types: [{ typeId: "t", name: "T", durationMinutes: 60 }],
            providers: [
                {
                    providerId: "p",
                    name: "P",
                    windows: [
                        { day: 1, start: 540, end: 720 },
                        { day: 1, start: 540, end: 780 },
                    ],
                },
            ],
        })
        const ids = slots.map((slot) => slot.sessionId)
        expect(new Set(ids).size).toBe(ids.length)
        expect(slots.map((slot) => slot.start)).toEqual([540, 600, 660, 720])
    })

    it("truncates deterministically at the generation ceiling", () => {
        const slots = generateAppointmentSlots({
            types: [{ typeId: "micro", name: "Micro", durationMinutes: 5 }],
            providers: Array.from({ length: 10 }, (_, index) => ({
                providerId: `p-${index}`,
                name: `P ${index}`,
                windows: Array.from({ length: 7 }, (_, day) => ({ day, start: 0, end: 1440 })),
            })),
        })
        expect(slots).toHaveLength(MAX_APPOINTMENT_SLOTS)
    })
})
