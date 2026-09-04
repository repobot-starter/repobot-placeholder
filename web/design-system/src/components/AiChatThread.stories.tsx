import type { Meta, StoryObj } from "@storybook/react"
import { darkTheme } from "../theme/tokens.css"
import { AiChatThread, AiChatThreadResponse } from "./AiChatThread"

/**
 * Mock thread data covering the full protocol: reasoning summaries, a tool
 * call, and every answer segment format — so the whole surface is stylable
 * in Storybook without a backend (the real stream lives in web/core).
 */
const completedExchange: AiChatThreadResponse = {
    requestId: "req-1",
    requestMessage: "What time is it in Tokyo?",
    responseId: "resp-1",
    responseItems: [
        {
            reasoningSummary: {
                id: "rs-1",
                message: [
                    {
                        format: "PARAGRAPH",
                        content: "The user wants the current time in Tokyo; the clock tool answers that.",
                    },
                ],
                status: "COMPLETED",
            },
            elapsedSeconds: 2,
        },
        {
            functionCall: {
                id: "fc-1",
                name: "get_current_time",
                arguments: '{"timezone":"Asia/Tokyo"}',
                output: '{"formatted":"Friday, July 24, 2026 at 12:04 AM"}',
                status: "COMPLETED",
            },
            elapsedSeconds: 1,
        },
    ],
    assistantMessage: {
        message: [
            { format: "TITLE", content: "Tokyo time" },
            {
                format: "PARAGRAPH",
                content: "It is just past midnight in Tokyo — Friday, July 24 at 12:04 AM (JST).",
            },
            { format: "LIST_ITEM", content: "Tokyo is UTC+9, with no daylight saving." },
            { format: "LIST_ITEM", content: "That's 16 hours ahead of San Francisco." },
            { format: "CODE", content: 'get_current_time({ timezone: "Asia/Tokyo" })' },
            { format: "QUOTE", content: "Ask about any IANA timezone." },
        ],
        status: "COMPLETED",
    },
}

const streamingExchange: AiChatThreadResponse = {
    requestId: "req-2",
    requestMessage: "Explain this starter in three bullets",
    responseItems: [
        {
            reasoningSummary: {
                id: "rs-2",
                message: [{ format: "PARAGRAPH", content: "Summarizing the starter's layers…" }],
                status: "IN_PROGRESS",
            },
            elapsedSeconds: 3,
        },
    ],
    assistantMessage: {
        message: [{ format: "PARAGRAPH", content: "This starter is an AI chat thread that streams" }],
        status: "IN_PROGRESS",
    },
}

const toolRunningExchange: AiChatThreadResponse = {
    requestId: "req-3",
    requestMessage: "What day is it in Sydney?",
    responseItems: [
        {
            functionCall: {
                id: "fc-3",
                name: "get_current_time",
                arguments: '{"timezone":"Australia/Sydney"}',
                status: "IN_PROGRESS",
            },
        },
    ],
}

const stoppedExchange: AiChatThreadResponse = {
    requestId: "req-4",
    requestMessage: "Write a long essay about clocks",
    responseId: "resp-4",
    responseItems: [],
    assistantMessage: {
        message: [
            {
                format: "PARAGRAPH",
                content: "Clocks have shaped how humans coordinate since the first water",
            },
        ],
        status: "CANCELLED",
    },
}

const meta: Meta<typeof AiChatThread> = {
    title: "Components/AiChatThread",
    component: AiChatThread,
    parameters: { layout: "fullscreen" },
    args: {
        streaming: false,
        onSubmit: () => undefined,
        onStop: () => undefined,
    },
    decorators: [
        (Story) => (
            <div className={darkTheme} style={{ height: "100vh", display: "flex" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <Story />
                </div>
            </div>
        ),
    ],
}
export default meta

type Story = StoryObj<typeof AiChatThread>

/** Before the first message: title, hint, and clickable suggestion chips. */
export const Empty: Story = {
    args: {
        responses: [],
        emptyTitle: "Ask me anything",
        emptyHint: "An AI assistant with streaming answers, visible reasoning, and a real tool call.",
        suggestions: ["What can you do?", "What time is it in Tokyo?"],
    },
}

/** A finished exchange exercising every segment format and the tool loop. */
export const CompletedExchange: Story = {
    args: { responses: [completedExchange] },
}

/** Mid-stream: pulsing reasoning, a partial answer with caret, Stop button. */
export const Streaming: Story = {
    args: { responses: [completedExchange, streamingExchange], streaming: true },
}

/** A tool call still running, before any answer text arrives. */
export const ToolRunning: Story = {
    args: { responses: [toolRunningExchange], streaming: true },
}

/** The stream failed; the error renders at the end of the thread. */
export const StreamError: Story = {
    args: {
        responses: [completedExchange],
        errorMessage: "The chat request failed with status 500.",
    },
}

/** Stopped mid-stream: the partial answer is kept, composer is live again. */
export const Stopped: Story = {
    args: { responses: [stoppedExchange] },
}
