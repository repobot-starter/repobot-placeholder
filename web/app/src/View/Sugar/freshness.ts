/**
 * The pastry-machine pack's engine: pure freshness logic. Given a machine's
 * stocking schedule and the current day + minutes-since-midnight, decide
 * what the case looks like right now — restocking soon, stocked fresh,
 * selling fast, or sold out. Mirrored in SugarFreshness.swift and
 * SugarFreshness.kt with the same tests, so a machine's status badge
 * agrees on every platform.
 */

export interface MachineSchedule {
    /** Days the machine is stocked; 0 = Sunday … 6 = Saturday. */
    stockedDays: number[]
    /** Minutes since midnight when the case is restocked. */
    restockMinute: number
    /** Minutes since midnight when the case typically sells out. */
    selloutMinute: number
}

/** How long before typical sellout the "selling fast" nudge appears. */
export const SELLING_FAST_WINDOW = 90

export type StatusKind = "closed" | "upcoming" | "fresh" | "sellingFast" | "soldOut"

export interface CaseStatus {
    kind: StatusKind
    label: string
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/** "7:00 AM" from minutes since midnight. */
export function formatMinute(minute: number): string {
    const hour24 = Math.floor(minute / 60) % 24
    const minutes = minute % 60
    const suffix = hour24 < 12 ? "AM" : "PM"
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`
}

/** "tomorrow" or the day name of the next stocked day after `day`. */
export function nextRestockDayLabel(schedule: MachineSchedule, day: number): string {
    for (let ahead = 1; ahead <= 7; ahead++) {
        if (schedule.stockedDays.includes((day + ahead) % 7)) {
            return ahead === 1 ? "tomorrow" : DAY_NAMES[(day + ahead) % 7]
        }
    }
    return "soon"
}

/** The status badge for a machine at the given local day and minute. */
export function statusAt(schedule: MachineSchedule, day: number, minute: number): CaseStatus {
    const restock = formatMinute(schedule.restockMinute)
    if (!schedule.stockedDays.includes(day)) {
        return {
            kind: "closed",
            label: `Back ${nextRestockDayLabel(schedule, day)} at ${restock}`,
        }
    }
    if (minute < schedule.restockMinute) {
        return { kind: "upcoming", label: `Restocking at ${restock}` }
    }
    if (minute >= schedule.selloutMinute) {
        return {
            kind: "soldOut",
            label: `Sold out — back ${nextRestockDayLabel(schedule, day)} at ${restock}`,
        }
    }
    if (minute >= schedule.selloutMinute - SELLING_FAST_WINDOW) {
        return { kind: "sellingFast", label: "Selling fast — almost gone" }
    }
    return { kind: "fresh", label: `Stocked fresh at ${restock}` }
}

/**
 * Which daily case a machine shows: the lineup rotates through the list
 * one day at a time, so regulars see something new each morning.
 */
export function lineupIndexForDay(epochDay: number, lineupCount: number): number {
    if (lineupCount === 0) return 0
    return ((epochDay % lineupCount) + lineupCount) % lineupCount
}

/** Days since the Unix epoch in local time — drives the lineup rotation. */
export function epochDay(date: Date): number {
    return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000)
}

/** "$4.50" / "$4" — trims trailing zero cents. */
export function formatPrice(priceCents: number): string {
    const dollars = Math.floor(priceCents / 100)
    const cents = priceCents % 100
    return cents === 0 ? `$${dollars}` : `$${dollars}.${String(cents).padStart(2, "0")}`
}
