import React from "react"
import { useAiVoiceTurn } from "../../Ai/useAiVoiceTurn"
import * as styles from "./AgentDeskPage.styles.css"

export default function AgentVoicePanel(): React.ReactElement {
    const voice = useAiVoiceTurn()
    const label = voice.holding ? "Release" : voice.busy ? "…" : "Hold"

    return (
        <div className={styles.voiceStage}>
            <button
                type="button"
                className={`${styles.orb} ${voice.holding ? styles.orbHolding : ""}`}
                disabled={voice.busy}
                aria-pressed={voice.holding}
                aria-label="Hold to talk"
                onPointerDown={(event) => {
                    event.preventDefault()
                    voice.startHold()
                }}
                onPointerUp={voice.endHold}
                onPointerCancel={voice.endHold}
                onPointerLeave={() => {
                    if (voice.holding) voice.endHold()
                }}
            >
                {label}
            </button>
            <p className={styles.voiceHint}>
                Hold the orb and talk. The agent hears you, reads the chart, and answers out loud. In the
                sandbox the reply uses this browser; on deploy it is ElevenLabs.
            </p>
            {voice.errorMessage !== undefined ? (
                <p className={styles.errorText} role="alert">
                    {voice.errorMessage}
                </p>
            ) : null}
            {voice.turns.length > 0 ? (
                <div className={styles.transcript}>
                    {voice.turns.map((turn) => (
                        <div key={turn.id} className={styles.bubble}>
                            <span className={styles.bubbleLabel}>You</span>
                            {turn.userTranscript}
                            <span className={styles.bubbleLabel} style={{ marginTop: "0.7rem" }}>
                                Agent
                            </span>
                            {turn.assistantText}
                        </div>
                    ))}
                </div>
            ) : null}
            {voice.turns.length > 0 ? (
                <button type="button" className={styles.ghostButton} onClick={voice.reset}>
                    Clear
                </button>
            ) : null}
        </div>
    )
}
