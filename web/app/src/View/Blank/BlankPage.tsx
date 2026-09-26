import React from "react"
import * as styles from "./BlankPage.styles.css"

/**
 * The spaceboy starter — the first page every new project shows. Pure scene,
 * no copy: the crayon rocket looping through a near-black night, the brand
 * artwork (the hand-drawn spaceship from the app icon) staged as a night
 * scene. Brand refresh Sep 2026, replacing the boy-holding-the-moon
 * composition. Replace it with the app's real home once the product has one.
 *
 * MIRROR: the workspace shows this same scene client-side while the pod
 * boots (main repo, web/app/src/View/Spaceboy/SpaceboyNightScene.tsx) so
 * the crossfade to the live preview is invisible, and the customer-site
 * holding page (main repo, firebase/functions HoldingPage.ts) carries it
 * too. The workspace cannot import kernel views — if you change the art
 * here, change it there as well. The composition is a single centered
 * vignette, so no landscape/portrait re-staging is needed.
 */

/**
 * Deterministic star field (seeded PRNG, not Math.random) so the sky is
 * identical on every render and screenshot.
 */
function starField(): Array<{ left: string; top: string; size: number; duration: string; delay: string }> {
    let seed = 0x5eedb0
    const next = (): number => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
    }
    return Array.from({ length: 80 }, () => ({
        left: `${(next() * 100).toFixed(2)}%`,
        // Keep stars in the sky's upper band, clear of the rocket.
        top: `${(next() * 72).toFixed(2)}%`,
        size: 1 + next() * 1.6,
        duration: `${(2 + next() * 4).toFixed(1)}s`,
        delay: `${(next() * 3).toFixed(1)}s`,
    }))
}

const stars = starField()

export default function BlankPage(): React.ReactElement {
    return (
        <div className={styles.page}>
            {stars.map((s, index) => (
                <span
                    key={index}
                    className={styles.star}
                    style={{
                        left: s.left,
                        top: s.top,
                        width: s.size,
                        height: s.size,
                        animationDuration: s.duration,
                        animationDelay: s.delay,
                    }}
                    aria-hidden
                />
            ))}
            <span className={styles.grain} aria-hidden />
            {/* The crayon rocket and its curly-cue trail, roughened to a wax
                stroke — the same doodle as the workspace night scene. */}
            <svg
                className={styles.scene}
                viewBox="0 0 480 360"
                role="img"
                aria-label="A crayon rocket looping through the night sky"
            >
                <defs>
                    <filter id="spaceboy-rough" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.05"
                            numOctaves="3"
                            seed="7"
                            result="noise"
                        />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
                    </filter>
                </defs>
                <g
                    filter="url(#spaceboy-rough)"
                    fill="none"
                    stroke="#f4f7ff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path
                        d="M60 330 C 140 348, 210 330, 262 282 C 300 246, 282 206, 252 220 C 226 233, 238 270, 286 258 C 330 246, 332 198, 352 154"
                        strokeWidth="4"
                        opacity="0.6"
                    />
                    <g transform="translate(366, 128) rotate(40)" strokeWidth="4.5" opacity="0.9">
                        <path d="M0 -52 C 11 -40, 14 -18, 9 0 L-9 0 C -14 -18, -11 -40, 0 -52 Z" />
                        <circle cx="0" cy="-27" r="6" stroke="#ffc43d" />
                        <path d="M-9 -10 C -16 -6, -20 2, -19 8 L -9 2" />
                        <path d="M9 -10 C 16 -6, 20 2, 19 8 L 9 2" />
                        <path d="M-5 5 L -2 16 L 0 8 L 3 17 L 6 5" stroke="#ffc43d" strokeWidth="3.5" />
                    </g>
                </g>
            </svg>
        </div>
    )
}
