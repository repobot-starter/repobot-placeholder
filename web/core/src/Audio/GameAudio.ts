/**
 * Shared WebAudio bleep synth core for the game packs. The context is created
 * lazily on first play so it always starts from a user gesture (browser
 * autoplay policy). Each pack keeps its own `sounds` cue map in a local
 * `audio.ts`, defined over a tone function from `createTone`.
 */

let context: AudioContext | null = null

/** Lazily creates (and resumes) the shared AudioContext. */
export function getGameAudioContext(): AudioContext {
    if (!context) {
        context = new AudioContext()
    }
    if (context.state === "suspended") {
        void context.resume()
    }
    return context
}

export interface GameToneOptions {
    frequency: number
    durationMs: number
    type?: OscillatorType
    volume?: number
    /** Optional frequency to glide to over the tone's duration. */
    glideTo?: number
    /** Optional start delay, scheduled on the audio clock. */
    delayMs?: number
}

export interface GameToneDefaults {
    type: OscillatorType
    volume: number
}

/**
 * Builds a bleep/tone player with the pack's default oscillator type and
 * volume. Every tone is a single oscillator with an exponential gain decay
 * over `durationMs` — the envelope every pack's hand-rolled synth used.
 */
export function createTone(defaults: GameToneDefaults): (options: GameToneOptions) => void {
    return (options: GameToneOptions): void => {
        const {
            frequency,
            durationMs,
            type = defaults.type,
            volume = defaults.volume,
            glideTo,
            delayMs = 0,
        } = options
        const ctx = getGameAudioContext()
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
}
