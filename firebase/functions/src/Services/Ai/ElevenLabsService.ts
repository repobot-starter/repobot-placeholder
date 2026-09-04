import { getElevenLabsWrapper } from "../../DependencyWrappers/ElevenLabsWrapper/index.js"
import { validatedEnv } from "../../Utils/Env.js"

/** Rachel — a clear, neutral default. Override with ELEVENLABS_VOICE_ID. */
export const ELEVENLABS_DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
export const ELEVENLABS_TTS_MODEL = "eleven_multilingual_v2"

const LOCAL_CATALOG_PROMPT = "Who is number one on the chart, and why is that song still famous?"

/**
 * ElevenLabs STT/TTS with the same three-mode split as chat. Local mode
 * never calls the network: STT returns the provided transcript (or a canned
 * catalog question), TTS returns empty audio so the client can speak with
 * the browser's own synthesis.
 */
class ElevenLabsService {
    resolveVoiceId(): string {
        const override = validatedEnv().ELEVENLABS_VOICE_ID?.trim()
        return override !== undefined && override !== "" ? override : ELEVENLABS_DEFAULT_VOICE_ID
    }

    async speechToText(request: { audio?: Buffer; mimeType?: string; transcript?: string }): Promise<string> {
        const provided = request.transcript?.trim()
        if (validatedEnv().ELEVENLABS_MODE === "local") {
            return provided !== undefined && provided !== "" ? provided : LOCAL_CATALOG_PROMPT
        }
        if (provided !== undefined && provided !== "") {
            return provided
        }
        if (request.audio === undefined || request.audio.length === 0) {
            throw new Error("The voice turn needs audio, or a transcript in local mode.")
        }
        const result = await getElevenLabsWrapper().speechToText({
            audio: request.audio,
            mimeType: request.mimeType ?? "audio/webm",
            fileName: fileNameForMime(request.mimeType ?? "audio/webm"),
        })
        return result.text
    }

    async textToSpeech(text: string): Promise<{ audio: Buffer; mimeType: string } | undefined> {
        const spoken = text.trim()
        if (spoken === "") {
            return undefined
        }
        if (validatedEnv().ELEVENLABS_MODE === "local") {
            return undefined
        }
        return await getElevenLabsWrapper().textToSpeech({
            text: spoken,
            voiceId: this.resolveVoiceId(),
            modelId: ELEVENLABS_TTS_MODEL,
        })
    }
}

function fileNameForMime(mimeType: string): string {
    if (mimeType.includes("wav")) return "speech.wav"
    if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "speech.mp3"
    if (mimeType.includes("ogg")) return "speech.ogg"
    return "speech.webm"
}

export const elevenLabsService = new ElevenLabsService()
