import SwiftUI

/// Home surface for the `blank` (no template) pack — the native twin of the
/// web `BlankPage`. Purely static: blank projects have no backend, so this
/// view must never touch stores, components, or the network. The web page
/// shows the Repobot logo; that asset isn't in the iOS bundle, so an SF
/// Symbol stands in as the app mark.
struct BlankLandingView: View {
  @Environment(\.uiThemeTokens) private var theme

  var body: some View {
    VStack(spacing: theme.spacing.xl) {
      Image(systemName: "sparkles")
        .font(.system(size: 56, weight: .medium))
        .foregroundStyle(theme.colors.accent)

      Text("Chat with the agent to start creating.")
        .font(.system(size: theme.typography.sizes.lg, weight: .medium))
        .foregroundStyle(theme.colors.textSecondary)
        .multilineTextAlignment(.center)
    }
    .padding(.horizontal, 32)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
  }
}
