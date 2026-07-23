import { onRequest } from "firebase-functions/v2/https"
import { aiChatService } from "../Services/Ai/AiChatService.js"
import { AiChatRequest, AiChatStreamEvent } from "../Services/Ai/AiChatTypes.js"
import { validatedEnv } from "../Utils/Env.js"

/**
 * The AI chat stream. Clients POST an AiChatRequest and read newline-
 * delimited AiChatStreamEvent JSON as the response streams — GraphQL stays
 * request/response, so this is the kernel's one streaming endpoint.
 *
 * The function name is part of the URL contract: clients derive this URL from
 * their GraphQL URL by swapping the trailing function name, which holds in
 * every environment because the emulator and the platform deployer treat all
 * exports uniformly:
 * http://127.0.0.1:5001/demo-repobot-base/us-central1/ai__request__chat
 *
 * Chat is anonymous by design, like shop checkout: the surface works without
 * sign-in, and cost control lives in the model settings (see AiChatService).
 * To gate it on accounts, add the AUTH capability and verify the bearer token
 * here with principalService.
 */
export const ai__request__chat = onRequest({ cors: true }, async (request, response) => {
    if (request.method !== "POST") {
        response.status(405).json({ error: { message: "POST an AiChatRequest to this endpoint." } })
        return
    }
    const chatRequest = parseChatRequest(request.body)
    if (chatRequest === undefined) {
        response.status(400).json({ error: { message: "The request needs an id and a message." } })
        return
    }

    // Fail fast with an actionable message when env is misconfigured.
    validatedEnv()

    response.writeHead(200, {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-cache",
    })
    const writeEvent = (event: AiChatStreamEvent): void => {
        response.write(`${JSON.stringify(event)}\n`)
    }
    await aiChatService.streamChatResponse(chatRequest, {
        stream: (chatResponse) => writeEvent({ data: chatResponse }),
        sendError: (message) => writeEvent({ error: { message } }),
    })
    response.end()
})

function parseChatRequest(body: unknown): AiChatRequest | undefined {
    if (typeof body !== "object" || body === null) {
        return undefined
    }
    const candidate = body as Record<string, unknown>
    if (typeof candidate.id !== "string" || candidate.id === "") {
        return undefined
    }
    if (typeof candidate.message !== "string" || candidate.message.trim() === "") {
        return undefined
    }
    return {
        id: candidate.id,
        message: candidate.message,
        previousResponseId:
            typeof candidate.previousResponseId === "string" && candidate.previousResponseId !== ""
                ? candidate.previousResponseId
                : undefined,
    }
}
