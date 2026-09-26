// Style's glam cue map over the shared game synth (see @base/core GameAudio).

import { createTone, getGameAudioContext } from "@base/core"

const bleep = createTone({ type: "triangle", volume: 0.05 })

// Applause is a burst of filtered white noise with a slow fade — close enough
// to a cheering crowd for a runway finale.
function noiseBurst(durationMs: number, volume: number): void {
    const ctx = getGameAudioContext()
    const length = Math.floor((ctx.sampleRate * durationMs) / 1000)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = 1800
    filter.Q.value = 0.6
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    source.start()
}

export const sounds = {
    /** Countdown tick for the final seconds. */
    tick: (): void => bleep({ frequency: 880, durationMs: 70, type: "square", volume: 0.035 }),
    /** Soft blip when an item goes on the model. */
    pick: (): void => bleep({ frequency: 620, durationMs: 80 }),
    /** Rising sparkle arpeggio when the judges reveal the verdict. */
    sparkle: (): void => {
        const notes = [523, 659, 784, 1047, 1319]
        notes.forEach((frequency, index) => {
            setTimeout(() => bleep({ frequency, durationMs: 140, volume: 0.045 }), index * 90)
        })
    },
    /** Crowd applause for a high-scoring look. */
    applause: (): void => {
        noiseBurst(900, 0.08)
        setTimeout(() => noiseBurst(700, 0.05), 350)
    },
}
