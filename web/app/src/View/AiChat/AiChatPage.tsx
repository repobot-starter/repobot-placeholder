import { AiChatThread, AppShell } from "@ui"
import React from "react"
import { useAiChat } from "../../Ai/useAiChat"
import * as styles from "./AiChatPage.styles.css"

const SUGGESTIONS = ["What can you do?", "What time is it in Tokyo?", "Explain this starter in three bullets"]

/** The thread is the whole product — no navigation to offer the shell. */
const NO_NAV_SECTIONS: never[] = []

/** The old wordmark's glowing violet dot, worn as the shell brand mark. */
function ChatBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="10" cy="10" r="4.75" fill="currentColor" />
        </svg>
    )
}

/**
 * The chat pack's home surface: a thin binder (like LoginPage + AuthCard)
 * that plugs the useAiChat stream into the design system's AiChatThread.
 * In the sandbox the assistant is simulated (AI_MODE=local, no key, no
 * cost); deployed with an OpenAI key it is the real model with the same
 * protocol. The chrome is the kernel AppShell in its minimal treatment (a
 * single-screen chat wants no nav rail); the New-chat action rides a page
 * toolbar over the thread. See packs/chat/PACK.md and docs/ai.md.
 */
export default function AiChatPage(): React.ReactElement {
    const chat = useAiChat()

    return (
        <AppShell
            title="ChatBot"
            brandIcon={<ChatBrandIcon />}
            sections={NO_NAV_SECTIONS}
            onItemSelect={() => undefined}
        >
            <div className={styles.page}>
                {chat.responses.length > 0 && (
                    <div className={styles.toolbar}>
                        <button type="button" className={styles.newChatButton} onClick={chat.reset}>
                            New chat
                        </button>
                    </div>
                )}
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
            </div>
        </AppShell>
    )
}
