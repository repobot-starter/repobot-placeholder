import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1"

export interface ElevenLabsSpeechToTextRequest {
    audio: Buffer
    mimeType: string
    fileName: string
}

export interface ElevenLabsSpeechToTextResult {
    text: string
}

export interface ElevenLabsTextToSpeechRequest {
    text: string
    voiceId: string
    modelId: string
}

export interface ElevenLabsTextToSpeechResult {
    audio: Buffer
    mimeType: string
}

/**
 * The ElevenLabs client the voice-turn path calls. Constructed once; tests
 * replace it with a fake via setElevenLabsWrapperForTests.
 */
export interface ElevenLabsWrapper {
    speechToText(request: ElevenLabsSpeechToTextRequest): Promise<ElevenLabsSpeechToTextResult>
    textToSpeech(request: ElevenLabsTextToSpeechRequest): Promise<ElevenLabsTextToSpeechResult>
}

let wrapper: ElevenLabsWrapper | undefined

export function getElevenLabsWrapper(): ElevenLabsWrapper {
    wrapper ??= new ElevenLabsApiWrapper()
    return wrapper
}

export function setElevenLabsWrapperForTests(next: ElevenLabsWrapper | undefined): void {
    wrapper = next
}

/**
 * Real ElevenLabs (or the platform AI gateway's ElevenLabs proxy). The
 * protocol is identical in both real modes; the endpoint and auth header
 * are the only difference:
 *
 * - ELEVENLABS_MODE=elevenlabs: api.elevenlabs.io with xi-api-key
 * - ELEVENLABS_MODE=gateway: AI_GATEWAY_URL /speech-to-text and
 *   /text-to-speech with the per-environment bearer token
 */
class ElevenLabsApiWrapper implements ElevenLabsWrapper {
    async speechToText(request: ElevenLabsSpeechToTextRequest): Promise<ElevenLabsSpeechToTextResult> {
        const endpoint = resolveEndpoint()
        const body = new FormData()
        body.append("model_id", "scribe_v1")
        body.append("file", new Blob([request.audio], { type: request.mimeType }), request.fileName)
        const response = await fetch(`${endpoint.baseUrl}${endpoint.speechToTextPath}`, {
            method: "POST",
            headers: sttHeaders(endpoint),
            body,
        })
        if (!response.ok) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                `ElevenLabs speech-to-text failed (${response.status}): ${await readError(response)}`,
            )
        }
        const payload = (await response.json()) as { text?: unknown }
        const text = typeof payload.text === "string" ? payload.text.trim() : ""
        if (text === "") {
            throw new RpcError("INVALID_ARGUMENT", "ElevenLabs heard no speech in that recording.")
        }
        return { text }
    }

    async textToSpeech(request: ElevenLabsTextToSpeechRequest): Promise<ElevenLabsTextToSpeechResult> {
        const endpoint = resolveEndpoint()
        const response = await fetch(`${endpoint.baseUrl}${endpoint.textToSpeechPath(request.voiceId)}`, {
            method: "POST",
            headers: {
                ...endpoint.headers,
                accept: "audio/mpeg",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                text: request.text,
                model_id: request.modelId,
            }),
        })
        if (!response.ok) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                `ElevenLabs text-to-speech failed (${response.status}): ${await readError(response)}`,
            )
        }
        const audio = Buffer.from(await response.arrayBuffer())
        return { audio, mimeType: "audio/mpeg" }
    }
}

interface ElevenLabsEndpoint {
    baseUrl: string
    headers: Record<string, string>
    speechToTextPath: string
    textToSpeechPath: (voiceId: string) => string
}

function resolveEndpoint(): ElevenLabsEndpoint {
    const env = validatedEnv()
    if (env.ELEVENLABS_MODE === "gateway") {
        const url = env.AI_GATEWAY_URL
        const token = env.AI_GATEWAY_TOKEN
        if (url === undefined || url === "" || token === undefined || token === "") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "ELEVENLABS_MODE=gateway needs AI_GATEWAY_URL and AI_GATEWAY_TOKEN (injected by " +
                    "the platform on deploy). Redeploy the environment, or run locally with " +
                    "ELEVENLABS_MODE=local (simulated voice).",
            )
        }
        return {
            baseUrl: url.replace(/\/+$/, ""),
            headers: { authorization: `Bearer ${token}` },
            speechToTextPath: "/speech-to-text",
            textToSpeechPath: (voiceId) => `/text-to-speech/${encodeURIComponent(voiceId)}`,
        }
    }
    const apiKey = env.ELEVENLABS_API_KEY
    if (apiKey === undefined || apiKey === "") {
        throw new RpcError(
            "FAILED_PRECONDITION",
            "ELEVENLABS_API_KEY is not set. Connect an ElevenLabs key under Integrations and " +
                "redeploy, or run locally with ELEVENLABS_MODE=local (simulated voice).",
        )
    }
    return {
        baseUrl: ELEVENLABS_API_BASE,
        headers: { "xi-api-key": apiKey },
        speechToTextPath: "/speech-to-text",
        textToSpeechPath: (voiceId) => `/text-to-speech/${encodeURIComponent(voiceId)}`,
    }
}

function sttHeaders(endpoint: ElevenLabsEndpoint): Record<string, string> {
    // FormData sets its own content-type (boundary). Only auth rides along.
    return endpoint.headers
}

async function readError(response: Response): Promise<string> {
    try {
        const text = await response.text()
        return text.slice(0, 400) || response.statusText
    } catch {
        return response.statusText
    }
}
