import React, { useState } from "react"
import CarromGame, { CarromHud } from "./CarromGame"
import { BotLevel, CarromMode, COINS_PER_PLAYER, MATCH_TARGET, PlayerIndex } from "./engine"
import * as styles from "./CarromPage.styles.css"

const BOT_LEVELS: BotLevel[] = ["easy", "medium", "hard"]
const STATS_KEY = "carrombot-stats"

/** Lifetime match tally persisted in localStorage under `carrombot-stats`. */
interface MatchStats {
    /** Matches won by the bottom seat (Player 1). */
    playerWins: number
    /** Matches won by the top seat (Bot or Player 2). */
    opponentWins: number
    matches: number
}

function loadStats(): MatchStats {
    try {
        const raw = localStorage.getItem(STATS_KEY)
        return raw ? (JSON.parse(raw) as MatchStats) : { playerWins: 0, opponentWins: 0, matches: 0 }
    } catch {
        return { playerWins: 0, opponentWins: 0, matches: 0 }
    }
}

/** Renders `count` pocketed coins as tray chips (queen chip appended by caller). */
function trayChips(count: number, chipClass: string): React.ReactElement[] {
    return Array.from({ length: count }, (_, index) => <span key={index} className={chipClass} />)
}

/**
 * Home surface for the `carrom` pack: flick the striker, pocket your coins,
 * and cover the queen on a plywood board — vs a bot or hotseat 2P.
 */
export default function CarromPage(): React.ReactElement {
    const [mode, setMode] = useState<CarromMode>("bot")
    const [botLevel, setBotLevel] = useState<BotLevel>("medium")
    const [soundOn, setSoundOn] = useState(true)
    const [resetToken, setResetToken] = useState(0)
    const [message, setMessage] = useState("Player 1 breaks. Drag back from the striker to flick.")
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

    const opponentName = mode === "bot" ? "Bot" : "Player 2"

    const newMatch = (): void => {
        setResetToken((token) => token + 1)
        setIsFoulMessage(false)
        setMessage("Player 1 breaks. Drag back from the striker to flick.")
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
        localStorage.setItem(STATS_KEY, JSON.stringify(next))
    }

    const queenChipFor = (player: PlayerIndex): React.ReactElement | null =>
        (player === 0 && hud.queenState === "coveredBy0") ||
        (player === 1 && hud.queenState === "coveredBy1") ? (
            <span className={styles.trayCoinQueen} title="Queen (covered)" />
        ) : null

    return (
        <div className={styles.page}>
            <div className={styles.parlor}>
                <div className={styles.titleBar}>
                    <span className={styles.title}>🎯 CarromBot</span>
                    <span className={styles.tagline}>
                        Flick, pocket, cover the queen — match to {MATCH_TARGET}.
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.sideColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Match</header>
                            <div className={styles.panelBody}>
                                <div className={styles.scoreRow}>
                                    <span>Player 1</span>
                                    <span className={styles.scoreBig}>{hud.matchScore[0]}</span>
                                </div>
                                <div className={styles.scoreRow}>
                                    <span>{opponentName}</span>
                                    <span className={styles.scoreBig}>{hud.matchScore[1]}</span>
                                </div>
                                <p className={styles.muted}>
                                    Board points = opponent's coins left on the wood, +3 for a covered queen.
                                    First to {MATCH_TARGET} takes the match.
                                </p>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>New game</header>
                            <div className={styles.panelBody}>
                                <div className={styles.buttonRow}>
                                    <button className={styles.chunky} onClick={newMatch}>
                                        ⟳ New Match
                                    </button>
                                    <button
                                        className={soundOn ? styles.chunkyLit : styles.chunky}
                                        onClick={() => setSoundOn((value) => !value)}
                                    >
                                        {soundOn ? "🔊 Sound" : "🔇 Sound"}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Mode</header>
                            <div className={styles.panelBody}>
                                <label className={styles.radioRow}>
                                    <input
                                        type="radio"
                                        checked={mode === "bot"}
                                        onChange={() => changeMode("bot")}
                                    />
                                    vs Bot 🤖
                                </label>
                                <label className={styles.radioRow}>
                                    <input
                                        type="radio"
                                        checked={mode === "2p"}
                                        onChange={() => changeMode("2p")}
                                    />
                                    2 Players (hotseat) 👥
                                </label>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Bot level</header>
                            <div className={styles.panelBody}>
                                {BOT_LEVELS.map((level) => (
                                    <label key={level} className={styles.radioRow}>
                                        <input
                                            type="radio"
                                            checked={botLevel === level}
                                            onChange={() => setBotLevel(level)}
                                            disabled={mode === "2p"}
                                        />
                                        <span className={styles.capitalize}>{level}</span>
                                    </label>
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
                            Press the baseline to place the striker · drag back from the striker to aim,
                            release to flick
                        </span>
                    </main>

                    <aside className={styles.sideColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Coin trays</header>
                            <div className={styles.panelBody}>
                                <div
                                    className={
                                        hud.currentPlayer === 0 ? styles.trayLabelActive : styles.trayLabel
                                    }
                                >
                                    <span>Player 1 · white</span>
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
                                        👑 Queen pocketed — it must be covered on the next strike or it
                                        returns to center.
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Lifetime tally</header>
                            <div className={styles.panelBody}>
                                <span className={styles.statChip}>
                                    Player 1 wins <span className={styles.statValue}>{stats.playerWins}</span>
                                </span>
                                <span className={styles.statChip}>
                                    Opponent wins{" "}
                                    <span className={styles.statValueLoss}>{stats.opponentWins}</span>
                                </span>
                                <span className={styles.statChip}>
                                    Matches played <span className={styles.statValue}>{stats.matches}</span>
                                </span>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>House rules</header>
                            <div className={styles.panelBody}>
                                <p className={styles.muted}>
                                    Pocket your own color to keep shooting. Sinking the striker is a foul: one
                                    of your coins comes back out.
                                </p>
                                <p className={styles.muted}>
                                    The red queen needs a cover — pocket one of your coins on the same or
                                    following strike, or she returns to the center.
                                </p>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>
                        ●{" "}
                        {hud.phase === "aiming"
                            ? "AIMING"
                            : hud.phase === "rolling"
                              ? "ROLLING"
                              : "BOARD OVER"}
                    </span>
                    <span>
                        Turn: {hud.currentPlayer === 0 ? "Player 1 (white)" : `${opponentName} (black)`}
                    </span>
                    <span>MATCH TO {MATCH_TARGET}</span>
                </div>
            </div>
        </div>
    )
}
