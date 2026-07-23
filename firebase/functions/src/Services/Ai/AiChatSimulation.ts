import { randomUUID } from "node:crypto"
import { executeAiChatTool } from "./AiChatTools.js"
import { AiChatRequest, AiChatResponse } from "./AiChatTypes.js"
import { AiChatStreamCallbacks } from "./AiChatService.js"
import { formatAssistantMessage } from "./FormatAssistantMessage.js"

const STREAM_DELAY_MS = 24

/**
 * The AI_MODE=local assistant: a scripted exchange that exercises the entire
 * wire protocol — a streaming reasoning summary, a real run of the
 * get_current_time tool, and a token-by-token assistant message — so the chat
 * surface is fully demonstrable in the sandbox with no OpenAI key and no
 * cost. Deployed environments run the real model (AI_MODE=openai).
 */
export async function streamSimulatedChatResponse(
    request: AiChatRequest,
    callbacks: AiChatStreamCallbacks,
): Promise<void> {
    const response: AiChatResponse = {
        requestId: request.id,
        requestMessage: request.message,
        responseId: `local-${randomUUID()}`,
        responseItems: [],
    }
    callbacks.stream(response)

    // 1. A reasoning summary streams in.
    const summaryId = `local-summary-${randomUUID()}`
    const summaryText =
        "**Reading the message**\n" +
        "The user is trying out the assistant. I will check the clock with the " +
        "get_current_time tool, then explain how this starter works."
    let summarySoFar = ""
    for (const word of summaryText.split(" ")) {
        summarySoFar += (summarySoFar === "" ? "" : " ") + word
        upsertSummary(response, summaryId, summarySoFar, "IN_PROGRESS")
        callbacks.stream(response)
        await sleep(STREAM_DELAY_MS)
    }
    upsertSummary(response, summaryId, summarySoFar, "COMPLETED")
    setElapsed(response, (item) => item.reasoningSummary?.id === summaryId, 1)
    callbacks.stream(response)

    // 2. The exemplar tool actually runs.
    const callId = `local-call-${randomUUID()}`
    const argumentsJson = JSON.stringify({ timezone: "UTC" })
    response.responseItems.push({
        functionCall: {
            id: callId,
            name: "get_current_time",
            arguments: argumentsJson,
            status: "IN_PROGRESS",
        },
    })
    callbacks.stream(response)
    await sleep(STREAM_DELAY_MS * 12)

    const output = executeAiChatTool("get_current_time", argumentsJson)
    const item = response.responseItems.find((candidate) => candidate.functionCall?.id === callId)
    if (item?.functionCall !== undefined) {
        item.functionCall.output = output
        item.functionCall.status = "COMPLETED"
        item.elapsedSeconds = 1
    }
    callbacks.stream(response)

    // 3. The assistant message streams token by token.
    const formattedTime = extractFormattedTime(output)
    const assistantText = [
        "# Hello from your AI starter",
        "",
        `You said: "${truncate(request.message, 120)}" — and this reply is simulated. ` +
            "In the sandbox the assistant runs in local mode: no API key, no cost, same " +
            "streaming protocol as the real thing.",
        "",
        `I did just run a real tool though. The clock says it is ${formattedTime}.`,
        "",
        "What you are looking at:",
        "- Reasoning summaries stream in while the assistant thinks",
        "- Tool calls run server-side and feed their output back to the model",
        "- The answer streams in with headings, lists, quotes, and code",
        "",
        "> Deploy this project (or set OPENAI_API_KEY with AI_MODE=openai locally) and " +
            "this same chat talks to the real model.",
        "",
        "Try asking the deployed assistant for the time — it will use the same tool:",
        "",
        "```",
        'user: "What time is it in Tokyo?"',
        'assistant: get_current_time({ timezone: "Asia/Tokyo" })',
        "```",
    ].join("\n")

    let assistantSoFar = ""
    for (const word of assistantText.split(" ")) {
        assistantSoFar += (assistantSoFar === "" ? "" : " ") + word
        response.assistantMessage = {
            message: formatAssistantMessage(assistantSoFar),
            status: "IN_PROGRESS",
        }
        callbacks.stream(response)
        await sleep(STREAM_DELAY_MS)
    }
    response.assistantMessage = {
        message: formatAssistantMessage(assistantText),
        status: "COMPLETED",
    }
    callbacks.stream(response)
}

function upsertSummary(
    response: AiChatResponse,
    summaryId: string,
    text: string,
    status: "IN_PROGRESS" | "COMPLETED",
): void {
    const summary = {
        id: summaryId,
        message: formatAssistantMessage(text),
        status,
    }
    const item = response.responseItems.find((candidate) => candidate.reasoningSummary?.id === summaryId)
    if (item !== undefined) {
        item.reasoningSummary = summary
    } else {
        response.responseItems.push({ reasoningSummary: summary })
    }
}

function setElapsed(
    response: AiChatResponse,
    predicate: (item: AiChatResponse["responseItems"][number]) => boolean,
    seconds: number,
): void {
    const item = response.responseItems.find(predicate)
    if (item !== undefined) {
        item.elapsedSeconds = seconds
    }
}

function extractFormattedTime(toolOutput: string): string {
    try {
        const parsed = JSON.parse(toolOutput) as { formatted?: string }
        return parsed.formatted ?? "unavailable"
    } catch {
        return "unavailable"
    }
}

function truncate(text: string, maxLength: number): string {
    const trimmed = text.trim()
    return trimmed.length <= maxLength ? trimmed : `${trimmed.slice(0, maxLength - 1)}…`
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
