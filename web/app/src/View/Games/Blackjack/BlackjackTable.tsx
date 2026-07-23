import React, { useEffect, useState } from "react"
import { Card, formatMoney, formatTotal, HandResult, handTotal, isRed, ResultKind } from "./cards"
import * as styles from "./BlackjackPage.styles.css"

interface BlackjackTableProps {
    dealerCards: Card[]
    playerCards: Card[]
    /** While true the dealer's second card renders face-down. */
    holeHidden: boolean
    bet: number
    result: HandResult | null
    shuffling: boolean
    /** True during the player's turn; shows the Hit/Stand/Double buttons. */
    actionsEnabled: boolean
    canDouble: boolean
    onHit: () => void
    onStand: () => void
    onDouble: () => void
}

const BANNER_TITLES: Record<ResultKind, string> = {
    blackjack: "BLACKJACK!",
    win: "WIN",
    push: "PUSH",
    bust: "BUST",
    lose: "DEALER WINS",
}

/**
 * The green felt. Purely presentational: renders both hands with live totals,
 * the bet spot, the per-hand result banner, and the player action buttons.
 * All game state lives in `BlackjackPage`.
 */
export default function BlackjackTable(props: BlackjackTableProps): React.ReactElement {
    const { dealerCards, playerCards, holeHidden, bet, result, shuffling } = props

    const dealerTotalText =
        dealerCards.length === 0
            ? null
            : holeHidden
              ? `showing ${handTotal([dealerCards[0]]).total}`
              : formatTotal(dealerCards)
    const playerTotalText = playerCards.length === 0 ? null : formatTotal(playerCards)

    const bannerClass =
        result === null
            ? null
            : result.kind === "push"
              ? styles.bannerPush
              : result.net > 0
                ? styles.bannerWin
                : styles.bannerLose

    return (
        <div className={styles.table}>
            <div className={styles.handArea}>
                <div className={styles.handLabel}>
                    <span>🤖 Dealer</span>
                    {dealerTotalText && <span className={styles.handTotalBadge}>{dealerTotalText}</span>}
                </div>
                <div className={styles.cardRow}>
                    {dealerCards.map((card, index) => (
                        <CardView
                            key={`${index}-${card.rank}${card.suit}`}
                            card={card}
                            faceUp={index !== 1 || !holeHidden}
                        />
                    ))}
                </div>
            </div>

            <div className={styles.tableCenter}>
                <div className={styles.tableMotto}>Blackjack pays 3 to 2 · Dealer stands on all 17s</div>
                <div className={styles.betSpot}>{bet > 0 ? formatMoney(bet) : "BET"}</div>
                {shuffling && <div className={styles.shuffleNote}>🔀 shuffling the shoe…</div>}
            </div>

            <div className={styles.handArea}>
                <div className={styles.cardRow}>
                    {playerCards.map((card, index) => (
                        <CardView key={`${index}-${card.rank}${card.suit}`} card={card} faceUp />
                    ))}
                </div>
                <div className={styles.handLabel}>
                    <span>👤 You</span>
                    {playerTotalText && <span className={styles.handTotalBadge}>{playerTotalText}</span>}
                </div>
                <div className={styles.actionRow}>
                    {props.actionsEnabled && (
                        <>
                            <button className={styles.actionButton} onClick={props.onHit}>
                                Hit
                            </button>
                            <button className={styles.actionButton} onClick={props.onStand}>
                                Stand
                            </button>
                            <button
                                className={styles.actionButton}
                                onClick={props.onDouble}
                                disabled={!props.canDouble}
                            >
                                Double
                            </button>
                        </>
                    )}
                </div>
            </div>

            {result && bannerClass && (
                <div className={bannerClass}>
                    <span className={styles.bannerTitle}>{BANNER_TITLES[result.kind]}</span>
                    <span className={styles.bannerNet}>
                        {result.net > 0
                            ? `+${formatMoney(result.net)}`
                            : result.net < 0
                              ? `-${formatMoney(-result.net)}`
                              : "bet returned"}
                    </span>
                </div>
            )}
        </div>
    )
}

/**
 * One playing card. Deals in with a slide/fade transition on mount and flips
 * in 3D whenever `faceUp` changes (used for the dealer's hole card reveal).
 */
function CardView({ card, faceUp }: { card: Card; faceUp: boolean }): React.ReactElement {
    const [dealt, setDealt] = useState(false)

    // Flip the "dealt" class one frame after mount so the deal-in transition runs.
    useEffect(() => {
        const frame = requestAnimationFrame(() => setDealt(true))
        return () => cancelAnimationFrame(frame)
    }, [])

    return (
        <div className={dealt ? styles.cardOuterDealt : styles.cardOuter}>
            <div className={faceUp ? styles.cardInnerFaceUp : styles.cardInnerFaceDown}>
                <div className={isRed(card) ? styles.cardFrontRed : styles.cardFrontBlack}>
                    <span className={styles.cardCorner}>{`${card.rank}\n${card.suit}`}</span>
                    <span className={styles.cardPip}>{card.suit}</span>
                    <span className={styles.cardCornerFlipped}>{`${card.rank}\n${card.suit}`}</span>
                </div>
                <div className={styles.cardBack} />
            </div>
        </div>
    )
}
