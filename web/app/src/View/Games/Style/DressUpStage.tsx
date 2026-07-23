import React from "react"
import { Outfit } from "./wardrobe"
import * as styles from "./StylePage.styles.css"

interface DressUpStageProps {
    outfit: Outfit
    /** When true, the model struts across the runway with camera flashes. */
    walking: boolean
}

// Camera flashes + sparkles shown during the runway walk. Positions are data,
// not layout, so they ride along as inline styles.
const SPARKLES = [
    { emoji: "📸", left: "8%", top: "22%", delayMs: 0 },
    { emoji: "✨", left: "22%", top: "48%", delayMs: 250 },
    { emoji: "📸", left: "88%", top: "30%", delayMs: 420 },
    { emoji: "✨", left: "70%", top: "14%", delayMs: 610 },
    { emoji: "📸", left: "45%", top: "10%", delayMs: 140 },
    { emoji: "✨", left: "92%", top: "60%", delayMs: 330 },
]

/**
 * The catwalk: a stage with marquee lights, a hot-pink runway strip, and the
 * dress-up doll composed from stacked emoji layers. Purely presentational —
 * the page owns all game state. Each worn layer is keyed by item id so
 * swapping an item replays the bounce animation.
 */
export default function DressUpStage(props: DressUpStageProps): React.ReactElement {
    const { outfit, walking } = props

    return (
        <div className={styles.stage}>
            <div className={styles.runwayLights} />
            <div className={styles.runway} />

            <div className={walking ? styles.dollWalking : styles.doll}>
                <span className={styles.dollBase}>🧍</span>
                {outfit.top && (
                    <span key={outfit.top.id} className={styles.dollTop}>
                        {outfit.top.emoji}
                    </span>
                )}
                {outfit.bottom && (
                    <span key={outfit.bottom.id} className={styles.dollBottom}>
                        {outfit.bottom.emoji}
                    </span>
                )}
                {outfit.shoes && (
                    <span key={outfit.shoes.id} className={styles.dollShoes}>
                        {outfit.shoes.emoji}
                    </span>
                )}
                {outfit.hat && (
                    <span key={outfit.hat.id} className={styles.dollHat}>
                        {outfit.hat.emoji}
                    </span>
                )}
                {outfit.accessory && (
                    <span key={outfit.accessory.id} className={styles.dollAccessory}>
                        {outfit.accessory.emoji}
                    </span>
                )}
            </div>

            {walking &&
                SPARKLES.map((spark, index) => (
                    <span
                        key={index}
                        className={styles.sparkle}
                        style={{ left: spark.left, top: spark.top, animationDelay: `${spark.delayMs}ms` }}
                    >
                        {spark.emoji}
                    </span>
                ))}
        </div>
    )
}
