import { AiChatRequest, AiChatResponse, AiChatSegment, AiChatStreamEvent } from "./AiChatTypes"

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

/**
 * Demo mode: streams a scripted reply with the same snapshot cadence as the
 * real endpoint, so ChatBot/TalkBot previews on the marketing site feel live
 * with no backend. The reply cycles through a small set of canned responses,
 * each acknowledging the visitor's message.
 */
export async function streamDemoAiChatResponse(
    request: AiChatRequest,
    signal: AbortSignal,
    callbacks: AiChatStreamCallbacks,
): Promise<void> {
    const scripts: AiChatSegment[][] = [
        [
            { format: "PARAGRAPH", content: "Happy to help with that. Here's the short version:" },
            {
                format: "LIST_ITEM",
                content: "This preview runs entirely in your browser — no server, no API keys.",
            },
            {
                format: "LIST_ITEM",
                content:
                    "In your own copy, this assistant streams real model responses through the built-in AI endpoint.",
            },
            {
                format: "LIST_ITEM",
                content:
                    "Everything you see — the thread, the streaming, the stop button — is the real product UI.",
            },
            { format: "PARAGRAPH", content: "Ask me something else and I'll keep the tour going." },
        ],
        [
            {
                format: "PARAGRAPH",
                content: `Good question — let me take "${request.message.trim()}" seriously for a second.`,
            },
            {
                format: "PARAGRAPH",
                content:
                    "In a deployed app I'd reason over your actual data and tools here. The preview keeps my answers scripted, but the plumbing — request chaining, streamed snapshots, markdown segments — is exactly what ships.",
            },
            { format: "QUOTE", content: "The demo is the product, minus the model." },
        ],
        [
            { format: "TITLE", content: "What you're looking at" },
            {
                format: "PARAGRAPH",
                content:
                    "A chat surface with streaming responses, conversation memory, and graceful stop/reset — the starter every AI product here begins from.",
            },
            {
                format: "PARAGRAPH",
                content: "Create your own project and this same thread talks to a real model within minutes.",
            },
        ],
    ]
    const responseNumber = Number(request.previousResponseId?.replace(/\D/g, "") ?? "0") + 1
    const script = scripts[(responseNumber - 1) % scripts.length]

    const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
    const snapshot = (segments: AiChatSegment[], done: boolean): AiChatResponse => ({
        requestId: request.id,
        requestMessage: request.message,
        responseId: done ? `demo-response-${responseNumber}` : undefined,
        responseItems: [],
        assistantMessage: { message: segments, status: done ? "COMPLETED" : "IN_PROGRESS" },
    })

    await wait(450)
    for (let index = 0; index < script.length; index += 1) {
        if (signal.aborted) {
            return
        }
        const revealed = script.slice(0, index)
        const current = script[index]
        const words = current.content.split(" ")
        for (let wordCount = 1; wordCount <= words.length; wordCount += 1) {
            if (signal.aborted) {
                return
            }
            callbacks.onResponse(
                snapshot(
                    [...revealed, { format: current.format, content: words.slice(0, wordCount).join(" ") }],
                    false,
                ),
            )
            await wait(28)
        }
    }
    callbacks.onResponse(snapshot(script, true))
    callbacks.onComplete()
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
