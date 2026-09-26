import { getOpenAiWrapper, OpenAiRealtimeClientSecret } from "../../DependencyWrappers/OpenAiWrapper/index.js"
import { validatedEnv } from "../../Utils/Env.js"

/** The realtime voice model and voice; tune these to taste. */
export const AI_VOICE_MODEL = "gpt-realtime-2"
export const AI_VOICE_VOICE = "marin"

/**
 * The client secret returned in AI_MODE=local. Clients that see this value
 * skip the realtime bridge and run their scripted simulation instead (see
 * ios/App/Components/AiVoice/AiVoiceComponent.swift) — the voice surface
 * stays fully exercisable in sandboxes, mirroring the chat simulation.
 * Must stay in sync with the client-side constant.
 */
export const AI_VOICE_SIMULATED_SECRET = "local-simulated-voice"

const SIMULATED_SESSION_TTL_SECONDS = 10 * 60

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
 * client and prompts stay editable here. AI_MODE=openai mints against
 * OpenAI directly; AI_MODE=gateway mints through the platform's AI gateway
 * (same request shape — the endpoint switch lives in OpenAiApiWrapper).
 *
 * AI_MODE=local returns a simulated session instead (marked by
 * AI_VOICE_SIMULATED_SECRET): real speech needs the real model, so clients
 * run a scripted push-to-talk exchange against the same store/component
 * plumbing — the sandbox is never refused, mirroring the chat simulation.
 */
class AiVoiceService {
    async createVoiceSession(): Promise<OpenAiRealtimeClientSecret> {
        if (validatedEnv().AI_MODE === "local") {
            return {
                clientSecret: AI_VOICE_SIMULATED_SECRET,
                expiresAtSeconds: Math.floor(Date.now() / 1000) + SIMULATED_SESSION_TTL_SECONDS,
                model: AI_VOICE_MODEL,
                voice: AI_VOICE_VOICE,
            }
        }
        return await getOpenAiWrapper().createRealtimeClientSecret({
            model: AI_VOICE_MODEL,
            voice: AI_VOICE_VOICE,
            instructions: AI_VOICE_INSTRUCTIONS,
        })
    }
}

export const aiVoiceService = new AiVoiceService()
