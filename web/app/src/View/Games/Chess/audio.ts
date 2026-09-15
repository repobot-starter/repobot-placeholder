// Chess's board-sound cue map over the shared game synth (see @base/core GameAudio).

import { createTone } from "@base/core"

const bleep = createTone({ type: "square", volume: 0.04 })

export const sounds = {
    /** Soft click for a quiet move. */
    move: (): void => bleep({ frequency: 520, durationMs: 45, type: "triangle", volume: 0.06 }),
    /** Low thunk for a capture. */
    capture: (): void => bleep({ frequency: 150, durationMs: 110, type: "sawtooth", volume: 0.07 }),
    /** Two-note chime for check. */
    check: (): void => {
        bleep({ frequency: 784, durationMs: 90, type: "sine", volume: 0.06 })
        setTimeout(() => bleep({ frequency: 988, durationMs: 140, type: "sine", volume: 0.06 }), 100)
    },
    /** Rising fanfare for checkmate or a draw. */
    gameOver: (): void => {
        bleep({ frequency: 523, durationMs: 120 })
        setTimeout(() => bleep({ frequency: 659, durationMs: 120 }), 130)
        setTimeout(() => bleep({ frequency: 784, durationMs: 240 }), 260)
    },
}
