import { useCallback, useEffect, useRef, useState } from "react"
import { deriveAiChatEndpoint, streamAiChatResponse, AiChatResponse } from "@base/core"

export interface AiChatThreadState {
    /** One entry per exchange, growing in place while it streams. */
    responses: AiChatResponse[]
    /** True from submit until the stream ends or is stopped. */
    streaming: boolean
    errorMessage?: string
    submit: (message: string) => void
    /** Aborts the in-flight stream, keeping what has arrived so far. */
    stop: () => void
    /** Clears the thread and forgets the conversation context. */
    reset: () => void
}

/**
 * The chat thread state machine: submits requests, upserts streamed response
 * snapshots, and chains conversation context by passing the last turn's
 * responseId as the next turn's previousResponseId (the server is stateless).
 * The transport lives in @base/core (web/core/src/Ai/); this hook binds it to
 * React state and the app's environment.
 */
export function useAiChat(): AiChatThreadState {
    const [responses, setResponses] = useState<AiChatResponse[]>([])
    const [streaming, setStreaming] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
    const abortRef = useRef<AbortController | undefined>(undefined)
    const previousResponseIdRef = useRef<string | undefined>(undefined)

    useEffect(() => {
        return () => abortRef.current?.abort()
    }, [])

    const submit = useCallback((message: string) => {
        const trimmed = message.trim()
        if (trimmed === "" || abortRef.current !== undefined) {
            return
        }
        const requestId = crypto.randomUUID()
        setErrorMessage(undefined)
        setStreaming(true)
        setResponses((current) => [...current, { requestId, requestMessage: trimmed, responseItems: [] }])

        const abortController = new AbortController()
        abortRef.current = abortController
        void streamAiChatResponse(
            deriveAiChatEndpoint(import.meta.env.VITE_GRAPHQL_URL),
            { id: requestId, message: trimmed, previousResponseId: previousResponseIdRef.current },
            abortController.signal,
            {
                onResponse: (response) => {
                    if (response.responseId !== undefined) {
                        previousResponseIdRef.current = response.responseId
                    }
                    setResponses((current) =>
                        current.map((candidate) =>
                            candidate.requestId === response.requestId ? response : candidate,
                        ),
                    )
                },
                onError: (message) => {
                    setErrorMessage(message)
                },
                onComplete: () => {
                    abortRef.current = undefined
                    setStreaming(false)
                },
            },
        )
    }, [])

    const stop = useCallback(() => {
        abortRef.current?.abort()
        abortRef.current = undefined
        setStreaming(false)
    }, [])

    const reset = useCallback(() => {
        stop()
        previousResponseIdRef.current = undefined
        setResponses([])
        setErrorMessage(undefined)
    }, [stop])

    return { responses, streaming, errorMessage, submit, stop, reset }
}
