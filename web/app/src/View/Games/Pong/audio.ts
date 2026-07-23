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
    paddle: (): void => bleep({ frequency: 440, durationMs: 60 }),
    wall: (): void => bleep({ frequency: 220, durationMs: 50 }),
    score: (): void => bleep({ frequency: 130, durationMs: 260, type: "sawtooth", volume: 0.05 }),
    win: (): void => {
        bleep({ frequency: 523, durationMs: 120 })
        setTimeout(() => bleep({ frequency: 659, durationMs: 120 }), 130)
        setTimeout(() => bleep({ frequency: 784, durationMs: 240 }), 260)
    },
}
