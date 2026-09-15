import { useSyncExternalStore } from "react"
import { activePack, type PackKey } from "../../Config/activePack"
import { getContentDocument, getContentDocumentVersion, subscribeContentDocument } from "./contentDocument"

/**
 * The healthcare-practice domains of the business-content contract
 * (repobot.content.json) — the practice-facts sibling of the schedule
 * domain in `contentDocument.ts`, shared by the whole Healthcare Providers
 * template category:
 *
 * - `practice` carries the marketing facts an owner runs the practice
 *   with: providers (name, credentials, bio, photo ref), services,
 *   insurance accepted, locations with hours, owner-curated reviews, and
 *   new-patient info. Reviews are deliberately owner-curated contract
 *   entries — there is no runtime review ingestion.
 * - `appointments` carries the booking-mode-2 facts the platform projects
 *   into bookable slots: appointment types with durations (new patient
 *   30 min, follow-up 15 min) and per-provider weekly availability
 *   windows. Slot generation (provider x window x type, capacity 1) is
 *   pure and mirrored by the platform — `generateAppointmentSlots` below
 *   is the kernel's copy, used by the sandbox booking simulation.
 *
 * Merge semantics follow the schedule resolver's graceful degradation: no
 * document a hand or the platform can write may crash the page. The
 * `practice` domain degrades per SECTION (a broken providers list falls
 *  back to the pack's code providers while valid services still land);
 * the `appointments` domain degrades WHOLE — a booking surface must be
 * coherent, so a document that can't speak for appointments falls back
 * entirely to the pack's code content.
 *
 * PRODUCT CONSTRAINT (deliberate architecture, not an omission): nothing
 * in these domains — and nothing in the visitor booking flow they feed —
 * carries clinical content. The booking form schema is name, contact,
 * appointment type, and new/returning patient; there is no free-text
 * reason, no symptoms, no health questions. Patient health information
 * never touches the site or the platform.
 */

/** Provider/type/location ids: short lower-kebab identifiers. Shorter than
 * session ids (24 chars) because generated slot ids embed two of them. */
export const PRACTICE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,23}$/

/** Appointment durations: a visit is minutes, not a residency. */
export const APPOINTMENT_MIN_DURATION = 5
export const APPOINTMENT_MAX_DURATION = 240

/** List ceilings — a practice site, not a hospital directory. */
export const PRACTICE_MAX_PROVIDERS = 20
export const PRACTICE_MAX_SERVICES = 40
export const PRACTICE_MAX_INSURANCE = 40
export const PRACTICE_MAX_LOCATIONS = 8
export const PRACTICE_MAX_REVIEWS = 30
export const PRACTICE_MAX_NEW_PATIENT_ITEMS = 12
export const APPOINTMENTS_MAX_TYPES = 12
export const APPOINTMENTS_MAX_WINDOWS_PER_PROVIDER = 28

/** Generated weekly slots ceiling; generation truncates deterministically. */
export const MAX_APPOINTMENT_SLOTS = 800

const MINUTES_PER_DAY = 24 * 60

// ------------------------------------------------------------------ practice

export interface PracticeProvider {
    /** Stable identity — joins the appointments domain and code photos. */
    providerId: string
    name: string
    /** Post-nominals and boards, e.g. "MD" or "PA-C". */
    credentials: string
    /** One-line role, e.g. "Family medicine". */
    role?: string
    bio: string
    /** Optional public image path; packs fall back to code photos by id. */
    photo?: string
}

export interface PracticeService {
    name: string
    description: string
}

export interface PracticeHoursEntry {
    /** 0 = Sunday … 6 = Saturday. */
    day: number
    /** Open/close in minutes since midnight (same-day interval). */
    open: number
    close: number
}

export interface PracticeLocation {
    locationId: string
    /** Display label when a practice has several locations. */
    label?: string
    /** Map-ready street address. */
    address: string
    phone?: string
    hours: PracticeHoursEntry[]
}

/** An owner-curated testimonial — contract data, never runtime ingestion. */
export interface PracticeReview {
    quote: string
    name: string
    /** e.g. "Patient since 2021". */
    detail?: string
}

export interface PracticeNewPatientItem {
    title: string
    body: string
}

/** The practice domain, fully resolved (every section present). */
export interface PracticeContent {
    providers: PracticeProvider[]
    services: PracticeService[]
    insurance: string[]
    locations: PracticeLocation[]
    reviews: PracticeReview[]
    newPatient: PracticeNewPatientItem[]
}

/** A document's practice domain: only the sections it validly speaks for. */
export type PracticeDocumentContent = Partial<PracticeContent>

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function warnInvalid(field: string, fallback: string): void {
    console.warn(`[content] repobot.content.json: invalid ${field}; ${fallback}.`)
}

function isText(value: unknown, max: number, min = 1): value is string {
    return typeof value === "string" && value.length >= min && value.length <= max
}

function parseProvider(entry: unknown, seen: Set<string>): PracticeProvider | undefined {
    if (!isRecord(entry)) return undefined
    const { providerId, name, credentials, role, bio, photo } = entry
    if (typeof providerId !== "string" || !PRACTICE_ID_PATTERN.test(providerId)) return undefined
    if (seen.has(providerId)) return undefined
    if (!isText(name, 120)) return undefined
    if (!isText(credentials, 120, 0)) return undefined
    if (role !== undefined && !isText(role, 120)) return undefined
    if (!isText(bio, 1000, 0)) return undefined
    if (photo !== undefined && !isText(photo, 300)) return undefined
    seen.add(providerId)
    return {
        providerId,
        name,
        credentials: credentials as string,
        ...(role !== undefined ? { role } : {}),
        bio: bio as string,
        ...(photo !== undefined ? { photo } : {}),
    }
}

function parseService(entry: unknown): PracticeService | undefined {
    if (!isRecord(entry)) return undefined
    const { name, description } = entry
    if (!isText(name, 120) || !isText(description, 500, 0)) return undefined
    return { name, description: description as string }
}

function parseHoursEntry(entry: unknown): PracticeHoursEntry | undefined {
    if (!isRecord(entry)) return undefined
    const { day, open, close } = entry
    if (typeof day !== "number" || !Number.isInteger(day) || day < 0 || day > 6) return undefined
    if (typeof open !== "number" || !Number.isInteger(open)) return undefined
    if (typeof close !== "number" || !Number.isInteger(close)) return undefined
    if (open < 0 || close > MINUTES_PER_DAY || close <= open) return undefined
    return { day, open, close }
}

function parseLocation(entry: unknown, seen: Set<string>): PracticeLocation | undefined {
    if (!isRecord(entry)) return undefined
    const { locationId, label, address, phone, hours } = entry
    if (typeof locationId !== "string" || !PRACTICE_ID_PATTERN.test(locationId)) return undefined
    if (seen.has(locationId)) return undefined
    if (label !== undefined && !isText(label, 120)) return undefined
    if (!isText(address, 300)) return undefined
    if (phone !== undefined && !isText(phone, 40)) return undefined
    if (!Array.isArray(hours)) return undefined
    const parsedHours: PracticeHoursEntry[] = []
    for (const hoursEntry of hours) {
        const parsed = parseHoursEntry(hoursEntry)
        if (parsed === undefined) return undefined
        parsedHours.push(parsed)
    }
    seen.add(locationId)
    return {
        locationId,
        ...(label !== undefined ? { label } : {}),
        address,
        ...(phone !== undefined ? { phone } : {}),
        hours: parsedHours,
    }
}

function parseReview(entry: unknown): PracticeReview | undefined {
    if (!isRecord(entry)) return undefined
    const { quote, name, detail } = entry
    if (!isText(quote, 1000) || !isText(name, 120)) return undefined
    if (detail !== undefined && !isText(detail, 120)) return undefined
    return { quote, name, ...(detail !== undefined ? { detail } : {}) }
}

function parseNewPatientItem(entry: unknown): PracticeNewPatientItem | undefined {
    if (!isRecord(entry)) return undefined
    const { title, body } = entry
    if (!isText(title, 160) || !isText(body, 1000)) return undefined
    return { title, body }
}

/**
 * One list section validated with the schedule resolver's discipline:
 * invalid entries drop with a warning; a non-empty list whose every entry
 * is invalid reads as a broken section (undefined → code fallback), while
 * an explicitly empty array is an owner's cleared list.
 */
function parseSection<T>(
    value: unknown,
    field: string,
    max: number,
    parseEntry: (entry: unknown) => T | undefined,
): T[] | undefined {
    if (value === undefined) return undefined
    if (!Array.isArray(value) || value.length > max) {
        warnInvalid(field, "keeping the code content")
        return undefined
    }
    const parsed: T[] = []
    for (const entry of value) {
        const item = parseEntry(entry)
        if (item === undefined) {
            warnInvalid(`${field} entry`, "dropping it")
            continue
        }
        parsed.push(item)
    }
    if (value.length > 0 && parsed.length === 0) {
        warnInvalid(field, "keeping the code content")
        return undefined
    }
    return parsed
}

/**
 * The document's practice domain: each section independently, or undefined
 * for sections the document doesn't validly speak for. Exported pure for
 * tests and for the platform mirror discipline; pages go through
 * `usePracticeContent`.
 */
export function parsePracticeContent(document: unknown): PracticeDocumentContent {
    if (!isRecord(document)) return {}
    const practice = document.practice
    if (practice === undefined) return {}
    if (!isRecord(practice)) {
        warnInvalid("practice", "keeping the code content")
        return {}
    }
    const providerIds = new Set<string>()
    const locationIds = new Set<string>()
    const providers = parseSection(practice.providers, "practice.providers", PRACTICE_MAX_PROVIDERS, (e) =>
        parseProvider(e, providerIds),
    )
    const services = parseSection(practice.services, "practice.services", PRACTICE_MAX_SERVICES, parseService)
    const insurance = parseSection(practice.insurance, "practice.insurance", PRACTICE_MAX_INSURANCE, (e) =>
        isText(e, 80) ? e : undefined,
    )
    const locations = parseSection(practice.locations, "practice.locations", PRACTICE_MAX_LOCATIONS, (e) =>
        parseLocation(e, locationIds),
    )
    const reviews = parseSection(practice.reviews, "practice.reviews", PRACTICE_MAX_REVIEWS, parseReview)
    const newPatient = parseSection(
        practice.newPatient,
        "practice.newPatient",
        PRACTICE_MAX_NEW_PATIENT_ITEMS,
        parseNewPatientItem,
    )
    return {
        ...(providers !== undefined ? { providers } : {}),
        ...(services !== undefined ? { services } : {}),
        ...(insurance !== undefined ? { insurance } : {}),
        ...(locations !== undefined ? { locations } : {}),
        ...(reviews !== undefined ? { reviews } : {}),
        ...(newPatient !== undefined ? { newPatient } : {}),
    }
}

/** Pure per-section resolve of a document over code content — for tests. */
export function applyContentDocumentPractice(fallback: PracticeContent, document: unknown): PracticeContent {
    return { ...fallback, ...parsePracticeContent(document) }
}

/**
 * The practice content a pack page should render: the committed document's
 * sections over the code fallback when `surface` names the ACTIVE pack,
 * otherwise the code content untouched — the schedule resolver's exact
 * "active" semantics.
 */
export function resolvePracticeContent(fallback: PracticeContent, surface: PackKey): PracticeContent {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentPractice(fallback, getContentDocument())
}

/** `resolvePracticeContent` as a hook: re-renders on live document edits. */
export function usePracticeContent(fallback: PracticeContent, surface: PackKey): PracticeContent {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolvePracticeContent(fallback, surface)
}

// -------------------------------------------------------------- appointments

export interface AppointmentType {
    typeId: string
    name: string
    /** Slot length this visit type books, in minutes. */
    durationMinutes: number
    description?: string
}

/** One weekly availability window: same-day minutes since midnight. */
export interface AppointmentWindow {
    /** 0 = Sunday … 6 = Saturday. */
    day: number
    start: number
    end: number
}

export interface AppointmentProvider {
    /** Joins practice.providers; the appointments domain stays projectable alone. */
    providerId: string
    name: string
    windows: AppointmentWindow[]
}

export interface AppointmentsContent {
    types: AppointmentType[]
    providers: AppointmentProvider[]
}

function parseAppointmentType(entry: unknown, seen: Set<string>): AppointmentType | undefined {
    if (!isRecord(entry)) return undefined
    const { typeId, name, durationMinutes, description } = entry
    if (typeof typeId !== "string" || !PRACTICE_ID_PATTERN.test(typeId)) return undefined
    if (seen.has(typeId)) return undefined
    if (!isText(name, 120)) return undefined
    if (
        typeof durationMinutes !== "number" ||
        !Number.isInteger(durationMinutes) ||
        durationMinutes < APPOINTMENT_MIN_DURATION ||
        durationMinutes > APPOINTMENT_MAX_DURATION
    ) {
        return undefined
    }
    if (description !== undefined && !isText(description, 300)) return undefined
    seen.add(typeId)
    return {
        typeId,
        name,
        durationMinutes,
        ...(description !== undefined ? { description } : {}),
    }
}

function parseWindow(entry: unknown): AppointmentWindow | undefined {
    if (!isRecord(entry)) return undefined
    const { day, start, end } = entry
    if (typeof day !== "number" || !Number.isInteger(day) || day < 0 || day > 6) return undefined
    if (typeof start !== "number" || !Number.isInteger(start)) return undefined
    if (typeof end !== "number" || !Number.isInteger(end)) return undefined
    if (start < 0 || end > MINUTES_PER_DAY || end <= start) return undefined
    return { day, start, end }
}

function parseAppointmentProvider(entry: unknown, seen: Set<string>): AppointmentProvider | undefined {
    if (!isRecord(entry)) return undefined
    const { providerId, name, windows } = entry
    if (typeof providerId !== "string" || !PRACTICE_ID_PATTERN.test(providerId)) return undefined
    if (seen.has(providerId)) return undefined
    if (!isText(name, 120)) return undefined
    if (!Array.isArray(windows) || windows.length > APPOINTMENTS_MAX_WINDOWS_PER_PROVIDER) {
        return undefined
    }
    const parsed: AppointmentWindow[] = []
    for (const windowEntry of windows) {
        const parsedWindow = parseWindow(windowEntry)
        if (parsedWindow === undefined) return undefined
        parsed.push(parsedWindow)
    }
    seen.add(providerId)
    return { providerId, name, windows: parsed }
}

/**
 * The document's appointments domain, or undefined when the document
 * doesn't validly speak for it — WHOLE-domain fallback, stricter than the
 * practice sections, because a booking surface rendered from half a
 * domain would offer slots the platform never projected. Invalid list
 * entries drop (with a warning) as long as the domain stays coherent:
 * both lists present and, when non-empty, at least one valid entry each.
 */
export function parseAppointmentsContent(document: unknown): AppointmentsContent | undefined {
    if (!isRecord(document)) return undefined
    const appointments = document.appointments
    if (appointments === undefined) return undefined
    if (!isRecord(appointments)) {
        warnInvalid("appointments", "keeping the code content")
        return undefined
    }
    const typeIds = new Set<string>()
    const providerIds = new Set<string>()
    const types = parseSection(appointments.types, "appointments.types", APPOINTMENTS_MAX_TYPES, (e) =>
        parseAppointmentType(e, typeIds),
    )
    const providers = parseSection(
        appointments.providers,
        "appointments.providers",
        PRACTICE_MAX_PROVIDERS,
        (e) => parseAppointmentProvider(e, providerIds),
    )
    if (types === undefined || providers === undefined) {
        warnInvalid("appointments", "keeping the code content")
        return undefined
    }
    return { types, providers }
}

/** Pure resolve of a document over code content — exported for tests. */
export function applyContentDocumentAppointments(
    fallback: AppointmentsContent,
    document: unknown,
): AppointmentsContent {
    return parseAppointmentsContent(document) ?? fallback
}

/** The appointments content a pack page should render (active semantics). */
export function resolveAppointmentsContent(
    fallback: AppointmentsContent,
    surface: PackKey,
): AppointmentsContent {
    if (surface !== activePack.key) return fallback
    return applyContentDocumentAppointments(fallback, getContentDocument())
}

/** `resolveAppointmentsContent` as a hook: re-renders on live edits. */
export function useAppointmentsContent(fallback: AppointmentsContent, surface: PackKey): AppointmentsContent {
    useSyncExternalStore(subscribeContentDocument, getContentDocumentVersion, getContentDocumentVersion)
    return resolveAppointmentsContent(fallback, surface)
}

// ------------------------------------------------------------ slot generation

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

/**
 * One generated weekly appointment slot: a capacity-1 bookable interval
 * for one provider and one visit type. The platform projects the same
 * derivation into booking_session rows (a slot IS a session with capacity
 * 1); the kernel uses this copy for the sandbox booking simulation, so a
 * workspace preview offers exactly the slots a deploy would.
 */
export interface AppointmentSlot {
    /** Deterministic, contract-grammar session id: ap-provider-type-day-HHMM. */
    sessionId: string
    providerId: string
    providerName: string
    typeId: string
    /** 0 = Sunday … 6 = Saturday. */
    day: number
    /** Slot interval, minutes since midnight. */
    start: number
    end: number
}

/** The deterministic slot id the platform mints for the same slot. */
export function appointmentSlotId(providerId: string, typeId: string, day: number, start: number): string {
    const hours = String(Math.floor(start / 60)).padStart(2, "0")
    const minutes = String(start % 60).padStart(2, "0")
    return `ap-${providerId}-${typeId}-${DAY_KEYS[((day % 7) + 7) % 7]}-${hours}${minutes}`
}

/**
 * Provider availability windows x appointment types → concrete weekly
 * slots, packed back-to-back from each window's start (a 9:00–12:00
 * window and a 30-minute type yield 9:00, 9:30, …, 11:30). Pure calendar
 * math on minutes-of-day — timezone- and DST-free by construction, the
 * booking domain's date-only discipline. Deterministic order (providers,
 * then windows by day/start, then types) and deterministically truncated
 * at MAX_APPOINTMENT_SLOTS so kernel and platform always agree.
 */
export function generateAppointmentSlots(content: AppointmentsContent): AppointmentSlot[] {
    const slots: AppointmentSlot[] = []
    const seenIds = new Set<string>()
    for (const provider of content.providers) {
        const windows = [...provider.windows].sort((a, b) => a.day - b.day || a.start - b.start)
        for (const window of windows) {
            for (const type of content.types) {
                for (
                    let start = window.start;
                    start + type.durationMinutes <= window.end;
                    start += type.durationMinutes
                ) {
                    if (slots.length >= MAX_APPOINTMENT_SLOTS) {
                        return slots
                    }
                    const sessionId = appointmentSlotId(provider.providerId, type.typeId, window.day, start)
                    // Overlapping windows can re-derive a slot; one wins.
                    if (seenIds.has(sessionId)) {
                        continue
                    }
                    seenIds.add(sessionId)
                    slots.push({
                        sessionId,
                        providerId: provider.providerId,
                        providerName: provider.name,
                        typeId: type.typeId,
                        day: window.day,
                        start,
                        end: start + type.durationMinutes,
                    })
                }
            }
        }
    }
    return slots
}
