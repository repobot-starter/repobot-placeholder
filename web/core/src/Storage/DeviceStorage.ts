/**
 * Small localStorage helpers for pack-local persistence (best scores, match
 * tallies, saved progress). All functions are safe when storage is
 * unavailable or holds corrupt data — they fall back instead of throwing, so
 * no exception ever escapes to callers.
 *
 * Native twins: `ios/App/Utils/DeviceStorage.swift` (UserDefaults) and
 * `android/.../util/DeviceStorage.kt` (SharedPreferences).
 */

/** Reads a JSON-serialized value; missing, corrupt, or unavailable storage yields `fallback`. */
export function readStoredJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
        return fallback
    }
}

/** Writes a value as JSON; silently a no-op when storage is unavailable. */
export function writeStoredJson(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // Storage may be unavailable (private mode, quota); the app keeps working in-memory.
    }
}

/** Reads a number; missing, non-numeric, or unavailable storage yields `fallback`. */
export function readStoredNumber(key: string, fallback: number): number {
    try {
        const raw = localStorage.getItem(key)
        if (raw === null) {
            return fallback
        }
        const value = Number(raw)
        return Number.isFinite(value) ? value : fallback
    } catch {
        return fallback
    }
}

/** Writes a number (stored as its decimal string, e.g. `"42"`). */
export function writeStoredNumber(key: string, value: number): void {
    try {
        localStorage.setItem(key, String(value))
    } catch {
        // Storage may be unavailable; the app keeps working in-memory.
    }
}

/** Reads a raw string; missing or unavailable storage yields `fallback`. */
export function readStoredString(key: string, fallback: string | null = null): string | null {
    try {
        return localStorage.getItem(key) ?? fallback
    } catch {
        return fallback
    }
}

/** Writes a raw string (no JSON quoting, matching values written before this helper existed). */
export function writeStoredString(key: string, value: string): void {
    try {
        localStorage.setItem(key, value)
    } catch {
        // Storage may be unavailable; the app keeps working in-memory.
    }
}
