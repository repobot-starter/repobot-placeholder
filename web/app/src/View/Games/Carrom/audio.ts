// Carrom's click cue map over the shared game synth (see @base/core GameAudio).
// No assets, no network.

import { createTone } from "@base/core"

const bleep = createTone({ type: "triangle", volume: 0.05 })

export const sounds = {
    /** Coin-on-coin knock; intensity in [0,1] scales pitch and volume. */
    click: (intensity: number): void =>
        bleep({
            frequency: 900 + intensity * 500,
            durationMs: 45,
            volume: 0.02 + intensity * 0.05,
        }),
    /** Duller cushion thud when a piece hits the frame. */
    cushion: (intensity: number): void =>
        bleep({
            frequency: 320 + intensity * 120,
            durationMs: 55,
            type: "sine",
            volume: 0.015 + intensity * 0.04,
        }),
    /** Descending plop as a piece drops into a pocket. */
    pocket: (): void => {
        bleep({ frequency: 520, durationMs: 70, type: "sine", volume: 0.06 })
        setTimeout(() => bleep({ frequency: 300, durationMs: 120, type: "sine", volume: 0.05 }), 60)
    },
    /** Sour buzz for a striker foul. */
    foul: (): void => bleep({ frequency: 140, durationMs: 260, type: "sawtooth", volume: 0.045 }),
    /** Little ascending arpeggio for a board or match win. */
    win: (): void => {
        bleep({ frequency: 523, durationMs: 120 })
        setTimeout(() => bleep({ frequency: 659, durationMs: 120 }), 130)
        setTimeout(() => bleep({ frequency: 784, durationMs: 240 }), 260)
    },
}
