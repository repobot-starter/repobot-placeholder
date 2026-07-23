import {
    getOpenAiWrapper,
    OpenAiFunctionCall,
    OpenAiInputItem,
    OpenAiModelTurnCallbacks,
} from "../../DependencyWrappers/OpenAiWrapper/index.js"
import { validatedEnv } from "../../Utils/Env.js"
import { executeAiChatTool, aiChatTools } from "./AiChatTools.js"
import { AiChatFunctionCall, AiChatReasoningSummary, AiChatRequest, AiChatResponse } from "./AiChatTypes.js"
import { formatAssistantMessage } from "./FormatAssistantMessage.js"
import { streamSimulatedChatResponse } from "./AiChatSimulation.js"

/** The chat model and its settings; tune these to taste. */
export const AI_CHAT_MODEL = "gpt-5.4"
const AI_CHAT_REASONING_EFFORT = "low"
/** Guard against a runaway tool loop burning tokens. */
const MAX_TOOL_TURNS = 5

export const AI_CHAT_SYSTEM_PROMPT = [
    "You are the built-in assistant of this app. Be helpful, warm, and concise.",
    "Format answers in light markdown: '#' headings for sections, '-' bullets for",
    "lists, fenced blocks for code, '>' for callouts. Prefer short paragraphs.",
    "Use the get_current_time tool whenever the current date or time matters.",
].join(" ")

export interface AiChatStreamCallbacks {
    /** Emits a response snapshot; called many times as the response grows. */
    stream: (response: AiChatResponse) => void
    /** Terminal error, sent as a stream event so clients parse one format. */
    sendError: (message: string) => void
}

/**
 * Produces one streamed chat response: reasoning summaries, tool calls, and
 * the assistant message, emitted as growing snapshots of the same
 * AiChatResponse. AI_MODE=local (the sandbox) streams a simulated assistant
 * that exercises the identical protocol; AI_MODE=openai runs the real model
 * with the tool loop.
 */
class AiChatService {
    async streamChatResponse(request: AiChatRequest, callbacks: AiChatStreamCallbacks): Promise<void> {
        if (validatedEnv().AI_MODE === "local") {
            await streamSimulatedChatResponse(request, callbacks)
            return
        }
        try {
            await new ChatTurnRunner(request, callbacks).run()
        } catch (error) {
            callbacks.sendError(error instanceof Error ? error.message : "The assistant failed.")
        }
    }
}

/**
 * Per-request state for one chat exchange. A fresh runner per request keeps
 * concurrent requests isolated (Cloud Functions instances serve many).
 */
class ChatTurnRunner {
    private readonly response: AiChatResponse
    private readonly itemStartTimes = new Map<string, number>()
    private assistantText = ""
    private currentSummaryTextById = new Map<string, string>()

    constructor(
        private readonly request: AiChatRequest,
        private readonly callbacks: AiChatStreamCallbacks,
    ) {
        this.response = {
            requestId: request.id,
            requestMessage: request.message,
            responseItems: [],
        }
    }

    async run(): Promise<void> {
        let previousResponseId = this.request.previousResponseId
        let input: OpenAiInputItem[] = [{ role: "user", content: this.request.message }]

        for (let turn = 0; turn <= MAX_TOOL_TURNS; turn++) {
            const modelTurn = await getOpenAiWrapper().streamModelTurn(
                {
                    model: AI_CHAT_MODEL,
                    instructions: AI_CHAT_SYSTEM_PROMPT,
                    input,
                    previousResponseId,
                    tools: aiChatTools,
                    reasoningEffort: AI_CHAT_REASONING_EFFORT,
                },
                this.turnCallbacks(),
            )
            previousResponseId = modelTurn.responseId

            if (modelTurn.functionCalls.length === 0 || turn === MAX_TOOL_TURNS) {
                break
            }
            input = modelTurn.functionCalls.map((functionCall) => {
                const output = executeAiChatTool(functionCall.name, functionCall.argumentsJson)
                this.completeFunctionCall(functionCall.callId, output)
                return { type: "function_call_output", call_id: functionCall.callId, output }
            })
            this.emit()
        }

        this.completeAssistantMessage()
        this.emit()
    }

    private turnCallbacks(): OpenAiModelTurnCallbacks {
        return {
            onResponseCreated: (responseId) => {
                this.response.responseId = responseId
                this.emit()
            },
            onReasoningSummaryDelta: (itemId, delta) => {
                this.markItemStart(itemId)
                const text = (this.currentSummaryTextById.get(itemId) ?? "") + delta
                this.currentSummaryTextById.set(itemId, text)
                const summary: AiChatReasoningSummary = {
                    id: itemId,
                    message: formatAssistantMessage(text),
                    status: "IN_PROGRESS",
                }
                this.upsertReasoningSummary(summary)
                this.emit()
            },
            onReasoningSummaryDone: (itemId) => {
                const item = this.response.responseItems.find(
                    (candidate) => candidate.reasoningSummary?.id === itemId,
                )
                if (item?.reasoningSummary !== undefined) {
                    item.reasoningSummary.status = "COMPLETED"
                    item.elapsedSeconds = this.elapsedSeconds(itemId)
                    this.emit()
                }
            },
            onAssistantTextDelta: (delta) => {
                this.assistantText += delta
                this.response.assistantMessage = {
                    message: formatAssistantMessage(this.assistantText),
                    status: "IN_PROGRESS",
                }
                this.emit()
            },
            onFunctionCallCreated: (functionCall) => {
                this.markItemStart(functionCall.callId)
                this.response.responseItems.push({
                    functionCall: this.pendingFunctionCall(functionCall),
                })
                this.emit()
            },
        }
    }

    private pendingFunctionCall(functionCall: OpenAiFunctionCall): AiChatFunctionCall {
        return {
            id: functionCall.callId,
            name: functionCall.name,
            arguments: functionCall.argumentsJson,
            status: "IN_PROGRESS",
        }
    }

    private upsertReasoningSummary(summary: AiChatReasoningSummary): void {
        const item = this.response.responseItems.find(
            (candidate) => candidate.reasoningSummary?.id === summary.id,
        )
        if (item !== undefined) {
            item.reasoningSummary = summary
        } else {
            this.response.responseItems.push({ reasoningSummary: summary })
        }
    }

    private completeFunctionCall(callId: string, output: string): void {
        const item = this.response.responseItems.find((candidate) => candidate.functionCall?.id === callId)
        if (item?.functionCall !== undefined) {
            item.functionCall.output = output
            item.functionCall.status = "COMPLETED"
            item.elapsedSeconds = this.elapsedSeconds(callId)
        }
    }

    private completeAssistantMessage(): void {
        this.response.assistantMessage = {
            message: formatAssistantMessage(this.assistantText),
            status: "COMPLETED",
        }
    }

    private markItemStart(itemId: string): void {
        if (!this.itemStartTimes.has(itemId)) {
            this.itemStartTimes.set(itemId, Date.now())
        }
    }

    private elapsedSeconds(itemId: string): number {
        const start = this.itemStartTimes.get(itemId)
        return start === undefined ? 0 : Math.round((Date.now() - start) / 1000)
    }

    private emit(): void {
        this.callbacks.stream(this.response)
    }
}

export const aiChatService = new AiChatService()
