// Asteroid's cue map over the shared game synth (see @base/core GameAudio).

import { createTone } from "@base/core"

const bleep = createTone({ type: "square", volume: 0.035 })

export const sounds = {
    fire: (): void => bleep({ frequency: 880, durationMs: 45 }),
    thrust: (): void => bleep({ frequency: 70, durationMs: 60, type: "sawtooth", volume: 0.02 }),
    breakLarge: (): void => bleep({ frequency: 110, durationMs: 180, type: "sawtooth", volume: 0.05 }),
    breakSmall: (): void => bleep({ frequency: 260, durationMs: 90, type: "sawtooth", volume: 0.04 }),
    crash: (): void => {
        bleep({ frequency: 160, durationMs: 200, type: "sawtooth", volume: 0.06 })
        setTimeout(() => bleep({ frequency: 80, durationMs: 320, type: "sawtooth", volume: 0.06 }), 120)
    },
    wave: (): void => {
        bleep({ frequency: 523, durationMs: 90 })
        setTimeout(() => bleep({ frequency: 784, durationMs: 140 }), 110)
    },
}
