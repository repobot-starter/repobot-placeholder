package com.baseapp.android.view.games.cabin

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.BiasAlignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.min

/**
 * Daylight airliner palette lifted from the web `CabinPage.styles.css.ts` so
 * the cabin keeps its identity on both app themes (why: like the Pong field,
 * the sky-and-fuselage look is part of the game, not of the app chrome).
 */
private object CabinColors {
    val sky = Color(0xFF8ECDF3)
    val skyDeep = Color(0xFF4F9FD9)
    val skyLow = Color(0xFFD9EEFB)
    val fuselage = Color(0xFFF2F8FD)
    val fuselageDark = Color(0xFFDCEBF7)
    val ink = Color(0xFF1B3A57)
    val brand = Color(0xFF1F6FB2)
    val good = Color(0xFF2E9E5B)
    val warn = Color(0xFFE8912D)
    val bad = Color(0xFFD64550)
    val nightPanel = Color(0xEB12283A)
    val nightText = Color(0xFF9FDCFF)

    /** Meter color by remaining fraction — the web `barColor` thresholds. */
    fun bar(fraction: Double): Color = when {
        fraction >= 0.6 -> good
        fraction >= 0.3 -> warn
        else -> bad
    }
}

private fun starString(stars: Int): String = "★".repeat(stars) + "☆".repeat(5 - stars)

/**
 * Home surface for the `cabin` pack — the native twin of the web CabinPage.
 * Rendering and touch input only: all rules live in [CabinEngine] so the
 * simulation stays JVM-testable and in lockstep with the web game. No
 * network, no stores.
 *
 * Art approach: visual parity with the web DOM scene is not required, so
 * this port keeps the same *ingredients* — sky gradient backdrop, white
 * fuselage seat map, emoji passengers, chunky monospace controls — using
 * plain composables. Patience meters become rings (a small arc Canvas), the
 * galley tray is a horizontally scrolling row, grandma's click-and-hold chat
 * maps to press-and-hold, and the runner is a tappable emoji hopping along
 * the aisle column.
 *
 * A `withFrameNanos` loop drives the engine and bumps a frame-clock state,
 * so the scene recomposes each frame while the engine itself stays out of
 * the snapshot system.
 */
@Composable
fun CabinGameView() {
    val engine = remember { CabinEngine() }
    var difficulty by remember { mutableStateOf(CabinEngine.Difficulty.CREW) }
    var heldItem by remember { mutableStateOf<CabinEngine.Item?>(null) }
    var bestRating by remember { mutableIntStateOf(0) }
    var frameTimeNanos by remember { mutableLongStateOf(0L) }

    LaunchedEffect(engine) {
        var lastNanos = 0L
        while (true) {
            withFrameNanos { now ->
                if (lastNanos != 0L) {
                    // Clamp dt like the web loop so backgrounding never
                    // fast-forwards the flight.
                    engine.step(min((now - lastNanos) / 1_000_000_000.0, 0.1))
                    if (engine.phase == CabinEngine.Phase.LANDED && engine.stars > bestRating) {
                        bestRating = engine.stars
                    }
                }
                lastNanos = now
                frameTimeNanos = now
            }
        }
    }

    fun startFlight() {
        engine.newFlight(difficulty)
        engine.beginBoarding()
        heldItem = null
    }

    // Reading the frame clock recomposes this scene every animation frame;
    // every meter and ring below reads live engine state.
    @Suppress("UNUSED_EXPRESSION")
    frameTimeNanos

    val flightActive =
        engine.phase == CabinEngine.Phase.BOARDING || engine.phase == CabinEngine.Phase.CRUISE

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(CabinColors.skyDeep, CabinColors.sky, CabinColors.skyLow),
                ),
            )
            .statusBarsPadding()
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = "🤖 CABINBOT",
            color = CabinColors.ink,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            ChunkyButton(label = "🛫 START", onClick = ::startFlight)
            CabinEngine.Difficulty.entries.forEach { level ->
                ChunkyButton(
                    label = level.name,
                    isLit = level == difficulty,
                    enabled = !flightActive,
                    onClick = { difficulty = level },
                )
            }
            Box(modifier = Modifier.weight(1f))
            Text(
                text = "BEST ${if (bestRating > 0) starString(bestRating) else "—"}",
                color = CabinColors.ink,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
            )
        }

        FlightProgressBar(progress = engine.flightProgress())

        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(CabinColors.fuselage)
                .border(2.dp, CabinColors.ink, RoundedCornerShape(10.dp)),
        ) {
            SeatMap(
                engine = engine,
                onSeatTap = { passenger ->
                    if (engine.phase == CabinEngine.Phase.CRUISE) {
                        heldItem?.let { item ->
                            val result = engine.serveItem(passenger.id, item)
                            if (result.correct) {
                                heldItem = null
                            }
                        }
                    }
                },
            )

            engine.passengers.firstOrNull { it.running }?.let { runner ->
                RunnerButton(runner = runner, onGrab = { engine.grabRunner(runner.id) })
            }

            engine.announcement?.let { message ->
                IntercomBanner(message = message)
            }

            // Countdown overlays ported from the web: paparazzi flash + cookie glow.
            if (engine.paparazziMs > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Color.White.copy(
                                alpha = (0.85 * engine.paparazziMs /
                                    CabinEngine.Tuning.CELEBRITY_FLASH_MS).toFloat(),
                            ),
                        ),
                )
            }
            if (engine.cookieGlowMs > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Color.Yellow.copy(
                                alpha = (0.3 * engine.cookieGlowMs /
                                    CabinEngine.Tuning.GRANDMA_GLOW_MS).toFloat(),
                            ),
                        ),
                )
            }

            if (engine.phase == CabinEngine.Phase.IDLE) {
                OverlayCard {
                    Text(
                        text = "✈️ Welcome aboard!",
                        color = CabinColors.ink,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    )
                    Text(
                        text = "Passengers pop requests over their seats. Grab the right item " +
                            "from the galley tray, tap the seat to serve it, and keep the whole " +
                            "cabin smiling until touchdown.",
                        color = CabinColors.ink.copy(alpha = 0.7f),
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center,
                    )
                    ChunkyButton(label = "🛫 START FLIGHT", isLit = true, onClick = ::startFlight)
                }
            }

            if (engine.phase == CabinEngine.Phase.LANDED) {
                OverlayCard {
                    Text(
                        text = "🛬 Landed!",
                        color = CabinColors.ink,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                    )
                    Text(
                        text = starString(engine.stars),
                        color = CabinColors.warn,
                        fontSize = 30.sp,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                        LandedStat(label = "SERVED", value = "${engine.served}")
                        LandedStat(label = "MISSED", value = "${engine.missed}")
                        LandedStat(label = "CABIN", value = "${engine.cabinHappiness()}%")
                    }
                    if (engine.stars >= bestRating && engine.stars > 0) {
                        Text(
                            text = "🏅 Best rating so far!",
                            color = CabinColors.ink.copy(alpha = 0.7f),
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                        )
                    }
                    ChunkyButton(label = "⟳ FLY AGAIN", isLit = true, onClick = ::startFlight)
                }
            }
        }

        GalleyTray(
            engine = engine,
            heldItem = heldItem,
            onPick = { item -> heldItem = if (heldItem == item) null else item },
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            StatusText(text = "● ${phaseLabel(engine.phase)}")
            StatusText(text = "ALT ${engine.altitudeFt()} FT")
            StatusText(text = "SERVED ${engine.served} · MISSED ${engine.missed}")
        }
    }
}

private fun phaseLabel(phase: CabinEngine.Phase): String = when (phase) {
    CabinEngine.Phase.IDLE -> "AT GATE."
    CabinEngine.Phase.BOARDING -> "BOARDING."
    CabinEngine.Phase.CRUISE -> "CRUISING."
    CabinEngine.Phase.LANDED -> "LANDED."
}

/** Overall 🛫→🛬 flight progress with the little plane riding the fill edge. */
@Composable
private fun FlightProgressBar(progress: Double) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = "🛫", fontSize = 13.sp)
        Box(
            modifier = Modifier
                .weight(1f)
                .height(12.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(CabinColors.fuselageDark),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(progress.toFloat())
                    .fillMaxHeight()
                    .background(CabinColors.brand),
            )
            Text(
                text = "✈️",
                fontSize = 11.sp,
                modifier = Modifier.align(
                    BiasAlignment(progress.toFloat() * 2f - 1f, 0f),
                ),
            )
        }
        Text(text = "🛬", fontSize = 13.sp)
    }
}

/** The seat map: 5 rows x (2 seats, aisle label, 2 seats). */
@Composable
private fun SeatMap(
    engine: CabinEngine,
    onSeatTap: (CabinEngine.Passenger) -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(vertical = 16.dp),
        verticalArrangement = Arrangement.SpaceEvenly,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        repeat(CabinEngine.ROWS) { row ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Seat(engine, row, 0, onSeatTap)
                Seat(engine, row, 1, onSeatTap)
                Text(
                    text = "${row + 1}",
                    color = CabinColors.ink.copy(alpha = 0.5f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.width(28.dp),
                    textAlign = TextAlign.Center,
                )
                Seat(engine, row, 2, onSeatTap)
                Seat(engine, row, 3, onSeatTap)
            }
        }
    }
}

/**
 * One seat: emoji passenger, request bubble with a patience ring, happiness
 * bar, role badges, and grandma's press-and-hold chat progress ring. Tap to
 * serve the held galley item; press and hold to chat with grandma.
 */
@Composable
private fun Seat(
    engine: CabinEngine,
    row: Int,
    seat: Int,
    onSeatTap: (CabinEngine.Passenger) -> Unit,
) {
    val passenger = engine.passengers[row * CabinEngine.SEATS_PER_ROW + seat]
    val away = !passenger.boarded || passenger.running
    val face = when {
        away -> "💺"
        passenger.mood == CabinEngine.Mood.HAPPY -> "😄"
        passenger.mood == CabinEngine.Mood.UPSET -> "😠"
        else -> passenger.face
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Box {
            Box(
                modifier = Modifier
                    .size(width = 52.dp, height = 46.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (away) CabinColors.fuselageDark else Color.White)
                    .border(
                        1.dp,
                        CabinColors.ink.copy(alpha = if (away) 0.2f else 0.5f),
                        RoundedCornerShape(8.dp),
                    )
                    .pointerInput(passenger.id) {
                        detectTapGestures(
                            onPress = {
                                // Grandma's web click-and-hold chat maps to
                                // press-and-hold; releasing anywhere stops it.
                                engine.startChat(passenger.id)
                                tryAwaitRelease()
                                engine.stopChatting()
                            },
                            onTap = { onSeatTap(passenger) },
                        )
                    },
                contentAlignment = Alignment.Center,
            ) {
                Text(text = face, fontSize = 24.sp)
            }

            if (!away) {
                passenger.request?.let { request ->
                    RequestBadge(
                        request = request,
                        modifier = Modifier.align(Alignment.TopEnd),
                    )
                }
                if (passenger.role == CabinEngine.Role.CELEBRITY) {
                    Text(
                        text = "⭐",
                        fontSize = 11.sp,
                        modifier = Modifier.align(Alignment.BottomEnd),
                    )
                }
                if (passenger.role == CabinEngine.Role.GRANDMA && passenger.needsChat) {
                    ChatRing(
                        fraction = passenger.chatMs / CabinEngine.Tuning.GRANDMA_CHAT_MS,
                        modifier = Modifier.align(Alignment.TopStart),
                    )
                }
            }
        }

        Box(
            modifier = Modifier
                .width(44.dp)
                .height(3.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(
                    if (away) Color.Transparent else CabinColors.ink.copy(alpha = 0.15f),
                ),
        ) {
            if (!away) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth((passenger.happiness / 100.0).toFloat())
                        .fillMaxHeight()
                        .background(CabinColors.bar(passenger.happiness / 100.0)),
                )
            }
        }
    }
}

/** Request bubble: the wanted item's emoji ringed by the remaining patience. */
@Composable
private fun RequestBadge(request: CabinEngine.SeatRequest, modifier: Modifier = Modifier) {
    val fraction = (request.remainingMs / request.totalMs).coerceAtLeast(0.0)
    Box(modifier = modifier.size(24.dp), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(color = Color.White)
            drawArc(
                color = CabinColors.bar(fraction),
                startAngle = -90f,
                sweepAngle = (fraction * 360.0).toFloat(),
                useCenter = false,
                style = Stroke(width = 3.dp.toPx()),
            )
        }
        Text(text = request.item.emoji, fontSize = 11.sp)
    }
}

/** Grandma's chat indicator: 💬 wrapped in a hold-progress ring. */
@Composable
private fun ChatRing(fraction: Double, modifier: Modifier = Modifier) {
    Box(modifier = modifier.size(22.dp), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawCircle(color = CabinColors.fuselageDark)
            drawArc(
                color = CabinColors.brand,
                startAngle = -90f,
                sweepAngle = (fraction.coerceAtMost(1.0) * 360.0).toFloat(),
                useCenter = false,
                style = Stroke(width = 3.dp.toPx()),
            )
        }
        Text(text = "💬", fontSize = 10.sp)
    }
}

/** The loose passenger: hops along the aisle column; tap 3 times to calm. */
@Composable
private fun BoxScope.RunnerButton(runner: CabinEngine.Passenger, onGrab: () -> Unit) {
    Box(
        modifier = Modifier
            .align(BiasAlignment(0f, ((0.1 + runner.aislePos * 0.8) * 2 - 1).toFloat()))
            .clip(CircleShape)
            .background(CabinColors.warn.copy(alpha = 0.4f))
            .clickable(onClick = onGrab)
            .padding(6.dp),
    ) {
        Text(text = "🏃", fontSize = 26.sp)
    }
}

/** Intercom announcement banner pinned to the top of the scene. */
@Composable
private fun BoxScope.IntercomBanner(message: String) {
    Box(
        modifier = Modifier
            .align(Alignment.TopCenter)
            .padding(8.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(CabinColors.nightPanel)
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Text(
            text = message,
            color = CabinColors.nightText,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            textAlign = TextAlign.Center,
        )
    }
}

/** Centered console card used for the idle and landed overlays. */
@Composable
private fun BoxScope.OverlayCard(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier.matchParentSize().background(CabinColors.ink.copy(alpha = 0.25f)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .padding(24.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(CabinColors.fuselage)
                .border(2.dp, CabinColors.ink, RoundedCornerShape(14.dp))
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            content()
        }
    }
}

@Composable
private fun LandedStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            color = CabinColors.ink.copy(alpha = 0.6f),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        Text(
            text = value,
            color = CabinColors.ink,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** The five web galley items; tap to pick one up, tap again to put it down. */
@Composable
private fun GalleyTray(
    engine: CabinEngine,
    heldItem: CabinEngine.Item?,
    onPick: (CabinEngine.Item) -> Unit,
) {
    val cruising = engine.phase == CabinEngine.Phase.CRUISE
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "GALLEY",
            color = CabinColors.ink.copy(alpha = 0.7f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
        CabinEngine.Item.entries.forEach { item ->
            val isHeld = heldItem == item
            val shape = RoundedCornerShape(6.dp)
            Column(
                modifier = Modifier
                    .clip(shape)
                    .background(
                        if (isHeld) CabinColors.brand.copy(alpha = 0.35f) else CabinColors.fuselage,
                    )
                    .border(
                        width = if (isHeld) 2.dp else 1.dp,
                        color = if (isHeld) CabinColors.brand else CabinColors.ink.copy(alpha = 0.4f),
                        shape = shape,
                    )
                    .clickable(enabled = cruising) { onPick(item) }
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(text = item.emoji, fontSize = 20.sp)
                Text(
                    text = item.label,
                    color = CabinColors.ink,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                )
            }
        }
        HappinessMeter(happiness = engine.cabinHappiness())
    }
}

/** Cabin-wide happiness readout for the galley row. */
@Composable
private fun HappinessMeter(happiness: Int) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = if (happiness >= 60) "😊" else if (happiness >= 30) "😐" else "😡",
            fontSize = 15.sp,
        )
        Box(
            modifier = Modifier
                .width(60.dp)
                .height(6.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(CabinColors.ink.copy(alpha = 0.15f)),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(happiness / 100f)
                    .fillMaxHeight()
                    .background(CabinColors.bar(happiness / 100.0)),
            )
        }
        Text(
            text = "$happiness%",
            color = CabinColors.ink,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

/** Chunky console button echoing the web page's toolbar buttons. */
@Composable
private fun ChunkyButton(
    label: String,
    isLit: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(6.dp)
    Box(
        modifier = Modifier
            .clip(shape)
            .background(if (isLit) CabinColors.brand else CabinColors.fuselage)
            .border(1.dp, CabinColors.ink, shape)
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 7.dp),
    ) {
        Text(
            text = label,
            color = if (isLit) Color.White else CabinColors.ink.copy(alpha = if (enabled) 1f else 0.4f),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
        )
    }
}

@Composable
private fun StatusText(text: String) {
    Text(
        text = text,
        color = CabinColors.ink,
        fontSize = 10.sp,
        fontWeight = FontWeight.SemiBold,
        fontFamily = FontFamily.Monospace,
    )
}
