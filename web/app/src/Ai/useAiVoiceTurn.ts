import { useCallback, useEffect, useRef, useState } from "react"
import { deriveAiVoiceTurnEndpoint, runAiVoiceTurn, type AiVoiceTurnResponse } from "@base/core"

export interface VoiceTurn {
    id: string
    userTranscript: string
    assistantText: string
}

export interface AiVoiceTurnState {
    turns: VoiceTurn[]
    busy: boolean
    holding: boolean
    errorMessage?: string
    startHold: () => void
    endHold: () => void
    reset: () => void
}

/**
 * Hold-to-talk state machine for the agent desk's Voice tab. Captures
 * microphone audio while held, POSTs a voice turn, plays ElevenLabs audio
 * when present, and falls back to the browser's speech synthesis in local
 * mode (empty audio).
 */
export function useAiVoiceTurn(): AiVoiceTurnState {
    const [turns, setTurns] = useState<VoiceTurn[]>([])
    const [busy, setBusy] = useState(false)
    const [holding, setHolding] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const previousResponseIdRef = useRef<string | undefined>(undefined)
    const mediaRef = useRef<MediaRecorder | undefined>(undefined)
    const chunksRef = useRef<Blob[]>([])
    const streamRef = useRef<MediaStream | undefined>(undefined)
    const abortRef = useRef<AbortController | undefined>(undefined)

    useEffect(() => {
        return () => {
            abortRef.current?.abort()
            stopStream()
        }
    }, [])

    const startHold = useCallback(() => {
        if (busy) return
        setErrorMessage(undefined)
        void beginRecording()
    }, [busy])

    const endHold = useCallback(() => {
        const recorder = mediaRef.current
        if (recorder !== undefined && recorder.state === "recording") {
            recorder.stop()
        } else {
            setHolding(false)
        }
    }, [])

    const reset = useCallback(() => {
        abortRef.current?.abort()
        previousResponseIdRef.current = undefined
        setTurns([])
        setErrorMessage(undefined)
    }, [])

    async function beginRecording(): Promise<void> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream
            const recorder = new MediaRecorder(stream)
            chunksRef.current = []
            recorder.addEventListener("dataavailable", (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data)
            })
            recorder.addEventListener("stop", () => {
                setHolding(false)
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
                stopStream()
                void submitTurn(blob)
            })
            mediaRef.current = recorder
            recorder.start()
            setHolding(true)
        } catch (error) {
            setHolding(false)
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Microphone access is needed to talk. You can still type on the Agent tab.",
            )
        }
    }

    async function submitTurn(blob: Blob): Promise<void> {
        setBusy(true)
        abortRef.current?.abort()
        const abort = new AbortController()
        abortRef.current = abort
        try {
            const audioBase64 = await blobToBase64(blob)
            const result: AiVoiceTurnResponse = await runAiVoiceTurn(
                deriveAiVoiceTurnEndpoint(import.meta.env.VITE_GRAPHQL_URL),
                {
                    id: crypto.randomUUID(),
                    audioBase64,
                    mimeType: blob.type || "audio/webm",
                    previousResponseId: previousResponseIdRef.current,
                },
                abort.signal,
            )
            previousResponseIdRef.current = result.responseId
            setTurns((current) => [
                ...current,
                {
                    id: result.requestId,
                    userTranscript: result.userTranscript,
                    assistantText: result.assistantText,
                },
            ])
            await speak(result)
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") return
            setErrorMessage(error instanceof Error ? error.message : "The voice turn failed.")
        } finally {
            setBusy(false)
        }
    }

    function stopStream(): void {
        streamRef.current?.getTracks().forEach((track) => track.stop())
        streamRef.current = undefined
        mediaRef.current = undefined
    }

    return { turns, busy, holding, errorMessage, startHold, endHold, reset }
}

async function speak(result: AiVoiceTurnResponse): Promise<void> {
    if (result.audioBase64 !== undefined && result.audioBase64 !== "") {
        const bytes = Uint8Array.from(atob(result.audioBase64), (char) => char.charCodeAt(0))
        const blob = new Blob([bytes], { type: result.audioMimeType ?? "audio/mpeg" })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        try {
            await audio.play()
        } finally {
            audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true })
        }
        return
    }
    if (result.assistantText !== "" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(result.assistantText)
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
    }
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            const value = reader.result
            if (typeof value !== "string") {
                reject(new Error("Could not read the recording."))
                return
            }
            const comma = value.indexOf(",")
            resolve(comma >= 0 ? value.slice(comma + 1) : value)
        }
        reader.onerror = () => reject(new Error("Could not read the recording."))
        reader.readAsDataURL(blob)
    })
}
