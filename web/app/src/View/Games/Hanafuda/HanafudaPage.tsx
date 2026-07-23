import React, { useEffect, useRef, useState } from "react"
import { HanafudaCardBack, HanafudaCardFace } from "./cards"
import {
    CardKind,
    HanafudaCard,
    KoiKoiEngine,
    Phase,
    STATS_STORAGE_KEY,
    TOTAL_ROUNDS,
    TurnReport,
    totalScore,
} from "./engine"
import * as styles from "./HanafudaPage.styles.css"

/** Pause before the bot acts, so its turn reads as an opponent thinking. */
const BOT_TURN_MS = 950

/** How long yaku toasts linger. */
const TOAST_MS = 2800

/** Rolling log length. */
const LOG_LINES = 7

interface MatchTally {
    matches: number
    wins: number
    losses: number
    draws: number
}

const EMPTY_TALLY: MatchTally = { matches: 0, wins: 0, losses: 0, draws: 0 }

const TRAY_ORDER: { kind: CardKind; label: string }[] = [
    { kind: "bright", label: "Brights" },
    { kind: "animal", label: "Animals" },
    { kind: "ribbon", label: "Ribbons" },
    { kind: "chaff", label: "Chaff" },
]

/** Static yaku reference shown in the side panel. */
const YAKU_REFERENCE: { name: string; points: string }[] = [
    { name: "Goko — five brights", points: "15" },
    { name: "Shiko — four dry brights", points: "8" },
    { name: "Ame-Shiko — four w/ Rain Man", points: "7" },
    { name: "Sanko — three dry brights", points: "6" },
    { name: "Hanami-zake — curtain + cup", points: "5" },
    { name: "Tsukimi-zake — moon + cup", points: "5" },
    { name: "Ino-Shika-Cho — boar/deer/butterfly", points: "5" },
    { name: "Akatan — 3 poetry ribbons", points: "5" },
    { name: "Aotan — 3 blue ribbons", points: "5" },
    { name: "Tan — 5+ ribbons", points: "1+" },
    { name: "Tane — 5+ animals", points: "1+" },
    { name: "Kasu — 10+ chaff", points: "1+" },
]

function loadTally(): MatchTally {
    try {
        const raw = window.localStorage.getItem(STATS_STORAGE_KEY)
        return raw ? { ...EMPTY_TALLY, ...(JSON.parse(raw) as Partial<MatchTally>) } : EMPTY_TALLY
    } catch {
        return EMPTY_TALLY
    }
}

/** Human log lines for one completed turn. */
function reportLines(report: TurnReport): string[] {
    const who = report.seat === "player" ? "You" : "Bot"
    const lines: string[] = []
    lines.push(
        report.playedCaptured.length > 0
            ? `${who} matched ${report.played.name} — took ${report.playedCaptured.length} cards.`
            : `${who} discarded ${report.played.name} to the field.`,
    )
    if (report.drawn) {
        lines.push(
            report.drawnCaptured.length > 0
                ? `Flip: ${report.drawn.name} — captured!`
                : `Flip: ${report.drawn.name} joins the field.`,
        )
    }
    if (report.newYaku.length > 0) {
        lines.push(`${who} formed: ${report.newYaku.map((yaku) => yaku.label).join(", ")}.`)
    }
    if (report.botDecision === "koikoi") {
        lines.push("Bot calls KOI-KOI!")
    } else if (report.botDecision === "shobu") {
        lines.push("Bot calls SHOBU and banks the round.")
    }
    return lines
}

/** Home surface for the `hanafuda` pack: Koi-Koi against a bot with the full 48-card flower deck. */
export default function HanafudaPage(): React.ReactElement {
    const engineRef = useRef<KoiKoiEngine | null>(null)
    if (engineRef.current === null) {
        engineRef.current = new KoiKoiEngine()
    }
    const engine = engineRef.current

    // The engine is mutable (like Pong's gameRef); `version` re-renders the
    // table after each action.
    const [version, setVersion] = useState(0)
    const [log, setLog] = useState<string[]>(["The table is set. Match a month to begin."])
    const [toast, setToast] = useState<{ title: string; sub: string } | null>(null)
    const [tally, setTally] = useState<MatchTally>(loadTally)
    const tallyRecordedRef = useRef(false)

    const refresh = (): void => setVersion((value) => value + 1)

    const appendLog = (lines: string[]): void => {
        setLog((existing) => [...existing, ...lines].slice(-LOG_LINES))
    }

    // Bot acts on a delay whenever the engine hands it the turn.
    useEffect(() => {
        if (engine.phase !== "botTurn") {
            return
        }
        const id = window.setTimeout(() => {
            const report = engine.botTakeTurn()
            if (report) {
                setLog((existing) => [...existing, ...reportLines(report)].slice(-LOG_LINES))
                if (report.newYaku.length > 0) {
                    setToast({
                        title: report.newYaku.map((yaku) => yaku.label).join(" · "),
                        sub:
                            report.botDecision === "koikoi"
                                ? "Bot calls KOI-KOI — the round continues!"
                                : "Bot banks the round.",
                    })
                }
            }
            setVersion((value) => value + 1)
        }, BOT_TURN_MS)
        return () => window.clearTimeout(id)
    }, [engine, engine.phase, version])

    // Toasts self-dismiss.
    useEffect(() => {
        if (!toast) {
            return
        }
        const id = window.setTimeout(() => setToast(null), TOAST_MS)
        return () => window.clearTimeout(id)
    }, [toast])

    // Persist the match tally exactly once per finished match.
    useEffect(() => {
        if (engine.phase !== "matchOver" || tallyRecordedRef.current) {
            return
        }
        tallyRecordedRef.current = true
        setTally((existing) => {
            const next: MatchTally = {
                matches: existing.matches + 1,
                wins: existing.wins + (engine.matchWinner === "player" ? 1 : 0),
                losses: existing.losses + (engine.matchWinner === "bot" ? 1 : 0),
                draws: existing.draws + (engine.matchWinner === null ? 1 : 0),
            }
            window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(next))
            return next
        })
    }, [engine, engine.phase, version])

    const playHandCard = (card: HanafudaCard): void => {
        if (engine.phase !== "selectHand" || engine.turn !== "player") {
            return
        }
        engine.playHandCard(card.id)
        // Re-read the phase after the mutation (TS still narrows it to the
        // guard above otherwise).
        const phaseAfter = engine.phase as Phase
        if (phaseAfter !== "chooseFieldForHand" && engine.lastReport?.seat === "player") {
            handlePlayerReport(engine.lastReport)
        }
        refresh()
    }

    const chooseFieldCard = (card: HanafudaCard): void => {
        engine.resolveFieldChoice(card.id)
        if (engine.lastReport?.seat === "player") {
            handlePlayerReport(engine.lastReport)
        }
        refresh()
    }

    /** Log the player's turn and toast an auto-banked final-card yaku. */
    const handlePlayerReport = (report: TurnReport): void => {
        appendLog(reportLines(report))
        if (report.newYaku.length > 0 && engine.phase !== "decision") {
            setToast({
                title: report.newYaku.map((yaku) => yaku.label).join(" · "),
                sub: "Last card — the yaku banks automatically.",
            })
        }
    }

    const declareKoiKoi = (): void => {
        engine.declareKoiKoi()
        appendLog(["You call KOI-KOI — the round continues!"])
        refresh()
    }

    const declareShobu = (): void => {
        engine.declareShobu()
        appendLog(["You call SHOBU and bank the round."])
        refresh()
    }

    const nextRound = (): void => {
        engine.startNextRound()
        appendLog([`Round ${engine.round} — ${engine.dealer === "player" ? "you deal" : "the bot deals"}.`])
        refresh()
    }

    const newMatch = (): void => {
        engine.startMatch()
        tallyRecordedRef.current = false
        setLog(["A fresh match. Six rounds — good luck."])
        setToast(null)
        refresh()
    }

    // Field cards the player may click right now (two-way choices).
    const choosableIds = new Set(
        engine.phase === "chooseFieldForHand" && engine.pendingHandCard
            ? engine.fieldMatches(engine.pendingHandCard).map((card) => card.id)
            : engine.phase === "chooseFieldForDraw" && engine.pendingDrawnCard
              ? engine.fieldMatches(engine.pendingDrawnCard).map((card) => card.id)
              : [],
    )

    const playerTotal = totalScore(engine.scores.player)
    const botTotal = totalScore(engine.scores.bot)
    const lastResult = engine.results[engine.results.length - 1]

    const statusMessage =
        engine.phase === "selectHand"
            ? "YOUR TURN — PLAY A CARD FROM YOUR HAND"
            : engine.phase === "chooseFieldForHand"
              ? `${engine.pendingHandCard?.name.toUpperCase()} MATCHES TWO — PICK A FIELD CARD`
              : engine.phase === "chooseFieldForDraw"
                ? `FLIPPED ${engine.pendingDrawnCard?.name.toUpperCase()} — PICK A FIELD CARD`
                : engine.phase === "decision"
                  ? "YAKU! KOI-KOI OR SHOBU?"
                  : engine.phase === "botTurn"
                    ? "BOT IS THINKING..."
                    : engine.phase === "roundOver"
                      ? "ROUND OVER"
                      : "MATCH OVER"

    const renderTrays = (seat: "player" | "bot"): React.ReactElement => (
        <div className={styles.trayRow}>
            {TRAY_ORDER.map(({ kind, label }) => {
                const cards = engine.captured[seat].filter((card) => card.kind === kind)
                return (
                    <div key={kind} className={styles.tray}>
                        <span className={styles.trayLabel}>
                            {label} · {cards.length}
                        </span>
                        <div className={styles.trayCards}>
                            {cards.map((card) => (
                                <span key={card.id} className={styles.trayCard} title={card.name}>
                                    <HanafudaCardFace card={card} className={styles.cardSvg} />
                                </span>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )

    return (
        <div className={styles.page}>
            <div className={styles.frame}>
                <div className={styles.titleBar}>
                    <span>
                        🎴 HanafudaBot <span className={styles.titleSub}>— Koi-Koi</span>
                    </span>
                    <span className={styles.titleSub}>花札 · こいこい</span>
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={newMatch}>
                        ⟳ New Match
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={styles.roundBadge}>
                        ROUND {engine.round} / {TOTAL_ROUNDS} ·{" "}
                        {engine.dealer === "player" ? "YOU DEAL" : "BOT DEALS"}
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.sideColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Scoreboard</header>
                            <table className={styles.scoreTable}>
                                <thead>
                                    <tr>
                                        <th>Round</th>
                                        <th>You</th>
                                        <th>Bot</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{engine.scores.player[i] ?? "—"}</td>
                                            <td>{engine.scores.bot[i] ?? "—"}</td>
                                        </tr>
                                    ))}
                                    <tr className={styles.scoreTotalRow}>
                                        <td>Total</td>
                                        <td>{playerTotal}</td>
                                        <td>{botTotal}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Yaku Reference</header>
                            <ul className={styles.yakuList}>
                                {YAKU_REFERENCE.map((yaku) => (
                                    <li key={yaku.name}>
                                        <span>{yaku.name}</span>
                                        <span>{yaku.points}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </aside>

                    <main className={styles.tableArea}>
                        <div className={styles.seatRow}>
                            <span className={styles.seatLabel}>Bot</span>
                            <div className={styles.handRow}>
                                {engine.hands.bot.map((card) => (
                                    <span key={card.id} className={styles.backCard}>
                                        <HanafudaCardBack className={styles.cardSvg} />
                                    </span>
                                ))}
                            </div>
                        </div>
                        {renderTrays("bot")}

                        <div className={styles.fieldZone}>
                            <div className={styles.deckZone}>
                                <span className={styles.deckCard}>
                                    <HanafudaCardBack className={styles.cardSvg} />
                                </span>
                                <span>DECK · {engine.deck.length}</span>
                            </div>
                            <div className={styles.fieldGrid}>
                                {engine.field.map((card) => {
                                    const choosable = choosableIds.has(card.id)
                                    return (
                                        <button
                                            key={card.id}
                                            className={
                                                choosable ? styles.fieldCardMatchable : styles.fieldCard
                                            }
                                            onClick={() => choosable && chooseFieldCard(card)}
                                            disabled={!choosable}
                                            title={card.name}
                                        >
                                            <HanafudaCardFace card={card} className={styles.cardSvg} />
                                        </button>
                                    )
                                })}
                            </div>
                            {(engine.pendingHandCard || engine.pendingDrawnCard) && (
                                <div className={styles.drawnCardZone}>
                                    <span className={styles.drawnCard}>
                                        <HanafudaCardFace
                                            card={(engine.pendingHandCard ?? engine.pendingDrawnCard)!}
                                            className={styles.cardSvg}
                                        />
                                    </span>
                                    <span>{engine.pendingHandCard ? "PLAYED" : "FLIPPED"}</span>
                                </div>
                            )}
                        </div>

                        {renderTrays("player")}
                        <div className={styles.seatRow}>
                            <span className={styles.seatLabel}>You</span>
                            <div className={styles.handRow}>
                                {engine.hands.player.map((card) => (
                                    <button
                                        key={card.id}
                                        className={styles.handCard}
                                        onClick={() => playHandCard(card)}
                                        disabled={engine.phase !== "selectHand" || engine.turn !== "player"}
                                        title={card.name}
                                    >
                                        <HanafudaCardFace card={card} className={styles.cardSvg} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {toast && (
                            <div className={styles.yakuToast}>
                                {toast.title}
                                <span className={styles.yakuToastSub}>{toast.sub}</span>
                            </div>
                        )}

                        {engine.phase === "decision" && engine.lastReport && (
                            <div className={styles.dialogScrim}>
                                <div className={styles.dialog}>
                                    <h2 className={styles.dialogTitle}>役 — Yaku!</h2>
                                    <ul className={styles.dialogYaku}>
                                        {engine.lastReport.newYaku.map((yaku) => (
                                            <li key={yaku.key}>
                                                {yaku.label} — {yaku.points}
                                            </li>
                                        ))}
                                    </ul>
                                    <p className={styles.dialogBody}>
                                        Call <strong>koi-koi</strong> to press for a bigger hand (the bot wins
                                        double if it banks first), or <strong>shobu</strong> to score now.
                                    </p>
                                    <div className={styles.dialogButtons}>
                                        <button className={styles.koiButton} onClick={declareKoiKoi}>
                                            Koi-Koi
                                        </button>
                                        <button className={styles.shobuButton} onClick={declareShobu}>
                                            Shobu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {engine.phase === "roundOver" && lastResult && (
                            <div className={styles.dialogScrim}>
                                <div className={styles.dialog}>
                                    <h2 className={styles.dialogTitle}>
                                        {lastResult.winner === "player"
                                            ? `You take round ${lastResult.round}!`
                                            : lastResult.winner === "bot"
                                              ? `Bot takes round ${lastResult.round}.`
                                              : `Round ${lastResult.round} is a draw.`}
                                    </h2>
                                    {lastResult.winner && (
                                        <>
                                            <ul className={styles.dialogYaku}>
                                                {lastResult.yaku.map((yaku) => (
                                                    <li key={yaku.key}>
                                                        {yaku.label} — {yaku.points}
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className={styles.dialogBody}>
                                                {lastResult.basePoints} points
                                                {lastResult.score !== lastResult.basePoints
                                                    ? ` → ${lastResult.score} after doubling`
                                                    : ""}
                                                .
                                            </p>
                                        </>
                                    )}
                                    <div className={styles.dialogButtons}>
                                        <button className={styles.shobuButton} onClick={nextRound}>
                                            Deal Round {engine.round + 1}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {engine.phase === "matchOver" && (
                            <div className={styles.dialogScrim}>
                                <div className={styles.dialog}>
                                    <h2 className={styles.dialogTitle}>
                                        {engine.matchWinner === "player"
                                            ? "🏮 You win the match!"
                                            : engine.matchWinner === "bot"
                                              ? "The bot takes the match."
                                              : "The match ends in a draw."}
                                    </h2>
                                    <p className={styles.dialogBody}>
                                        Final score — You {playerTotal} · Bot {botTotal}
                                    </p>
                                    <div className={styles.dialogButtons}>
                                        <button className={styles.shobuButton} onClick={newMatch}>
                                            New Match
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    <aside className={styles.sideColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Table Log</header>
                            <div className={styles.logPanel}>
                                {log.map((line, index) => (
                                    <div
                                        key={index}
                                        className={line.startsWith("Bot") ? styles.logLineBot : undefined}
                                    >
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Match Tally</header>
                            {tally.matches > 0 ? (
                                <dl className={styles.stats}>
                                    <div>
                                        <dt>🎴 Matches</dt>
                                        <dd>{tally.matches}</dd>
                                    </div>
                                    <div>
                                        <dt>🏮 Wins</dt>
                                        <dd>{tally.wins}</dd>
                                    </div>
                                    <div>
                                        <dt>🤖 Losses</dt>
                                        <dd>{tally.losses}</dd>
                                    </div>
                                    <div>
                                        <dt>🤝 Draws</dt>
                                        <dd>{tally.draws}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className={styles.muted}>No matches finished yet.</p>
                            )}
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>House Rules</header>
                            <ul className={styles.yakuList}>
                                <li>
                                    <span>6 rounds, dealer alternates</span>
                                </li>
                                <li>
                                    <span>7+ points doubles the score</span>
                                </li>
                                <li>
                                    <span>Win after opponent&apos;s koi-koi doubles</span>
                                </li>
                                <li>
                                    <span>Triple month match sweeps all four</span>
                                </li>
                            </ul>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>
                        ● {engine.koiKoiCalled.player ? "YOUR KOI-KOI IS LIVE. " : ""}
                        {engine.koiKoiCalled.bot ? "BOT'S KOI-KOI IS LIVE." : ""}
                        {!engine.koiKoiCalled.player && !engine.koiKoiCalled.bot ? "TABLE OPEN." : ""}
                    </span>
                    <span className={styles.statusHot}>{statusMessage}</span>
                    <span>
                        HAND: {engine.hands.player.length} · FIELD: {engine.field.length} · DECK:{" "}
                        {engine.deck.length}
                    </span>
                </div>
            </div>
        </div>
    )
}
