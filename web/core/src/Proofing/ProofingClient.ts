/**
 * Client half of the managed proofing kernel: deployed sites talk to their
 * own origin (`/__proofing/room` | `/__proofing/select` — same-origin, so
 * no CORS and no baked-in site ids), where the platform's site router
 * resolves the site from the Host header and forwards to the control plane.
 * Room membership and selections live in control-plane Postgres; the static
 * site only ever fetches a manifest (after the door checks the access code)
 * and posts a pick list.
 *
 * Outside a deployed site (sandbox dev server, workspace preview, baked
 * template preview) the reserved path does not exist, so the client reports
 * `unreachable` and the page falls back to its demo fixtures. A real door's
 * domain outcomes (wrong code, closed room, rate limit, not configured)
 * are always relayed — they must never turn into a fake gallery.
 */

/** Reserved same-origin paths the site router listens on. */
export const PROOFING_ROOM_PATH = "/__proofing/room"
export const PROOFING_SELECT_PATH = "/__proofing/select"

/** Where sandbox-mode selections live in localStorage. */
export const PROOFING_SANDBOX_STORAGE_KEY = "rb.proofing.sandbox"

export interface ProofingRoomImage {
    imageId: string
    objectPath: string
    originalObjectPath: string
    filename: string
    width: number
    height: number
    previewUrl: string
}

export interface ProofingRoomManifest {
    name: string
    images: ProofingRoomImage[]
}

export type FetchProofingRoomResult =
    | { status: "ok"; room: ProofingRoomManifest; sandbox: false }
    | { status: "invalid_code" }
    | { status: "not_found" }
    | { status: "rate_limited" }
    | { status: "not_configured" }
    | { status: "invalid_request" }
    | { status: "unreachable" }

export interface SubmitProofingSelectionRequest {
    slug: string
    code: string
    visitorName: string
    visitorEmail: string
    note?: string
    picks: readonly string[]
    /**
     * localStorage key written when the door is unreachable, so a baked
     * preview's "send" still completes.
     */
    fallbackStorageKey?: string
}

export type SubmitProofingSelectionResult =
    | { status: "ok"; selectionId: string; sandbox: boolean }
    | { status: "invalid_code" }
    | { status: "not_found" }
    | { status: "rate_limited" }
    | { status: "not_configured" }
    | { status: "invalid_request" }
    | { status: "error" }

const DOOR_ERRORS = {
    invalid_room_code: "invalid_code",
    proofing_room_not_found: "not_found",
    unknown_site: "not_found",
    proofing_not_configured: "not_configured",
    invalid_room_request: "invalid_request",
    invalid_selection: "invalid_request",
} as const

type DoorErrorStatus = (typeof DOOR_ERRORS)[keyof typeof DOOR_ERRORS] | "rate_limited"

function readJson(response: Response): Promise<Record<string, unknown> | undefined> {
    return response.json().then(
        (body: unknown) =>
            typeof body === "object" && body !== null && !Array.isArray(body)
                ? (body as Record<string, unknown>)
                : undefined,
        () => undefined,
    )
}

function doorOutcome(status: number, body: Record<string, unknown> | undefined): DoorErrorStatus | undefined {
    const error = typeof body?.error === "string" ? body.error : undefined
    if (error !== undefined && error in DOOR_ERRORS) {
        return DOOR_ERRORS[error as keyof typeof DOOR_ERRORS]
    }
    // 429 is distinctive to the door's abuse limiter; static previews do
    // not emit it for a missing reserved path.
    if (status === 429) {
        return "rate_limited"
    }
    return undefined
}

function isRoomManifest(value: unknown): value is ProofingRoomManifest {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false
    }
    const room = value as { name?: unknown; images?: unknown }
    return typeof room.name === "string" && Array.isArray(room.images)
}

/**
 * Fetches one room's manifest from the site's own origin. Never throws.
 * A JSON door answer (success or a known error) is relayed; only an
 * unreachable reserved path (network failure, HTML 404 from a static
 * preview) returns `unreachable` so the page can render demo fixtures.
 */
export async function fetchProofingRoom(slug: string, code: string): Promise<FetchProofingRoomResult> {
    const params = new URLSearchParams({ slug, code })
    try {
        const response = await fetch(`${PROOFING_ROOM_PATH}?${params.toString()}`)
        const body = await readJson(response)
        if (response.ok && body?.ok === true && isRoomManifest(body.room)) {
            return { status: "ok", room: body.room, sandbox: false }
        }
        const outcome = doorOutcome(response.status, body)
        if (outcome !== undefined) {
            return { status: outcome }
        }
    } catch {
        // Network failure — same as a non-JSON 404 from a static preview.
    }
    return { status: "unreachable" }
}

/**
 * Posts one selection. Real-door domain outcomes come back as states the
 * page renders; only an unreachable door falls into the sandbox write so a
 * baked preview's send still completes. Never throws.
 */
export async function submitProofingSelection(
    request: SubmitProofingSelectionRequest,
): Promise<SubmitProofingSelectionResult> {
    try {
        const response = await fetch(PROOFING_SELECT_PATH, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                slug: request.slug,
                code: request.code,
                visitorName: request.visitorName,
                visitorEmail: request.visitorEmail,
                note: request.note ?? "",
                picks: [...request.picks],
            }),
        })
        const body = await readJson(response)
        if (response.ok && body?.ok === true && typeof body.selectionId === "string") {
            return { status: "ok", selectionId: body.selectionId, sandbox: false }
        }
        const outcome = doorOutcome(response.status, body)
        if (outcome !== undefined) {
            return { status: outcome }
        }
    } catch {
        // Network failure — treated as no door below.
    }
    writeSandboxSelection(request)
    return { status: "ok", selectionId: `sandbox-${Date.now()}`, sandbox: true }
}

function writeSandboxSelection(request: SubmitProofingSelectionRequest): void {
    const record = {
        slug: request.slug,
        visitorName: request.visitorName,
        visitorEmail: request.visitorEmail,
        note: request.note ?? "",
        picks: [...request.picks],
    }
    try {
        const raw = localStorage.getItem(PROOFING_SANDBOX_STORAGE_KEY)
        const parsed: unknown = raw === null ? [] : JSON.parse(raw)
        const current = Array.isArray(parsed) ? parsed : []
        localStorage.setItem(PROOFING_SANDBOX_STORAGE_KEY, JSON.stringify([...current, record]))
    } catch {
        // Storage full or blocked — the confirm state still shows.
    }
    if (request.fallbackStorageKey === undefined) {
        return
    }
    try {
        localStorage.setItem(request.fallbackStorageKey, JSON.stringify(record))
    } catch {
        // Storage full or blocked — nothing else to do.
    }
}
