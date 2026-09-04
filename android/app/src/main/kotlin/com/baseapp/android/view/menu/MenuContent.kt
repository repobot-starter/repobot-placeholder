package com.baseapp.android.view.menu

/**
 * All content for the local-business site, mirrored from the web pack's
 * content.ts. To make this template yours, replace the business below —
 * nothing else needs to change.
 */
object MenuContent {
    enum class Dietary(val mark: String, val label: String) {
        VEGETARIAN("V", "Vegetarian"),
        VEGAN("VG", "Vegan"),
        GLUTEN_FREE("GF", "Gluten-free"),
    }

    data class Item(
        val name: String,
        val description: String,
        /** Price in cents so arithmetic and formatting stay exact. */
        val priceCents: Int,
        val dietary: List<Dietary>,
        val popular: Boolean = false,
    )

    data class Section(
        val title: String,
        val note: String? = null,
        val items: List<Item>,
    )

    const val NAME = "The Copper Kettle"
    const val TAGLINE = "Neighborhood café & all-day kitchen"
    const val ABOUT =
        "Slow mornings, honest coffee, and a short menu we cook from scratch every day. " +
            "Counter service, sunny corner windows, and the same four soups our regulars won't let us retire."
    const val ADDRESS = "214 Alder Street, Portland, OR 97204"
    const val PHONE = "(503) 555-0184"
    const val EMAIL = "hello@copperkettle.example"
    const val INSTAGRAM = "https://instagram.com/example"
    const val MAPS_QUERY = "214 Alder Street Portland OR"

    /** 0 = Sunday … 6 = Saturday. Minutes since midnight. */
    val weeklyHours = listOf(
        MenuHours.DayHours(day = 0, intervals = listOf(9 * 60 to 14 * 60)),
        MenuHours.DayHours(day = 2, intervals = listOf(7 * 60 to 15 * 60)),
        MenuHours.DayHours(day = 3, intervals = listOf(7 * 60 to 15 * 60)),
        MenuHours.DayHours(day = 4, intervals = listOf(7 * 60 to 15 * 60)),
        MenuHours.DayHours(day = 5, intervals = listOf(7 * 60 to 15 * 60, 17 * 60 to 21 * 60)),
        MenuHours.DayHours(day = 6, intervals = listOf(8 * 60 to 15 * 60, 17 * 60 to 21 * 60)),
        // Monday: closed (no entry).
    )

    const val HOURS_NOTE = "Closed Mondays. Friday & Saturday supper service 5–9 PM."

    val menu = listOf(
        Section(
            title = "Breakfast",
            note = "Served till 11:30, eggs from Meadowlark Farm",
            items = listOf(
                Item(
                    name = "Copper Kettle breakfast",
                    description = "Two eggs any style, sourdough toast, herbed potatoes, greens",
                    priceCents = 1400,
                    dietary = listOf(Dietary.VEGETARIAN),
                    popular = true,
                ),
                Item(
                    name = "Oat porridge",
                    description = "Steel-cut oats, poached pear, toasted hazelnuts, maple",
                    priceCents = 950,
                    dietary = listOf(Dietary.VEGAN, Dietary.GLUTEN_FREE),
                ),
                Item(
                    name = "Smoked trout toast",
                    description = "Rye, whipped crème fraîche, pickled shallot, dill",
                    priceCents = 1550,
                    dietary = emptyList(),
                ),
                Item(
                    name = "Buttermilk pancakes",
                    description = "Three cakes, whipped butter, warm blueberry compote",
                    priceCents = 1250,
                    dietary = listOf(Dietary.VEGETARIAN),
                    popular = true,
                ),
            ),
        ),
        Section(
            title = "Lunch",
            note = "From 11:30, soup changes daily",
            items = listOf(
                Item(
                    name = "Soup + half sandwich",
                    description = "Today's soup with a half grilled cheese on sourdough",
                    priceCents = 1300,
                    dietary = listOf(Dietary.VEGETARIAN),
                    popular = true,
                ),
                Item(
                    name = "Roast chicken sandwich",
                    description = "Garlic aioli, pickles, butter lettuce, ciabatta",
                    priceCents = 1500,
                    dietary = emptyList(),
                ),
                Item(
                    name = "Farro bowl",
                    description = "Roasted squash, kale, feta, pepitas, lemon vinaigrette",
                    priceCents = 1400,
                    dietary = listOf(Dietary.VEGETARIAN),
                ),
                Item(
                    name = "Kettle burger",
                    description = "Smashed patty, sharp cheddar, onion jam, fries",
                    priceCents = 1700,
                    dietary = emptyList(),
                ),
            ),
        ),
        Section(
            title = "Drinks",
            items = listOf(
                Item(
                    name = "Drip coffee",
                    description = "Bottomless with any plate — Heart Roasters",
                    priceCents = 400,
                    dietary = listOf(Dietary.VEGAN, Dietary.GLUTEN_FREE),
                ),
                Item(
                    name = "Cappuccino",
                    description = "Double shot, oat milk on request",
                    priceCents = 550,
                    dietary = listOf(Dietary.VEGETARIAN),
                    popular = true,
                ),
                Item(
                    name = "Chai",
                    description = "House-spiced, steamed milk, lightly sweet",
                    priceCents = 525,
                    dietary = listOf(Dietary.VEGETARIAN),
                ),
                Item(
                    name = "Fresh lemonade",
                    description = "Pressed daily, mint from the planter out back",
                    priceCents = 450,
                    dietary = listOf(Dietary.VEGAN, Dietary.GLUTEN_FREE),
                ),
            ),
        ),
        Section(
            title = "Sweets",
            note = "Baked each morning",
            items = listOf(
                Item(
                    name = "Cardamom bun",
                    description = "Twisted, buttery, pearl sugar",
                    priceCents = 525,
                    dietary = listOf(Dietary.VEGETARIAN),
                    popular = true,
                ),
                Item(
                    name = "Olive oil cake",
                    description = "Citrus glaze, whipped cream",
                    priceCents = 650,
                    dietary = listOf(Dietary.VEGETARIAN),
                ),
                Item(
                    name = "Flourless chocolate cookie",
                    description = "Crackly top, sea salt",
                    priceCents = 400,
                    dietary = listOf(Dietary.VEGETARIAN, Dietary.GLUTEN_FREE),
                ),
            ),
        ),
    )

    /** "$14" / "$9.50" — trims trailing zero cents. */
    fun formatPrice(priceCents: Int): String {
        val dollars = priceCents / 100
        val cents = priceCents % 100
        return if (cents == 0) "$$dollars" else "$$dollars.${cents.toString().padStart(2, '0')}"
    }
}
