import { AiChatRequest, AiChatResponse } from "./AiChatTypes.js"
import { aiChatService } from "./AiChatService.js"
import { elevenLabsService } from "./ElevenLabsService.js"

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
 * One hold-to-talk turn: transcribe (ElevenLabs), run the same chat brain
 * (tools included), speak the answer (ElevenLabs). ChatGPT stays the mind;
 * ElevenLabs is the voice. Local mode skips the speech APIs and still runs
 * the catalog tools.
 */
class AiVoiceTurnService {
    async runTurn(request: AiVoiceTurnRequest): Promise<AiVoiceTurnResponse> {
        const audio =
            request.audioBase64 !== undefined && request.audioBase64 !== ""
                ? Buffer.from(request.audioBase64, "base64")
                : undefined
        const userTranscript = await elevenLabsService.speechToText({
            audio,
            mimeType: request.mimeType,
            transcript: request.transcript,
        })
        const chatRequest: AiChatRequest = {
            id: request.id,
            message: userTranscript,
            previousResponseId: request.previousResponseId,
        }
        const chatResponse = await aiChatService.collectChatResponse(chatRequest)
        const assistantText = plainAssistantText(chatResponse)
        const spoken = await elevenLabsService.textToSpeech(assistantText)
        return {
            requestId: request.id,
            userTranscript,
            assistantText,
            audioBase64: spoken !== undefined ? spoken.audio.toString("base64") : undefined,
            audioMimeType: spoken?.mimeType,
            responseId: chatResponse.responseId,
        }
    }
}

export function plainAssistantText(response: AiChatResponse): string {
    const segments = response.assistantMessage?.message ?? []
    return segments
        .map((segment) => segment.content)
        .join("\n")
        .trim()
}

export const aiVoiceTurnService = new AiVoiceTurnService()
