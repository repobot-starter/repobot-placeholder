/** Formats an Instant scalar (ISO 8601 string) for table display, e.g. "Jan 12, 2026". */
export function formatInstant(instant: string): string {
    const date = new Date(instant)
    if (Number.isNaN(date.getTime())) {
        return instant
    }
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}
