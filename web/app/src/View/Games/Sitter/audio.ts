// Sitter's house-sound cue map over the shared game synth (see @base/core GameAudio).

import { createTone } from "@base/core"

const bleep = createTone({ type: "triangle", volume: 0.05 })

export const sounds = {
    /** Ding-dong: the shift starts. */
    doorbell: (): void => {
        bleep({ frequency: 659, durationMs: 220, type: "sine", volume: 0.06 })
        setTimeout(() => bleep({ frequency: 523, durationMs: 380, type: "sine", volume: 0.06 }), 240)
    },
    /** A mishap fixed with the right tool. */
    plink: (): void => bleep({ frequency: 880, durationMs: 90, volume: 0.05 }),
    /** Wrong tool. */
    buzz: (): void => bleep({ frequency: 110, durationMs: 160, type: "sawtooth", volume: 0.05 }),
    /** Quick pitch wobbles — the kids think your mistake is hilarious. */
    giggle: (): void => {
        bleep({ frequency: 620, durationMs: 90, glideTo: 780, volume: 0.04 })
        setTimeout(() => bleep({ frequency: 700, durationMs: 90, glideTo: 560, volume: 0.04 }), 110)
        setTimeout(() => bleep({ frequency: 660, durationMs: 120, glideTo: 840, volume: 0.04 }), 220)
    },
    /** A mishap hardened into a mess (low thud). */
    mess: (): void => bleep({ frequency: 90, durationMs: 240, type: "square", volume: 0.05 }),
    /** UH OH — the scripted big event just kicked off. */
    alarm: (): void => {
        bleep({ frequency: 440, durationMs: 140, type: "square", volume: 0.05 })
        setTimeout(() => bleep({ frequency: 440, durationMs: 140, type: "square", volume: 0.05 }), 180)
    },
    /** Parents-home door chime. */
    chime: (): void => {
        bleep({ frequency: 523, durationMs: 160, type: "sine", volume: 0.06 })
        setTimeout(() => bleep({ frequency: 659, durationMs: 160, type: "sine", volume: 0.06 }), 170)
        setTimeout(() => bleep({ frequency: 784, durationMs: 320, type: "sine", volume: 0.06 }), 340)
    },
}
