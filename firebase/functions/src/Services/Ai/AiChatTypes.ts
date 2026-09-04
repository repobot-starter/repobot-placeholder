/**
 * The wire protocol for the AI chat stream served by ai__request__chat.
 *
 * The client POSTs an AiChatRequest and receives newline-delimited JSON
 * (NDJSON): one AiChatStreamEvent per line. The same AiChatResponse is
 * re-sent many times as it grows — reasoning summaries stream in, tool calls
 * run, and the assistant message streams token by token — and the client
 * upserts each snapshot by requestId. The web and iOS clients keep mirrored
 * copies of these types (web/core/src/Ai/AiChatTypes.ts and
 * ios/App/Components/AiChat/AiChatModels.swift); change all three together.
 */

export interface AiChatRequest {
    /** Client-generated unique id for this request (echoed as requestId). */
    id: string
    /** The user's chat message. */
    message: string
    /**
     * The responseId of the previous turn, chaining the conversation. The
     * server is stateless by design (Cloud Functions may serve consecutive
     * requests from different instances), so context lives in this id, which
     * OpenAI resolves to the stored conversation. Omit to start fresh.
     */
    previousResponseId?: string
}

export interface AiChatResponse {
    /** Mirrors AiChatRequest.id. */
    requestId: string
    /** Mirrors AiChatRequest.message, so a thread renders from responses alone. */
    requestMessage: string
    /** Send as previousResponseId on the next turn to continue the thread. */
    responseId?: string
    /** Reasoning summaries and tool calls, in the order they happened. */
    responseItems: AiChatResponseItem[]
    /** The assistant's answer; present once the model starts writing it. */
    assistantMessage?: AiChatAssistantMessage
}

export interface AiChatResponseItem {
    functionCall?: AiChatFunctionCall
    reasoningSummary?: AiChatReasoningSummary
    /** How long the item took, filled in when it completes. */
    elapsedSeconds?: number
}

export interface AiChatFunctionCall {
    id: string
    name: string
    /** JSON-encoded arguments from the model. */
    arguments: string
    /** JSON-encoded tool output, present once the tool has run. */
    output?: string
    status: AiChatStatus
}

export interface AiChatReasoningSummary {
    id: string
    message: AiChatSegment[]
    status: AiChatStatus
}

export interface AiChatAssistantMessage {
    message: AiChatSegment[]
    status: AiChatStatus
}

export type AiChatStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

/**
 * A displayable chunk of assistant output. The server splits the model's
 * markdown-ish text into typed segments so clients render structure (titles,
 * lists, code) without shipping a markdown parser.
 */
export interface AiChatSegment {
    format: AiChatSegmentFormat
    content: string
}

export type AiChatSegmentFormat = "TITLE" | "PARAGRAPH" | "LIST_ITEM" | "CODE" | "QUOTE"

/** One NDJSON line: a response snapshot or a terminal error. */
export interface AiChatStreamEvent {
    data?: AiChatResponse
    error?: AiChatError
}

export interface AiChatError {
    message: string
}
