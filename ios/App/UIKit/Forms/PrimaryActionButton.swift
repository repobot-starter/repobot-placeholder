import SwiftUI

struct PrimaryActionButton: View {
  @Environment(\.uiThemeTokens) private var theme
  let title: String
  let loadingTitle: String
  let isLoading: Bool
  let isEnabled: Bool
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      HStack(spacing: 8) {
        if isLoading {
          ProgressView()
            .progressViewStyle(.circular)
            .tint(theme.colors.accentText)
        }
        Text(isLoading ? loadingTitle : title)
          .font(.system(size: theme.typography.sizes.md, weight: .semibold))
      }
      .frame(maxWidth: .infinity)
      .padding(.vertical, 12)
    }
    .buttonStyle(.plain)
    .foregroundStyle(theme.colors.accentText)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
        .fill(theme.colors.accent)
        .opacity((isEnabled && !isLoading) ? 1 : 0.45)
    )
    .disabled(!isEnabled || isLoading)
  }
}
