/**
 * The OpenAI boundary the Ai domain talks through. Mirrors the Stripe wrapper
 * pattern: a small interface over raw fetch (no SDK dependency), constructed
 * lazily so booting without an OPENAI_API_KEY never fails, and substitutable
 * in tests via setOpenAiWrapperForTests.
 */
export interface OpenAiWrapper {
    /**
     * Runs one streaming model turn against the Responses API and reports
     * progress through the callbacks. Returns once the turn completes, with
     * any function calls the model requested; the caller executes them and
     * starts the next turn with their outputs.
     */
    streamModelTurn(
        request: OpenAiModelTurnRequest,
        callbacks: OpenAiModelTurnCallbacks,
    ): Promise<OpenAiModelTurn>

    /**
     * Mints a short-lived Realtime client secret the native app connects to
     * wss://api.openai.com/v1/realtime with. The session (model, voice,
     * instructions, audio formats) is configured server-side here so the
     * client never needs the real API key.
     */
    createRealtimeClientSecret(request: OpenAiRealtimeSessionRequest): Promise<OpenAiRealtimeClientSecret>

    /**
     * Embeds a batch of texts against the Embeddings API (plain JSON, never
     * streams). Vectors come back in input order. Only the embeddings
     * client (Services/Ai/AiEmbeddingsService.ts) calls this.
     */
    createEmbeddings(request: OpenAiEmbeddingsRequest): Promise<OpenAiEmbeddingsResult>
}

export interface OpenAiModelTurnRequest {
    model: string
    /** The system prompt; sent on every turn. */
    instructions: string
    /** New input items for this turn: the user message or tool outputs. */
    input: OpenAiInputItem[]
    /** Chains onto the stored previous response (conversation context). */
    previousResponseId?: string
    tools: OpenAiToolDefinition[]
    reasoningEffort: "low" | "medium" | "high"
}

export type OpenAiInputItem =
    { role: "user"; content: string } | { type: "function_call_output"; call_id: string; output: string }

export interface OpenAiToolDefinition {
    type: "function"
    name: string
    description: string
    parameters: Record<string, unknown>
}

export interface OpenAiModelTurnCallbacks {
    /** The turn's response id — the next request's previousResponseId. */
    onResponseCreated: (responseId: string) => void
    onReasoningSummaryDelta: (itemId: string, delta: string) => void
    onReasoningSummaryDone: (itemId: string) => void
    onAssistantTextDelta: (delta: string) => void
    /** The model requested a tool; announced before the turn completes. */
    onFunctionCallCreated: (functionCall: OpenAiFunctionCall) => void
}

export interface OpenAiModelTurn {
    responseId: string
    /** Tools the model wants run before it can answer; empty when done. */
    functionCalls: OpenAiFunctionCall[]
}

export interface OpenAiFunctionCall {
    callId: string
    name: string
    /** JSON-encoded arguments. */
    argumentsJson: string
}

export interface OpenAiEmbeddingsRequest {
    model: string
    /** Texts to embed; one vector comes back per entry, in order. */
    input: string[]
    /** Output dimensionality (the -3 models support truncation natively). */
    dimensions: number
}

export interface OpenAiEmbeddingsResult {
    /** One unit-normalized vector per input text, in input order. */
    embeddings: number[][]
    /** Prompt tokens the API reported (embeddings have no output tokens). */
    inputTokens: number
}

export interface OpenAiRealtimeSessionRequest {
    model: string
    voice: string
    instructions: string
}

export interface OpenAiRealtimeClientSecret {
    clientSecret: string
    /** Unix seconds; undefined when OpenAI omits it. */
    expiresAtSeconds?: number
    model: string
    voice: string
}
