import { getOpenAiWrapper, OpenAiRealtimeClientSecret } from "../../DependencyWrappers/OpenAiWrapper/index.js"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"

/** The realtime voice model and voice; tune these to taste. */
export const AI_VOICE_MODEL = "gpt-realtime-2"
export const AI_VOICE_VOICE = "marin"

const AI_VOICE_INSTRUCTIONS = [
    "You are the built-in voice assistant of this app, on a push-to-talk channel.",
    "The user holds a button to speak, so every message is intentionally addressed",
    "to you — respond directly, never require a wake phrase. Keep replies short and",
    "conversational: one or two sentences by default. If you are unsure what was",
    "asked, ask one short clarifying question.",
].join(" ")

/**
 * Mints the short-lived OpenAI Realtime client secret the native app uses to
 * open its audio WebSocket. The session — model, voice, instructions, PCM
 * formats — is configured server-side, so the real API key never reaches the
 * client and prompts stay editable here.
 *
 * There is no simulated voice mode: realtime speech needs the real model. In
 * AI_MODE=local this refuses with instructions instead — unlike chat, where
 * the sandbox streams a simulated assistant.
 */
class AiVoiceService {
    async createVoiceSession(): Promise<OpenAiRealtimeClientSecret> {
        if (validatedEnv().AI_MODE === "local") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "Voice needs the real model: set AI_MODE=openai and OPENAI_API_KEY in " +
                    "firebase/functions/.env.local to test locally, or deploy this project " +
                    "with an OpenAI key connected.",
            )
        }
        return await getOpenAiWrapper().createRealtimeClientSecret({
            model: AI_VOICE_MODEL,
            voice: AI_VOICE_VOICE,
            instructions: AI_VOICE_INSTRUCTIONS,
        })
    }
}

export const aiVoiceService = new AiVoiceService()
