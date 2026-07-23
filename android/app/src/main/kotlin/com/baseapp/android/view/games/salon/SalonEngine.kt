package com.baseapp.android.view.games.salon

import kotlin.math.roundToInt
import kotlin.random.Random

/**
 * Pure Kotlin port of the web SalonBot game logic
 * (`web/app/src/View/Games/Salon/clients.ts` for content and scoring, plus
 * the station state machines that `SalonPage.tsx` keeps in React state and
 * the bubble/stray generators from `ClientHead.tsx`). No Android or Compose
 * imports here — rendering and input live in `SalonGameView`, so the rules
 * stay JVM-testable and in lockstep with the web game and the iOS twin.
 *
 * All randomness (client rolls, bubble/stray placement, reaction lines) goes
 * through the injected [Random], so tests can pin every roll with a seed or
 * a scripted source. Enum entry order matches the web arrays because client
 * generation picks by index (`floor(random * count)`).
 */
class SalonEngine(
    private val random: Random = Random.Default,
) {
    /** Hair lengths, in the web `HAIR_LENGTHS` order (labels: `LENGTH_LABELS`). */
    enum class HairLength(val label: String, val silhouetteBottom: Float) {
        SHORT("Short", 222f),
        MEDIUM("Medium", 272f),
        LONG("Long", 324f),
    }

    /**
     * Dye colors, in the web `HAIR_COLORS` order. Fill/highlight are ARGB
     * ints (web `DYE_SWATCHES` hex values) so the engine stays Compose-free.
     */
    enum class HairColor(val label: String, val fill: Long, val highlight: Long) {
        PINK("Pink", 0xFFF06EAA, 0xFFFFB8D9),
        BLUE("Blue", 0xFF4F8FE6, 0xFFA8CCF5),
        BLONDE("Blonde", 0xFFF2C94C, 0xFFFFE9A8),
        BROWN("Brown", 0xFF8A5A33, 0xFFC08A55),
        BLACK("Black", 0xFF3A3540, 0xFF6E6879),
        RED("Red", 0xFFCF4B32, 0xFFF0855F),
        PURPLE("Purple", 0xFF9A6FD0, 0xFFCDB0EE),
        MINT("Mint", 0xFF58C9A2, 0xFFA8EBD2),
    }

    /** Styles, in the web `HAIR_TEXTURES` order (web `TEXTURE_LABELS`). */
    enum class HairTexture(val label: String, val emoji: String) {
        STRAIGHT("Straight", "💇"),
        CURLY("Curly", "➿"),
        WAVES("Waves", "🌊"),
        UPDO("Updo", "🍥"),
        BRAIDS("Braids", "🪢"),
    }

    /**
     * Accessories, in the web `ACCESSORIES` order (web `ACCESSORY_META`).
     * `NONE` is a real pickable option at the finish station; a request with
     * no accessory wish is a null [Client.request] accessory instead.
     */
    enum class Accessory(val label: String, val emoji: String) {
        BOW("Bow", "🎀"),
        FLOWER("Flower", "💐"),
        CLIP("Clip", "⭐"),
        TIARA("Tiara", "👑"),
        NONE("None", "🙅"),
    }

    enum class Smile { SOFT, WIDE }

    /** What is stuck in the tangled walk-in hair. */
    enum class Debris { LEAF, GUM }

    /** A complete hairdo as rendered on a client's head (web `HairLook`). */
    data class HairLook(
        val length: HairLength,
        val color: HairColor,
        val texture: HairTexture,
        val accessory: Accessory,
    )

    /** What the client asks for; null accessory = no wish (web `ClientRequest`). */
    data class ClientRequest(
        val length: HairLength,
        val color: HairColor,
        val texture: HairTexture,
        val accessory: Accessory?,
    )

    /**
     * One customer: face parameters, the messy walk-in look, and a request
     * card (web `Client`). Skin/eye colors are ARGB ints from the web tables.
     */
    data class Client(
        val name: String,
        val skinTone: Long,
        val eyeColor: Long,
        val smile: Smile,
        val startLook: HairLook,
        val debris: Debris,
        val request: ClientRequest,
    )

    /**
     * One soap bubble at the wash station (web `Bubble`), in the 320x360
     * head-view space. A bubble pops after [SCRUBS_TO_POP] scrub passes.
     */
    data class WashBubble(
        val id: Int,
        val x: Float,
        val y: Float,
        val r: Float,
        val scrubs: Int,
    ) {
        val isPopped: Boolean get() = scrubs >= SCRUBS_TO_POP
    }

    /**
     * One stray strand poking out of the cut silhouette (web `Stray`).
     * [direction] is +1 (right side) or -1 (left side).
     */
    data class StrayStrand(
        val id: Int,
        val x: Float,
        val y: Float,
        val direction: Float,
        val snipped: Boolean,
    )

    /** A shine-spritz sparkle (web `Sparkle`); purely cosmetic. */
    data class Sparkle(
        val id: Int,
        val x: Float,
        val y: Float,
        val size: Float,
        val delayMs: Float,
    )

    /**
     * Per-attribute match breakdown (web `Score`). [accessoryMatch] is null
     * when the client had no accessory wish, and [max] shrinks by one match.
     */
    data class Score(
        val lengthMatch: Boolean,
        val colorMatch: Boolean,
        val textureMatch: Boolean,
        val accessoryMatch: Boolean?,
        val washBonus: Int,
        val total: Int,
        val max: Int,
    )

    /** How the client feels about their reveal (web `Mood` + `REACTIONS`). */
    enum class Mood(val emoji: String, val lines: List<String>) {
        DELIGHTED(
            "😍",
            listOf(
                "I LOVE it! You're a wizard with scissors!",
                "Stunning! I'm never going anywhere else!",
                "Best. Hair. Ever. I could cry!",
            ),
        ),
        HAPPY(
            "🙂",
            listOf(
                "Pretty nice! I'd come back.",
                "Not exactly what I asked for, but cute!",
                "Solid work, stylist. Solid work.",
            ),
        ),
        GRIMACE(
            "😬",
            listOf(
                "Um… did you read my request card?",
                "I asked for WHAT now?",
                "My hat is staying ON, thanks.",
            ),
        ),
    }

    /**
     * Play flow position (web `Station` union). Progression is strictly
     * linear: wash → cut → color → style → finish → reveal, like the web.
     */
    enum class Station(val label: String, val emoji: String, val hint: String) {
        WASH("Wash", "🫧", "Rub the bubbles with your finger (or tap them) to scrub!"),
        CUT("Cut", "✂️", "Pick a length below, then tap ✂️ on every stray strand"),
        COLOR("Color", "🎨", "Choose a dye swatch — gorgeous!"),
        STYLE("Style", "💈", "Pick a style and the hair redraws"),
        FINISH("Finish", "✨", "Accessory? Spritz of shine? Then hit the big reveal!"),
        REVEAL("Reveal", "🪞", ""),
    }

    // MARK: Session state (the web page's React state, minus sound/UI toggles)

    var client: Client = rollClient(random)
        private set

    /** The hairdo currently on the client's head; mutated station by station. */
    var look: HairLook = client.startLook
        private set
    var station: Station = Station.WASH
        private set
    var bubbles: List<WashBubble> = rollBubbles(random)
        private set
    var strays: List<StrayStrand> = emptyList()
        private set
    var sparkles: List<Sparkle> = emptyList()
        private set
    var lengthChosen: Boolean = false
        private set
    var hasDyed: Boolean = false
        private set
    var hasStyled: Boolean = false
        private set
    var score: Score? = null
        private set
    var mood: Mood = Mood.HAPPY
        private set
    var reactionLine: String = ""
        private set

    /** Consecutive non-grimace reveals (web streak; resets on a grimace). */
    var streak: Int = 0
        private set

    /**
     * Best streak this session. The web persists it in localStorage; the
     * native ports keep it in memory only (see PACK.md).
     */
    var bestStreak: Int = 0
        private set

    /** Status-bar message, verbatim web strings. */
    var status: String = "A new client sits down. Read the request card!"
        private set

    /** Monotonic id source for sparkles (web uses `Date.now()`). */
    private var sparkleStamp = 0

    // MARK: Derived state (web SalonPage derived consts)

    /** Fraction of bubbles popped; 1 when there are none (web `cleanliness`). */
    val cleanliness: Float
        get() = if (bubbles.isEmpty()) 1f else bubbles.count { it.isPopped } / bubbles.size.toFloat()

    /** 0 = freshly washed, 1 = just walked in; forced clean at the reveal. */
    val messiness: Float
        get() = if (station == Station.REVEAL) 0f else 1f - cleanliness

    val straysLeft: Int
        get() = strays.count { !it.snipped }

    /** The cut station is done once a length is chosen and every stray snipped. */
    val cutDone: Boolean
        get() = lengthChosen && straysLeft == 0

    // MARK: Wash station

    /**
     * One scrub pass over a bubble (web `handleScrub`; a touch enter or tap
     * is one pass). Returns true when this pass popped the bubble. Popping
     * every bubble auto-advances to the cut station, like the web.
     */
    fun scrub(bubbleId: Int): Boolean {
        if (station != Station.WASH) return false
        val target = bubbles.firstOrNull { it.id == bubbleId } ?: return false
        if (target.isPopped) return false

        val scrubbed = target.copy(scrubs = target.scrubs + 1)
        bubbles = bubbles.map { if (it.id == bubbleId) scrubbed else it }
        if (bubbles.all { it.isPopped }) {
            station = Station.CUT
            status = "Squeaky clean! On to the cut. ✂️"
        } else {
            status = "Scrub-a-dub…"
        }
        return scrubbed.isPopped
    }

    // MARK: Cut station

    /**
     * Choose the target length (web `chooseLength`): sets the look's length
     * and rolls a fresh batch of 2-3 stray strands to snip. Re-picking a
     * length re-rolls the strays, exactly like the web.
     */
    fun chooseLength(length: HairLength) {
        if (station != Station.CUT) return
        look = look.copy(length = length)
        strays = rollStrays(length, random)
        lengthChosen = true
        status = "Nice cut — now snip those stray strands!"
    }

    /** Snip one stray strand (web `handleSnip`). */
    fun snip(strayId: Int) {
        if (station != Station.CUT) return
        val target = strays.firstOrNull { it.id == strayId } ?: return
        if (target.snipped) return

        strays = strays.map { if (it.id == strayId) it.copy(snipped = true) else it }
        val remaining = straysLeft
        status = if (remaining == 0) {
            "Sharp! Ready for color."
        } else {
            "$remaining stray strand${if (remaining == 1) "" else "s"} left…"
        }
    }

    /** Leave the cut station once the cut is done (web "Next: Color" button). */
    fun advanceToColor() {
        if (station != Station.CUT || !cutDone) return
        station = Station.COLOR
        status = "Pick a dye!"
    }

    // MARK: Color station

    /** Apply a dye swatch (web `applyDye`). */
    fun applyDye(color: HairColor) {
        if (station != Station.COLOR) return
        look = look.copy(color = color)
        hasDyed = true
        status = "${color.label} dye — gorgeous!"
    }

    /** Leave the color station after at least one dye (web "Next: Style"). */
    fun advanceToStyle() {
        if (station != Station.COLOR || !hasDyed) return
        station = Station.STYLE
        status = "Pick a style!"
    }

    // MARK: Style station

    /** Pick a texture and the hair redraws (web `chooseTexture`). */
    fun chooseTexture(texture: HairTexture) {
        if (station != Station.STYLE) return
        look = look.copy(texture = texture)
        hasStyled = true
        status = "${texture.label} it is!"
    }

    /** Leave the style station after at least one pick (web "Next: Finish"). */
    fun advanceToFinish() {
        if (station != Station.STYLE || !hasStyled) return
        station = Station.FINISH
        status = "Final touches…"
    }

    // MARK: Finish station

    /** Place (or remove, via [Accessory.NONE]) an accessory (web `chooseAccessory`). */
    fun chooseAccessory(accessory: Accessory) {
        if (station != Station.FINISH) return
        look = look.copy(accessory = accessory)
    }

    /** Spritz of shine: rolls a fresh batch of cosmetic sparkles (web `spritz`). */
    fun spritz() {
        if (station != Station.FINISH) return
        sparkles = rollSparkles(12)
        status = "So shiny! ✨"
    }

    /**
     * The big reveal (web `reveal`): scores the look, picks a mood and
     * reaction line, and updates the happy streak.
     */
    fun reveal() {
        if (station != Station.FINISH) return
        val result = scoreLook(client.request, look, cleanliness)
        score = result
        mood = moodFor(result)
        reactionLine = pickReactionLine(mood)
        station = Station.REVEAL
        sparkles = rollSparkles(14)

        val happy = mood != Mood.GRIMACE
        streak = if (happy) streak + 1 else 0
        if (streak > bestStreak) {
            bestStreak = streak
        }
        status = if (happy) {
            "The mirror never lies — fabulous!"
        } else {
            "Oof. The next one will be better."
        }
    }

    // MARK: Next client

    /**
     * Roll a fresh client and reset every station (web `nextClient`). Also
     * the toolbar "New Client" action, which the web allows at any time.
     */
    fun nextClient() {
        val fresh = rollClient(random)
        client = fresh
        look = fresh.startLook
        station = Station.WASH
        bubbles = rollBubbles(random)
        strays = emptyList()
        sparkles = emptyList()
        lengthChosen = false
        hasDyed = false
        hasStyled = false
        score = null
        reactionLine = ""
        status = "${fresh.name} sits down. Read the request card!"
    }

    /** Random line from the mood's reaction table (web `pickReactionLine`). */
    fun pickReactionLine(mood: Mood): String = pick(mood.lines, random)

    /** Shine-spritz sparkles (web `randomSparkles`); fresh ids each call. */
    private fun rollSparkles(count: Int): List<Sparkle> {
        val stamp = sparkleStamp
        sparkleStamp += count
        return List(count) { index ->
            Sparkle(
                id = stamp + index,
                x = 70f + random.nextFloat() * 180f,
                y = 56f + random.nextFloat() * 210f,
                size = 14f + random.nextFloat() * 14f,
                delayMs = random.nextFloat() * 500f,
            )
        }
    }

    companion object {
        // Scoring constants — must stay in sync with the web `clients.ts`.
        /** Points for each request attribute the finished look matches. */
        const val POINTS_PER_MATCH = 25

        /** Extra points for a perfect scrub at the wash station. */
        const val WASH_BONUS_MAX = 25

        /** score/max ratio at or above which the client is delighted (web `moodFor`). */
        const val DELIGHTED_RATIO = 0.9f

        /** score/max ratio at or above which the client is at least happy. */
        const val HAPPY_RATIO = 0.55f

        /** Chance that a client has an accessory wish (web `ACCESSORY_WISH_CHANCE`). */
        const val ACCESSORY_WISH_CHANCE = 0.5f

        // Mini-game constants — must stay in sync with the web `ClientHead.tsx`.
        /** How many scrub passes pop one wash bubble (web `SCRUBS_TO_POP`). */
        const val SCRUBS_TO_POP = 2

        /** Soap bubbles per wash (web `randomBubbles` length). */
        const val BUBBLE_COUNT = 10

        /** Head-view coordinate space the bubbles/strays are placed in. */
        const val HEAD_VIEW_WIDTH = 320f
        const val HEAD_VIEW_HEIGHT = 360f

        /** x of the hair silhouette edges (web `SIDE_LEFT` / `SIDE_RIGHT`). */
        const val HAIR_SIDE_LEFT = 88f
        const val HAIR_SIDE_RIGHT = 232f

        // Content tables, verbatim from `clients.ts` (order matters for pick).
        val NAMES = listOf(
            "Luna", "Milo", "Zoe", "Kai", "Pippa", "Ravi",
            "Nova", "Theo", "Mimi", "Ozzy", "Ida", "Beau",
        )
        val SKIN_TONES = listOf(
            0xFFFFE0C7, 0xFFF3C9A6, 0xFFE0AC7E, 0xFFC68A5A, 0xFF9C6B43, 0xFF71492C,
        )
        val EYE_COLORS = listOf(0xFF4A3826, 0xFF2F4A6E, 0xFF3C6B4F, 0xFF5A4A7A)

        /** Walk-in hair colors; requests always ask for something different. */
        val WALK_IN_COLORS = listOf(HairColor.BROWN, HairColor.BLACK, HairColor.BLONDE, HairColor.RED)

        /**
         * Roll a fresh client (web `randomClient`). Random calls happen in
         * the same order as the web function. Invariants: the walk-in look is
         * always long/straight with no accessory, the requested color always
         * differs from the walk-in color, and an accessory wish is never
         * `NONE` — every request is satisfiable.
         */
        fun rollClient(random: Random): Client {
            val startColor = pick(WALK_IN_COLORS, random)
            val wantsAccessory = random.nextDouble() < ACCESSORY_WISH_CHANCE
            return Client(
                name = pick(NAMES, random),
                skinTone = pick(SKIN_TONES, random),
                eyeColor = pick(EYE_COLORS, random),
                smile = if (random.nextDouble() < 0.5) Smile.SOFT else Smile.WIDE,
                startLook = HairLook(
                    length = HairLength.LONG,
                    color = startColor,
                    texture = HairTexture.STRAIGHT,
                    accessory = Accessory.NONE,
                ),
                debris = if (random.nextDouble() < 0.5) Debris.LEAF else Debris.GUM,
                request = ClientRequest(
                    length = pick(HairLength.entries, random),
                    color = pick(HairColor.entries.filter { it != startColor }, random),
                    texture = pick(HairTexture.entries, random),
                    accessory = if (wantsAccessory) {
                        pick(Accessory.entries.filter { it != Accessory.NONE }, random)
                    } else {
                        null
                    },
                ),
            )
        }

        /** Soap bubbles scattered over the hair (web `randomBubbles`). */
        fun rollBubbles(random: Random): List<WashBubble> = List(BUBBLE_COUNT) { id ->
            WashBubble(
                id = id,
                x = 104f + random.nextFloat() * 112f,
                y = 94f + random.nextFloat() * 116f,
                r = 13f + random.nextFloat() * 8f,
                scrubs = 0,
            )
        }

        /**
         * 2-3 stray strands poking out of the cut silhouette (web
         * `randomStrays`). Even ids sprout from the right edge, odd ids from
         * the left, and the vertical span grows with the chosen length.
         */
        fun rollStrays(length: HairLength, random: Random): List<StrayStrand> {
            val bottom = length.silhouetteBottom
            val count = 2 + (random.nextDouble() * 2).toInt()
            return List(count) { index ->
                val direction = if (index % 2 == 0) 1f else -1f
                StrayStrand(
                    id = index,
                    x = if (direction == 1f) HAIR_SIDE_RIGHT else HAIR_SIDE_LEFT,
                    y = 155f + random.nextFloat() * maxOf(20f, bottom - 180f),
                    direction = direction,
                    snipped = false,
                )
            }
        }

        /**
         * Compare the finished look against the request card (web
         * `scoreLook`). [cleanliness] in [0, 1] converts to up to
         * [WASH_BONUS_MAX] bonus points.
         */
        fun scoreLook(request: ClientRequest, look: HairLook, cleanliness: Float): Score {
            val lengthMatch = look.length == request.length
            val colorMatch = look.color == request.color
            val textureMatch = look.texture == request.texture
            val accessoryMatch = request.accessory?.let { look.accessory == it }
            val washBonus = (cleanliness * WASH_BONUS_MAX).roundToInt()
            val matches = listOf(lengthMatch, colorMatch, textureMatch).count { it } +
                (if (accessoryMatch == true) 1 else 0)
            val max = POINTS_PER_MATCH * (if (request.accessory == null) 3 else 4) + WASH_BONUS_MAX
            return Score(
                lengthMatch = lengthMatch,
                colorMatch = colorMatch,
                textureMatch = textureMatch,
                accessoryMatch = accessoryMatch,
                washBonus = washBonus,
                total = POINTS_PER_MATCH * matches + washBonus,
                max = max,
            )
        }

        /** How the client feels about their reveal (web `moodFor`). */
        fun moodFor(score: Score): Mood {
            val ratio = score.total / score.max.toFloat()
            return when {
                ratio >= DELIGHTED_RATIO -> Mood.DELIGHTED
                ratio >= HAPPY_RATIO -> Mood.HAPPY
                else -> Mood.GRIMACE
            }
        }

        /**
         * Web `pick`: uniform index by flooring `random * count`, so a shared
         * random stream lands on the same entries as the web arrays.
         */
        private fun <T> pick(items: List<T>, random: Random): T =
            items[(random.nextDouble() * items.size).toInt()]
    }
}
