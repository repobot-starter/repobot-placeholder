package com.baseapp.android.view.launch

import android.content.Context
import androidx.compose.animation.animateContentSize
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Deep-navy SaaS palette with a sun-gold accent, mirroring the web styles. */
private object LaunchPalette {
    val bg = Color(0xFF0C1022)
    val surface = Color(0xFF141A33)
    val line = Color(0xFF252D4F)
    val text = Color(0xFFEEF0FB)
    val subtle = Color(0xFF9AA3C7)
    val gold = Color(0xFFF5B83D)
    val confirm = Color(0xFF8FE3A5)
}

private const val PREFS_NAME = "launchbot"
private const val WAITLIST_PREF_KEY = "waitlist-email"

private fun prefs(context: Context) =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

/**
 * Home surface for the `launch` pack: a startup landing page rendered
 * entirely from [LaunchContent] — hero with waitlist capture, features,
 * steps, pricing with a billing toggle, and FAQ. The waitlist stores locally
 * (this pack is client-only).
 */
@Composable
fun LaunchView() {
    val context = LocalContext.current
    var joinedEmail by remember {
        mutableStateOf(prefs(context).getString(WAITLIST_PREF_KEY, "") ?: "")
    }
    var email by remember { mutableStateOf("") }
    var yearly by remember { mutableStateOf(false) }
    var openQuestion by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(LaunchPalette.bg),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(40.dp),
            modifier = Modifier
                .widthIn(max = 700.dp)
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 32.dp),
        ) {
            Hero(
                joinedEmail = joinedEmail,
                email = email,
                onEmailChange = { email = it },
                onJoin = {
                    val trimmed = email.trim()
                    if ("@" in trimmed) {
                        joinedEmail = trimmed
                        prefs(context).edit().putString(WAITLIST_PREF_KEY, trimmed).apply()
                    }
                },
            )
            FeatureSection()
            StepsSection()
            PricingSection(yearly = yearly, onToggle = { yearly = it })
            FaqSection(openQuestion) { openQuestion = if (openQuestion == it) null else it }
            Text(
                text = "Made with LaunchBot",
                color = LaunchPalette.subtle,
                fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun Hero(
    joinedEmail: String,
    email: String,
    onEmailChange: (String) -> Unit,
    onJoin: () -> Unit,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(text = LaunchContent.product.logoEmoji, fontSize = 18.sp)
            Text(
                text = LaunchContent.product.name,
                color = LaunchPalette.text,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
            )
        }

        Text(
            text = LaunchContent.product.headline,
            color = LaunchPalette.text,
            fontSize = 34.sp,
            lineHeight = 40.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )

        Text(
            text = LaunchContent.product.subheadline,
            color = LaunchPalette.subtle,
            fontSize = 15.sp,
            lineHeight = 23.sp,
            textAlign = TextAlign.Center,
        )

        if (joinedEmail.isEmpty()) {
            TextField(
                value = email,
                onValueChange = onEmailChange,
                placeholder = {
                    Text(LaunchContent.product.waitlistPlaceholder, color = LaunchPalette.subtle)
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = LaunchPalette.surface,
                    unfocusedContainerColor = LaunchPalette.surface,
                    focusedTextColor = LaunchPalette.text,
                    unfocusedTextColor = LaunchPalette.text,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    cursorColor = LaunchPalette.gold,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .border(1.dp, LaunchPalette.line, RoundedCornerShape(12.dp)),
            )
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(LaunchPalette.gold)
                    .clickable(onClick = onJoin)
                    .padding(vertical = 14.dp),
            ) {
                Text(
                    text = LaunchContent.product.waitlistCta,
                    color = LaunchPalette.surface,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        } else {
            Text(
                text = "You're on the list — watch your inbox for the next cohort.",
                color = LaunchPalette.confirm,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
            )
        }

        if (LaunchContent.product.trustedBy.isNotEmpty()) {
            Text(
                text = LaunchContent.product.trustedBy
                    .joinToString("   ") { it.uppercase() },
                color = LaunchPalette.subtle.copy(alpha = 0.7f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun SectionHeader(kicker: String, title: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = kicker.uppercase(),
            color = LaunchPalette.gold,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.6.sp,
        )
        Text(
            text = title,
            color = LaunchPalette.text,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun Card(
    highlighted: Boolean = false,
    content: @Composable () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(LaunchPalette.surface)
            .border(
                1.dp,
                if (highlighted) LaunchPalette.gold else LaunchPalette.line,
                RoundedCornerShape(16.dp),
            )
            .padding(20.dp),
    ) {
        content()
    }
}

@Composable
private fun FeatureSection() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeader(kicker = "Features", title = "Everything your week is hiding")
        LaunchContent.features.forEach { feature ->
            Card {
                Text(text = feature.emoji, fontSize = 26.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = feature.title,
                    color = LaunchPalette.text,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = feature.description,
                    color = LaunchPalette.subtle,
                    fontSize = 14.sp,
                    lineHeight = 21.sp,
                )
            }
        }
    }
}

@Composable
private fun StepsSection() {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        SectionHeader(kicker = "How it works", title = "Three steps, one honest week")
        LaunchContent.steps.forEachIndexed { index, step ->
            Card {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(LaunchPalette.gold),
                ) {
                    Text(
                        text = "${index + 1}",
                        color = LaunchPalette.surface,
                        fontWeight = FontWeight.Bold,
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = step.title,
                    color = LaunchPalette.text,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = step.description,
                    color = LaunchPalette.subtle,
                    fontSize = 14.sp,
                    lineHeight = 21.sp,
                )
            }
        }
    }
}

@Composable
private fun PricingSection(yearly: Boolean, onToggle: (Boolean) -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        SectionHeader(kicker = "Pricing", title = "Pay for the hours you get back")

        Row(
            modifier = Modifier
                .clip(CircleShape)
                .background(LaunchPalette.surface)
                .border(1.dp, LaunchPalette.line, CircleShape)
                .padding(4.dp),
        ) {
            BillingOption(label = "Monthly", active = !yearly) { onToggle(false) }
            BillingOption(label = "Yearly", active = yearly) { onToggle(true) }
        }

        LaunchContent.pricing.forEach { tier ->
            val price = if (yearly) tier.yearlyPerMonth else tier.monthly
            Card(highlighted = tier.highlighted) {
                tier.badge?.let { badge ->
                    Text(
                        text = badge.uppercase(),
                        color = LaunchPalette.surface,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.8.sp,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(LaunchPalette.gold)
                            .padding(horizontal = 10.dp, vertical = 4.dp),
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }
                Text(
                    text = tier.name,
                    color = LaunchPalette.text,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                )
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = if (price == 0) "Free" else "$$price",
                        color = LaunchPalette.text,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    if (price > 0) {
                        Text(
                            text = " /mo",
                            color = LaunchPalette.subtle,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 5.dp),
                        )
                    }
                }
                Text(
                    text = tier.description,
                    color = LaunchPalette.subtle,
                    fontSize = 13.sp,
                )
                Spacer(modifier = Modifier.height(10.dp))
                Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    tier.features.forEach { item ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = "✓",
                                color = LaunchPalette.gold,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                text = item,
                                color = LaunchPalette.text,
                                fontSize = 14.sp,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BillingOption(label: String, active: Boolean, onClick: () -> Unit) {
    Text(
        text = label,
        color = if (active) LaunchPalette.surface else LaunchPalette.subtle,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .clip(CircleShape)
            .background(if (active) LaunchPalette.gold else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 8.dp),
    )
}

@Composable
private fun FaqSection(openQuestion: String?, onToggle: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        SectionHeader(kicker = "FAQ", title = "Fair questions")
        LaunchContent.faq.forEach { item ->
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(LaunchPalette.surface)
                    .border(1.dp, LaunchPalette.line, RoundedCornerShape(14.dp))
                    .clickable { onToggle(item.question) }
                    .padding(horizontal = 18.dp, vertical = 15.dp)
                    .animateContentSize(),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = item.question,
                        color = LaunchPalette.text,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        text = if (openQuestion == item.question) "–" else "+",
                        color = LaunchPalette.subtle,
                        fontSize = 20.sp,
                    )
                }
                if (openQuestion == item.question) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = item.answer,
                        color = LaunchPalette.subtle,
                        fontSize = 14.sp,
                        lineHeight = 21.sp,
                    )
                }
            }
        }
    }
}
