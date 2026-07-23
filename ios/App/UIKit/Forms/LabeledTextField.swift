import SwiftUI
import UIKit

struct LabeledTextField: View {
  @Environment(\.uiThemeTokens) private var theme
  let title: String
  let placeholder: String
  @Binding var text: String
  let capitalization: TextInputAutocapitalization?
  let keyboardType: UIKeyboardType
  let disableAutocorrection: Bool
  let isRequired: Bool
  let focused: FocusState<Bool>.Binding?

  init(
    title: String,
    placeholder: String,
    text: Binding<String>,
    capitalization: TextInputAutocapitalization? = .words,
    keyboardType: UIKeyboardType = .default,
    disableAutocorrection: Bool = true,
    isRequired: Bool = false,
    focused: FocusState<Bool>.Binding? = nil
  ) {
    self.title = title
    self.placeholder = placeholder
    _text = text
    self.capitalization = capitalization
    self.keyboardType = keyboardType
    self.disableAutocorrection = disableAutocorrection
    self.isRequired = isRequired
    self.focused = focused
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text(isRequired ? "\(title)*" : title)
        .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
        .foregroundStyle(theme.colors.textPrimary)
      if let focused {
        TextField(placeholder, text: $text)
          .textInputAutocapitalization(capitalization)
          .autocorrectionDisabled(disableAutocorrection)
          .keyboardType(keyboardType)
          .focused(focused)
          .padding(.horizontal, 12)
          .padding(.vertical, 11)
          .background(fieldBackground)
      } else {
        TextField(placeholder, text: $text)
          .textInputAutocapitalization(capitalization)
          .autocorrectionDisabled(disableAutocorrection)
          .keyboardType(keyboardType)
          .padding(.horizontal, 12)
          .padding(.vertical, 11)
          .background(fieldBackground)
      }
    }
  }

  private var fieldBackground: some View {
    RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
      .fill(theme.colors.surfaceAlt)
      .overlay(
        RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
          .stroke(theme.colors.border, lineWidth: 1)
      )
  }
}
