import React from "react"
import * as styles from "./AiTalkPage.styles.css"

/**
 * The talk pack's web landing page. The product itself is the native iOS
 * surface — hold-to-talk voice with OpenAI Realtime — so the web page
 * presents it and explains how the pieces fit. See packs/talk/PACK.md.
 */
export default function AiTalkPage(): React.ReactElement {
    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <span className={styles.headerDot} aria-hidden="true" />
                TalkBot
            </header>

            <section className={styles.hero}>
                <div className={styles.orb} aria-hidden="true">
                    🎙️
                </div>
                <h1 className={styles.title}>Hold a button. Talk to your app.</h1>
                <p className={styles.lede}>
                    TalkBot is a push-to-talk voice assistant: hold to speak, release, and the assistant
                    answers out loud with a live transcript. Speech streams straight to OpenAI Realtime — no
                    wake word, no typing.
                </p>
                <span className={styles.iosBadge}>📱 The voice surface ships in this project's iOS app</span>
            </section>

            <section className={styles.steps}>
                <div className={styles.step}>
                    <span className={styles.stepNumber}>01</span>
                    <h2 className={styles.stepTitle}>Hold to talk</h2>
                    <p className={styles.stepBody}>
                        The iOS app streams mic audio over a WebSocket while the button is held, and commits
                        it when released.
                    </p>
                </div>
                <div className={styles.step}>
                    <span className={styles.stepNumber}>02</span>
                    <h2 className={styles.stepTitle}>The backend brokers</h2>
                    <p className={styles.stepBody}>
                        The app never sees your OpenAI key: the backend mints a short-lived Realtime session
                        secret with the voice and prompt configured server-side.
                    </p>
                </div>
                <div className={styles.step}>
                    <span className={styles.stepNumber}>03</span>
                    <h2 className={styles.stepTitle}>It talks back</h2>
                    <p className={styles.stepBody}>
                        Replies stream back as audio plus a live transcript, and a hold while the assistant is
                        speaking interrupts it — like a real conversation.
                    </p>
                </div>
            </section>

            <footer className={styles.footer}>
                Voice needs a deployed backend with an OpenAI key (or AI_MODE=openai locally). The chat
                starter's simulated sandbox mode does not apply to realtime speech.
            </footer>
        </main>
    )
}
