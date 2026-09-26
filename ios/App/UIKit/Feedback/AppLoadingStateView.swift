import SwiftUI

/// The one shared loading treatment for page-level loading states (root
/// hydration, workspace bootstrap, agent sandbox spin-up). Any full-screen
/// loader should render this header so the app never mixes spinner styles.
struct AppLoadingHeader: View {
  @Environment(\.uiThemeTokens) private var theme
  let message: String
  var detail: String?

  var body: some View {
    VStack(spacing: 20) {
      ProgressView()
        .controlSize(.large)

      Text(message)
        .font(.system(size: theme.typography.sizes.lg, weight: .semibold))
        .foregroundStyle(theme.colors.textPrimary)
        .multilineTextAlignment(.center)

      if let detail {
        Text(detail)
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.textSecondary)
          .multilineTextAlignment(.center)
          .padding(.horizontal, 32)
      }
    }
  }
}

/// Full-screen variant of the shared loader.
struct AppLoadingStateView: View {
  @Environment(\.uiThemeTokens) private var theme
  let message: String
  var detail: String?

  var body: some View {
    AppLoadingHeader(message: message, detail: detail)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(theme.colors.appBg)
  }
}
