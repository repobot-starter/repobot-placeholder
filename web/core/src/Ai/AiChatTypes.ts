/**
 * The AI chat wire protocol — the client mirror of
 * firebase/functions/src/Services/Ai/AiChatTypes.ts (the iOS twin is
 * ios/App/Components/AiChat/AiChatModels.swift). The server re-sends the same
 * growing AiChatResponse many times per request; the client upserts each
 * snapshot by requestId. Change all three files together.
 */

export interface AiChatRequest {
    id: string
    message: string
    /** Chains the conversation; omit to start fresh. */
    previousResponseId?: string
}

export interface AiChatResponse {
    requestId: string
    requestMessage: string
    /** Send as previousResponseId on the next turn to continue the thread. */
    responseId?: string
    responseItems: AiChatResponseItem[]
    assistantMessage?: AiChatAssistantMessage
}

export interface AiChatResponseItem {
    functionCall?: AiChatFunctionCall
    reasoningSummary?: AiChatReasoningSummary
    elapsedSeconds?: number
}

export interface AiChatFunctionCall {
    id: string
    name: string
    arguments: string
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

export interface AiChatSegment {
    format: AiChatSegmentFormat
    content: string
}

export type AiChatSegmentFormat = "TITLE" | "PARAGRAPH" | "LIST_ITEM" | "CODE" | "QUOTE"

export interface AiChatStreamEvent {
    data?: AiChatResponse
    error?: AiChatError
}

export interface AiChatError {
    message: string
}
