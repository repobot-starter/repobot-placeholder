import { useEffect, useRef } from "react"

/**
 * Frames longer than this (tab was backgrounded, debugger paused) are clamped
 * so one giant dt never teleports a game's physics.
 */
const MAX_DT_SECONDS = 0.05

/**
 * Runs `onFrame` on a requestAnimationFrame loop for as long as the component
 * is mounted and `running` is true. The callback receives the clamped elapsed
 * time in seconds and the frame's `now` timestamp (performance.now clock).
 *
 * The latest callback is always used without restarting the loop, so callers
 * can pass an inline closure over fresh props/state.
 */
export function useAnimationFrameLoop(onFrame: (dt: number, now: number) => void, running = true): void {
    const onFrameRef = useRef(onFrame)
    onFrameRef.current = onFrame

    useEffect(() => {
        if (!running) {
            return
        }
        let frameId: number
        let lastTime = performance.now()

        const tick = (now: number): void => {
            frameId = requestAnimationFrame(tick)
            const dt = Math.min(MAX_DT_SECONDS, (now - lastTime) / 1000)
            lastTime = now
            onFrameRef.current(dt, now)
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [running])
}
