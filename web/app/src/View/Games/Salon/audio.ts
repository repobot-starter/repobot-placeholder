// Tiny WebAudio salon-foley synth. The context is created lazily on first
// play so it always starts from a user gesture (browser autoplay policy).

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

function tone(options: {
    frequency: number
    durationMs: number
    type?: OscillatorType
    volume?: number
    /** Optional frequency to glide to over the tone's duration. */
    glideTo?: number
    delayMs?: number
}): void {
    const { frequency, durationMs, type = "sine", volume = 0.05, glideTo, delayMs = 0 } = options
    const ctx = getContext()
    const start = ctx.currentTime + delayMs / 1000
    const end = start + durationMs / 1000
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    if (glideTo !== undefined) {
        oscillator.frequency.exponentialRampToValueAtTime(glideTo, end)
    }
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(end)
}

export const sounds = {
    /** Bubble pop at the wash station. */
    pop: (): void =>
        tone({ frequency: 620 + Math.random() * 240, durationMs: 70, glideTo: 1200, volume: 0.045 }),
    /** Scissor snip at the cut station. */
    snip: (): void => {
        tone({ frequency: 1500, durationMs: 45, type: "square", volume: 0.03 })
        tone({ frequency: 950, durationMs: 55, type: "square", volume: 0.03, delayMs: 55 })
    },
    /** Dye shimmer sweep at the color station. */
    shimmer: (): void =>
        tone({ frequency: 420, durationMs: 380, type: "triangle", glideTo: 1680, volume: 0.04 }),
    /** Small click for picking lengths, styles, and accessories. */
    select: (): void => tone({ frequency: 520, durationMs: 60, type: "triangle", volume: 0.04 }),
    /** Shine-spritz sparkle arpeggio at the finish station. */
    sparkle: (): void => {
        tone({ frequency: 1319, durationMs: 90 })
        tone({ frequency: 1568, durationMs: 90, delayMs: 80 })
        tone({ frequency: 2093, durationMs: 140, delayMs: 160 })
    },
    /** Ta-da reveal chord for a happy client. */
    tada: (): void => {
        for (const frequency of [523, 659, 784]) {
            tone({ frequency, durationMs: 420, type: "triangle", volume: 0.035 })
        }
        tone({ frequency: 1047, durationMs: 500, type: "triangle", volume: 0.04, delayMs: 180 })
    },
    /** Sad slide for a grimacing client. */
    womp: (): void =>
        tone({ frequency: 300, durationMs: 500, type: "sawtooth", glideTo: 150, volume: 0.045 }),
}
