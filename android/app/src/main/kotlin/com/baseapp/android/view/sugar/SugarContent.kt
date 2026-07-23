package com.baseapp.android.view.sugar

/**
 * All content for the pastry-machine site, mirrored from the web pack's
 * content.ts. To make this template yours, replace the brand, lineups,
 * and machines below. Prices are in cents; times are minutes since
 * midnight (7 * 60 = 7:00 AM).
 */
object SugarContent {
    data class Pastry(
        val name: String,
        val emoji: String,
        val description: String,
        /** Price in cents so arithmetic and formatting stay exact. */
        val priceCents: Int,
    )

    /** One day's case. The lineup rotates daily through this list. */
    data class Lineup(val title: String, val pastries: List<Pastry>)

    data class Machine(
        val name: String,
        /** Where to actually find it, written like you'd text a friend. */
        val spot: String,
        val note: String?,
        val schedule: SugarFreshness.MachineSchedule,
    )

    data class Step(val emoji: String, val title: String, val text: String)

    const val NAME = "The Sugar Bin"
    const val TAGLINE = "Fresh pastries from a little pink machine."
    const val STORY =
        "Every morning before dawn, our bakers fill each Sugar Bin with pastries made that night — " +
            "no day-olds, no freezer, no apologies. When a machine sells out, it sells out. " +
            "Whatever's left at closing goes to the neighborhood shelter, and we start again tomorrow."

    val howItWorks =
        listOf(
            Step(
                emoji = "🌙",
                title = "Baked overnight",
                text =
                    "Our kitchen starts at midnight so everything in the bin was made hours ago, not days.",
            ),
            Step(
                emoji = "🚲",
                title = "Stocked at 7 sharp",
                text = "Riders fill every machine each morning. The case you see is the whole batch.",
            ),
            Step(
                emoji = "🧁",
                title = "Tap, grab, go",
                text = "Tap your card, the door pops, breakfast is handled. No app, no account, no line.",
            ),
        )

    /** The case rotates through these lineups, one per day. */
    val lineups =
        listOf(
            Lineup(
                title = "The classics case",
                pastries =
                    listOf(
                        Pastry(
                            name = "Butter croissant",
                            emoji = "🥐",
                            description = "Twenty-seven layers, rolled at midnight, still whispering.",
                            priceCents = 450,
                        ),
                        Pastry(
                            name = "Morning bun",
                            emoji = "🌀",
                            description = "Croissant dough, cinnamon sugar, candied orange peel.",
                            priceCents = 500,
                        ),
                        Pastry(
                            name = "Chocolate chunk cookie",
                            emoji = "🍪",
                            description = "Sea salt on top, still soft in the middle at 7 AM.",
                            priceCents = 375,
                        ),
                        Pastry(
                            name = "Strawberry cream puff",
                            emoji = "🍓",
                            description = "Choux, vanilla bean cream, berries from the Saturday market.",
                            priceCents = 550,
                        ),
                    ),
            ),
            Lineup(
                title = "The cozy case",
                pastries =
                    listOf(
                        Pastry(
                            name = "Pain au chocolat",
                            emoji = "🍫",
                            description = "Two batons of dark chocolate, zero restraint.",
                            priceCents = 495,
                        ),
                        Pastry(
                            name = "Maple pecan twist",
                            emoji = "🍁",
                            description = "Laminated dough, toasted pecans, real maple glaze.",
                            priceCents = 525,
                        ),
                        Pastry(
                            name = "Lemon poppyseed loaf",
                            emoji = "🍋",
                            description = "A thick slice, tart glaze, cheerful attitude.",
                            priceCents = 425,
                        ),
                        Pastry(
                            name = "Hazelnut brownie",
                            emoji = "🌰",
                            description = "Fudgy center, crackly top, roasted hazelnuts throughout.",
                            priceCents = 450,
                        ),
                    ),
            ),
            Lineup(
                title = "The weekend case",
                pastries =
                    listOf(
                        Pastry(
                            name = "Cardamom knot",
                            emoji = "🪢",
                            description = "Swedish-style, pearl sugar, best eaten warm from the bin.",
                            priceCents = 525,
                        ),
                        Pastry(
                            name = "Raspberry danish",
                            emoji = "🫐",
                            description = "Cream cheese, whole raspberries, a very flaky situation.",
                            priceCents = 550,
                        ),
                        Pastry(
                            name = "Ham & gruyère roll",
                            emoji = "🥨",
                            description = "The savory one — croissant dough, dijon, proper cheese.",
                            priceCents = 650,
                        ),
                        Pastry(
                            name = "Cinnamon roll",
                            emoji = "🥮",
                            description = "Cream cheese frosting applied without fear.",
                            priceCents = 500,
                        ),
                    ),
            ),
        )

    val machines =
        listOf(
            Machine(
                name = "Pioneer Square",
                spot = "SW 6th & Morrison, by the fountain",
                note = "Our first machine — she's the pink one you can see from the MAX.",
                schedule =
                    SugarFreshness.MachineSchedule(
                        stockedDays = setOf(0, 1, 2, 3, 4, 5, 6),
                        restockMinute = 7 * 60,
                        selloutMinute = 13 * 60,
                    ),
            ),
            Machine(
                name = "PDX Airport",
                spot = "Concourse C, across from gate C7",
                note = "Restocked twice on holiday weekends.",
                schedule =
                    SugarFreshness.MachineSchedule(
                        stockedDays = setOf(0, 1, 2, 3, 4, 5, 6),
                        restockMinute = 6 * 60,
                        selloutMinute = 15 * 60,
                    ),
            ),
            Machine(
                name = "Tech Row",
                spot = "NW 13th & Irving, lobby of the Brewery Blocks",
                note = "Weekdays only — she rests when you do.",
                schedule =
                    SugarFreshness.MachineSchedule(
                        stockedDays = setOf(1, 2, 3, 4, 5),
                        restockMinute = 7 * 60,
                        selloutMinute = 11 * 60,
                    ),
            ),
            Machine(
                name = "Riverfront Market",
                spot = "Waterfront Park, north entrance",
                note = "Weekends only, next to the flower cart.",
                schedule =
                    SugarFreshness.MachineSchedule(
                        stockedDays = setOf(0, 6),
                        restockMinute = 8 * 60,
                        selloutMinute = 14 * 60,
                    ),
            ),
        )

    const val EMAIL = "hello@sugarbin.example"
    const val INSTAGRAM = "https://instagram.com/example"

    /** The B2B pitch under the machine list. */
    const val HOST_PITCH = "Want a Sugar Bin in your lobby, campus, or terminal?"
    const val DONATION_NOTE = "Unsold pastries are donated to Blanchet House every evening."
}
