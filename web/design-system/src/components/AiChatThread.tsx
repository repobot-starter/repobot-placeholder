import React, { useEffect, useRef, useState } from "react"
import * as styles from "./AiChatThread.styles.css"

/**
 * The reusable AI chat surface: the message thread (user messages, the
 * assistant's visible machinery — reasoning summaries and tool calls — and
 * the answer segments) plus the composer with send/stop. Purely
 * presentational: the stream itself lives in web/core (useAiChat in the app
 * binds the two), so this component renders in Storybook with mock data and
 * can back any template that needs an assistant.
 *
 * The types below mirror web/core's AiChatTypes (which mirror the server's
 * wire protocol); they are kept structural so the design system stays
 * dependency-free — core's AiChatResponse satisfies AiChatThreadResponse
 * without mapping.
 */
export type AiChatThreadStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

export type AiChatThreadSegmentFormat = "TITLE" | "PARAGRAPH" | "LIST_ITEM" | "CODE" | "QUOTE"

export interface AiChatThreadSegment {
    format: AiChatThreadSegmentFormat
    content: string
}

export interface AiChatThreadFunctionCall {
    id: string
    name: string
    arguments: string
    output?: string
    status: AiChatThreadStatus
}

export interface AiChatThreadReasoningSummary {
    id: string
    message: AiChatThreadSegment[]
    status: AiChatThreadStatus
}

export interface AiChatThreadAssistantMessage {
    message: AiChatThreadSegment[]
    status: AiChatThreadStatus
}

export interface AiChatThreadResponseItem {
    functionCall?: AiChatThreadFunctionCall
    reasoningSummary?: AiChatThreadReasoningSummary
    elapsedSeconds?: number
}

export interface AiChatThreadResponse {
    requestId: string
    requestMessage: string
    responseId?: string
    responseItems: AiChatThreadResponseItem[]
    assistantMessage?: AiChatThreadAssistantMessage
}

export interface AiChatThreadProps {
    /** One entry per exchange, upserted in place while it streams. */
    responses: AiChatThreadResponse[]
    /** True while a response is streaming; swaps Send for Stop. */
    streaming: boolean
    errorMessage?: string
    onSubmit: (message: string) => void
    /** Aborts the in-flight stream, keeping what has arrived so far. */
    onStop: () => void
    /** Empty-state heading shown before the first message. */
    emptyTitle?: string
    emptyHint?: string
    /** Empty-state suggestion chips; clicking one submits it. */
    suggestions?: string[]
    placeholder?: string
    className?: string
}

/**
 * Fills its container (give the parent a fixed height, e.g. a flex column
 * page shell): the thread scrolls, the composer stays pinned at the bottom.
 */
export function AiChatThread(props: AiChatThreadProps): React.ReactElement {
    const [draft, setDraft] = useState("")
    const threadRef = useRef<HTMLDivElement>(null)

    // Keep the newest tokens in view while streaming.
    useEffect(() => {
        const thread = threadRef.current
        if (thread !== null) {
            thread.scrollTop = thread.scrollHeight
        }
    }, [props.responses])

    const submitDraft = (): void => {
        if (props.streaming || draft.trim() === "") {
            return
        }
        props.onSubmit(draft)
        setDraft("")
    }

    return (
        <div className={`${styles.root} ${props.className ?? ""}`}>
            {props.responses.length === 0 ? (
                <div className={styles.emptyState}>
                    <h1 className={styles.emptyTitle}>{props.emptyTitle ?? "Ask me anything"}</h1>
                    {props.emptyHint !== undefined && <p className={styles.emptyHint}>{props.emptyHint}</p>}
                    {props.suggestions !== undefined && props.suggestions.length > 0 && (
                        <div className={styles.suggestions}>
                            {props.suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    className={styles.suggestion}
                                    onClick={() => props.onSubmit(suggestion)}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.thread} ref={threadRef}>
                    <div className={styles.threadColumn}>
                        {props.responses.map((response) => (
                            <AiChatExchange key={response.requestId} response={response} />
                        ))}
                        {props.errorMessage !== undefined && (
                            <p className={styles.errorLine}>{props.errorMessage}</p>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.composerBar}>
                <form
                    className={styles.composer}
                    onSubmit={(event) => {
                        event.preventDefault()
                        submitDraft()
                    }}
                >
                    <textarea
                        className={styles.composerInput}
                        value={draft}
                        placeholder={props.placeholder ?? "Message the assistant…"}
                        rows={1}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault()
                                submitDraft()
                            }
                        }}
                    />
                    {props.streaming ? (
                        <button type="button" className={styles.stopButton} onClick={props.onStop}>
                            Stop
                        </button>
                    ) : (
                        <button type="submit" className={styles.sendButton} disabled={draft.trim() === ""}>
                            Send
                        </button>
                    )}
                </form>
                <p className={styles.composerHint}>Enter to send · Shift+Enter for a new line</p>
            </div>
        </div>
    )
}

/**
 * Renders one exchange: the user's message, the assistant's machinery
 * (reasoning summaries and tool calls as it works), and the answer segments.
 */
export function AiChatExchange(props: { response: AiChatThreadResponse }): React.ReactElement {
    const { response } = props
    const assistantStreaming = response.assistantMessage?.status === "IN_PROGRESS"

    return (
        <>
            <div className={styles.userMessage}>{response.requestMessage}</div>
            <div className={styles.assistantBlock}>
                {response.responseItems.map((item, index) => (
                    <React.Fragment key={item.reasoningSummary?.id ?? item.functionCall?.id ?? index}>
                        {item.reasoningSummary !== undefined && (
                            <ReasoningSummaryItem
                                summary={item.reasoningSummary}
                                elapsedSeconds={item.elapsedSeconds}
                            />
                        )}
                        {item.functionCall !== undefined && (
                            <FunctionCallItem
                                functionCall={item.functionCall}
                                elapsedSeconds={item.elapsedSeconds}
                            />
                        )}
                    </React.Fragment>
                ))}
                {response.assistantMessage !== undefined && (
                    <AssistantSegments
                        segments={response.assistantMessage.message}
                        streaming={assistantStreaming}
                    />
                )}
            </div>
        </>
    )
}

function ReasoningSummaryItem(props: {
    summary: AiChatThreadReasoningSummary
    elapsedSeconds?: number
}): React.ReactElement {
    const { summary, elapsedSeconds } = props
    const text = summary.message.map((segment) => segment.content).join(" ")
    return (
        <div className={styles.machineryItem}>
            <div className={styles.machineryLabel}>
                {summary.status === "IN_PROGRESS" && <span className={styles.machineryActiveDot} />}
                Thinking
                {elapsedSeconds !== undefined && elapsedSeconds > 0 && ` · ${elapsedSeconds}s`}
            </div>
            <div className={styles.machineryText}>{text}</div>
        </div>
    )
}

function FunctionCallItem(props: {
    functionCall: AiChatThreadFunctionCall
    elapsedSeconds?: number
}): React.ReactElement {
    const { functionCall, elapsedSeconds } = props
    return (
        <div className={styles.machineryItem}>
            <div className={styles.machineryLabel}>
                {functionCall.status === "IN_PROGRESS" && <span className={styles.machineryActiveDot} />}
                Tool
                {elapsedSeconds !== undefined && elapsedSeconds > 0 && ` · ${elapsedSeconds}s`}
            </div>
            <div className={styles.machineryText}>
                <span className={styles.toolName}>{functionCall.name}</span>
                {functionCall.output !== undefined ? " → done" : " running…"}
            </div>
        </div>
    )
}

function AssistantSegments(props: {
    segments: AiChatThreadSegment[]
    streaming: boolean
}): React.ReactElement {
    const { segments, streaming } = props
    const rendered: React.ReactElement[] = []
    // Consecutive LIST_ITEM segments render as one list.
    let listBuffer: string[] = []
    const flushList = (key: string): void => {
        if (listBuffer.length === 0) {
            return
        }
        rendered.push(
            <ul key={key} className={styles.segmentList}>
                {listBuffer.map((item, index) => (
                    <li key={index} className={styles.segmentListItem}>
                        {item}
                    </li>
                ))}
            </ul>,
        )
        listBuffer = []
    }

    segments.forEach((segment, index) => {
        const key = `segment-${index}`
        if (segment.format === "LIST_ITEM") {
            listBuffer.push(segment.content)
            return
        }
        flushList(`${key}-list`)
        switch (segment.format) {
            case "TITLE":
                rendered.push(
                    <h2 key={key} className={styles.segmentTitle}>
                        {segment.content}
                    </h2>,
                )
                break
            case "CODE":
                rendered.push(
                    <pre key={key} className={styles.segmentCode}>
                        {segment.content}
                    </pre>,
                )
                break
            case "QUOTE":
                rendered.push(
                    <blockquote key={key} className={styles.segmentQuote}>
                        {segment.content}
                    </blockquote>,
                )
                break
            default:
                rendered.push(
                    <p key={key} className={styles.segmentParagraph}>
                        {segment.content}
                        {streaming && index === segments.length - 1 && (
                            <span className={styles.streamingCaret} aria-hidden="true" />
                        )}
                    </p>,
                )
                break
        }
    })
    flushList("segment-final-list")

    return <>{rendered}</>
}
