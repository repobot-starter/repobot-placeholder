export interface AiVoiceTurnRequest {
    id: string
    audioBase64?: string
    mimeType?: string
    transcript?: string
    previousResponseId?: string
}

export interface AiVoiceTurnResponse {
    requestId: string
    userTranscript: string
    assistantText: string
    audioBase64?: string
    audioMimeType?: string
    responseId?: string
}

/**
 * The voice-turn endpoint is the ai__request__voice function, which lives
 * next to GraphQL in every environment — same derivation as chat.
 */
export function deriveAiVoiceTurnEndpoint(graphqlUrl: string): string {
    const endpoint = graphqlUrl.replace(/graphql__request__api\/?$/, "ai__request__voice")
    if (endpoint === graphqlUrl) {
        throw new Error(
            "Could not derive the AI voice endpoint: the GraphQL URL does not end with " +
                "the graphql__request__api function name.",
        )
    }
    return endpoint
}

/**
 * POSTs one hold-to-talk turn and returns the transcript, answer, and
 * optional spoken audio (base64). Abort the signal to cancel in flight.
 */
export async function runAiVoiceTurn(
    endpoint: string,
    request: AiVoiceTurnRequest,
    signal?: AbortSignal,
): Promise<AiVoiceTurnResponse> {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal,
    })
    // Read as text first: a missing emulator function returns
    // "Function us-central1-ai__request__voice does not exist", and
    // response.json() turned that into "Unexpected token 'F'".
    const raw = await response.text()
    const payload = parseJsonPayload(raw)
    if (payload === undefined) {
        throw new Error(nonJsonVoiceError(response.status, raw))
    }
    if (!response.ok) {
        throw new Error(payload.error?.message ?? `The voice request failed with status ${response.status}.`)
    }
    if (typeof payload.userTranscript !== "string" || typeof payload.assistantText !== "string") {
        throw new Error("The voice endpoint returned an unexpected payload.")
    }
    return payload
}

function parseJsonPayload(raw: string): (AiVoiceTurnResponse & { error?: { message?: string } }) | undefined {
    try {
        return JSON.parse(raw) as AiVoiceTurnResponse & { error?: { message?: string } }
    } catch {
        return undefined
    }
}

/** Exported for tests. */
export function nonJsonVoiceError(status: number, raw: string): string {
    if (status === 404 || /Function \S+ does not exist/i.test(raw)) {
        return "The voice function is not running. Rebuild firebase/functions and restart the emulator."
    }
    const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 160)
    if (snippet === "") {
        return `The voice request failed with status ${status}.`
    }
    return `The voice endpoint returned a non-JSON response (${status}): ${snippet}`
}
