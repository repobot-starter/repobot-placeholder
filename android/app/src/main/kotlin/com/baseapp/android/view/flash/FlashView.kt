package com.baseapp.android.view.flash

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Date

/** Study-lamp palette, mirrored from the web pack's FlashPage.styles.css.ts. */
private object FlashColors {
    val paper = Color(0xFFF7F6FC)
    val ink = Color(0xFF232136)
    val inkSoft = Color(0xFF6E6A86)
    val line = Color(0xFFE2E0EF)
    val violet = Color(0xFF5B4FC7)
    val violetSoft = Color(0xFFECEAFB)
    val amber = Color(0xFFE5A33D)
    val green = Color(0xFF3E6B4F)
    val greenSoft = Color(0xFFE8EFE9)
    val red = Color(0xFFA04B3C)
    val redSoft = Color(0xFFF6E7E3)
    val hint = Color(0xFFA9A5C4)
}

private const val PREFS_NAME = "flashbot"

/**
 * Saved progress: deckId -> card front -> state, one SharedPreferences
 * entry per card ("deckId::front" -> "box,lastReviewedDay"). The native
 * mirror of the web pack's localStorage key.
 */
private object FlashStore {
    fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun load(prefs: SharedPreferences): Map<String, Map<String, FlashScheduler.CardState>> {
        val progress = mutableMapOf<String, MutableMap<String, FlashScheduler.CardState>>()
        for ((key, value) in prefs.all) {
            val keyParts = key.split("::", limit = 2)
            val stateParts = (value as? String)?.split(",")
            if (keyParts.size != 2 || stateParts?.size != 2) continue
            val box = stateParts[0].toIntOrNull() ?: continue
            val lastReviewedDay = stateParts[1].toIntOrNull() ?: continue
            progress.getOrPut(keyParts[0]) { mutableMapOf() }[keyParts[1]] =
                FlashScheduler.CardState(box = box, lastReviewedDay = lastReviewedDay)
        }
        return progress
    }

    fun save(prefs: SharedPreferences, deckId: String, front: String, state: FlashScheduler.CardState) {
        prefs.edit()
            .putString("$deckId::$front", "${state.box},${state.lastReviewedDay}")
            .apply()
    }
}

/** Card states for a deck, keyed by card front (stable across content edits). */
private fun statesForDeck(
    progress: Map<String, Map<String, FlashScheduler.CardState>>,
    deck: FlashContent.Deck,
): List<FlashScheduler.CardState> {
    val saved = progress[deck.id] ?: emptyMap()
    return deck.cards.map { saved[it.front] ?: FlashScheduler.newCardState() }
}

/**
 * Home surface for the `flash` pack — the native twin of the web FlashPage.
 * All scheduling lives in [FlashScheduler] so it stays JVM-testable and in
 * lockstep with the web app. Purely client-side: progress persists to
 * SharedPreferences, no network, no stores.
 */
@Composable
fun FlashView() {
    val context = LocalContext.current
    val prefs = remember { FlashStore.prefs(context) }
    var progress by remember { mutableStateOf(FlashStore.load(prefs)) }
    var openDeckId by remember { mutableStateOf<String?>(null) }

    fun record(deck: FlashContent.Deck, cardIndex: Int, state: FlashScheduler.CardState) {
        val front = deck.cards[cardIndex].front
        FlashStore.save(prefs, deck.id, front, state)
        val deckProgress = (progress[deck.id] ?: emptyMap()) + (front to state)
        progress = progress + (deck.id to deckProgress)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FlashColors.paper),
        contentAlignment = Alignment.TopCenter,
    ) {
        val openDeck = FlashContent.decks.firstOrNull { it.id == openDeckId }
        if (openDeck != null) {
            StudySession(
                deck = openDeck,
                progress = progress,
                onGrade = { index, state -> record(openDeck, index, state) },
                onExit = { openDeckId = null },
            )
        } else {
            DeckList(progress = progress, onOpen = { openDeckId = it })
        }
    }
}

@Composable
private fun DeckList(
    progress: Map<String, Map<String, FlashScheduler.CardState>>,
    onOpen: (String) -> Unit,
) {
    val today = FlashScheduler.dayIndex(Date())
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
        modifier = Modifier
            .widthIn(max = 640.dp)
            .verticalScroll(rememberScrollState())
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 22.dp)
            .padding(top = 34.dp, bottom = 48.dp),
    ) {
        Text(
            text = FlashContent.TITLE,
            color = FlashColors.ink,
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = FlashContent.TAGLINE,
            color = FlashColors.inkSoft,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(bottom = 12.dp),
        )

        FlashContent.decks.forEach { deck ->
            DeckRow(
                deck = deck,
                summary = FlashScheduler.deckProgress(statesForDeck(progress, deck), today),
                onOpen = { onOpen(deck.id) },
            )
        }

        Text(
            text = "Spaced repetition, five boxes, no streak guilt. Built with Repobot.",
            color = FlashColors.inkSoft,
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 24.dp),
        )
    }
}

@Composable
private fun DeckRow(
    deck: FlashContent.Deck,
    summary: FlashScheduler.DeckProgress,
    onOpen: () -> Unit,
) {
    val fraction = if (summary.total == 0) 0f else summary.mastered.toFloat() / summary.total
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, FlashColors.line, RoundedCornerShape(16.dp))
            .clickable(onClick = onOpen)
            .padding(16.dp),
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(52.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(FlashColors.violetSoft),
        ) {
            Text(text = deck.emoji, fontSize = 26.sp)
        }
        Column(
            verticalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 14.dp),
        ) {
            Text(
                text = deck.title,
                color = FlashColors.ink,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Serif,
            )
            Text(
                text = deck.description,
                color = FlashColors.inkSoft,
                fontSize = 12.sp,
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp)
                    .height(6.dp)
                    .clip(CircleShape)
                    .background(FlashColors.line),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(fraction)
                        .height(6.dp)
                        .clip(CircleShape)
                        .background(FlashColors.violet),
                )
            }
            Text(
                text = "${summary.mastered} of ${summary.total} mastered",
                color = FlashColors.inkSoft,
                fontSize = 11.sp,
            )
        }
        if (summary.due > 0) {
            Badge(text = "${summary.due} due", background = FlashColors.amber, foreground = Color.White)
        } else {
            Badge(text = "Done today", background = FlashColors.greenSoft, foreground = FlashColors.green)
        }
    }
}

@Composable
private fun Badge(text: String, background: Color, foreground: Color) {
    Text(
        text = text,
        color = foreground,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .clip(CircleShape)
            .background(background)
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}

@Composable
private fun StudySession(
    deck: FlashContent.Deck,
    progress: Map<String, Map<String, FlashScheduler.CardState>>,
    onGrade: (index: Int, state: FlashScheduler.CardState) -> Unit,
    onExit: () -> Unit,
) {
    val today = FlashScheduler.dayIndex(Date())
    var queue by remember {
        mutableStateOf(FlashScheduler.dueIndices(statesForDeck(progress, deck), today))
    }
    var flipped by remember { mutableStateOf(false) }
    var reviewed by remember { mutableIntStateOf(0) }
    var missed by remember { mutableIntStateOf(0) }

    fun grade(value: FlashScheduler.Grade) {
        val index = queue.firstOrNull() ?: return
        val state = statesForDeck(progress, deck)[index]
        onGrade(index, FlashScheduler.review(state, value, today))
        reviewed += 1
        queue = if (value == FlashScheduler.Grade.AGAIN) {
            missed += 1
            // Missed cards come back at the end of this session.
            queue.drop(1) + index
        } else {
            queue.drop(1)
        }
        flipped = false
    }

    Column(
        modifier = Modifier
            .widthIn(max = 640.dp)
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(horizontal = 22.dp),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 22.dp),
        ) {
            Text(
                text = "← ${deck.title}",
                color = FlashColors.violet,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .clickable(onClick = onExit)
                    .padding(4.dp),
            )
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = "${queue.size} to go",
                color = FlashColors.inkSoft,
                fontSize = 13.sp,
            )
        }

        val currentIndex = queue.firstOrNull()
        if (currentIndex != null) {
            Spacer(modifier = Modifier.weight(1f))
            StudyCard(
                card = deck.cards[currentIndex],
                flipped = flipped,
                onFlip = { flipped = !flipped },
            )
            Spacer(modifier = Modifier.weight(1f))
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 28.dp),
            ) {
                GradeButton(
                    label = "Again",
                    enabled = flipped,
                    background = FlashColors.redSoft,
                    foreground = FlashColors.red,
                    modifier = Modifier.weight(1f),
                ) { grade(FlashScheduler.Grade.AGAIN) }
                GradeButton(
                    label = "Got it",
                    enabled = flipped,
                    background = FlashColors.violet,
                    foreground = Color.White,
                    modifier = Modifier.weight(1f),
                ) { grade(FlashScheduler.Grade.GOOD) }
            }
        } else {
            SessionSummary(
                summary = FlashScheduler.deckProgress(statesForDeck(progress, deck), today),
                reviewed = reviewed,
                missed = missed,
                onExit = onExit,
            )
        }
    }
}

@Composable
private fun StudyCard(card: FlashContent.Flashcard, flipped: Boolean, onFlip: () -> Unit) {
    val flip by animateFloatAsState(
        targetValue = if (flipped) 360f else 0f,
        animationSpec = tween(durationMillis = 300),
        label = "cardFlip",
    )
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp, Alignment.CenterVertically),
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 280.dp)
            .graphicsLayer { rotationX = flip }
            .clip(RoundedCornerShape(20.dp))
            .background(if (flipped) FlashColors.ink else Color.White)
            .border(1.dp, FlashColors.line, RoundedCornerShape(20.dp))
            .clickable(onClick = onFlip)
            .padding(24.dp),
    ) {
        Text(
            text = if (flipped) "ANSWER" else "QUESTION",
            color = if (flipped) FlashColors.amber else FlashColors.inkSoft,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.6.sp,
        )
        Text(
            text = if (flipped) card.back else card.front,
            color = if (flipped) FlashColors.paper else FlashColors.ink,
            fontSize = 26.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Serif,
            textAlign = TextAlign.Center,
        )
        if (flipped && card.hint != null) {
            Text(
                text = card.hint,
                color = FlashColors.hint,
                fontSize = 13.sp,
                fontStyle = FontStyle.Italic,
                textAlign = TextAlign.Center,
            )
        }
        if (!flipped) {
            Text(
                text = "Tap to reveal",
                color = FlashColors.inkSoft,
                fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun GradeButton(
    label: String,
    enabled: Boolean,
    background: Color,
    foreground: Color,
    modifier: Modifier = Modifier,
    onTap: () -> Unit,
) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .alpha(if (enabled) 1f else 0.4f)
            .clip(RoundedCornerShape(14.dp))
            .background(background)
            .clickable(enabled = enabled, onClick = onTap)
            .padding(vertical = 15.dp),
    ) {
        Text(
            text = label,
            color = foreground,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun SessionSummary(
    summary: FlashScheduler.DeckProgress,
    reviewed: Int,
    missed: Int,
    onExit: () -> Unit,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterVertically),
        modifier = Modifier.fillMaxSize(),
    ) {
        Text(text = if (reviewed > 0) "🎉" else "🌤️", fontSize = 44.sp)
        Text(
            text = if (reviewed > 0) "Session complete" else "All caught up",
            color = FlashColors.ink,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = if (reviewed > 0) {
                "Every due card reviewed. The boxes will bring them back right on time."
            } else {
                "Nothing is due in this deck today — come back tomorrow."
            },
            color = FlashColors.inkSoft,
            fontSize = 14.sp,
            textAlign = TextAlign.Center,
        )
        Row(
            horizontalArrangement = Arrangement.spacedBy(28.dp),
            modifier = Modifier.padding(top = 14.dp),
        ) {
            StatBlock(number = "$reviewed", label = "reviews")
            StatBlock(number = "$missed", label = "misses")
            StatBlock(number = "${summary.mastered}/${summary.total}", label = "mastered")
        }
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 18.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(FlashColors.violet)
                .clickable(onClick = onExit)
                .padding(vertical = 15.dp),
        ) {
            Text(
                text = "Back to decks",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun StatBlock(number: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = number,
            color = FlashColors.violet,
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Serif,
        )
        Text(
            text = label,
            color = FlashColors.inkSoft,
            fontSize = 11.sp,
        )
    }
}
