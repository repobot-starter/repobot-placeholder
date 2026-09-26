package com.baseapp.android.view.quiz

/**
 * All quizzes for the quiz app, mirrored from the web pack's content.ts.
 * To make this template yours, replace the quizzes below — the engine,
 * scoring, and UI adapt to whatever you define. Quiz ids must be unique
 * (they key saved best scores).
 */
object QuizContent {
    data class Quiz(
        val id: String,
        val title: String,
        val emoji: String,
        val description: String,
        val questions: List<QuizEngine.Question>,
    )

    const val TITLE = "QuizBot"
    const val TAGLINE = "Eight questions. No lifelines. See what sticks."

    val quizzes = listOf(
        Quiz(
            id = "space-roughly",
            title = "Space, roughly",
            emoji = "🪐",
            description = "The solar system as you half-remember it from school.",
            questions = listOf(
                QuizEngine.Question(
                    prompt = "Which planet has the most moons discovered so far?",
                    choices = listOf("Jupiter", "Saturn", "Uranus", "Neptune"),
                    answerIndex = 1,
                    explanation = "Saturn pulled ahead again — well over 200 confirmed moons, most of them tiny.",
                ),
                QuizEngine.Question(
                    prompt = "How long does sunlight take to reach Earth?",
                    choices = listOf("8 seconds", "8 minutes", "8 hours", "8 days"),
                    answerIndex = 1,
                    explanation = "About 8 minutes 20 seconds. You're always seeing a slightly outdated Sun.",
                ),
                QuizEngine.Question(
                    prompt = "Which of these is bigger than the planet Mercury?",
                    choices = listOf("Earth's Moon", "Ganymede", "Pluto", "Ceres"),
                    answerIndex = 1,
                    explanation = "Jupiter's moon Ganymede beats Mercury on diameter — though Mercury is far heavier.",
                ),
                QuizEngine.Question(
                    prompt = "What makes Mars red?",
                    choices = listOf(
                        "Molten lava fields",
                        "Rusted iron in the dust",
                        "Thick red clouds",
                        "Reflection from its moons",
                    ),
                    answerIndex = 1,
                    explanation = "Iron oxide — the whole planet is, essentially, gently rusting.",
                ),
                QuizEngine.Question(
                    prompt = "A day on Venus, compared to its year, is…",
                    choices = listOf("Much shorter", "About the same", "Longer", "Venus doesn't rotate"),
                    answerIndex = 2,
                    explanation = "Venus spins so slowly that one rotation (243 Earth days) outlasts its year (225).",
                ),
                QuizEngine.Question(
                    prompt = "What is the Sun mostly made of?",
                    choices = listOf(
                        "Burning gas and oxygen",
                        "Hydrogen and helium",
                        "Molten iron",
                        "Plasma made of carbon",
                    ),
                    answerIndex = 1,
                    explanation = "Roughly three-quarters hydrogen, a quarter helium — nothing is 'burning' in the fire sense.",
                ),
                QuizEngine.Question(
                    prompt = "Which planet could float in a big enough bathtub?",
                    choices = listOf("Mars", "Neptune", "Saturn", "Mercury"),
                    answerIndex = 2,
                    explanation = "Saturn's average density is less than water's. (Please do not attempt.)",
                ),
                QuizEngine.Question(
                    prompt = "How many Earths would fit across the Sun's diameter?",
                    choices = listOf("About 10", "About 109", "About 1,000", "About 12,000"),
                    answerIndex = 1,
                    explanation = "Around 109 Earths side by side — and about 1.3 million inside it by volume.",
                ),
            ),
        ),
        Quiz(
            id = "how-things-work",
            title = "How things work",
            emoji = "🔧",
            description = "Everyday machines and the small physics running your kitchen.",
            questions = listOf(
                QuizEngine.Question(
                    prompt = "Why does a microwave heat food?",
                    choices = listOf(
                        "Infrared heating coils",
                        "It vibrates water molecules with radio waves",
                        "Compressed hot air",
                        "Mild radioactivity",
                    ),
                    answerIndex = 1,
                    explanation = "Microwaves make water (and fat) molecules oscillate; the friction is the heat.",
                ),
                QuizEngine.Question(
                    prompt = "What does a refrigerator actually do with heat?",
                    choices = listOf(
                        "Destroys it",
                        "Converts it to electricity",
                        "Moves it from inside to the coils outside",
                        "Stores it in the freezer",
                    ),
                    answerIndex = 2,
                    explanation = "Fridges are heat movers, not heat destroyers — feel the warm coils at the back.",
                ),
                QuizEngine.Question(
                    prompt = "Why do planes have winglets (the bent wing tips)?",
                    choices = listOf(
                        "Radio antennas",
                        "They reduce drag from wingtip vortices",
                        "Lightning protection",
                        "Style, mostly",
                    ),
                    answerIndex = 1,
                    explanation = "They tame the swirl of air at the tip, cutting drag and saving real fuel.",
                ),
                QuizEngine.Question(
                    prompt = "A car's catalytic converter exists to…",
                    choices = listOf(
                        "Boost horsepower",
                        "Muffle engine noise",
                        "Turn harmful exhaust gases into tamer ones",
                        "Recycle unburned fuel into the tank",
                    ),
                    answerIndex = 2,
                    explanation = "Platinum-group metals inside convert carbon monoxide and NOx — which is why thieves want it.",
                ),
                QuizEngine.Question(
                    prompt = "Why does bread rise?",
                    choices = listOf(
                        "Yeast releases carbon dioxide",
                        "Flour expands when wet",
                        "Trapped steam only",
                        "Gluten multiplies",
                    ),
                    answerIndex = 0,
                    explanation = "Yeast eats sugars and exhales CO₂; gluten is the balloon skin that holds it.",
                ),
                QuizEngine.Question(
                    prompt = "Noise-cancelling headphones work by…",
                    choices = listOf(
                        "Very thick padding",
                        "Playing an inverted copy of the noise",
                        "Filtering frequencies with magnets",
                        "A vacuum between the ear cups",
                    ),
                    answerIndex = 1,
                    explanation = "They emit the mirror image of incoming sound; the waves cancel before your eardrum votes.",
                ),
                QuizEngine.Question(
                    prompt = "Why do golf balls have dimples?",
                    choices = listOf(
                        "Grip on the club face",
                        "They reduce aerodynamic drag",
                        "Cheaper to manufacture",
                        "Tradition from feather-stuffed balls",
                    ),
                    answerIndex = 1,
                    explanation = "Dimples trip the air into a thin turbulent layer that hugs the ball — roughly half the drag, twice the flight.",
                ),
                QuizEngine.Question(
                    prompt = "What keeps a suspension bridge deck up?",
                    choices = listOf(
                        "Stiff steel beams underneath",
                        "Cables in tension hung from towers",
                        "Air pressure chambers",
                        "Arches hidden in the roadway",
                    ),
                    answerIndex = 1,
                    explanation = "The deck hangs from vertical cables, which hang from main cables, which pull down on the towers.",
                ),
            ),
        ),
        Quiz(
            id = "world-map",
            title = "The world map",
            emoji = "🗺️",
            description = "Borders, rivers, and the geography that wins bar trivia.",
            questions = listOf(
                QuizEngine.Question(
                    prompt = "Which country has the most time zones?",
                    choices = listOf("Russia", "United States", "France", "China"),
                    answerIndex = 2,
                    explanation = "France — twelve, thanks to territories scattered across every ocean.",
                ),
                QuizEngine.Question(
                    prompt = "The only sea with no coastline is the…",
                    choices = listOf("Dead Sea", "Sargasso Sea", "Caspian Sea", "Coral Sea"),
                    answerIndex = 1,
                    explanation = "The Sargasso Sea is bounded by Atlantic currents, not land.",
                ),
                QuizEngine.Question(
                    prompt = "Which two countries share the longest land border?",
                    choices = listOf(
                        "Russia & China",
                        "Chile & Argentina",
                        "US & Canada",
                        "Kazakhstan & Russia",
                    ),
                    answerIndex = 2,
                    explanation = "The US–Canada border runs about 8,900 km, counting Alaska.",
                ),
                QuizEngine.Question(
                    prompt = "Which African country was never colonized?",
                    choices = listOf("Morocco", "Kenya", "Ethiopia", "Ghana"),
                    answerIndex = 2,
                    explanation = "Ethiopia repelled Italy at Adwa in 1896 and kept its independence (aside from a brief occupation).",
                ),
                QuizEngine.Question(
                    prompt = "Istanbul sits on two continents. Which two?",
                    choices = listOf(
                        "Europe & Africa",
                        "Asia & Africa",
                        "Europe & Asia",
                        "It's only in Europe",
                    ),
                    answerIndex = 2,
                    explanation = "The Bosphorus strait splits the city between Europe and Asia.",
                ),
                QuizEngine.Question(
                    prompt = "What's the smallest country in the world?",
                    choices = listOf("Monaco", "Vatican City", "San Marino", "Liechtenstein"),
                    answerIndex = 1,
                    explanation = "Vatican City: about 49 hectares — smaller than many golf courses.",
                ),
                QuizEngine.Question(
                    prompt = "Which river carries the most water?",
                    choices = listOf("Nile", "Amazon", "Yangtze", "Mississippi"),
                    answerIndex = 1,
                    explanation = "The Amazon discharges more than the next several rivers combined.",
                ),
                QuizEngine.Question(
                    prompt = "Which country is both the flattest and one of the driest continents' nations?",
                    choices = listOf("Mongolia", "Australia", "Botswana", "Argentina"),
                    answerIndex = 1,
                    explanation = "Australia: mean elevation around 330 m and mostly arid — a very flat, very dry place.",
                ),
            ),
        ),
    )
}
