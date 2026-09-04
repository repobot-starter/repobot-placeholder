// Blackjack's casino cue map over the shared game synth (see @base/core GameAudio).

import { createTone } from "@base/core"

const bleep = createTone({ type: "triangle", volume: 0.04 })

/** Pitch sweep between two frequencies with the same decay envelope. */
function sweep(options: {
    from: number
    to: number
    durationMs: number
    type?: OscillatorType
    volume?: number
}): void {
    const { from, to, ...rest } = options
    bleep({ ...rest, frequency: from, glideTo: to })
}

export const sounds = {
    /** Two quick high clinks, like a chip dropped on a stack. */
    chip: (): void => {
        bleep({ frequency: 1680, durationMs: 40, volume: 0.05 })
        setTimeout(() => bleep({ frequency: 2240, durationMs: 55, volume: 0.04 }), 45)
    },
    /** Short downward swish for a card sliding out of the shoe. */
    card: (): void => sweep({ from: 880, to: 210, durationMs: 90, volume: 0.03 }),
    /** Rising three-note chime for a won hand. */
    win: (): void => {
        bleep({ frequency: 523, durationMs: 110, volume: 0.05 })
        setTimeout(() => bleep({ frequency: 659, durationMs: 110, volume: 0.05 }), 120)
        setTimeout(() => bleep({ frequency: 784, durationMs: 220, volume: 0.05 }), 240)
    },
    /** Extended fanfare reserved for a natural blackjack. */
    blackjack: (): void => {
        bleep({ frequency: 523, durationMs: 100, volume: 0.05 })
        setTimeout(() => bleep({ frequency: 659, durationMs: 100, volume: 0.05 }), 110)
        setTimeout(() => bleep({ frequency: 784, durationMs: 100, volume: 0.05 }), 220)
        setTimeout(() => bleep({ frequency: 1047, durationMs: 320, volume: 0.06 }), 330)
    },
    /** Neutral blip for a push. */
    push: (): void => bleep({ frequency: 440, durationMs: 130, type: "sine", volume: 0.04 }),
    /** Low descending thud for a bust or dealer win. */
    lose: (): void => sweep({ from: 180, to: 65, durationMs: 320, type: "sawtooth", volume: 0.05 }),
}
