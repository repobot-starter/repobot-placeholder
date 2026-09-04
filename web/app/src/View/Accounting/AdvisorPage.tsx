import { AiChatThread } from "@ui"
import React from "react"
import { useAiChat } from "../../Ai/useAiChat"
import * as styles from "./AdvisorPage.styles.css"

/**
 * The accounting pack's AI advisor (manifest destination `/advisor`,
 * packs/accounting): the kernel chat surface (AiChatThread over useAiChat,
 * docs/ai.md) inside the dashboard shell. The assistant reaches the
 * connected QuickBooks company through its quickbooks_* tools
 * (AiChatTools.ts), so it can answer with real numbers. In the sandbox the
 * assistant is simulated (AI_MODE=local); deployed with an OpenAI key it is
 * the real model with the same protocol.
 */

const SUGGESTIONS = [
    "How is revenue looking?",
    "Which invoices are overdue?",
    "Who are my biggest customers?",
]

export default function AdvisorPage(): React.ReactElement {
    const chat = useAiChat()

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Advisor</h1>
                    <p className={styles.subtitle}>
                        Ask about your books — the advisor reads your QuickBooks data through its tools.
                    </p>
                </div>
                {chat.responses.length > 0 && (
                    <button type="button" className={styles.newChatButton} onClick={chat.reset}>
                        New chat
                    </button>
                )}
            </header>
            <div className={styles.threadWrap}>
                <AiChatThread
                    responses={chat.responses}
                    streaming={chat.streaming}
                    errorMessage={chat.errorMessage}
                    onSubmit={chat.submit}
                    onStop={chat.stop}
                    emptyTitle="Ask about your books"
                    emptyHint={
                        "The advisor answers with your QuickBooks numbers — revenue, unpaid " +
                        "invoices, customers — via tool calls you can watch run."
                    }
                    suggestions={SUGGESTIONS}
                />
            </div>
        </section>
    )
}
