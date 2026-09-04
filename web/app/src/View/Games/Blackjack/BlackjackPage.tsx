import React, { useEffect, useRef, useState } from "react"
import { readStoredNumber, writeStoredNumber } from "@base/core"
import { sounds } from "./audio"
import BlackjackTable from "./BlackjackTable"
import {
    BANKROLL_STORAGE_KEY,
    BLACKJACK_PAYOUT,
    buildShoe,
    Card,
    CHIP_DENOMINATIONS,
    DEALER_STANDS_ON,
    DECK_COUNT,
    formatMoney,
    HandResult,
    handTotal,
    isBlackjack,
    RESHUFFLE_FRACTION,
    ResultKind,
    STARTING_BANKROLL,
} from "./cards"
import * as styles from "./BlackjackPage.styles.css"

// Pacing of the deal choreography (ms).
const DEAL_STEP_MS = 280
const REVEAL_PAUSE_MS = 550
const DEALER_DRAW_MS = 700
const SHUFFLE_NOTE_MS = 2600

const SHOE_SIZE = DECK_COUNT * 52
const RESHUFFLE_AT = Math.floor(SHOE_SIZE * RESHUFFLE_FRACTION)

type Phase = "betting" | "dealing" | "player" | "dealer" | "settled"

interface SessionStats {
    hands: number
    wins: number
    pushes: number
    biggestWin: number
}

const CHIP_CLASSES: Record<number, string> = {
    5: styles.chipRed,
    25: styles.chipGreen,
    100: styles.chipBlack,
}

const RESULT_SOUND: Record<ResultKind, keyof typeof sounds> = {
    blackjack: "blackjack",
    win: "win",
    push: "push",
    bust: "lose",
    lose: "lose",
}

const RESULT_STATUS: Record<ResultKind, string> = {
    blackjack: "Blackjack — paid 3:2",
    win: "You win",
    push: "Push — bet returned",
    bust: "Bust",
    lose: "Dealer wins",
}

/** Home surface for the `blackjack` pack: casino blackjack against the house dealer. */
export default function BlackjackPage(): React.ReactElement {
    const [bankroll, setBankroll] = useState<number>(loadBankroll)
    const [bet, setBet] = useState(0)
    const [phase, setPhase] = useState<Phase>("betting")
    const [playerCards, setPlayerCards] = useState<Card[]>([])
    const [dealerCards, setDealerCards] = useState<Card[]>([])
    const [holeHidden, setHoleHidden] = useState(true)
    const [result, setResult] = useState<HandResult | null>(null)
    const [soundOn, setSoundOn] = useState(true)
    const [shuffling, setShuffling] = useState(false)
    const [shoeCount, setShoeCount] = useState(SHOE_SIZE)
    const [stats, setStats] = useState<SessionStats>({ hands: 0, wins: 0, pushes: 0, biggestWin: 0 })

    // The shoe is mutable game state (like Pong's gameRef); starts empty so the
    // first draw triggers a shuffle. Timers are tracked for unmount cleanup.
    const shoeRef = useRef<Card[]>([])
    const timersRef = useRef<number[]>([])
    const soundRef = useRef(soundOn)
    soundRef.current = soundOn

    useEffect(() => {
        const timers = timersRef.current
        return () => timers.forEach((id) => window.clearTimeout(id))
    }, [])

    useEffect(() => {
        writeStoredNumber(BANKROLL_STORAGE_KEY, bankroll)
    }, [bankroll])

    const schedule = (callback: () => void, delayMs: number): void => {
        timersRef.current.push(window.setTimeout(callback, delayMs))
    }

    const playSound = (name: keyof typeof sounds): void => {
        if (soundRef.current) {
            sounds[name]()
        }
    }

    const drawCard = (): Card => {
        if (shoeRef.current.length <= RESHUFFLE_AT) {
            shoeRef.current = buildShoe()
            setShuffling(true)
            schedule(() => setShuffling(false), SHUFFLE_NOTE_MS)
        }
        const card = shoeRef.current.pop() as Card
        setShoeCount(shoeRef.current.length)
        return card
    }

    /** Pays out the hand, updates session stats, and moves to the settled phase. */
    const settle = (player: Card[], dealer: Card[], wagered: number): void => {
        const playerTotal = handTotal(player).total
        const dealerTotal = handTotal(dealer).total
        const playerNatural = isBlackjack(player)
        const dealerNatural = isBlackjack(dealer)

        let kind: ResultKind
        let payout = 0
        if (playerTotal > 21) {
            kind = "bust"
        } else if (playerNatural && !dealerNatural) {
            kind = "blackjack"
            payout = wagered + wagered * BLACKJACK_PAYOUT
        } else if (dealerNatural && !playerNatural) {
            kind = "lose"
        } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
            kind = "win"
            payout = wagered * 2
        } else if (playerTotal === dealerTotal) {
            kind = "push"
            payout = wagered
        } else {
            kind = "lose"
        }

        const net = payout - wagered
        setBankroll((value) => value + payout)
        setResult({ kind, net })
        setStats((previous) => ({
            hands: previous.hands + 1,
            wins: previous.wins + (net > 0 ? 1 : 0),
            pushes: previous.pushes + (kind === "push" ? 1 : 0),
            biggestWin: Math.max(previous.biggestWin, net),
        }))
        setPhase("settled")
        playSound(RESULT_SOUND[kind])
    }

    /** Flips the hole card, draws to `DEALER_STANDS_ON`, then settles. */
    const beginDealerTurn = (player: Card[], wagered: number): void => {
        setPhase("dealer")
        schedule(() => {
            setHoleHidden(false)
            playSound("card")
        }, REVEAL_PAUSE_MS)

        let dealerHand = dealerCards
        const step = (): void => {
            if (handTotal(dealerHand).total < DEALER_STANDS_ON) {
                dealerHand = [...dealerHand, drawCard()]
                setDealerCards(dealerHand)
                playSound("card")
                schedule(step, DEALER_DRAW_MS)
            } else {
                settle(player, dealerHand, wagered)
            }
        }
        schedule(step, REVEAL_PAUSE_MS + DEALER_DRAW_MS)
    }

    /** Player busted (or doubled into a bust): reveal the hole card and settle. */
    const settleBust = (player: Card[], wagered: number): void => {
        setPhase("dealer")
        schedule(() => {
            setHoleHidden(false)
            settle(player, dealerCards, wagered)
        }, REVEAL_PAUSE_MS)
    }

    const addChip = (denomination: number): void => {
        setBet((value) => value + denomination)
        playSound("chip")
    }

    const deal = (): void => {
        if (phase !== "betting" || bet === 0) {
            return
        }
        setBankroll((value) => value - bet)
        setPlayerCards([])
        setDealerCards([])
        setResult(null)
        setHoleHidden(true)
        setPhase("dealing")

        // Casino order: player, dealer up, player, dealer hole.
        const first = drawCard()
        const upcard = drawCard()
        const second = drawCard()
        const hole = drawCard()
        const player = [first, second]
        const dealer = [upcard, hole]

        schedule(() => {
            setPlayerCards([first])
            playSound("card")
        }, 0)
        schedule(() => {
            setDealerCards([upcard])
            playSound("card")
        }, DEAL_STEP_MS)
        schedule(() => {
            setPlayerCards(player)
            playSound("card")
        }, DEAL_STEP_MS * 2)
        schedule(() => {
            setDealerCards(dealer)
            playSound("card")
        }, DEAL_STEP_MS * 3)
        schedule(
            () => {
                if (isBlackjack(player) || isBlackjack(dealer)) {
                    setHoleHidden(false)
                    settle(player, dealer, bet)
                } else {
                    setPhase("player")
                }
            },
            DEAL_STEP_MS * 4 + 250,
        )
    }

    const hit = (): void => {
        const next = [...playerCards, drawCard()]
        setPlayerCards(next)
        playSound("card")
        const { total } = handTotal(next)
        if (total > 21) {
            settleBust(next, bet)
        } else if (total === 21) {
            beginDealerTurn(next, bet)
        }
    }

    const stand = (): void => {
        beginDealerTurn(playerCards, bet)
    }

    const doubleDown = (): void => {
        setBankroll((value) => value - bet)
        const doubled = bet * 2
        setBet(doubled)
        const next = [...playerCards, drawCard()]
        setPlayerCards(next)
        playSound("card")
        if (handTotal(next).total > 21) {
            settleBust(next, doubled)
        } else {
            beginDealerTurn(next, doubled)
        }
    }

    const newHand = (): void => {
        setPlayerCards([])
        setDealerCards([])
        setResult(null)
        setHoleHidden(true)
        setBet(0)
        setPhase("betting")
    }

    const takeHouseCredit = (): void => {
        setBankroll(STARTING_BANKROLL)
        playSound("chip")
    }

    const broke = bankroll === 0 && bet === 0
    const canDouble = playerCards.length === 2 && bankroll >= bet

    const statusMessage =
        phase === "betting"
            ? broke
                ? "Bankroll empty — take house credit"
                : bet > 0
                  ? `Bet ${formatMoney(bet)} — press deal`
                  : "Place your bet"
            : phase === "dealing"
              ? "Dealing"
              : phase === "player"
                ? "Your move — hit, stand, or double"
                : phase === "dealer"
                  ? "Dealer plays"
                  : result
                    ? RESULT_STATUS[result.kind]
                    : "Hand over"

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <header className={styles.header}>
                    <div className={styles.wordmarkBlock}>
                        <span className={styles.wordmark}>Blackjack</span>
                        <span className={styles.tagline}>The house deals. Twenty-one or bust.</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={soundOn ? styles.button : styles.buttonMuted}
                            onClick={() => setSoundOn((value) => !value)}
                        >
                            {soundOn ? "Sound on" : "Sound off"}
                        </button>
                        <button
                            className={styles.buttonPrimary}
                            onClick={newHand}
                            disabled={phase !== "settled"}
                        >
                            New hand
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Bankroll</header>
                            <div className={styles.moneyRow}>
                                <span>Cash</span>
                                <span className={styles.moneyValue}>{formatMoney(bankroll)}</span>
                            </div>
                            <div className={styles.moneyRow}>
                                <span>Bet</span>
                                <span className={styles.moneyValue}>{formatMoney(bet)}</span>
                            </div>
                            <div className={styles.chipRow}>
                                {CHIP_DENOMINATIONS.map((denomination) => (
                                    <button
                                        key={denomination}
                                        className={CHIP_CLASSES[denomination] ?? styles.chipRed}
                                        onClick={() => addChip(denomination)}
                                        disabled={phase !== "betting" || bet + denomination > bankroll}
                                    >
                                        ${denomination}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.betButtonRow}>
                                <button
                                    className={styles.dealButton}
                                    onClick={deal}
                                    disabled={phase !== "betting" || bet === 0}
                                >
                                    Deal
                                </button>
                                <button
                                    className={styles.clearButton}
                                    onClick={() => setBet(0)}
                                    disabled={phase !== "betting" || bet === 0}
                                >
                                    Clear bet
                                </button>
                                {broke && phase === "betting" && (
                                    <button className={styles.creditButton} onClick={takeHouseCredit}>
                                        House credit {formatMoney(STARTING_BANKROLL)}
                                    </button>
                                )}
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Table rules</header>
                            <ul className={styles.ruleList}>
                                <li>{DECK_COUNT}-deck shoe</li>
                                <li>Dealer stands on all 17s</li>
                                <li>Blackjack pays 3:2</li>
                                <li>Double on first two cards</li>
                            </ul>
                        </section>
                    </aside>

                    <main className={styles.tableArea}>
                        <BlackjackTable
                            dealerCards={dealerCards}
                            playerCards={playerCards}
                            holeHidden={holeHidden}
                            bet={bet}
                            result={result}
                            shuffling={shuffling}
                            actionsEnabled={phase === "player"}
                            canDouble={canDouble}
                            onHit={hit}
                            onStand={stand}
                            onDouble={doubleDown}
                        />
                        <div className={styles.controlsHint}>
                            Chips build your bet — double takes exactly one more card
                        </div>
                    </main>

                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Session</header>
                            {stats.hands > 0 ? (
                                <dl className={styles.stats}>
                                    <div>
                                        <dt>Hands</dt>
                                        <dd>{stats.hands}</dd>
                                    </div>
                                    <div>
                                        <dt>Wins</dt>
                                        <dd>{stats.wins}</dd>
                                    </div>
                                    <div>
                                        <dt>Pushes</dt>
                                        <dd>{stats.pushes}</dd>
                                    </div>
                                    <div>
                                        <dt>Biggest win</dt>
                                        <dd>{formatMoney(stats.biggestWin)}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className={styles.muted}>No hands yet. Place a bet.</p>
                            )}
                        </section>
                    </aside>
                </div>

                <footer className={styles.statusBar}>
                    <span>
                        {phase === "betting" ? "Table open" : phase === "settled" ? "Hand over" : "In play"}
                    </span>
                    <span>{statusMessage}</span>
                    <span>Shoe {shoeCount} cards</span>
                </footer>
            </div>
        </div>
    )
}

function loadBankroll(): number {
    const value = readStoredNumber(BANKROLL_STORAGE_KEY, -1)
    return value >= 0 ? value : STARTING_BANKROLL
}
