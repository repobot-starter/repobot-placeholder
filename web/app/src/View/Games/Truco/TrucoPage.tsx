import React, { useEffect, useRef, useState } from "react"
import { Card, nextStake, RAISE_CALL, SUIT_SYMBOL, TrucoEngine, TrucoEvent, WINNING_SCORE } from "./engine"
import * as styles from "./TrucoPage.styles.css"

/** localStorage key the win/loss tally persists under between sessions. */
const STATS_STORAGE_KEY = "trucobot-stats"

// Pacing of the table choreography (ms).
const BOT_THINK_MS = 900
const TRICK_LINGER_MS = 1600
const SPEECH_MS = 2600

interface GameTally {
    games: number
    wins: number
}

function loadTally(): GameTally {
    try {
        const raw = window.localStorage.getItem(STATS_STORAGE_KEY)
        return raw ? (JSON.parse(raw) as GameTally) : { games: 0, wins: 0 }
    } catch {
        return { games: 0, wins: 0 }
    }
}

/**
 * Home surface for the `truco` pack: Truco Paulista on a festive boteco table
 * against a bluffing bot. All rules live in the pure `engine.ts`; this page
 * renders its state, forwards clicks, and owns the timing (bot "thinking"
 * delays, trick-reveal pauses, speech-bubble lifetimes).
 */
export default function TrucoPage(): React.ReactElement {
    // The engine is mutable game state (like Pong's gameRef); `tick` forces a
    // re-render after each engine action. Timers are tracked for cleanup.
    const engineRef = useRef<TrucoEngine | null>(null)
    if (engineRef.current === null) {
        engineRef.current = new TrucoEngine({ bluff: 0.35 })
    }
    const engine = engineRef.current

    const [, setTick] = useState(0)
    const [speech, setSpeech] = useState<string | null>(null)
    const [showLastTrick, setShowLastTrick] = useState(false)
    const [caraDePau, setCaraDePau] = useState(35)
    const [tally, setTally] = useState<GameTally>(loadTally)
    const timersRef = useRef<number[]>([])
    const startedRef = useRef(false)

    useEffect(() => {
        const timers = timersRef.current
        return () => timers.forEach((id) => window.clearTimeout(id))
    }, [])

    useEffect(() => {
        window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(tally))
    }, [tally])

    const schedule = (callback: () => void, delayMs: number): void => {
        timersRef.current.push(window.setTimeout(callback, delayMs))
    }

    /** Applies engine events to the UI and keeps the bot's turn moving. */
    const apply = (events: TrucoEvent[]): void => {
        setTick((value) => value + 1)
        let trickPause = 0
        for (const event of events) {
            if (event.type === "botSpoke") {
                setSpeech(event.line)
                // Only clear if a newer line hasn't replaced this one.
                schedule(() => setSpeech((current) => (current === event.line ? null : current)), SPEECH_MS)
            } else if (event.type === "trickResolved") {
                setShowLastTrick(true)
                trickPause = TRICK_LINGER_MS
                schedule(() => setShowLastTrick(false), TRICK_LINGER_MS)
            } else if (event.type === "gameEnded") {
                setTally((previous) => ({
                    games: previous.games + 1,
                    wins: previous.wins + (event.winner === "player" ? 1 : 0),
                }))
            }
        }
        if (engine.phase === "botTurn") {
            schedule(() => apply(engine.botAct()), trickPause + BOT_THINK_MS)
        }
    }

    // Deal the first hand once on mount.
    useEffect(() => {
        if (!startedRef.current) {
            startedRef.current = true
            apply(engine.newGame())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const newGame = (): void => {
        engine.bluff = caraDePau / 100
        setSpeech(null)
        setShowLastTrick(false)
        apply(engine.newGame())
    }

    const setBluff = (value: number): void => {
        setCaraDePau(value)
        engine.bluff = value / 100
    }

    const playerRaise = nextStake(engine.stake)
    const respondRaise = engine.proposedStake !== null ? nextStake(engine.proposedStake) : null
    const handLocked = showLastTrick || engine.phase !== "playerTurn"

    const statusMessage =
        engine.phase === "playerTurn"
            ? "SUA VEZ — PLAY A CARD" + (engine.canRaise("player") ? " OR CALL IT" : "")
            : engine.phase === "botTurn"
              ? "BOT IS THINKING..."
              : engine.phase === "respond"
                ? "THE BOT RAISED — YOUR CALL"
                : engine.phase === "maoDeOnze"
                  ? "MÃO DE ONZE — PLAY OR FOLD"
                  : engine.phase === "handOver"
                    ? "HAND OVER"
                    : engine.phase === "gameOver"
                      ? "GAME OVER"
                      : ""

    return (
        <div className={styles.page}>
            <div className={styles.cabinet}>
                <div className={styles.titleBar}>
                    <span>🤖 TrucoBot — Boteco do Bot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Placar (até {WINNING_SCORE})</header>
                            <div className={styles.scoreRow}>
                                <span>Você</span>
                                <span className={styles.scoreValue}>{engine.playerScore}</span>
                            </div>
                            <div className={styles.scoreRow}>
                                <span>Bot</span>
                                <span className={styles.scoreValue}>{engine.botScore}</span>
                            </div>
                            <span className={styles.stakeBadge}>
                                Mão vale {engine.stake}
                                {engine.proposedStake !== null ? ` → ${engine.proposedStake}?` : ""}
                            </span>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Truco</header>
                            <button
                                className={styles.trucoButton}
                                onClick={() => apply(engine.playerCallRaise())}
                                disabled={playerRaise === null || !engine.canRaise("player")}
                            >
                                {playerRaise !== null ? RAISE_CALL[playerRaise] : "Doze é o teto"}
                            </button>
                            <p className={styles.muted}>
                                Raise the stake: 1 → 3 → 6 → 9 → 12. The bot may accept, re-raise, or run.
                            </p>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Nova partida</header>
                            <div className={styles.sliderRow}>
                                <label htmlFor="cara-de-pau">Cara de pau do bot: {caraDePau}%</label>
                                <input
                                    id="cara-de-pau"
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={caraDePau}
                                    onChange={(event) => setBluff(Number(event.target.value))}
                                />
                                <div className={styles.sliderScale}>
                                    <span>honesto</span>
                                    <span>sem vergonha</span>
                                </div>
                            </div>
                            <button className={styles.chunky} onClick={newGame}>
                                ⟳ Nova partida
                            </button>
                        </section>
                    </aside>

                    <main className={styles.tableArea}>
                        <div className={styles.table}>
                            <div className={styles.lights} />

                            <div className={styles.botSeat}>
                                <span className={styles.seatLabel}>Bot · {engine.botHand.length} cartas</span>
                                {engine.botHand.map((_, index) => (
                                    <div key={index} className={styles.cardBack} />
                                ))}
                                {speech !== null && <div className={styles.speechBubble}>{speech}</div>}
                            </div>

                            <TrickArea engine={engine} showLastTrick={showLastTrick} />

                            <div className={styles.playerSeat}>
                                <span className={styles.seatLabel}>Sua mão</span>
                                {engine.playerHand.map((card, index) => (
                                    <button
                                        key={`${card.rank}${card.suit}`}
                                        className={styles.handCardButton}
                                        onClick={() => apply(engine.playCard(index))}
                                        disabled={handLocked}
                                    >
                                        <CardFace card={card} manilha={card.rank === engine.manilhaRank} />
                                    </button>
                                ))}
                                {engine.playerHand.length === 0 && <div className={styles.emptySlot} />}
                            </div>

                            {engine.phase === "respond" && engine.proposedStake !== null && (
                                <div className={styles.dialogScrim}>
                                    <div className={styles.dialog}>
                                        <div className={styles.dialogTitle}>
                                            {RAISE_CALL[engine.proposedStake]}
                                        </div>
                                        <p className={styles.dialogText}>
                                            The bot raised to {engine.proposedStake}. Running concedes{" "}
                                            {engine.stake}.
                                        </p>
                                        <div className={styles.dialogButtons}>
                                            <button
                                                className={styles.dialogButton}
                                                onClick={() => apply(engine.respondToRaise("accept"))}
                                            >
                                                Aceito ({engine.proposedStake})
                                            </button>
                                            {respondRaise !== null && (
                                                <button
                                                    className={styles.dialogButtonDanger}
                                                    onClick={() => apply(engine.respondToRaise("raise"))}
                                                >
                                                    {RAISE_CALL[respondRaise]}
                                                </button>
                                            )}
                                            <button
                                                className={styles.dialogButton}
                                                onClick={() => apply(engine.respondToRaise("fold"))}
                                            >
                                                Corro ({engine.stake} pro bot)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {engine.phase === "maoDeOnze" && (
                                <div className={styles.dialogScrim}>
                                    <div className={styles.dialog}>
                                        <div className={styles.dialogTitle}>Mão de onze!</div>
                                        <p className={styles.dialogText}>
                                            You are at 11. Play this hand for 3 points (no truco calls), or
                                            fold and hand the bot 1 point.
                                        </p>
                                        <div className={styles.dialogButtons}>
                                            <button
                                                className={styles.dialogButtonDanger}
                                                onClick={() => apply(engine.decideMaoDeOnze(true))}
                                            >
                                                Jogar (vale 3)
                                            </button>
                                            <button
                                                className={styles.dialogButton}
                                                onClick={() => apply(engine.decideMaoDeOnze(false))}
                                            >
                                                Correr (bot +1)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {engine.phase === "handOver" && engine.handWinner !== null && (
                                <div className={styles.dialogScrim}>
                                    <div className={styles.dialog}>
                                        <div className={styles.dialogTitle}>
                                            {engine.handWinner === "player" ? "Mão sua!" : "Mão do bot!"}
                                        </div>
                                        <p className={styles.dialogText}>
                                            {engine.handWinner === "player" ? "You take" : "The bot takes"}{" "}
                                            {engine.handPoints} point{engine.handPoints === 1 ? "" : "s"}.
                                        </p>
                                        <div className={styles.dialogButtons}>
                                            <button
                                                className={styles.dialogButton}
                                                onClick={() => apply(engine.startHand())}
                                            >
                                                Próxima mão →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {engine.phase === "gameOver" && engine.gameWinner !== null && (
                                <div className={styles.dialogScrim}>
                                    <div className={styles.dialog}>
                                        <div className={styles.dialogTitle}>
                                            {engine.gameWinner === "player"
                                                ? "🏆 Você fechou 12!"
                                                : "O bot fechou 12..."}
                                        </div>
                                        <p className={styles.dialogText}>
                                            Final: você {engine.playerScore} × {engine.botScore} bot.
                                        </p>
                                        <div className={styles.dialogButtons}>
                                            <button className={styles.dialogButtonDanger} onClick={newGame}>
                                                Revanche!
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={styles.resultBanner}>{statusMessage}</div>
                    </main>

                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Vitórias</header>
                            <dl className={styles.stats}>
                                <div>
                                    <dt>🍻 Partidas</dt>
                                    <dd>{tally.games}</dd>
                                </div>
                                <div>
                                    <dt>🏆 Suas</dt>
                                    <dd>{tally.wins}</dd>
                                </div>
                                <div>
                                    <dt>🤖 Do bot</dt>
                                    <dd>{tally.games - tally.wins}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Como joga</header>
                            <p className={styles.muted}>
                                Best of 3 tricks per hand. The card above the vira is the manilha — it glows,
                                and beats everything: ♦ &lt; ♠ &lt; ♥ &lt; ♣ (zap).
                            </p>
                            <p className={styles.muted}>
                                Plain order: 4 5 6 7 Q J K A 2 3. Equal plain cards tie; the first non-tied
                                trick then decides the hand.
                            </p>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>● MESA ABERTA.</span>
                    <span>{statusMessage}</span>
                    <span>
                        VIRA: {engine.vira.rank}
                        {SUIT_SYMBOL[engine.vira.suit]} · MANILHA: {engine.manilhaRank}
                    </span>
                </div>
            </div>
        </div>
    )
}

/** The center of the felt: vira, both trick plays, and the trick-result dots. */
function TrickArea({
    engine,
    showLastTrick,
}: {
    engine: TrucoEngine
    showLastTrick: boolean
}): React.ReactElement {
    // While a resolved trick lingers, show its pair; otherwise the live plays.
    const lingering =
        showLastTrick &&
        engine.lastTrick !== null &&
        engine.trickPlays.player === null &&
        engine.trickPlays.bot === null
    const botCard = lingering ? (engine.lastTrick?.botCard ?? null) : engine.trickPlays.bot
    const playerCard = lingering ? (engine.lastTrick?.playerCard ?? null) : engine.trickPlays.player

    return (
        <div className={styles.trickArea}>
            <div className={styles.viraColumn}>
                <span>Vira</span>
                <CardFace card={engine.vira} manilha={false} />
                <span>Manilha: {engine.manilhaRank}</span>
            </div>
            <div className={styles.trickSlot}>
                <span>Bot</span>
                {botCard !== null ? (
                    <CardFace card={botCard} manilha={botCard.rank === engine.manilhaRank} />
                ) : (
                    <div className={styles.emptySlot} />
                )}
            </div>
            <div className={styles.trickSlot}>
                <span>Você</span>
                {playerCard !== null ? (
                    <CardFace card={playerCard} manilha={playerCard.rank === engine.manilhaRank} />
                ) : (
                    <div className={styles.emptySlot} />
                )}
            </div>
            <div className={styles.trickSlot}>
                <span>Rodadas</span>
                <div className={styles.trickDots}>
                    {[0, 1, 2].map((index) => {
                        const result = engine.trickResults[index]
                        const dotClass =
                            result === "player"
                                ? styles.trickDotPlayer
                                : result === "bot"
                                  ? styles.trickDotBot
                                  : result === "tie"
                                    ? styles.trickDotTie
                                    : styles.trickDot
                        return <span key={index} className={dotClass} />
                    })}
                </div>
            </div>
        </div>
    )
}

/** A CSS-drawn card face: corner indices plus a big suit pip, manilha glow. */
function CardFace({ card, manilha }: { card: Card; manilha: boolean }): React.ReactElement {
    const red = card.suit === "hearts" || card.suit === "diamonds"
    const classes = [red ? styles.cardRed : styles.card, manilha ? styles.cardManilha : ""]
    return (
        <div className={classes.join(" ").trim()}>
            <span className={styles.cardCorner}>
                <span className={styles.cardRank}>{card.rank}</span>
                <br />
                {SUIT_SYMBOL[card.suit]}
            </span>
            <span className={styles.cardPip}>{SUIT_SYMBOL[card.suit]}</span>
            <span className={styles.cardCornerBottom}>
                <span className={styles.cardRank}>{card.rank}</span>
                <br />
                {SUIT_SYMBOL[card.suit]}
            </span>
        </div>
    )
}
