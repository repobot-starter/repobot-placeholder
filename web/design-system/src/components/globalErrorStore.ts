/**
 * Global error store: a tiny framework-free pub/sub so failures can be
 * published from anywhere — Apollo links, form submits, event handlers —
 * without threading React context through non-React code. The <GlobalErrors>
 * presenter subscribes and renders the stack; nothing else should render
 * these entries.
 *
 *     publishGlobalError("Could not save the booking.")
 *     publishGlobalError({ title: "Sync failed", message: error.message })
 *
 * Errors stack (never replace each other) and stay until dismissed, so a
 * burst of failures is fully inspectable instead of flashing past.
 */

export interface GlobalErrorInput {
    /** Short headline; defaults to "Something went wrong". */
    title?: string
    /** Human-readable explanation of what failed. */
    message: string
    /** Optional technical detail (stack, response body) shown in monospace. */
    detail?: string
}

export interface GlobalErrorEntry extends GlobalErrorInput {
    id: number
    occurredAt: number
}

/** Oldest entries drop past this cap so a runaway retry loop can't grow unbounded. */
const MAX_ENTRIES = 20

let entries: readonly GlobalErrorEntry[] = []
let nextId = 1
const listeners = new Set<(entries: readonly GlobalErrorEntry[]) => void>()

function setEntries(next: readonly GlobalErrorEntry[]): void {
    entries = next
    for (const listener of listeners) {
        listener(entries)
    }
}

/** Publish a global error; returns the entry id (usable with dismissGlobalError). */
export function publishGlobalError(input: string | GlobalErrorInput): number {
    const normalized: GlobalErrorInput = typeof input === "string" ? { message: input } : input
    const id = nextId
    nextId += 1
    const entry: GlobalErrorEntry = { ...normalized, id, occurredAt: Date.now() }
    setEntries([...entries, entry].slice(-MAX_ENTRIES))
    return id
}

export function dismissGlobalError(id: number): void {
    setEntries(entries.filter((entry) => entry.id !== id))
}

export function dismissAllGlobalErrors(): void {
    setEntries([])
}

export function getGlobalErrors(): readonly GlobalErrorEntry[] {
    return entries
}

/** Subscribe to stack changes; returns an unsubscribe function. */
export function subscribeGlobalErrors(listener: (entries: readonly GlobalErrorEntry[]) => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
