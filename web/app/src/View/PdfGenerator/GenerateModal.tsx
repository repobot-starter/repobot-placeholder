import React, { useEffect, useRef, useState } from "react"
import * as styles from "./PdfGeneratorPage.styles.css"

/**
 * The generation moment, staged: a printed-sheet loader walks through
 * composing → typesetting → rendering while the real POST /generate runs,
 * then lands on a success card with the download. The stages have minimum
 * durations so the reveal feels earned even when the render returns fast;
 * a slow render simply holds the last stage.
 */

export type GenerationState =
    | { kind: "working" }
    | { kind: "success"; fileName: string; url: string }
    | { kind: "error"; message: string }

const STAGES = ["Composing document", "Typesetting pages", "Rendering PDF"]
const STAGE_DEADLINES_MS = [950, 2050, 2950]

interface GenerateModalProps {
    state: GenerationState
    onClose: () => void
    onRetry: () => void
}

export function GenerateModal({ state, onClose, onRetry }: GenerateModalProps): React.ReactElement {
    const cardRef = useRef<HTMLDivElement>(null)
    // 0..2: that stage is active; 3: the choreography has finished.
    const [stage, setStage] = useState(0)

    useEffect(() => {
        const timers = STAGE_DEADLINES_MS.map((delay, index) =>
            window.setTimeout(() => setStage(index + 1), delay),
        )
        return () => timers.forEach((timer) => window.clearTimeout(timer))
    }, [])

    useEffect(() => {
        cardRef.current?.focus()
    }, [])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                onClose()
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [onClose])

    const showError = state.kind === "error"
    const showSuccess = state.kind === "success" && stage >= STAGES.length
    const activeStage = Math.min(stage, STAGES.length - 1)
    const progressPercent = showSuccess ? 100 : 14 + activeStage * 34

    return (
        <div
            className={styles.modalBackdrop}
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose()
                }
            }}
        >
            <div
                ref={cardRef}
                className={styles.modalCard}
                role="dialog"
                aria-modal="true"
                aria-label="PDF generation"
                tabIndex={-1}
            >
                {showError ? (
                    <>
                        <div className={styles.errorBadge} aria-hidden="true">
                            !
                        </div>
                        <h2 className={styles.modalTitle}>The press jammed</h2>
                        <p className={styles.errorMessage}>{state.message}</p>
                        <div className={styles.modalActions}>
                            <button type="button" className={styles.generateCta} onClick={onRetry}>
                                Try again
                            </button>
                            <button type="button" className={styles.ghostButton} onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </>
                ) : showSuccess ? (
                    <>
                        <div className={styles.successBadge} aria-hidden="true">
                            <span className={styles.successCheck} />
                        </div>
                        <h2 className={styles.modalTitle}>Your PDF is ready</h2>
                        <p className={styles.modalSub}>Fresh off the press</p>
                        <span className={styles.fileChip}>{state.fileName}</span>
                        <div className={styles.modalActions}>
                            <a className={styles.downloadButton} href={state.url} download={state.fileName}>
                                Download PDF
                            </a>
                            <button type="button" className={styles.ghostButton} onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.sheet} aria-hidden="true">
                            <span className={styles.sheetLines} />
                            <span className={styles.sheetScan} />
                        </div>
                        <h2 className={styles.modalTitle}>Printing your document</h2>
                        <p className={styles.modalSub}>Hot metal, real pixels</p>
                        <div className={styles.stageList}>
                            {STAGES.map((label, index) => {
                                const done = index < stage
                                const active = index === activeStage && !done
                                return (
                                    <div
                                        key={label}
                                        className={`${styles.stageRow} ${
                                            active ? styles.stageRowActive : done ? styles.stageRowDone : ""
                                        }`}
                                    >
                                        <span
                                            className={`${styles.stageIcon} ${
                                                done
                                                    ? styles.stageIconDone
                                                    : active
                                                      ? styles.stageIconActive
                                                      : ""
                                            }`}
                                        >
                                            {done && <span className={styles.stageCheck} />}
                                        </span>
                                        {label}
                                    </div>
                                )
                            })}
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
