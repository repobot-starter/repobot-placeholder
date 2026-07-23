// Tiny WebAudio bleep synth. The context is created lazily on first play so
// it always starts from a user gesture (browser autoplay policy).

let context: AudioContext | null = null

function getContext(): AudioContext {
    if (!context) {
        context = new AudioContext()
    }
    if (context.state === "suspended") {
        void context.resume()
    }
    return context
}

function bleep(options: {
    frequency: number
    durationMs: number
    type?: OscillatorType
    volume?: number
}): void {
    const { frequency, durationMs, type = "square", volume = 0.04 } = options
    const ctx = getContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + durationMs / 1000)
}

export const sounds = {
    /** Soft tick as the robot executes a move. */
    tick: (): void => bleep({ frequency: 620, durationMs: 45, volume: 0.03 }),
    /** Slightly lower tick for turns. */
    turn: (): void => bleep({ frequency: 440, durationMs: 45, volume: 0.03 }),
    /** Sparkle when a bonus star is collected. */
    star: (): void => {
        bleep({ frequency: 880, durationMs: 70, type: "triangle", volume: 0.05 })
        setTimeout(() => bleep({ frequency: 1320, durationMs: 110, type: "triangle", volume: 0.05 }), 70)
    },
    /** Dull thud when the robot walks into a wall. */
    bonk: (): void => bleep({ frequency: 110, durationMs: 200, type: "sawtooth", volume: 0.06 }),
    /** Descending whistle when the robot falls into a pit or off the grid. */
    fall: (): void => {
        bleep({ frequency: 520, durationMs: 120, type: "triangle", volume: 0.05 })
        setTimeout(() => bleep({ frequency: 330, durationMs: 140, type: "triangle", volume: 0.05 }), 110)
        setTimeout(() => bleep({ frequency: 180, durationMs: 220, type: "triangle", volume: 0.05 }), 230)
    },
    /** Fanfare arpeggio when the pet gets its treat. */
    fanfare: (): void => {
        bleep({ frequency: 523, durationMs: 120 })
        setTimeout(() => bleep({ frequency: 659, durationMs: 120 }), 120)
        setTimeout(() => bleep({ frequency: 784, durationMs: 120 }), 240)
        setTimeout(() => bleep({ frequency: 1047, durationMs: 280 }), 360)
    },
}
