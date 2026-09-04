// Pong's cue map over the shared game synth (see @base/core GameAudio).

import { createTone } from "@base/core"

const bleep = createTone({ type: "square", volume: 0.04 })

export const sounds = {
    paddle: (): void => bleep({ frequency: 440, durationMs: 60 }),
    wall: (): void => bleep({ frequency: 220, durationMs: 50 }),
    score: (): void => bleep({ frequency: 130, durationMs: 260, type: "sawtooth", volume: 0.05 }),
    win: (): void => {
        bleep({ frequency: 523, durationMs: 120 })
        setTimeout(() => bleep({ frequency: 659, durationMs: 120 }), 130)
        setTimeout(() => bleep({ frequency: 784, durationMs: 240 }), 260)
    },
}
