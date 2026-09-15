import React, { useState } from "react"
import { readStoredJson, writeStoredJson } from "@base/core"
import CarromGame, { CarromHud } from "./CarromGame"
import { BotLevel, CarromMode, COINS_PER_PLAYER, MATCH_TARGET, PlayerIndex } from "./engine"
import * as styles from "./CarromPage.styles.css"

const BOT_LEVELS: BotLevel[] = ["easy", "medium", "hard"]
const STATS_KEY = "carrombot-stats"

/** Lifetime match tally persisted in localStorage under `carrombot-stats`. */
interface MatchStats {
    /** Matches won by the bottom seat (Player one). */
    playerWins: number
    /** Matches won by the top seat (CPU or Player two). */
    opponentWins: number
    matches: number
}

function loadStats(): MatchStats {
    return readStoredJson<MatchStats>(STATS_KEY, { playerWins: 0, opponentWins: 0, matches: 0 })
}

/** Renders `count` pocketed coins as tray chips (queen chip appended by caller). */
function trayChips(count: number, chipClass: string): React.ReactElement[] {
    return Array.from({ length: count }, (_, index) => <span key={index} className={chipClass} />)
}

/**
 * Home surface for the `carrom` pack: flick the striker, pocket your coins,
 * and cover the queen — vs the CPU or hotseat two-player.
 */
export default function CarromPage(): React.ReactElement {
    const [mode, setMode] = useState<CarromMode>("bot")
    const [botLevel, setBotLevel] = useState<BotLevel>("medium")
    const [soundOn, setSoundOn] = useState(true)
    const [resetToken, setResetToken] = useState(0)
    const [message, setMessage] = useState("Player one breaks. Drag back from the striker to flick.")
    const [isFoulMessage, setIsFoulMessage] = useState(false)
    const [hud, setHud] = useState<CarromHud>({
        currentPlayer: 0,
        phase: "aiming",
        matchScore: [0, 0],
        whitePocketed: 0,
        blackPocketed: 0,
        queenState: "onBoard",
    })
    const [stats, setStats] = useState<MatchStats>(loadStats)

    const opponentName = mode === "bot" ? "CPU" : "Player two"

    const newMatch = (): void => {
        setResetToken((token) => token + 1)
        setIsFoulMessage(false)
        setMessage("Player one breaks. Drag back from the striker to flick.")
    }

    const changeMode = (nextMode: CarromMode): void => {
        setMode(nextMode)
        newMatch()
    }

    const handleMessage = (nextMessage: string): void => {
        setMessage(nextMessage)
        setIsFoulMessage(nextMessage.startsWith("Foul"))
    }

    const handleMatchOver = (winner: PlayerIndex): void => {
        const next: MatchStats = {
            playerWins: stats.playerWins + (winner === 0 ? 1 : 0),
            opponentWins: stats.opponentWins + (winner === 1 ? 1 : 0),
            matches: stats.matches + 1,
        }
        setStats(next)
        writeStoredJson(STATS_KEY, next)
    }

    const queenChipFor = (player: PlayerIndex): React.ReactElement | null =>
        (player === 0 && hud.queenState === "coveredBy0") ||
        (player === 1 && hud.queenState === "coveredBy1") ? (
            <span className={styles.trayCoinQueen} title="Queen (covered)" />
        ) : null

    return (
        <div className={styles.page}>
            <div className={styles.parlor}>
                <header className={styles.header}>
                    <div className={styles.wordmarkBlock}>
                        <span className={styles.wordmark}>Carrom</span>
                        <span className={styles.tagline}>
                            Flick, pocket, cover the queen — match to {MATCH_TARGET}.
                        </span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={soundOn ? styles.button : styles.buttonMuted}
                            onClick={() => setSoundOn((value) => !value)}
                        >
                            {soundOn ? "Sound on" : "Sound off"}
                        </button>
                        <button className={styles.buttonPrimary} onClick={newMatch}>
                            New match
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <aside className={styles.sideColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Match</header>
                            <div className={styles.scoreRow}>
                                <span>Player one</span>
                                <span className={styles.scoreBig}>{hud.matchScore[0]}</span>
                            </div>
                            <div className={styles.scoreRow}>
                                <span>{opponentName}</span>
                                <span className={styles.scoreBig}>{hud.matchScore[1]}</span>
                            </div>
                            <p className={styles.muted}>
                                Board points = opponent's coins left on the board, +3 for a covered queen.
                                First to {MATCH_TARGET} takes the match.
                            </p>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Mode</header>
                            <div className={styles.segmented}>
                                <button
                                    className={mode === "bot" ? styles.segmentOn : styles.segment}
                                    onClick={() => changeMode("bot")}
                                >
                                    Solo
                                </button>
                                <button
                                    className={mode === "2p" ? styles.segmentOn : styles.segment}
                                    onClick={() => changeMode("2p")}
                                >
                                    Two player
                                </button>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Difficulty</header>
                            <div className={styles.segmented}>
                                {BOT_LEVELS.map((level) => (
                                    <button
                                        key={level}
                                        className={botLevel === level ? styles.segmentOn : styles.segment}
                                        onClick={() => setBotLevel(level)}
                                        disabled={mode === "2p"}
                                    >
                                        {level[0].toUpperCase() + level.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </aside>

                    <main className={styles.boardWell}>
                        <div className={styles.boardFrame}>
                            <CarromGame
                                mode={mode}
                                botLevel={botLevel}
                                soundOn={soundOn}
                                resetToken={resetToken}
                                onHud={setHud}
                                onMessage={handleMessage}
                                onMatchOver={handleMatchOver}
                            />
                        </div>
                        <div className={isFoulMessage ? styles.messageFoul : styles.messageBar}>
                            {message}
                        </div>
                        <span className={styles.hint}>
                            Press the baseline to place the striker — drag back to aim, release to flick
                        </span>
                    </main>

                    <aside className={styles.sideColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Coin trays</header>
                            <div
                                className={
                                    hud.currentPlayer === 0 ? styles.trayLabelActive : styles.trayLabel
                                }
                            >
                                <span>Player one · white</span>
                                <span>
                                    {hud.whitePocketed}/{COINS_PER_PLAYER}
                                </span>
                            </div>
                            <div className={styles.tray}>
                                {hud.whitePocketed === 0 && queenChipFor(0) === null ? (
                                    <span className={styles.trayEmpty}>Empty tray</span>
                                ) : (
                                    <>
                                        {trayChips(hud.whitePocketed, styles.trayCoinWhite)}
                                        {queenChipFor(0)}
                                    </>
                                )}
                            </div>
                            <div
                                className={
                                    hud.currentPlayer === 1 ? styles.trayLabelActive : styles.trayLabel
                                }
                            >
                                <span>{opponentName} · black</span>
                                <span>
                                    {hud.blackPocketed}/{COINS_PER_PLAYER}
                                </span>
                            </div>
                            <div className={styles.tray}>
                                {hud.blackPocketed === 0 && queenChipFor(1) === null ? (
                                    <span className={styles.trayEmpty}>Empty tray</span>
                                ) : (
                                    <>
                                        {trayChips(hud.blackPocketed, styles.trayCoinBlack)}
                                        {queenChipFor(1)}
                                    </>
                                )}
                            </div>
                            {hud.queenState === "pendingCover" && (
                                <p className={styles.muted}>
                                    Queen pocketed — it must be covered on the next strike or it returns to
                                    center.
                                </p>
                            )}
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Lifetime tally</header>
                            <div className={styles.statChip}>
                                <span>Player one wins</span>
                                <span className={styles.statValue}>{stats.playerWins}</span>
                            </div>
                            <div className={styles.statChip}>
                                <span>Opponent wins</span>
                                <span className={styles.statValue}>{stats.opponentWins}</span>
                            </div>
                            <div className={styles.statChip}>
                                <span>Matches played</span>
                                <span className={styles.statValue}>{stats.matches}</span>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>House rules</header>
                            <p className={styles.muted}>
                                Pocket your own color to keep shooting. Sinking the striker is a foul: one of
                                your coins comes back out.
                            </p>
                            <p className={styles.muted}>
                                The red queen needs a cover — pocket one of your coins on the same or
                                following strike, or she returns to the center.
                            </p>
                        </section>
                    </aside>
                </div>

                <footer className={styles.statusBar}>
                    <span>
                        {hud.phase === "aiming"
                            ? "Aiming"
                            : hud.phase === "rolling"
                              ? "Rolling"
                              : "Board over"}
                    </span>
                    <span>
                        Turn — {hud.currentPlayer === 0 ? "Player one (white)" : `${opponentName} (black)`}
                    </span>
                    <span>Match to {MATCH_TARGET}</span>
                </footer>
            </div>
        </div>
    )
}
