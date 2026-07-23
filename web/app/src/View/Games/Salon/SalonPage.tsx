import React, { useState } from "react"
import { sounds } from "./audio"
import ClientHead, {
    Bubble,
    randomBubbles,
    randomSparkles,
    randomStrays,
    SCRUBS_TO_POP,
    Sparkle,
    Stray,
} from "./ClientHead"
import {
    ACCESSORIES,
    ACCESSORY_META,
    Client,
    DYE_SWATCHES,
    HAIR_COLORS,
    HAIR_LENGTHS,
    HAIR_TEXTURES,
    HairColor,
    HairLength,
    HairLook,
    HairTexture,
    LENGTH_LABELS,
    Mood,
    moodFor,
    pickReactionLine,
    POINTS_PER_MATCH,
    randomClient,
    REACTIONS,
    Score,
    scoreLook,
    TEXTURE_LABELS,
    Accessory,
} from "./clients"
import * as styles from "./SalonPage.styles.css"

type Station = "wash" | "cut" | "color" | "style" | "finish" | "reveal"

const STATIONS: { key: Station; label: string; emoji: string }[] = [
    { key: "wash", label: "Wash", emoji: "🫧" },
    { key: "cut", label: "Cut", emoji: "✂️" },
    { key: "color", label: "Color", emoji: "🎨" },
    { key: "style", label: "Style", emoji: "💈" },
    { key: "finish", label: "Finish", emoji: "✨" },
]

const STAGE_HINTS: Record<Station, string> = {
    wash: "Rub the bubbles with your mouse (or click them) to scrub!",
    cut: "Pick a length on the right, then click ✂️ on every stray strand",
    color: "Choose a dye swatch — watch the shimmer",
    style: "Pick a style and the hair redraws",
    finish: "Accessory? Spritz of shine? Then hit the big reveal!",
    reveal: "",
}

const BEST_STREAK_KEY = "salon.bestStreak"

function loadBestStreak(): number {
    const raw = localStorage.getItem(BEST_STREAK_KEY)
    const parsed = raw === null ? 0 : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
}

/** Home surface for the `salon` pack: a hair-salon glow-up game — wash, cut, color, style, and reveal. */
export default function SalonPage(): React.ReactElement {
    const [client, setClient] = useState<Client>(() => randomClient())
    const [look, setLook] = useState<HairLook>(client.startLook)
    const [station, setStation] = useState<Station>("wash")
    const [bubbles, setBubbles] = useState<Bubble[]>(() => randomBubbles())
    const [strays, setStrays] = useState<Stray[]>([])
    const [lengthChosen, setLengthChosen] = useState(false)
    const [hasDyed, setHasDyed] = useState(false)
    const [hasStyled, setHasStyled] = useState(false)
    const [shimmerToken, setShimmerToken] = useState(0)
    const [sparkles, setSparkles] = useState<Sparkle[]>([])
    const [score, setScore] = useState<Score | null>(null)
    const [mood, setMood] = useState<Mood>("happy")
    const [reactionLine, setReactionLine] = useState("")
    const [streak, setStreak] = useState(0)
    const [bestStreak, setBestStreak] = useState(loadBestStreak)
    const [soundOn, setSoundOn] = useState(true)
    const [status, setStatus] = useState("A new client sits down. Read the request card!")

    const play = soundOn ? sounds : null
    const poppedCount = bubbles.filter((bubble) => bubble.scrubs >= SCRUBS_TO_POP).length
    const cleanliness = bubbles.length === 0 ? 1 : poppedCount / bubbles.length
    const messiness = station === "reveal" ? 0 : 1 - cleanliness
    const straysLeft = strays.filter((stray) => !stray.snipped).length
    const cutDone = lengthChosen && straysLeft === 0

    const advance = (next: Station, message: string): void => {
        setStation(next)
        setStatus(message)
        play?.select()
    }

    const handleScrub = (id: number): void => {
        const target = bubbles.find((bubble) => bubble.id === id)
        if (!target || target.scrubs >= SCRUBS_TO_POP) {
            return
        }
        const next = bubbles.map((bubble) =>
            bubble.id === id ? { ...bubble, scrubs: bubble.scrubs + 1 } : bubble,
        )
        setBubbles(next)
        if (target.scrubs + 1 >= SCRUBS_TO_POP) {
            play?.pop()
        }
        if (next.every((bubble) => bubble.scrubs >= SCRUBS_TO_POP)) {
            advance("cut", "Squeaky clean! On to the cut. ✂️")
        } else {
            setStatus("Scrub-a-dub…")
        }
    }

    const chooseLength = (length: HairLength): void => {
        setLook((current) => ({ ...current, length }))
        setStrays(randomStrays(length))
        setLengthChosen(true)
        play?.select()
        setStatus("Nice cut — now snip those stray strands!")
    }

    const handleSnip = (id: number): void => {
        setStrays((current) =>
            current.map((stray) => (stray.id === id ? { ...stray, snipped: true } : stray)),
        )
        play?.snip()
        const remaining = strays.filter((stray) => !stray.snipped && stray.id !== id).length
        setStatus(
            remaining === 0
                ? "Sharp! Ready for color."
                : `${remaining} stray strand${remaining === 1 ? "" : "s"} left…`,
        )
    }

    const applyDye = (color: HairColor): void => {
        setLook((current) => ({ ...current, color }))
        setHasDyed(true)
        setShimmerToken((token) => token + 1)
        play?.shimmer()
        setStatus(`${DYE_SWATCHES[color].label} dye — gorgeous!`)
    }

    const chooseTexture = (texture: HairTexture): void => {
        setLook((current) => ({ ...current, texture }))
        setHasStyled(true)
        play?.select()
        setStatus(`${TEXTURE_LABELS[texture].label} it is!`)
    }

    const chooseAccessory = (accessory: Accessory): void => {
        setLook((current) => ({ ...current, accessory }))
        play?.select()
    }

    const spritz = (): void => {
        setSparkles(randomSparkles(12))
        play?.sparkle()
        setStatus("So shiny! ✨")
    }

    const reveal = (): void => {
        const result = scoreLook(client.request, look, cleanliness)
        const nextMood = moodFor(result)
        setScore(result)
        setMood(nextMood)
        setReactionLine(pickReactionLine(nextMood))
        setStation("reveal")
        setSparkles(randomSparkles(14))
        const happy = nextMood !== "grimace"
        const nextStreak = happy ? streak + 1 : 0
        setStreak(nextStreak)
        if (nextStreak > bestStreak) {
            setBestStreak(nextStreak)
            localStorage.setItem(BEST_STREAK_KEY, String(nextStreak))
        }
        if (happy) {
            play?.tada()
        } else {
            play?.womp()
        }
        setStatus(happy ? "The mirror never lies — fabulous!" : "Oof. The next one will be better.")
    }

    const nextClient = (): void => {
        const fresh = randomClient()
        setClient(fresh)
        setLook(fresh.startLook)
        setStation("wash")
        setBubbles(randomBubbles())
        setStrays([])
        setLengthChosen(false)
        setHasDyed(false)
        setHasStyled(false)
        setShimmerToken(0)
        setSparkles([])
        setScore(null)
        setStatus(`${fresh.name} sits down. Read the request card!`)
    }

    const currentIndex = station === "reveal" ? STATIONS.length : STATIONS.findIndex((s) => s.key === station)

    return (
        <div className={styles.page}>
            <div className={styles.console}>
                <div className={styles.titleBar}>
                    <span>🤖 SalonBot</span>
                    <span className={styles.titleControls}>
                        <span className={styles.titleBtn}>_</span>
                        <span className={styles.titleBtn}>□</span>
                        <span className={styles.titleBtn}>✕</span>
                    </span>
                </div>

                <div className={styles.toolbar}>
                    <button className={styles.chunky} onClick={nextClient}>
                        💺 New Client
                    </button>
                    <button
                        className={soundOn ? styles.chunkyLit : styles.chunky}
                        onClick={() => setSoundOn((value) => !value)}
                    >
                        {soundOn ? "🔊 Sound" : "🔇 Sound"}
                    </button>
                    <span className={styles.toolbarSpacer} />
                    <span className={styles.streakBadge}>💇 STREAK: {streak}</span>
                </div>

                <div className={styles.layout}>
                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>💌 Request Card</header>
                            <div className={styles.requestRow}>
                                <span>📏</span>
                                {LENGTH_LABELS[client.request.length]}
                            </div>
                            <div className={styles.requestRow}>
                                <span
                                    className={styles.colorChip}
                                    style={{ background: DYE_SWATCHES[client.request.color].fill }}
                                />
                                {DYE_SWATCHES[client.request.color].label}
                            </div>
                            <div className={styles.requestRow}>
                                <span>{TEXTURE_LABELS[client.request.texture].emoji}</span>
                                {TEXTURE_LABELS[client.request.texture].label}
                            </div>
                            {client.request.accessory !== null ? (
                                <div className={styles.requestRow}>
                                    <span>{ACCESSORY_META[client.request.accessory].emoji}</span>
                                    {ACCESSORY_META[client.request.accessory].label}, please!
                                </div>
                            ) : null}
                            <p className={styles.muted}>…and a good scrub! ✨</p>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>In the Chair</header>
                            <div className={styles.requestRow}>
                                <span>💺</span>
                                {client.name}
                            </div>
                            <div className={styles.requestRow}>
                                <span>{client.debris === "leaf" ? "🍂" : "🍬"}</span>
                                {client.debris === "leaf" ? "Leaf in hair!" : "Gum in hair!"}
                            </div>
                        </section>

                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Happy Streak</header>
                            <dl className={styles.stats}>
                                <div>
                                    <dt>🔥 Current</dt>
                                    <dd>{streak}</dd>
                                </div>
                                <div>
                                    <dt>🏆 Best</dt>
                                    <dd>{bestStreak}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className={styles.panelBrand}>
                            <div className={styles.brandName}>SALONBOT</div>
                            <div className={styles.brandTag}>Fix it. Fluff it. Fabulous. 💖</div>
                        </section>
                    </aside>

                    <main className={styles.stage}>
                        {station === "reveal" && score !== null ? (
                            <>
                                <div className={styles.moodBubble}>
                                    {REACTIONS[mood].emoji} “{reactionLine}”
                                </div>
                                <div className={styles.revealRow}>
                                    <div className={styles.revealCard}>
                                        <span className={styles.revealLabel}>Before 😱</span>
                                        <div className={styles.revealMirror}>
                                            <ClientHead
                                                client={client}
                                                look={client.startLook}
                                                messiness={1}
                                                shimmerToken={0}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.revealCardAfter}>
                                        <span className={styles.revealLabel}>After ✨</span>
                                        <div className={styles.revealMirror}>
                                            <ClientHead
                                                client={client}
                                                look={look}
                                                messiness={0}
                                                shimmerToken={0}
                                                sparkles={sparkles}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    className={
                                        station === "cut"
                                            ? `${styles.stageMirror} ${styles.cutting}`
                                            : styles.stageMirror
                                    }
                                >
                                    <ClientHead
                                        client={client}
                                        look={look}
                                        messiness={messiness}
                                        shimmerToken={shimmerToken}
                                        bubbles={
                                            station === "wash"
                                                ? bubbles.filter((bubble) => bubble.scrubs < SCRUBS_TO_POP)
                                                : undefined
                                        }
                                        onScrub={handleScrub}
                                        strays={station === "cut" ? strays : undefined}
                                        onSnip={handleSnip}
                                        sparkles={station === "finish" ? sparkles : undefined}
                                    />
                                </div>
                                <div className={styles.stageHint}>{STAGE_HINTS[station]}</div>
                            </>
                        )}
                    </main>

                    <aside className={styles.panelColumn}>
                        <section className={styles.panel}>
                            <header className={styles.panelHeader}>Stations</header>
                            {STATIONS.map((entry, index) => (
                                <div
                                    key={entry.key}
                                    className={
                                        index === currentIndex
                                            ? styles.stationRowActive
                                            : index < currentIndex
                                              ? styles.stationRowDone
                                              : styles.stationRow
                                    }
                                >
                                    <span>{entry.emoji}</span>
                                    {entry.label}
                                    <span className={styles.stationState}>
                                        {index < currentIndex ? "✔" : index === currentIndex ? "▶" : ""}
                                    </span>
                                </div>
                            ))}
                        </section>

                        {station === "wash" ? (
                            <section className={styles.panel}>
                                <header className={styles.panelHeader}>🫧 Wash</header>
                                <div className={styles.meterWrap}>
                                    <span className={styles.meterLabel}>Cleanliness</span>
                                    <div className={styles.meterTrack}>
                                        <div
                                            className={styles.meterFill}
                                            style={{ width: `${Math.round(cleanliness * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <p className={styles.muted}>Pop every bubble to fill the meter.</p>
                            </section>
                        ) : null}

                        {station === "cut" ? (
                            <section className={styles.panel}>
                                <header className={styles.panelHeader}>✂️ Cut</header>
                                <div className={styles.optionGrid}>
                                    {HAIR_LENGTHS.map((length) => (
                                        <button
                                            key={length}
                                            className={
                                                lengthChosen && look.length === length
                                                    ? styles.optionBtnActive
                                                    : styles.optionBtn
                                            }
                                            onClick={() => chooseLength(length)}
                                        >
                                            {LENGTH_LABELS[length]}
                                        </button>
                                    ))}
                                </div>
                                <p className={styles.muted}>
                                    {!lengthChosen
                                        ? "Choose a target length."
                                        : straysLeft > 0
                                          ? `Snip ${straysLeft} stray strand${straysLeft === 1 ? "" : "s"}!`
                                          : "Clean cut! ✂️"}
                                </p>
                                <button
                                    className={styles.nextBtn}
                                    disabled={!cutDone}
                                    onClick={() => advance("color", "Pick a dye!")}
                                >
                                    Next: Color →
                                </button>
                            </section>
                        ) : null}

                        {station === "color" ? (
                            <section className={styles.panel}>
                                <header className={styles.panelHeader}>🎨 Color</header>
                                <div className={styles.swatchGrid}>
                                    {HAIR_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            title={DYE_SWATCHES[color].label}
                                            className={
                                                hasDyed && look.color === color
                                                    ? styles.swatchBtnActive
                                                    : styles.swatchBtn
                                            }
                                            style={{ background: DYE_SWATCHES[color].fill }}
                                            onClick={() => applyDye(color)}
                                        />
                                    ))}
                                </div>
                                <button
                                    className={styles.nextBtn}
                                    disabled={!hasDyed}
                                    onClick={() => advance("style", "Pick a style!")}
                                >
                                    Next: Style →
                                </button>
                            </section>
                        ) : null}

                        {station === "style" ? (
                            <section className={styles.panel}>
                                <header className={styles.panelHeader}>💈 Style</header>
                                <div className={styles.optionGrid}>
                                    {HAIR_TEXTURES.map((texture) => (
                                        <button
                                            key={texture}
                                            className={
                                                hasStyled && look.texture === texture
                                                    ? styles.optionBtnActive
                                                    : styles.optionBtn
                                            }
                                            onClick={() => chooseTexture(texture)}
                                        >
                                            {TEXTURE_LABELS[texture].emoji} {TEXTURE_LABELS[texture].label}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className={styles.nextBtn}
                                    disabled={!hasStyled}
                                    onClick={() => advance("finish", "Final touches…")}
                                >
                                    Next: Finish →
                                </button>
                            </section>
                        ) : null}

                        {station === "finish" ? (
                            <section className={styles.panel}>
                                <header className={styles.panelHeader}>✨ Finish</header>
                                <div className={styles.optionGrid}>
                                    {ACCESSORIES.map((accessory) => (
                                        <button
                                            key={accessory}
                                            className={
                                                look.accessory === accessory
                                                    ? styles.optionBtnActive
                                                    : styles.optionBtn
                                            }
                                            onClick={() => chooseAccessory(accessory)}
                                        >
                                            {ACCESSORY_META[accessory].emoji}{" "}
                                            {ACCESSORY_META[accessory].label}
                                        </button>
                                    ))}
                                </div>
                                <button className={styles.spritzBtn} onClick={spritz}>
                                    💦 Spritz of shine
                                </button>
                                <button className={styles.nextBtn} onClick={reveal}>
                                    🪞 The big reveal!
                                </button>
                            </section>
                        ) : null}

                        {station === "reveal" && score !== null ? (
                            <section className={styles.panel}>
                                <header className={styles.panelHeader}>🪞 Scorecard</header>
                                <dl className={styles.stats}>
                                    <div>
                                        <dt>📏 Length</dt>
                                        <dd>{score.lengthMatch ? `✔ +${POINTS_PER_MATCH}` : "✘ 0"}</dd>
                                    </div>
                                    <div>
                                        <dt>🎨 Color</dt>
                                        <dd>{score.colorMatch ? `✔ +${POINTS_PER_MATCH}` : "✘ 0"}</dd>
                                    </div>
                                    <div>
                                        <dt>💈 Style</dt>
                                        <dd>{score.textureMatch ? `✔ +${POINTS_PER_MATCH}` : "✘ 0"}</dd>
                                    </div>
                                    {score.accessoryMatch !== null ? (
                                        <div>
                                            <dt>🎀 Accessory</dt>
                                            <dd>{score.accessoryMatch ? `✔ +${POINTS_PER_MATCH}` : "✘ 0"}</dd>
                                        </div>
                                    ) : null}
                                    <div>
                                        <dt>🫧 Wash bonus</dt>
                                        <dd>+{score.washBonus}</dd>
                                    </div>
                                    <div>
                                        <dt>Total</dt>
                                        <dd>
                                            {score.total} / {score.max}
                                        </dd>
                                    </div>
                                </dl>
                                <button className={styles.nextBtn} onClick={nextClient}>
                                    💺 Next client →
                                </button>
                            </section>
                        ) : null}
                    </aside>
                </div>

                <div className={styles.statusBar}>
                    <span>● {station.toUpperCase()}</span>
                    <span>{status}</span>
                    <span>BEST STREAK: {bestStreak}</span>
                </div>
            </div>
        </div>
    )
}
