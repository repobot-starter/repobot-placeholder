package com.baseapp.android.view.games.style

import kotlin.math.roundToInt
import kotlin.random.Random

/**
 * One of the five outfit slots on the model, top to bottom. Mirrors the web
 * `SlotId` union in `web/app/src/View/Games/Style/wardrobe.ts`.
 */
enum class StyleSlotId { HAT, TOP, BOTTOM, SHOES, ACCESSORY }

/**
 * A closet item. [tags] drive judging: an item is on-theme when it shares at
 * least one tag with the round's theme. Same ids/tags as the web wardrobe.
 */
data class StyleItem(
    val id: String,
    val name: String,
    val emoji: String,
    /** Themes whose tags overlap these count the item as on-theme. */
    val tags: List<String>,
)

/** One tab of the closet: the slot it dresses plus its rack of items. */
data class StyleSlot(
    val id: StyleSlotId,
    val label: String,
    val icon: String,
    val items: List<StyleItem>,
)

/** A runway theme. An item matches when it shares at least one tag. */
data class StyleTheme(
    val name: String,
    val emoji: String,
    val tags: List<String>,
    /** Judge one-liners, picked at random for the verdict card. */
    val verdicts: List<String>,
)

/** The judge's verdict for one finished round. Mirrors the web `RoundScore`. */
data class StyleRoundScore(
    /** How many of the five worn items match the theme. */
    val matches: Int,
    /** All five slots filled? */
    val complete: Boolean,
    /** All five slots filled AND every item on-theme? */
    val fullMatch: Boolean,
    val total: Int,
    /** 0-5 stars for the verdict card. */
    val stars: Int,
)

/** A locked-in round result: the score plus the judge's one-liner. */
data class StyleVerdict(
    val score: StyleRoundScore,
    val line: String,
)

/**
 * Wardrobe catalog + scoring rules, ported verbatim from the web
 * `wardrobe.ts`. Pure data — keep ids, tags, and constants byte-for-byte in
 * sync so all platforms judge outfits identically. No Android or Compose
 * imports here.
 */
object StyleWardrobe {
    // Tunables — must match the web constants exactly.

    /** Seconds on the clock each round. */
    const val ROUND_SECONDS = 40

    /** Rounds in one season. */
    const val ROUNDS_PER_SEASON = 3

    /** Points per item that matches the theme. */
    const val MATCH_POINTS = 20

    /** Bonus when every single item matches the theme. */
    const val FULL_MATCH_BONUS = 20

    /** Small bonus just for filling all five slots — effort counts. */
    const val COMPLETE_OUTFIT_BONUS = 10

    /** Highest score a single round can earn. */
    const val MAX_ROUND_SCORE = MATCH_POINTS * 5 + FULL_MATCH_BONUS + COMPLETE_OUTFIT_BONUS

    /**
     * Persistence key for the best season score — the same string as the web
     * localStorage key so the two stores stay conceptually aligned.
     */
    const val BEST_SCORE_KEY = "style.bestScore"

    /**
     * The closet: five slots, each with its rack of items. Same order, ids,
     * names, emoji, and tags as the web `SLOTS`.
     */
    val SLOTS: List<StyleSlot> = listOf(
        StyleSlot(
            id = StyleSlotId.HAT,
            label = "Hats",
            icon = "🎩",
            items = listOf(
                StyleItem("top-hat", "Top Hat", "🎩", listOf("gala", "concert")),
                StyleItem("sun-hat", "Sun Hat", "👒", listOf("beach", "safari")),
                StyleItem("ball-cap", "Ball Cap", "🧢", listOf("sport", "school")),
                StyleItem("trek-helmet", "Trek Helmet", "⛑️", listOf("safari", "rain")),
                StyleItem("crown", "Crown", "👑", listOf("gala")),
                StyleItem("grad-cap", "Grad Cap", "🎓", listOf("school")),
                StyleItem("hair-bow", "Hair Bow", "🎀", listOf("pajama", "school", "gala")),
                StyleItem("earmuff-phones", "Earmuff Phones", "🎧", listOf("snow", "concert")),
            ),
        ),
        StyleSlot(
            id = StyleSlotId.TOP,
            label = "Tops",
            icon = "👗",
            items = listOf(
                StyleItem("ball-gown", "Ball Gown", "👗", listOf("gala")),
                StyleItem("band-tee", "Band Tee", "👕", listOf("concert", "school", "beach")),
                StyleItem("puffer-coat", "Puffer Coat", "🧥", listOf("snow", "rain")),
                StyleItem("safari-vest", "Safari Vest", "🦺", listOf("safari")),
                StyleItem("silk-robe", "Silk Robe", "👘", listOf("pajama", "gala")),
                StyleItem("martial-gi", "Martial Gi", "🥋", listOf("sport")),
                StyleItem("track-jersey", "Track Jersey", "🎽", listOf("sport", "beach")),
                StyleItem("smart-shirt", "Smart Shirt", "👔", listOf("school", "gala")),
            ),
        ),
        StyleSlot(
            id = StyleSlotId.BOTTOM,
            label = "Bottoms",
            icon = "👖",
            items = listOf(
                StyleItem("blue-jeans", "Blue Jeans", "👖", listOf("school", "concert", "safari")),
                StyleItem("board-shorts", "Board Shorts", "🩳", listOf("beach", "sport")),
                StyleItem("swimsuit", "Swimsuit", "🩱", listOf("beach")),
                StyleItem("silk-skirt", "Silk Skirt", "🥻", listOf("gala")),
                StyleItem("ski-pants", "Ski Pants", "🎿", listOf("snow")),
                StyleItem("sprint-shorts", "Sprint Shorts", "🩲", listOf("sport")),
                StyleItem("flannel-pjs", "Flannel PJs", "💤", listOf("pajama")),
            ),
        ),
        StyleSlot(
            id = StyleSlotId.SHOES,
            label = "Shoes",
            icon = "👠",
            items = listOf(
                StyleItem("heels", "Heels", "👠", listOf("gala")),
                StyleItem("sneakers", "Sneakers", "👟", listOf("sport", "school", "concert")),
                StyleItem("hiking-boots", "Hiking Boots", "🥾", listOf("safari", "rain")),
                StyleItem("flip-flops", "Flip-Flops", "🩴", listOf("beach", "pajama")),
                StyleItem("tall-boots", "Tall Boots", "👢", listOf("rain", "concert")),
                StyleItem("ice-skates", "Ice Skates", "⛸️", listOf("snow")),
                StyleItem("fuzzy-socks", "Fuzzy Socks", "🧦", listOf("pajama")),
                StyleItem("ballet-flats", "Ballet Flats", "🩰", listOf("gala", "school")),
            ),
        ),
        StyleSlot(
            id = StyleSlotId.ACCESSORY,
            label = "Extras",
            icon = "👜",
            items = listOf(
                StyleItem("handbag", "Handbag", "👜", listOf("gala", "school")),
                StyleItem("sunglasses", "Sunglasses", "🕶️", listOf("beach", "sport", "concert")),
                StyleItem("scarf", "Scarf", "🧣", listOf("snow")),
                StyleItem("umbrella", "Umbrella", "🌂", listOf("rain")),
                StyleItem("diamond-ring", "Diamond Ring", "💍", listOf("gala")),
                StyleItem("guitar", "Guitar", "🎸", listOf("concert")),
                StyleItem("teddy-bear", "Teddy Bear", "🧸", listOf("pajama")),
                StyleItem("camera", "Camera", "📷", listOf("safari", "beach")),
            ),
        ),
    )

    /** The eight runway themes, same order and data as the web `THEMES`. */
    val THEMES: List<StyleTheme> = listOf(
        StyleTheme(
            name = "Beach Day",
            emoji = "🏖️",
            tags = listOf("beach"),
            verdicts = listOf(
                "Sun-kissed and camera-ready!",
                "The sand called — it wants your autograph.",
            ),
        ),
        StyleTheme(
            name = "Gala Night",
            emoji = "💃",
            tags = listOf("gala"),
            verdicts = listOf(
                "Red carpet? More like rolled out just for you.",
                "The chandeliers are jealous.",
            ),
        ),
        StyleTheme(
            name = "Snow Trip",
            emoji = "❄️",
            tags = listOf("snow"),
            verdicts = listOf(
                "Frostbite could never touch this fit.",
                "Cooler than the slopes themselves.",
            ),
        ),
        StyleTheme(
            name = "Sport Star",
            emoji = "🏆",
            tags = listOf("sport"),
            verdicts = listOf(
                "Gold medal in looking fast.",
                "The scoreboard just gave you extra points.",
            ),
        ),
        StyleTheme(
            name = "Rainy School Run",
            emoji = "🌧️",
            tags = listOf("rain", "school"),
            verdicts = listOf(
                "Puddle-proof AND homework-proof.",
                "Even the rain stopped to stare.",
            ),
        ),
        StyleTheme(
            name = "Rock Concert",
            emoji = "🎸",
            tags = listOf("concert"),
            verdicts = listOf(
                "Front row hearts you. Backstage wants you.",
                "That outfit shreds harder than the encore.",
            ),
        ),
        StyleTheme(
            name = "Safari Adventure",
            emoji = "🦁",
            tags = listOf("safari"),
            verdicts = listOf(
                "The lions are taking style notes.",
                "Built for the bush, dressed for the cover shoot.",
            ),
        ),
        StyleTheme(
            name = "Pajama Party",
            emoji = "🌙",
            tags = listOf("pajama"),
            verdicts = listOf(
                "Certified coziest look in the sleepover.",
                "Dream-sequence levels of comfy glamour.",
            ),
        ),
    )

    /** True when the item shares at least one tag with the theme. */
    fun itemMatchesTheme(item: StyleItem, theme: StyleTheme): Boolean =
        item.tags.any { it in theme.tags }

    /**
     * Applies the scoring rules above to a finished outfit — the same math as
     * the web `scoreOutfit`, including the round-half-up star rating
     * ([roundToInt] and JS `Math.round` both round ties toward +∞).
     */
    fun scoreOutfit(outfit: Map<StyleSlotId, StyleItem>, theme: StyleTheme): StyleRoundScore {
        val worn = SLOTS.mapNotNull { outfit[it.id] }
        val matches = worn.count { itemMatchesTheme(it, theme) }
        val complete = worn.size == SLOTS.size
        val fullMatch = complete && matches == SLOTS.size
        val total = matches * MATCH_POINTS +
            (if (fullMatch) FULL_MATCH_BONUS else 0) +
            (if (complete) COMPLETE_OUTFIT_BONUS else 0)
        return StyleRoundScore(
            matches = matches,
            complete = complete,
            fullMatch = fullMatch,
            total = total,
            stars = (total.toDouble() / MAX_ROUND_SCORE * 5).roundToInt(),
        )
    }
}

/**
 * Pure Kotlin port of the web StyleBot round loop
 * (`web/app/src/View/Games/Style/StylePage.tsx` + `wardrobe.ts`) so the exact
 * same rules run on every platform and can be unit-tested on the JVM. No
 * Android or Compose imports here — rendering and input live in
 * `StyleGameView`.
 *
 * Timing is tick-driven: the view owns the clock and calls [tick]; the engine
 * never creates a timer. Randomness (theme shuffle, shuffle button, verdict
 * line) goes through the injected [random] so tests can make a whole season
 * deterministic.
 */
class StyleEngine(
    private val random: Random = Random.Default,
) {
    /** Where the game is in its round loop — the web `Phase` union. */
    enum class Phase { IDLE, DRESSING, WALKING, VERDICT, SEASON_OVER }

    /**
     * Discrete things that happened during one [tick] — the native twin of
     * the web page's timer/timeout effects. The view uses these to know when
     * to recompose; tests use them to assert on round flow.
     */
    enum class Event {
        /** One whole second came off the dressing clock. */
        SECOND_ELAPSED,

        /** The clock hit zero and the round auto-finished. */
        TIME_EXPIRED,

        /** The runway walk completed; the verdict card is now showing. */
        VERDICT_REVEALED,
    }

    var phase: Phase = Phase.IDLE
        private set

    /** This season's theme order; `themes[roundIndex]` is tonight's theme. */
    var themes: List<StyleTheme> = emptyList()
        private set

    /** Zero-based round within the season. */
    var roundIndex: Int = 0
        private set

    /** What the model is wearing; a missing key means the slot is empty. */
    var outfit: Map<StyleSlotId, StyleItem> = emptyMap()
        private set

    var secondsLeft: Int = StyleWardrobe.ROUND_SECONDS
        private set

    /** Locked-in totals for the rounds finished so far this season. */
    var roundScores: List<Int> = emptyList()
        private set

    /** The current round's result, set the moment the round finishes. */
    var verdict: StyleVerdict? = null
        private set

    /** Fraction of the current dressing second that has already elapsed. */
    private var dressingClock = 0f

    /** Seconds of runway walk completed so far. */
    private var walkClock = 0f

    val theme: StyleTheme?
        get() = themes.getOrNull(roundIndex)

    val seasonTotal: Int
        get() = roundScores.sum()

    /** True when the verdict on screen is for the season's final round. */
    val isFinalRound: Boolean
        get() = roundIndex + 1 >= StyleWardrobe.ROUNDS_PER_SEASON

    // ------------------------------------------------------------------
    // Season flow
    // ------------------------------------------------------------------

    /**
     * Deals a fresh shuffled theme deck and opens round 1's closet. The web
     * equivalent is `startSeason`.
     */
    fun startSeason() {
        themes = shuffledThemes()
        roundIndex = 0
        roundScores = emptyList()
        beginRound()
    }

    /**
     * Ends the dressing phase: locks in the score and sends the model down
     * the runway. Called by the Done! button and by the clock hitting zero.
     */
    fun finishRound() {
        val theme = theme
        if (phase != Phase.DRESSING || theme == null) {
            return
        }
        val score = StyleWardrobe.scoreOutfit(outfit, theme)
        verdict = StyleVerdict(score = score, line = theme.verdicts[random.nextInt(theme.verdicts.size)])
        roundScores = roundScores + score.total
        walkClock = 0f
        phase = Phase.WALKING
    }

    /**
     * Dismisses the verdict card: advances to the next round, or ends the
     * season after the final round. The caller persists the best score.
     */
    fun dismissVerdict() {
        if (phase != Phase.VERDICT) {
            return
        }
        if (isFinalRound) {
            phase = Phase.SEASON_OVER
        } else {
            roundIndex += 1
            beginRound()
        }
    }

    /**
     * Advance the clock by [dtSeconds]. Drives the dressing countdown (1Hz
     * decrements, auto finish at zero) and the runway walk (verdict reveal
     * after [WALK_DURATION_SECONDS]). Returns the discrete events that
     * occurred so the caller can react.
     */
    fun tick(dtSeconds: Float): List<Event> {
        val events = mutableListOf<Event>()
        when (phase) {
            Phase.DRESSING -> {
                dressingClock += dtSeconds
                while (dressingClock >= 1f && secondsLeft > 0) {
                    dressingClock -= 1f
                    secondsLeft -= 1
                    events.add(Event.SECOND_ELAPSED)
                    if (secondsLeft == 0) {
                        finishRound()
                        events.add(Event.TIME_EXPIRED)
                        break
                    }
                }
            }
            Phase.WALKING -> {
                walkClock += dtSeconds
                if (walkClock >= WALK_DURATION_SECONDS) {
                    phase = Phase.VERDICT
                    events.add(Event.VERDICT_REVEALED)
                }
            }
            Phase.IDLE, Phase.VERDICT, Phase.SEASON_OVER -> Unit
        }
        return events
    }

    // ------------------------------------------------------------------
    // Closet actions
    // ------------------------------------------------------------------

    /**
     * Puts the item in the slot, or takes it off when it is already worn —
     * the same toggle as the web `pickItem`. Only valid while dressing.
     */
    fun pick(item: StyleItem, slot: StyleSlotId) {
        if (phase != Phase.DRESSING) {
            return
        }
        outfit = if (outfit[slot]?.id == item.id) {
            outfit - slot
        } else {
            outfit + (slot to item)
        }
    }

    /** A random item in every slot — the shuffle button. */
    fun shuffleOutfit() {
        if (phase != Phase.DRESSING) {
            return
        }
        outfit = StyleWardrobe.SLOTS.associate { slot ->
            slot.id to slot.items[random.nextInt(slot.items.size)]
        }
    }

    /** Empties every slot — the clear button. */
    fun clearOutfit() {
        if (phase != Phase.DRESSING) {
            return
        }
        outfit = emptyMap()
    }

    // ------------------------------------------------------------------
    // Private
    // ------------------------------------------------------------------

    private fun beginRound() {
        outfit = emptyMap()
        secondsLeft = StyleWardrobe.ROUND_SECONDS
        dressingClock = 0f
        verdict = null
        phase = Phase.DRESSING
    }

    /**
     * The themes in a fresh random order — the web `shuffledThemes`
     * Fisher–Yates, with the injected RNG standing in for `Math.random`.
     */
    private fun shuffledThemes(): List<StyleTheme> {
        val deck = StyleWardrobe.THEMES.toMutableList()
        for (i in deck.size - 1 downTo 1) {
            val j = random.nextInt(i + 1)
            val swap = deck[i]
            deck[i] = deck[j]
            deck[j] = swap
        }
        return deck
    }

    companion object {
        /**
         * How long the runway strut lasts before the verdict card appears —
         * the web `WALK_DURATION_MS`.
         */
        const val WALK_DURATION_SECONDS = 2.6f
    }
}
