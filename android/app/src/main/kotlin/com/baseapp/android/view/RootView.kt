package com.baseapp.android.view

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.baseapp.android.components.store
import com.baseapp.android.config.ActivePack
import com.baseapp.android.view.blank.BlankLandingView
import com.baseapp.android.view.games.astro.AstroGameView
import com.baseapp.android.view.games.blackjack.BlackjackGameView
import com.baseapp.android.view.games.cabin.CabinGameView
import com.baseapp.android.view.games.carrom.CarromGameView
import com.baseapp.android.view.games.chess.ChessGameView
import com.baseapp.android.view.games.chimney.ChimneyGameView
import com.baseapp.android.view.games.code.CodeGameView
import com.baseapp.android.view.games.gomoku.GomokuGameView
import com.baseapp.android.view.games.hanafuda.HanafudaGameView
import com.baseapp.android.view.games.ludo.LudoGameView
import com.baseapp.android.view.games.paint.PaintGameView
import com.baseapp.android.view.games.pong.PongGameView
import com.baseapp.android.view.games.race.RaceGameView
import com.baseapp.android.view.games.salon.SalonGameView
import com.baseapp.android.view.games.sitter.SitterGameView
import com.baseapp.android.view.games.snake.SnakeGameView
import com.baseapp.android.view.games.style.StyleGameView
import com.baseapp.android.view.games.tawla.TawlaGameView
import com.baseapp.android.view.games.truco.TrucoGameView
import com.baseapp.android.view.kit.AppLoadingStateView
import com.baseapp.android.view.folio.FolioView
import com.baseapp.android.view.blog.BlogView
import com.baseapp.android.view.flash.FlashView
import com.baseapp.android.view.quiz.QuizView
import com.baseapp.android.view.sugar.SugarView
import com.baseapp.android.view.launch.LaunchView
import com.baseapp.android.view.link.LinkView
import com.baseapp.android.view.menu.MenuView
import com.baseapp.android.view.signin.SignInView
import com.baseapp.android.view.theme.LocalUiTheme
import com.baseapp.android.view.trade.TradeView
import com.baseapp.android.view.theme.ThemeCatalog
import com.baseapp.android.view.theme.ThemePreference
import com.baseapp.android.view.theme.ThemeResolver

@Composable
fun RootView() {
    val systemIsDark = isSystemInDarkTheme()
    val mode = ThemeResolver.resolveMode(ThemePreference.SYSTEM, systemIsDark)
    val theme = ThemeCatalog.uiTokens(mode)

    CompositionLocalProvider(LocalUiTheme provides theme) {
      // The contract's fontFamily cascades to all otherwise-unstyled text;
      // explicit TextStyles merge with (and can override) it.
      ProvideTextStyle(TextStyle(fontFamily = theme.typography.fontFamily)) {
        // Home surface switches on the composed pack — the native twin of the
        // web App.tsx homePageByPack. Client-only packs (blank and every
        // game) render without session stores or the alert overlay: those
        // projects may have no backend deployed, so nothing here may touch
        // GraphQL.
        when (ActivePack.KEY) {
            "blank" -> BlankLandingView()
            "pong" -> PongGameView()
            "snake" -> SnakeGameView()
            "astro" -> AstroGameView()
            "paint" -> PaintGameView()
            "blackjack" -> BlackjackGameView()
            "chess" -> ChessGameView()
            "style" -> StyleGameView()
            "cabin" -> CabinGameView()
            "salon" -> SalonGameView()
            "sitter" -> SitterGameView()
            "code" -> CodeGameView()
            "ludo" -> LudoGameView()
            "gomoku" -> GomokuGameView()
            "tawla" -> TawlaGameView()
            "carrom" -> CarromGameView()
            "hanafuda" -> HanafudaGameView()
            "truco" -> TrucoGameView()
            "race" -> RaceGameView()
            "chimney" -> ChimneyGameView()
            "link" -> LinkView()
            "folio" -> FolioView()
            "trade" -> TradeView()
            "launch" -> LaunchView()
            "blog" -> BlogView()
            "menu" -> MenuView()
            "flash" -> FlashView()
            "quiz" -> QuizView()
            "sugar" -> SugarView()
            else -> KernelHomeView()
        }
      }
    }
}

/** The kernel Identity exemplar: sign-in → tabs, with the global alert overlay. */
@Composable
private fun KernelHomeView() {
    val sessionState by store.sessionStore.state.collectAsState()
    val activeAlert by store.appAlertStore.activeAlert.collectAsState()

    Box(modifier = Modifier.fillMaxSize()) {
        when {
            sessionState.session != null && sessionState.hydratedUser != null -> MainTabView()
            sessionState.session != null && sessionState.isHydratingUser ->
                AppLoadingStateView(message = "Loading your account…")
            else -> SignInView()
        }

        AnimatedVisibility(
            visible = activeAlert != null,
            enter = slideInVertically { -it } + fadeIn(),
            exit = slideOutVertically { -it } + fadeOut(),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .statusBarsPadding()
                .padding(top = 8.dp)
                .padding(horizontal = 12.dp),
        ) {
            activeAlert?.let { alert ->
                GlobalTopAlert(
                    message = alert.message,
                    isError = alert.isError,
                    onDismiss = { store.appAlertStore.setActiveAlert(null) },
                )
            }
        }
    }
}

@Composable
private fun GlobalTopAlert(message: String, isError: Boolean, onDismiss: () -> Unit) {
    val theme = LocalUiTheme.current
    val statusColor = if (isError) theme.colors.statusError else theme.colors.statusSuccess
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(theme.colors.surface)
            .border(1.dp, statusColor, RoundedCornerShape(14.dp))
            .padding(horizontal = 12.dp, vertical = 11.dp),
    ) {
        Icon(
            imageVector = if (isError) Icons.Filled.Warning else Icons.Filled.CheckCircle,
            contentDescription = null,
            tint = statusColor,
            modifier = Modifier.size(18.dp),
        )
        Text(
            text = message,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 10.dp),
        )
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .size(24.dp)
                .clip(CircleShape)
                .background(theme.colors.surfaceAlt)
                .clickable(onClick = onDismiss),
        ) {
            Icon(
                imageVector = Icons.Filled.Close,
                contentDescription = "Dismiss notification",
                tint = theme.colors.textSecondary,
                modifier = Modifier.size(12.dp),
            )
        }
    }
}
