import { RpcError } from "../../Utils/RpcError.js"
import {
    OpenAiFunctionCall,
    OpenAiModelTurn,
    OpenAiModelTurnCallbacks,
    OpenAiModelTurnRequest,
    OpenAiRealtimeClientSecret,
    OpenAiRealtimeSessionRequest,
    OpenAiWrapper,
} from "./OpenAiWrapper.js"

const OPENAI_API_BASE = "https://api.openai.com/v1"

/**
 * The real OpenAI client, used when AI_MODE=openai. Talks to the Responses
 * API (streaming SSE) and the Realtime client-secrets endpoint over raw
 * fetch, mirroring the Stripe wrapper's no-SDK approach. The API key is
 * injected by the platform at deploy time when the deploy manifest declares
 * the AI capability; locally it can be set in firebase/functions/.env.local.
 */
export class OpenAiApiWrapper implements OpenAiWrapper {
    private readonly apiKey: string

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY
        if (apiKey === undefined || apiKey === "") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "OPENAI_API_KEY is not set. Connect an OpenAI key under Integrations and " +
                    "redeploy, or run locally with AI_MODE=local (simulated assistant).",
            )
        }
        this.apiKey = apiKey
    }

    async streamModelTurn(
        request: OpenAiModelTurnRequest,
        callbacks: OpenAiModelTurnCallbacks,
    ): Promise<OpenAiModelTurn> {
        const response = await fetch(`${OPENAI_API_BASE}/responses`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${this.apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: request.model,
                instructions: request.instructions,
                input: request.input,
                tools: request.tools,
                previous_response_id: request.previousResponseId,
                reasoning: { effort: request.reasoningEffort, summary: "auto" },
                stream: true,
                store: true,
            }),
        })
        if (!response.ok || response.body === null) {
            const errorText = await response.text()
            throw new RpcError("UNAVAILABLE", `OpenAI: ${extractErrorMessage(errorText, response.status)}`)
        }

        let responseId: string | undefined
        const functionCalls: OpenAiFunctionCall[] = []

        for await (const event of sseEvents(response.body)) {
            switch (event.type) {
                case "response.created":
                    responseId = stringAtPath(event, ["response", "id"])
                    if (responseId !== undefined) {
                        callbacks.onResponseCreated(responseId)
                    }
                    break
                case "response.output_text.delta": {
                    const delta = stringAtPath(event, ["delta"])
                    if (delta !== undefined) {
                        callbacks.onAssistantTextDelta(delta)
                    }
                    break
                }
                case "response.reasoning_summary_text.delta": {
                    const itemId = stringAtPath(event, ["item_id"])
                    const delta = stringAtPath(event, ["delta"])
                    if (itemId !== undefined && delta !== undefined) {
                        callbacks.onReasoningSummaryDelta(itemId, delta)
                    }
                    break
                }
                case "response.output_item.done": {
                    const item = event.item as Record<string, unknown> | undefined
                    if (item === undefined) {
                        break
                    }
                    if (item.type === "reasoning" && typeof item.id === "string") {
                        callbacks.onReasoningSummaryDone(item.id)
                    }
                    if (
                        item.type === "function_call" &&
                        typeof item.call_id === "string" &&
                        typeof item.name === "string"
                    ) {
                        const functionCall: OpenAiFunctionCall = {
                            callId: item.call_id,
                            name: item.name,
                            argumentsJson: typeof item.arguments === "string" ? item.arguments : "{}",
                        }
                        functionCalls.push(functionCall)
                        callbacks.onFunctionCallCreated(functionCall)
                    }
                    break
                }
                case "response.failed":
                case "error": {
                    const message =
                        stringAtPath(event, ["response", "error", "message"]) ??
                        stringAtPath(event, ["error", "message"]) ??
                        stringAtPath(event, ["message"]) ??
                        "The model request failed."
                    throw new RpcError("UNAVAILABLE", `OpenAI: ${message}`)
                }
                default:
                    break
            }
        }

        if (responseId === undefined) {
            throw new RpcError("UNAVAILABLE", "OpenAI: the stream ended without a response id.")
        }
        return { responseId, functionCalls }
    }

    async createRealtimeClientSecret(
        request: OpenAiRealtimeSessionRequest,
    ): Promise<OpenAiRealtimeClientSecret> {
        const response = await fetch(`${OPENAI_API_BASE}/realtime/client_secrets`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${this.apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                session: {
                    type: "realtime",
                    model: request.model,
                    instructions: request.instructions,
                    output_modalities: ["audio"],
                    audio: {
                        input: { format: { type: "audio/pcm", rate: 24000 } },
                        output: { format: { type: "audio/pcm", rate: 24000 }, voice: request.voice },
                    },
                },
            }),
        })
        const payload = (await response.json()) as { value?: string; expires_at?: number }
        if (!response.ok) {
            throw new RpcError(
                "UNAVAILABLE",
                `OpenAI: realtime session failed with status ${response.status}.`,
            )
        }
        if (payload.value === undefined || payload.value === "") {
            throw new RpcError("UNAVAILABLE", "OpenAI: realtime session returned no client secret.")
        }
        return {
            clientSecret: payload.value,
            expiresAtSeconds: payload.expires_at,
            model: request.model,
            voice: request.voice,
        }
    }
}

/**
 * Parses an SSE byte stream into JSON event payloads. The Responses API sends
 * `event: <type>` + `data: <json>` records; the JSON carries its own `type`
 * field, so only data lines matter.
 */
async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
    const decoder = new TextDecoder()
    let buffer = ""
    const reader = body.getReader()
    try {
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
                if (!line.startsWith("data:")) {
                    continue
                }
                const data = line.slice("data:".length).trim()
                if (data === "" || data === "[DONE]") {
                    continue
                }
                let parsed: unknown
                try {
                    parsed = JSON.parse(data)
                } catch {
                    continue
                }
                if (typeof parsed === "object" && parsed !== null) {
                    yield parsed as Record<string, unknown>
                }
            }
        }
    } finally {
        reader.releaseLock()
    }
}

function stringAtPath(object: Record<string, unknown>, path: string[]): string | undefined {
    let current: unknown = object
    for (const key of path) {
        if (typeof current !== "object" || current === null) {
            return undefined
        }
        current = (current as Record<string, unknown>)[key]
    }
    return typeof current === "string" ? current : undefined
}

function extractErrorMessage(errorText: string, status: number): string {
    try {
        const parsed = JSON.parse(errorText) as { error?: { message?: string } }
        if (parsed.error?.message !== undefined) {
            return parsed.error.message
        }
    } catch {
        // Fall through to the generic message.
    }
    return `request failed with status ${status}.`
}
