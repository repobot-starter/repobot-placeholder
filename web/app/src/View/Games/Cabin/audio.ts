// Tiny WebAudio chime synth. The context is created lazily on first play so
// it always starts from a user gesture (browser autoplay policy).

import { SoundCue } from "./flight"

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
    const { frequency, durationMs, type = "sine", volume = 0.05 } = options
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

/** One synth voice per simulation sound cue. */
export const sounds: Record<SoundCue, () => void> = {
    pop: (): void => bleep({ frequency: 660, durationMs: 60, type: "triangle", volume: 0.04 }),
    request: (): void => bleep({ frequency: 520, durationMs: 80, volume: 0.03 }),
    serve: (): void => bleep({ frequency: 880, durationMs: 100, volume: 0.05 }),
    grumble: (): void => bleep({ frequency: 110, durationMs: 240, type: "sawtooth", volume: 0.05 }),
    intercom: (): void => {
        // Classic two-tone ding-dong.
        bleep({ frequency: 830, durationMs: 280, volume: 0.06 })
        setTimeout(() => bleep({ frequency: 622, durationMs: 380, volume: 0.06 }), 260)
    },
    sparkle: (): void => {
        bleep({ frequency: 880, durationMs: 110 })
        setTimeout(() => bleep({ frequency: 1109, durationMs: 110 }), 110)
        setTimeout(() => bleep({ frequency: 1319, durationMs: 220 }), 220)
    },
    landing: (): void => {
        // Fasten-seatbelt chime on touchdown.
        bleep({ frequency: 622, durationMs: 260, volume: 0.06 })
        setTimeout(() => bleep({ frequency: 830, durationMs: 260, volume: 0.06 }), 280)
        setTimeout(() => bleep({ frequency: 622, durationMs: 420, volume: 0.06 }), 560)
    },
}
