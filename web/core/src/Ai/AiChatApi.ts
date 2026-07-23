import { AiChatRequest, AiChatResponse, AiChatStreamEvent } from "./AiChatTypes"

/**
 * The chat stream endpoint is the ai__request__chat function, which lives
 * next to the GraphQL function in every environment — the emulator and the
 * platform deployer treat all exports uniformly — so its URL is the GraphQL
 * URL with the trailing function name swapped. The app passes its GraphQL URL
 * (import.meta.env.VITE_GRAPHQL_URL); core never reads env directly.
 */
export function deriveAiChatEndpoint(graphqlUrl: string): string {
    const endpoint = graphqlUrl.replace(/graphql__request__api\/?$/, "ai__request__chat")
    if (endpoint === graphqlUrl) {
        throw new Error(
            "Could not derive the AI chat endpoint: the GraphQL URL does not end with " +
                "the graphql__request__api function name.",
        )
    }
    return endpoint
}

export interface AiChatStreamCallbacks {
    /** A response snapshot; upsert it by requestId. */
    onResponse: (response: AiChatResponse) => void
    onError: (message: string) => void
    onComplete: () => void
}

/**
 * POSTs a chat request to the given endpoint and reads the NDJSON response
 * stream, invoking onResponse for every snapshot line until the stream ends.
 * Abort the signal to stop mid-stream (the "stop generating" button).
 */
export async function streamAiChatResponse(
    endpoint: string,
    request: AiChatRequest,
    signal: AbortSignal,
    callbacks: AiChatStreamCallbacks,
): Promise<void> {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(request),
            signal,
        })
        if (!response.ok || response.body === null) {
            callbacks.onError(`The chat request failed with status ${response.status}.`)
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        while (true) {
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            buffer += decoder.decode(value, { stream: true })
            let newlineIndex: number
            while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
                const line = buffer.slice(0, newlineIndex).trim()
                buffer = buffer.slice(newlineIndex + 1)
                if (line === "") {
                    continue
                }
                handleAiChatEventLine(line, callbacks)
            }
        }
        callbacks.onComplete()
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return
        }
        callbacks.onError(error instanceof Error ? error.message : "The chat stream failed.")
    }
}

/** Parses one NDJSON stream line and routes it to the callbacks. Exported for tests. */
export function handleAiChatEventLine(line: string, callbacks: AiChatStreamCallbacks): void {
    let event: AiChatStreamEvent
    try {
        event = JSON.parse(line) as AiChatStreamEvent
    } catch {
        callbacks.onError("The server sent a malformed stream event.")
        return
    }
    if (event.error !== undefined) {
        callbacks.onError(event.error.message)
        return
    }
    if (event.data !== undefined) {
        callbacks.onResponse(event.data)
    }
}
