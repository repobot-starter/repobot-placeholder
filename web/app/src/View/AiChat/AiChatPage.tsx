import { AiChatThread, darkTheme } from "@ui"
import React from "react"
import { useAiChat } from "../../Ai/useAiChat"
import * as styles from "./AiChatPage.styles.css"

const SUGGESTIONS = ["What can you do?", "What time is it in Tokyo?", "Explain this starter in three bullets"]

/**
 * The chat pack's home surface: a thin binder (like LoginPage + AuthCard)
 * that plugs the useAiChat stream into the design system's AiChatThread.
 * In the sandbox the assistant is simulated (AI_MODE=local, no key, no
 * cost); deployed with an OpenAI key it is the real model with the same
 * protocol. See packs/chat/PACK.md and docs/ai.md.
 */
export default function AiChatPage(): React.ReactElement {
    const chat = useAiChat()

    return (
        <main className={`${darkTheme} ${styles.page}`}>
            <header className={styles.header}>
                <div className={styles.wordmark}>
                    <span className={styles.wordmarkDot} aria-hidden="true" />
                    ChatBot
                </div>
                {chat.responses.length > 0 && (
                    <button type="button" className={styles.headerButton} onClick={chat.reset}>
                        New chat
                    </button>
                )}
            </header>
            <AiChatThread
                responses={chat.responses}
                streaming={chat.streaming}
                errorMessage={chat.errorMessage}
                onSubmit={chat.submit}
                onStop={chat.stop}
                emptyTitle="Ask me anything"
                emptyHint={
                    "An AI assistant with streaming answers, visible reasoning, and a real " +
                    "tool call — simulated for free in the sandbox, the real model when deployed."
                }
                suggestions={SUGGESTIONS}
            />
        </main>
    )
}
