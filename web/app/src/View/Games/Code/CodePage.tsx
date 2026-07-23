import React, { useEffect, useMemo, useState } from "react"
import { sounds } from "./audio"
import {
    Block,
    CommandBlock,
    Outcome,
    RunResult,
    Step,
    StepEvent,
    flattenProgram,
    parseLevel,
    runProgram,
    scoreRun,
    slotCount,
    tileKey,
} from "./interpreter"
import { Facing, LEVELS } from "./levels"
import * as styles from "./CodePage.styles.css"

/** Milliseconds between executed program steps (also the robot's slide time). */
const STEP_MS = 350
/** Pixel size of one board tile. */
const TILE_PX = 52
/** localStorage key holding unlocked level + stars earned per level. */
const PROGRESS_KEY = "code.progress"

const FACING_DEGREES: Record<Facing, number> = { north: 0, east: 90, south: 180, west: 270 }

const STEP_SOUNDS: Record<StepEvent, () => void> = {
    move: sounds.tick,
    turn: sounds.turn,
    star: sounds.star,
    feed: sounds.fanfare,
    bonk: sounds.bonk,
    fall: sounds.fall,
}

const FAIL_INFO: Record<Exclude<Outcome, "fed">, { title: string; status: string; note: string }> = {
    bonk: { title: "BONK! 🧱", status: "HIT A WALL.", note: "The robot smacked into a wall. Re-route it!" },
    fell: { title: "SPLAT! 🕳️", status: "FELL IN A PIT.", note: "The robot fell. Steer around the holes!" },
    outOfCode: {
        title: "OUT OF CODE!",
        status: "PROGRAM ENDED EARLY.",
        note: "The blocks ran out before the pet got fed. Add more!",
    },
}

const BLOCK_LABELS: Record<CommandBlock["kind"], string> = {
    move: "⬆️ MOVE",
    turnLeft: "↩️ LEFT",
    turnRight: "↪️ RIGHT",
}

const REPEAT_TIMES_CHOICES = [2, 3, 4, 5]

interface Progress {
    unlocked: number
    stars: number[]
}

function loadProgress(): Progress {
    try {
        const raw = window.localStorage.getItem(PROGRESS_KEY)
        if (raw) {
            const saved = JSON.parse(raw) as Progress
            if (typeof saved.unlocked === "number" && Array.isArray(saved.stars)) {
                return {
                    unlocked: Math.max(1, Math.min(saved.unlocked, LEVELS.length)),
                    stars: saved.stars,
                }
            }
        }
    } catch {
        // Corrupt save: start fresh.
    }
    return { unlocked: 1, stars: [] }
}

type Overlay = { kind: "clear"; stars: number } | { kind: "fail"; outcome: Exclude<Outcome, "fed"> }

function starRow(earned: number): string {
    return "★".repeat(earned) + "☆".repeat(3 - earned)
}

function blockClass(kind: CommandBlock["kind"]): string {
    return kind === "move" ? styles.blockMove : styles.blockTurn
}

/** Home surface for the `code` pack: block-programming robot puzzles — code a path to feed the pet. */
export default function CodePage(): React.ReactElement {
    const [levelIndex, setLevelIndex] = useState(0)
    const [progress, setProgress] = useState<Progress>(loadProgress)
    const [program, setProgram] = useState<Block[]>([])
    const [openRepeat, setOpenRepeat] = useState(false)
    const [repeatTimes, setRepeatTimes] = useState(3)
    const [run, setRun] = useState<RunResult | null>(null)
    const [stepIndex, setStepIndex] = useState(-1)
    const [running, setRunning] = useState(false)
    const [overlay, setOverlay] = useState<Overlay | null>(null)
    const [soundOn, setSoundOn] = useState(true)
    const [status, setStatus] = useState("READY.")

    const level = LEVELS[levelIndex]
    const parsed = useMemo(() => parseLevel(level), [level])
    const usedSlots = slotCount(program)
    const canAddBlock = !running && usedSlots < level.slotLimit

    useEffect(() => {
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    }, [progress])

    // Playback: advance one step per tick; after the final step, settle the run.
    useEffect(() => {
        if (!running || !run) {
            return
        }
        const timer = window.setTimeout(() => {
            const next = stepIndex + 1
            if (next < run.steps.length) {
                if (soundOn) {
                    STEP_SOUNDS[run.steps[next].event]()
                }
                setStepIndex(next)
                return
            }
            setRunning(false)
            if (run.outcome === "fed") {
                const earned = scoreRun(level, program, run)
                setProgress((prev) => {
                    const stars = [...prev.stars]
                    stars[levelIndex] = Math.max(stars[levelIndex] ?? 0, earned)
                    return {
                        unlocked: Math.max(prev.unlocked, Math.min(levelIndex + 2, LEVELS.length)),
                        stars,
                    }
                })
                setOverlay({ kind: "clear", stars: earned })
                setStatus("LEVEL CLEAR! 💕")
            } else {
                setOverlay({ kind: "fail", outcome: run.outcome })
                setStatus(FAIL_INFO[run.outcome].status)
            }
        }, STEP_MS)
        return () => window.clearTimeout(timer)
    }, [running, run, stepIndex, soundOn, level, program, levelIndex])

    const currentStep: Step | null = run && stepIndex >= 0 ? run.steps[stepIndex] : null

    // Cumulative rotation per step so the robot never spins the long way around.
    const rotations = useMemo(() => {
        if (!run) {
            return []
        }
        let degrees = FACING_DEGREES[level.facing]
        return run.steps.map((step) => {
            if (step.event === "turn") {
                degrees += step.command === "turnRight" ? 90 : -90
            }
            return degrees
        })
    }, [run, level])

    const collectedStars = useMemo(() => {
        const keys = new Set<string>()
        if (run) {
            for (let i = 0; i <= stepIndex && i < run.steps.length; i++) {
                const collected = run.steps[i].collectedStar
                if (collected) {
                    keys.add(collected)
                }
            }
        }
        return keys
    }, [run, stepIndex])

    const resetRun = (): void => {
        setRunning(false)
        setRun(null)
        setStepIndex(-1)
        setOverlay(null)
        setStatus("READY.")
    }

    const selectLevel = (index: number): void => {
        if (index >= progress.unlocked) {
            return
        }
        setLevelIndex(index)
        setProgram([])
        setOpenRepeat(false)
        resetRun()
    }

    // Any edit invalidates the previous run, so the robot pops back to start.
    const editProgram = (updater: (previous: Block[]) => Block[]): void => {
        if (running) {
            return
        }
        setProgram(updater)
        setRun(null)
        setStepIndex(-1)
        setOverlay(null)
        setStatus("READY.")
    }

    const appendSimple = (kind: CommandBlock["kind"]): void => {
        if (!canAddBlock) {
            return
        }
        editProgram((previous) => {
            const last = previous[previous.length - 1]
            if (openRepeat && last?.kind === "repeat") {
                return [...previous.slice(0, -1), { ...last, body: [...last.body, { kind }] }]
            }
            return [...previous, { kind }]
        })
    }

    const appendRepeat = (): void => {
        if (!canAddBlock || openRepeat) {
            return
        }
        editProgram((previous) => [...previous, { kind: "repeat", times: repeatTimes, body: [] }])
        setOpenRepeat(true)
    }

    const removeTopBlock = (index: number): void => {
        if (program[index].kind === "repeat") {
            setOpenRepeat(false)
        }
        editProgram((previous) => previous.filter((_, i) => i !== index))
    }

    const removeInnerBlock = (repeatIndex: number, bodyIndex: number): void => {
        editProgram((previous) =>
            previous.map((block, i) =>
                i === repeatIndex && block.kind === "repeat"
                    ? { ...block, body: block.body.filter((_, j) => j !== bodyIndex) }
                    : block,
            ),
        )
    }

    const handleRun = (): void => {
        setOpenRepeat(false)
        setOverlay(null)
        setRun(runProgram(level, program))
        setStepIndex(-1)
        setRunning(true)
        setStatus("RUNNING…")
    }

    const robotX = currentStep ? currentStep.x : parsed.startX
    const robotY = currentStep ? currentStep.y : parsed.startY
    const robotDegrees = currentStep ? rotations[stepIndex] : FACING_DEGREES[level.facing]
    const robotClass =
        currentStep?.event === "bonk"
            ? styles.robotBonk
            : currentStep?.event === "fall"
              ? styles.robotFall
              : styles.robot

    const isActiveBlock = (path: number[]): boolean =>
        running &&
        currentStep !== null &&
        currentStep.blockPath.length === path.length &&
        currentStep.blockPath.every((value, i) => value === path[i])

    const totalStarsEarned = progress.stars.reduce((sum, stars) => sum + (stars ?? 0), 0)

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>🤖 CodeBot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.toolbar}>
                    <button
                        className={styles.chunkyRun}
                        onClick={handleRun}
                        disabled={running || flattenProgram(program).length === 0}
                    >
                        ▶ RUN
                    </button>
                    <button className={styles.chunky} onClick={() => setRunning(false)} disabled={!running}>
                        ■ STOP
                    </button>
                    <button className={styles.chunky} onClick={resetRun}>
                        ⟲ RESET
                    </button>
                    <button
                        className={soundOn ? styles.chunkyLit : styles.chunky}
                        onClick={() => setSoundOn((value) => !value)}
                    >
                        {soundOn ? "🔊 Sound" : "🔇 Sound"}
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={running ? styles.runBadgeOn : styles.runBadge}>
                        {running ? "● EXECUTING" : "○ IDLE"}
                    </span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Levels</header>
                            {LEVELS.map((entry, index) => {
                                const locked = index >= progress.unlocked
                                const rowClass = locked
                                    ? styles.levelRowLocked
                                    : index === levelIndex
                                      ? styles.levelRowActive
                                      : styles.levelRow
                                return (
                                    <button
                                        key={entry.name}
                                        className={rowClass}
                                        onClick={() => selectLevel(index)}
                                        disabled={locked}
                                    >
                                        <span>
                                            {index + 1}. {entry.name}
                                        </span>
                                        <span className={styles.levelStars}>
                                            {locked ? "🔒" : starRow(progress.stars[index] ?? 0)}
                                        </span>
                                    </button>
                                )
                            })}
                        </section>

                        <section className={styles.panelBrand}>
                            <div className={styles.brandName}>CODEBOT</div>
                            <div className={styles.brandTag}>Write the code. Feed the pet. 🤖</div>
                        </section>
                    </aside>

                    <main className={styles.stageColumn}>
                        <div className={styles.stage}>
                            <div
                                className={styles.board}
                                style={{
                                    gridTemplateColumns: `repeat(${parsed.width}, ${TILE_PX}px)`,
                                    gridTemplateRows: `repeat(${parsed.height}, ${TILE_PX}px)`,
                                }}
                            >
                                {level.grid.map((row, y) =>
                                    Array.from(row).map((tileChar, x) => {
                                        const key = tileKey(x, y)
                                        const tileClass =
                                            tileChar === "#"
                                                ? styles.tileWall
                                                : tileChar === "O"
                                                  ? styles.tilePit
                                                  : styles.tile
                                        const content =
                                            tileChar === "#"
                                                ? "🧱"
                                                : tileChar === "O"
                                                  ? "🕳️"
                                                  : tileChar === "*"
                                                    ? collectedStars.has(key)
                                                        ? ""
                                                        : "⭐"
                                                    : tileChar === "P"
                                                      ? level.pet
                                                      : ""
                                        return (
                                            <span key={key} className={tileClass}>
                                                {content}
                                            </span>
                                        )
                                    }),
                                )}
                                <span
                                    className={robotClass}
                                    style={{
                                        left: robotX * TILE_PX,
                                        top: robotY * TILE_PX,
                                        width: TILE_PX,
                                        height: TILE_PX,
                                        transform: `rotate(${robotDegrees}deg)`,
                                        transitionDuration: `${STEP_MS}ms`,
                                    }}
                                >
                                    <span className={styles.robotHeading}>▲</span>
                                    🤖
                                </span>
                                {currentStep?.event === "feed" && (
                                    <span
                                        className={styles.hearts}
                                        style={{
                                            left: parsed.petX * TILE_PX + TILE_PX / 2 - 10,
                                            top: parsed.petY * TILE_PX - 8,
                                        }}
                                    >
                                        💕
                                    </span>
                                )}
                            </div>

                            {overlay && (
                                <div className={styles.overlay}>
                                    {overlay.kind === "clear" ? (
                                        <>
                                            <div className={styles.overlayTitle}>
                                                LEVEL CLEAR! {level.pet}💕
                                            </div>
                                            <div className={styles.overlayStars}>
                                                {starRow(overlay.stars)}
                                            </div>
                                            {levelIndex + 1 < LEVELS.length ? (
                                                <button
                                                    className={styles.chunkyRun}
                                                    onClick={() => selectLevel(levelIndex + 1)}
                                                >
                                                    NEXT ▶
                                                </button>
                                            ) : (
                                                <div className={styles.overlayNote}>
                                                    All pets fed. You are a real programmer now! 🎓
                                                </div>
                                            )}
                                            <button className={styles.chunky} onClick={resetRun}>
                                                ⟲ REPLAY
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.overlayTitleFail}>
                                                {FAIL_INFO[overlay.outcome].title}
                                            </div>
                                            <div className={styles.overlayNote}>
                                                {FAIL_INFO[overlay.outcome].note}
                                            </div>
                                            <button className={styles.chunky} onClick={resetRun}>
                                                ⟲ TRY AGAIN
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <section className={styles.codeSection}>
                            <header className={styles.codeSectionHeader}>
                                <span>
                                    Program — {usedSlots}/{level.slotLimit} slots
                                </span>
                                <button className={styles.clearBtn} onClick={() => editProgram(() => [])}>
                                    🗑 Clear
                                </button>
                            </header>
                            <div className={styles.strip}>
                                {program.length === 0 && (
                                    <span className={styles.stripEmpty}>
                                        Click blocks below to build your program…
                                    </span>
                                )}
                                {program.map((block, index) =>
                                    block.kind === "repeat" ? (
                                        <span
                                            key={index}
                                            className={styles.blockRepeat}
                                            onClick={() => removeTopBlock(index)}
                                        >
                                            🔁 ×{block.times}
                                            <span
                                                className={styles.repeatBody}
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                {block.body.length === 0 && (
                                                    <span className={styles.stripEmpty}>…</span>
                                                )}
                                                {block.body.map((child, bodyIndex) => (
                                                    <button
                                                        key={bodyIndex}
                                                        className={`${blockClass(child.kind)} ${
                                                            isActiveBlock([index, bodyIndex])
                                                                ? styles.blockActive
                                                                : ""
                                                        }`}
                                                        onClick={() => removeInnerBlock(index, bodyIndex)}
                                                    >
                                                        {BLOCK_LABELS[child.kind]}
                                                    </button>
                                                ))}
                                            </span>
                                        </span>
                                    ) : (
                                        <button
                                            key={index}
                                            className={`${blockClass(block.kind)} ${
                                                isActiveBlock([index]) ? styles.blockActive : ""
                                            }`}
                                            onClick={() => removeTopBlock(index)}
                                        >
                                            {BLOCK_LABELS[block.kind]}
                                        </button>
                                    ),
                                )}
                            </div>
                        </section>

                        <section className={styles.codeSection}>
                            <header className={styles.codeSectionHeader}>
                                <span>Palette — click to add{openRepeat ? " (inside 🔁)" : ""}</span>
                            </header>
                            <div className={styles.paletteRow}>
                                {(Object.keys(BLOCK_LABELS) as CommandBlock["kind"][]).map((kind) => (
                                    <button
                                        key={kind}
                                        className={`${blockClass(kind)} ${styles.paletteBtn}`}
                                        onClick={() => appendSimple(kind)}
                                        disabled={!canAddBlock}
                                    >
                                        {BLOCK_LABELS[kind]}
                                    </button>
                                ))}
                                <button
                                    className={`${styles.blockRepeat} ${styles.paletteBtn}`}
                                    onClick={appendRepeat}
                                    disabled={!canAddBlock || openRepeat}
                                >
                                    🔁 REPEAT ×{repeatTimes}
                                </button>
                                {REPEAT_TIMES_CHOICES.map((times) => (
                                    <button
                                        key={times}
                                        className={
                                            times === repeatTimes ? styles.timesBtnOn : styles.timesBtn
                                        }
                                        onClick={() => setRepeatTimes(times)}
                                    >
                                        ×{times}
                                    </button>
                                ))}
                                {openRepeat && (
                                    <button
                                        className={`${styles.blockRepeat} ${styles.paletteBtn}`}
                                        onClick={() => setOpenRepeat(false)}
                                    >
                                        ✔ END 🔁
                                    </button>
                                )}
                            </div>
                        </section>
                    </main>

                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Mission</header>
                            <div className={styles.missionRow}>
                                <span className={styles.missionLabel}>Feed</span>
                                <span className={styles.missionValue}>{level.pet}</span>
                            </div>
                            <div className={styles.missionRow}>
                                <span className={styles.missionLabel}>Slots</span>
                                <span className={styles.missionValue}>
                                    {usedSlots}/{level.slotLimit}
                                </span>
                            </div>
                            <div className={styles.missionRow}>
                                <span className={styles.missionLabel}>Par</span>
                                <span className={styles.missionValue}>{level.par}</span>
                            </div>
                            <div className={styles.missionRow}>
                                <span className={styles.missionLabel}>⭐ Stars</span>
                                <span className={styles.missionValue}>
                                    {collectedStars.size}/{parsed.stars.length}
                                </span>
                            </div>
                            <p className={styles.missionHint}>💡 {level.hint}</p>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Scoring</header>
                            <div className={styles.missionRow}>
                                <span className={styles.missionLabel}>Feed the pet</span>
                                <span className={styles.missionValue}>★</span>
                            </div>
                            <div className={styles.missionRow}>
                                <span className={styles.missionLabel}>All bonus ⭐</span>
                                <span className={styles.missionValue}>★</span>
                            </div>
                            <div className={styles.missionRow}>
                                <span className={styles.missionLabel}>Within par</span>
                                <span className={styles.missionValue}>★</span>
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Legend</header>
                            <p className={styles.missionHint}>
                                🧱 wall — bonk!
                                <br />
                                🕳️ pit — don&apos;t fall in
                                <br />
                                ⭐ bonus star
                                <br />
                                🤖 you (▲ shows facing)
                            </p>
                        </section>
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>● {status}</span>
                    <span>
                        LVL {levelIndex + 1}/{LEVELS.length} · {level.name.toUpperCase()}
                    </span>
                    <span>
                        ⭐ {totalStarsEarned}/{LEVELS.length * 3}
                    </span>
                </div>
            </div>
        </div>
    )
}
