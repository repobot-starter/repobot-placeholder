package com.baseapp.android.view.link

import android.content.Context
import android.content.Intent
import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.core.net.toUri
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private const val PREFS_NAME = "linkbot"
private const val THEME_PREF_KEY = "theme"

private fun prefs(context: Context) =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

/**
 * Home surface for the `link` pack: a link-in-bio page rendered entirely
 * from [LinkContent]. Visitors cycle theme palettes (persisted via
 * SharedPreferences) and share the page; owners edit LinkContent.kt.
 */
@Composable
fun LinkView() {
    val context = LocalContext.current
    var themeKey by remember {
        mutableStateOf(prefs(context).getString(THEME_PREF_KEY, null) ?: LinkContent.themes[0].key)
    }
    val theme = LinkContent.themes.firstOrNull { it.key == themeKey } ?: LinkContent.themes[0]

    fun open(url: String) {
        context.startActivity(Intent(Intent.ACTION_VIEW, url.toUri()))
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.linearGradient(theme.backgroundColors)),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp),
            modifier = Modifier
                .widthIn(max = 560.dp)
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 32.dp),
        ) {
            Header(theme)
            SocialRow(theme, ::open)
            LinkList(theme, ::open)
            ShareButton(theme)
            Footer(theme, activeKey = themeKey) { key ->
                themeKey = key
                prefs(context).edit().putString(THEME_PREF_KEY, key).apply()
            }
        }
    }
}

@Composable
private fun Header(theme: LinkContent.Theme) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(96.dp)
                .clip(CircleShape)
                .background(theme.surface)
                .border(3.dp, theme.accent, CircleShape),
        ) {
            Text(text = LinkContent.profile.avatarEmoji, fontSize = 44.sp)
        }
        Spacer(modifier = Modifier.size(14.dp))
        Text(
            text = LinkContent.profile.name,
            color = theme.text,
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = LinkContent.profile.handle,
            color = theme.accent,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
        )
        Spacer(modifier = Modifier.size(6.dp))
        Text(
            text = LinkContent.profile.bio,
            color = theme.subtleText,
            fontSize = 15.sp,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp,
        )
        Spacer(modifier = Modifier.size(4.dp))
        Text(
            text = "📍 ${LinkContent.profile.location}",
            color = theme.subtleText,
            fontSize = 13.sp,
        )
    }
}

@Composable
private fun SocialRow(theme: LinkContent.Theme, open: (String) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        LinkContent.socials.forEach { social ->
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(theme.surface)
                    .border(1.dp, theme.surfaceBorder, CircleShape)
                    .clickable { open(social.url) }
                    .semantics { contentDescription = social.label },
            ) {
                Text(
                    text = social.monogram,
                    color = theme.text,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}

@Composable
private fun LinkList(theme: LinkContent.Theme, open: (String) -> Unit) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        LinkContent.links.forEach { link ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(theme.surface)
                    .border(1.dp, theme.surfaceBorder, RoundedCornerShape(16.dp))
                    .clickable { open(link.url) }
                    .padding(horizontal = 18.dp, vertical = 14.dp),
            ) {
                Text(text = link.emoji, fontSize = 24.sp)
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = link.label,
                        color = theme.text,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = link.note,
                        color = theme.subtleText,
                        fontSize = 13.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Text(text = "↗", color = theme.subtleText, fontSize = 16.sp)
            }
        }
    }
}

@Composable
private fun ShareButton(theme: LinkContent.Theme) {
    val context = LocalContext.current
    Box(
        modifier = Modifier
            .clip(CircleShape)
            .background(theme.surface)
            .border(1.dp, theme.surfaceBorder, CircleShape)
            .clickable {
                val send = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, "https://robo.example")
                }
                context.startActivity(Intent.createChooser(send, "Share this page"))
            }
            .padding(horizontal = 22.dp, vertical = 10.dp),
    ) {
        Text(
            text = "Share this page",
            color = theme.text,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun Footer(theme: LinkContent.Theme, activeKey: String, onPick: (String) -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            LinkContent.themes.forEach { candidate ->
                val isActive = candidate.key == activeKey
                val ringColor by animateColorAsState(
                    if (isActive) theme.accent else theme.surfaceBorder,
                    label = "swatch-ring",
                )
                Box(
                    modifier = Modifier
                        .size(26.dp)
                        .scale(if (isActive) 1.12f else 1f)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(candidate.backgroundColors))
                        .border(2.dp, ringColor, CircleShape)
                        .clickable { onPick(candidate.key) }
                        .semantics { contentDescription = "${candidate.label} theme" },
                )
            }
        }
        Text(text = "Made with LinkBot", color = theme.subtleText, fontSize = 12.sp)
    }
}
