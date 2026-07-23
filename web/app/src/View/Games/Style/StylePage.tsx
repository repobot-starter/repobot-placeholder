import React, { useEffect, useRef, useState } from "react"
import DressUpStage from "./DressUpStage"
import { sounds } from "./audio"
import {
    BEST_SCORE_KEY,
    MAX_ROUND_SCORE,
    ROUNDS_PER_SEASON,
    ROUND_SECONDS,
    RoundScore,
    SLOTS,
    SlotId,
    Theme,
    WardrobeItem,
    emptyOutfit,
    randomOutfit,
    scoreOutfit,
    shuffledThemes,
} from "./wardrobe"
import * as styles from "./StylePage.styles.css"

/** How long the runway strut lasts before the verdict card appears. */
const WALK_DURATION_MS = 2600
/** Countdown ticks are audible from this many seconds left. */
const TICK_FROM_SECONDS = 10
/** Round scores at or above this earn applause. */
const APPLAUSE_SCORE = 100

type Phase = "idle" | "dressing" | "walking" | "verdict" | "seasonOver"

interface Verdict {
    score: RoundScore
    line: string
}

function readBestScore(): number {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0
}

/** Home surface for the `style` pack: dress a model against the clock, then face the runway judges. */
export default function StylePage(): React.ReactElement {
    const [phase, setPhase] = useState<Phase>("idle")
    const [themes, setThemes] = useState<Theme[]>([])
    const [round, setRound] = useState(0)
    const [outfit, setOutfit] = useState(emptyOutfit)
    const [activeSlot, setActiveSlot] = useState<SlotId>("hat")
    const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
    const [soundOn, setSoundOn] = useState(true)
    const [roundScores, setRoundScores] = useState<number[]>([])
    const [verdict, setVerdict] = useState<Verdict | null>(null)
    const [bestScore, setBestScore] = useState(readBestScore)

    const theme = themes[round] ?? null
    const seasonTotal = roundScores.reduce((sum, score) => sum + score, 0)

    const startSeason = (): void => {
        setThemes(shuffledThemes())
        setRound(0)
        setRoundScores([])
        setOutfit(emptyOutfit())
        setActiveSlot("hat")
        setSecondsLeft(ROUND_SECONDS)
        setVerdict(null)
        setPhase("dressing")
    }

    // Ends the dressing phase: locks in the score and sends the model down
    // the runway. Called by the Done! button and by the timer hitting zero.
    const finishRound = (): void => {
        if (phase !== "dressing" || !theme) {
            return
        }
        const score = scoreOutfit(outfit, theme)
        const line = theme.verdicts[Math.floor(Math.random() * theme.verdicts.length)]
        setVerdict({ score, line })
        setRoundScores((scores) => [...scores, score.total])
        setPhase("walking")
    }

    // Flips the walk into the verdict reveal, with sparkles and (for a great
    // score) applause.
    const revealVerdict = (): void => {
        setPhase("verdict")
        if (soundOn) {
            sounds.sparkle()
            if (verdict && verdict.score.total >= APPLAUSE_SCORE) {
                sounds.applause()
            }
        }
    }

    const dismissVerdict = (): void => {
        if (round + 1 >= ROUNDS_PER_SEASON) {
            if (seasonTotal > bestScore) {
                setBestScore(seasonTotal)
                localStorage.setItem(BEST_SCORE_KEY, String(seasonTotal))
            }
            setPhase("seasonOver")
        } else {
            setRound(round + 1)
            setOutfit(emptyOutfit())
            setActiveSlot("hat")
            setSecondsLeft(ROUND_SECONDS)
            setVerdict(null)
            setPhase("dressing")
        }
    }

    // Effects read the latest handlers through a ref (like Pong's settingsRef)
    // so their dependency lists stay minimal.
    const actionsRef = useRef({ finishRound, revealVerdict })
    actionsRef.current = { finishRound, revealVerdict }

    useEffect(() => {
        if (phase !== "dressing") {
            return
        }
        const interval = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
        return () => clearInterval(interval)
    }, [phase])

    useEffect(() => {
        if (phase === "dressing" && secondsLeft > 0 && secondsLeft <= TICK_FROM_SECONDS && soundOn) {
            sounds.tick()
        }
    }, [phase, secondsLeft, soundOn])

    useEffect(() => {
        if (phase === "dressing" && secondsLeft === 0) {
            actionsRef.current.finishRound()
        }
    }, [phase, secondsLeft])

    useEffect(() => {
        if (phase !== "walking") {
            return
        }
        const timeout = setTimeout(() => actionsRef.current.revealVerdict(), WALK_DURATION_MS)
        return () => clearTimeout(timeout)
    }, [phase])

    const pickItem = (item: WardrobeItem): void => {
        if (phase !== "dressing") {
            return
        }
        setOutfit((current) => ({
            ...current,
            [activeSlot]: current[activeSlot]?.id === item.id ? null : item,
        }))
        if (soundOn) {
            sounds.pick()
        }
    }

    const shuffle = (): void => {
        setOutfit(randomOutfit())
        if (soundOn) {
            sounds.pick()
        }
    }

    const dressing = phase === "dressing"
    const activeSlotData = SLOTS.find((slot) => slot.id === activeSlot) ?? SLOTS[0]
    const timerLabel = `⏱ 0:${String(secondsLeft).padStart(2, "0")}`
    const statusLabel =
        phase === "idle"
            ? "BACKSTAGE."
            : phase === "dressing"
              ? "DRESSING."
              : phase === "walking"
                ? "ON THE RUNWAY."
                : phase === "verdict"
                  ? "JUDGES DECIDING."
                  : "SEASON OVER."

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>🤖 StyleBot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={startSeason}>
                        ⟳ New Season
                    </button>
                    <button className={styles.chunkyGold} onClick={finishRound} disabled={!dressing}>
                        ✔ Done!
                    </button>
                    <button
                        className={soundOn ? styles.chunkyLit : styles.chunky}
                        onClick={() => setSoundOn((value) => !value)}
                    >
                        {soundOn ? "🔊 Sound" : "🔇 Sound"}
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={styles.roundBadge}>
                        {phase === "idle" ? "ROUND —" : `ROUND ${round + 1}/${ROUNDS_PER_SEASON}`}
                    </span>
                    <span
                        className={
                            dressing && secondsLeft <= TICK_FROM_SECONDS
                                ? styles.timerChipUrgent
                                : styles.timerChip
                        }
                    >
                        {timerLabel}
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Tonight&apos;s Theme</header>
                            {theme ? (
                                <div className={styles.themeCard}>
                                    <div className={styles.themeEmoji}>{theme.emoji}</div>
                                    <div className={styles.themeName}>{theme.name}</div>
                                    <div className={styles.themeHint}>
                                        Pick one item per slot that fits the theme!
                                    </div>
                                </div>
                            ) : (
                                <p className={styles.muted}>Start a season to reveal the theme.</p>
                            )}
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Season Score</header>
                            <dl className={styles.stats}>
                                {roundScores.map((score, index) => (
                                    <div key={index}>
                                        <dt>Round {index + 1}</dt>
                                        <dd>{score}</dd>
                                    </div>
                                ))}
                                <div>
                                    <dt>💎 Total</dt>
                                    <dd>{seasonTotal}</dd>
                                </div>
                                <div>
                                    <dt>🏆 Best</dt>
                                    <dd>{bestScore}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className={styles.panelBrand}>
                            <div className={styles.brandName}>STYLEBOT</div>
                            <div className={styles.brandTag}>Serve looks. Beat the clock. 💅</div>
                        </section>
                    </aside>

                    <main className={styles.stageArea}>
                        <div className={styles.stageWrap}>
                            <DressUpStage outfit={outfit} walking={phase === "walking"} />

                            {phase === "idle" && (
                                <div className={styles.stageOverlay}>
                                    <div className={styles.verdictCard}>
                                        <div className={styles.overlayTitle}>✨ STYLEBOT ✨</div>
                                        <div className={styles.verdictLine}>
                                            {ROUNDS_PER_SEASON} rounds. {ROUND_SECONDS} seconds each. Dress to
                                            impress the judges!
                                        </div>
                                        <button className={styles.chunkyLit} onClick={startSeason}>
                                            💃 Start Season
                                        </button>
                                    </div>
                                </div>
                            )}

                            {phase === "verdict" && verdict && (
                                <div className={styles.stageOverlay}>
                                    <div className={styles.verdictCard}>
                                        <div className={styles.verdictStars}>
                                            {"★".repeat(verdict.score.stars)}
                                            {"☆".repeat(5 - verdict.score.stars)}
                                        </div>
                                        <div className={styles.verdictScore}>+{verdict.score.total} pts</div>
                                        <div className={styles.verdictLine}>“{verdict.line}”</div>
                                        <div className={styles.verdictDetail}>
                                            {verdict.score.matches}/5 on-theme
                                            {verdict.score.fullMatch && " · full-theme bonus!"}
                                            {verdict.score.complete && " · complete outfit"}
                                        </div>
                                        <button className={styles.chunkyLit} onClick={dismissVerdict}>
                                            {round + 1 >= ROUNDS_PER_SEASON
                                                ? "🏁 Finish Season"
                                                : "▶ Next Round"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {phase === "seasonOver" && (
                                <div className={styles.stageOverlay}>
                                    <div className={styles.verdictCard}>
                                        <div className={styles.overlayTitle}>SEASON OVER</div>
                                        <div className={styles.verdictScore}>{seasonTotal} pts</div>
                                        <div className={styles.verdictLine}>
                                            {seasonTotal >= bestScore && seasonTotal > 0
                                                ? "🌟 New best score!"
                                                : `Best season: ${bestScore} pts`}
                                        </div>
                                        <button className={styles.chunkyLit} onClick={startSeason}>
                                            ⟳ New Season
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>

                    <aside className={styles.closet}>
                        <header className={styles.panelHeader}>Closet</header>
                        <div className={styles.slotTabs}>
                            {SLOTS.map((slot) => (
                                <button
                                    key={slot.id}
                                    className={slot.id === activeSlot ? styles.slotTabActive : styles.slotTab}
                                    onClick={() => setActiveSlot(slot.id)}
                                    title={slot.label}
                                >
                                    {slot.icon}
                                </button>
                            ))}
                        </div>
                        <div className={styles.closetLabel}>{activeSlotData.label}</div>
                        <div className={styles.itemGrid}>
                            {activeSlotData.items.map((item) => (
                                <button
                                    key={item.id}
                                    className={
                                        outfit[activeSlot]?.id === item.id
                                            ? styles.itemButtonSelected
                                            : styles.itemButton
                                    }
                                    onClick={() => pickItem(item)}
                                    disabled={!dressing}
                                >
                                    <span className={styles.itemEmoji}>{item.emoji}</span>
                                    <span className={styles.itemName}>{item.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className={styles.closetActions}>
                            <button className={styles.chunky} onClick={shuffle} disabled={!dressing}>
                                🎲 Shuffle
                            </button>
                            <button
                                className={styles.chunky}
                                onClick={() => setOutfit(emptyOutfit())}
                                disabled={!dressing}
                            >
                                🧺 Clear
                            </button>
                        </div>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>● {statusLabel}</span>
                    <span>{theme ? `THEME: ${theme.name.toUpperCase()}` : "PRESS NEW SEASON"}</span>
                    <span>MAX {MAX_ROUND_SCORE} PTS / ROUND</span>
                </div>
            </div>
        </div>
    )
}
