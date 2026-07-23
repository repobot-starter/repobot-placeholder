import SwiftUI

struct RootView: View {
  @EnvironmentObject private var sessionStore: SessionStore
  @EnvironmentObject private var appAlertStore: AppAlertStore
  @Environment(\.colorScheme) private var systemColorScheme

  var body: some View {
    // The contract's fontFamily applies app-wide; everything else about the
    // theme flows through the uiThemeTokens environment below.
    packSurface
      .themedFontFamily()
  }

  // The home surface follows the composed pack. Client-only packs (blank
  // and every game) have no backend, so they render without the kernel
  // sign-in flow or the session-driven alert overlay.
  @ViewBuilder
  private var packSurface: some View {
    switch ActivePack.key {
    case "blank":
      BlankLandingView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "pong":
      PongGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "snake":
      SnakeGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "astro":
      AstroGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "paint":
      PaintGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "blackjack":
      BlackjackGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "chess":
      ChessGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "style":
      StyleGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "cabin":
      CabinGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "salon":
      SalonGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "sitter":
      SitterGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "code":
      CodeGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "ludo":
      LudoGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "gomoku":
      GomokuGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "tawla":
      TawlaGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "carrom":
      CarromGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "hanafuda":
      HanafudaGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "truco":
      TrucoGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "race":
      RaceGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "chimney":
      ChimneyGameView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "link":
      LinkView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "folio":
      FolioView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "trade":
      TradeView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "launch":
      LaunchView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "blog":
      BlogView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "menu":
      MenuView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "flash":
      FlashView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "quiz":
      QuizView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "sugar":
      SugarView()
        .environment(\.uiThemeTokens, uiThemeTokens)
    // The AI packs are full-stack but anonymous: their surfaces talk to the
    // backend without the kernel sign-in flow (chat streams NDJSON, talk
    // mints realtime sessions via a public mutation).
    case "chat":
      AiChatView()
        .environmentObject(store.aiChatStore)
        .environment(\.uiThemeTokens, uiThemeTokens)
    case "talk":
      AiVoiceView()
        .environmentObject(store.aiVoiceStore)
        .environment(\.uiThemeTokens, uiThemeTokens)
    default:
      kernelFlow
    }
  }

  /// The kernel Identity exemplar: sign-in → hydrate → tabs, with the global
  /// alert overlay on top.
  private var kernelFlow: some View {
    ZStack(alignment: .top) {
      NavigationStack {
        if sessionStore.isAuthenticated, sessionStore.hasHydratedUser {
          MainTabView()
        } else if sessionStore.isAuthenticated, sessionStore.state.isHydratingUser {
          AppLoadingStateView(message: "Loading your account…")
        } else {
          SignInView()
        }
      }

      if let alertMessage = appAlertStore.activeAlert {
        GlobalTopAlert(
          message: alertMessage.message,
          isError: alertMessage.isError,
          onDismiss: {
            appAlertStore.activeAlert = nil
          }
        )
        .padding(.top, 8)
        .padding(.horizontal, 12)
        .transition(.move(edge: .top).combined(with: .opacity))
      }
    }
    .animation(.spring(response: 0.26, dampingFraction: 0.92), value: appAlertStore.activeAlert?.id)
    .environment(\.uiThemeTokens, uiThemeTokens)
  }

  private var uiThemeTokens: UiThemeTokens {
    let mode = ThemeResolver.resolveMode(preference: .system, systemColorScheme: systemColorScheme)
    return ThemeCatalog.uiTokens(mode: mode)
  }
}

private struct GlobalTopAlert: View {
  @Environment(\.uiThemeTokens) private var theme
  let message: String
  let isError: Bool
  let onDismiss: () -> Void

  var body: some View {
    HStack(spacing: 10) {
      Image(systemName: isError ? "xmark.octagon.fill" : "checkmark.circle.fill")
        .foregroundStyle(isError ? theme.colors.statusError : theme.colors.statusSuccess)

      Text(message)
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(theme.colors.textPrimary)
        .frame(maxWidth: .infinity, alignment: .leading)

      Button(action: onDismiss) {
        Image(systemName: "xmark")
          .font(.caption.weight(.bold))
          .foregroundStyle(theme.colors.textSecondary)
          .padding(6)
          .background(Circle().fill(theme.colors.surfaceAlt))
      }
      .buttonStyle(.plain)
      .accessibilityLabel("Dismiss notification")
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 11)
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(theme.colors.surface)
        .overlay(
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .stroke(isError ? theme.colors.statusError : theme.colors.statusSuccess, lineWidth: 1)
        )
    )
    .shadow(color: theme.colors.shadowMd, radius: 10, x: 0, y: 6)
  }
}
