import SwiftUI

/// Mirrors the web kernel's login page (AuthCard + LoginPage wrapper): renders
/// whichever sign-in methods the config enables (AUTH_METHODS), in configured
/// order — OAuth buttons first, then a password and/or email-code form, plus
/// guest sign-in. In local (sandbox) mode every flow is simulated: no email
/// leaves the machine and each method resolves by signing in as the dev user,
/// so the surface matches what deploys ship.
struct SignInView: View {
  @EnvironmentObject private var appComponents: AppComponents
  @EnvironmentObject private var sessionStore: SessionStore
  @Environment(\.uiThemeTokens) private var theme
  @Environment(\.openURL) private var openURL

  private enum AuthViewState: Equatable {
    case start
    case codeEntry
    case reset
    case resetVerify
    case signup
  }

  private enum FormKind: Equatable {
    case emailCode
    case password
  }

  @State private var viewState: AuthViewState = .start
  /// When both form methods are enabled, a ghost toggle swaps between them.
  @State private var useAlternateForm = false
  @State private var email = ""
  @State private var code = ""
  @State private var password = ""
  @State private var newPassword = ""

  var body: some View {
    VStack(spacing: 0) {
      Spacer()

      VStack(alignment: .leading, spacing: 20) {
        VStack(alignment: .leading, spacing: 6) {
          Text(appConfig.appName)
            .font(.system(size: 28, weight: .bold))
            .foregroundStyle(theme.colors.textPrimary)
          Text(subtitle)
            .font(.system(size: theme.typography.sizes.md))
            .foregroundStyle(theme.colors.textSecondary)
        }

        switch viewState {
        case .start:
          startView
        case .codeEntry:
          codeEntry
        case .reset:
          resetView
        case .resetVerify:
          resetVerifyView
        case .signup:
          signupView
        }

        statusMessages

        if isLocalMode && viewState == .start {
          sandboxFootnote
        }
      }
      .padding(24)
      .background(
        RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
          .fill(theme.colors.surface)
          .overlay(
            RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
              .stroke(theme.colors.border, lineWidth: 1)
          )
      )
      .padding(.horizontal, 20)

      Spacer()
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .background(theme.colors.appBg)
  }

  // MARK: - Method registry plumbing

  private var isLocalMode: Bool {
    appConfig.authMode == .local
  }

  private var methods: [AuthMethod] {
    appConfig.authMethods
  }

  private var oauthProviders: [AuthMethod] {
    methods.filter { $0 == .google }
  }

  private var hasEmailCode: Bool { methods.contains(.emailCode) }
  private var hasPassword: Bool { methods.contains(.password) }
  private var hasGuest: Bool { methods.contains(.anonymous) }

  /// When both form methods are enabled, the one listed first is primary.
  private var passwordFirst: Bool {
    guard hasPassword else { return false }
    guard let emailIndex = methods.firstIndex(of: .emailCode) else { return true }
    guard let passwordIndex = methods.firstIndex(of: .password) else { return false }
    return passwordIndex < emailIndex
  }

  private var activeForm: FormKind? {
    if hasEmailCode && hasPassword {
      let primary: FormKind = passwordFirst ? .password : .emailCode
      let alternate: FormKind = passwordFirst ? .emailCode : .password
      return useAlternateForm ? alternate : primary
    }
    if hasPassword { return .password }
    if hasEmailCode { return .emailCode }
    return nil
  }

  private var subtitle: String {
    switch viewState {
    case .codeEntry:
      return "Enter the code we emailed you"
    case .reset:
      return "We'll email you a reset code"
    case .resetVerify:
      return "Enter the code we emailed you and pick a new password"
    case .signup:
      return "Create an account with your email"
    case .start:
      if hasEmailCode {
        return "Sign in with your email — we'll send you a 6-digit code"
      }
      if hasPassword {
        return "Sign in with your email and password"
      }
      return "Choose how you'd like to continue"
    }
  }

  // MARK: - Start view (OAuth + primary form + secondary actions)

  private var startView: some View {
    VStack(alignment: .leading, spacing: 16) {
      ForEach(oauthProviders, id: \.self) { provider in
        PrimaryActionButton(
          title: "Continue with Google",
          loadingTitle: "Signing in...",
          isLoading: sessionStore.state.isSigningIn,
          isEnabled: true
        ) {
          startOAuth(provider: provider)
        }
      }

      if !oauthProviders.isEmpty && (activeForm != nil || hasGuest) {
        divider
      }

      if activeForm == .password {
        passwordForm
      } else if activeForm == .emailCode {
        emailCodeForm
      }

      secondaryActions
    }
  }

  private var divider: some View {
    HStack(spacing: 12) {
      Rectangle().fill(theme.colors.border).frame(height: 1)
      Text("or")
        .font(.system(size: theme.typography.sizes.xs))
        .foregroundStyle(theme.colors.textSecondary)
      Rectangle().fill(theme.colors.border).frame(height: 1)
    }
  }

  private var emailCodeForm: some View {
    VStack(alignment: .leading, spacing: 16) {
      LabeledTextField(
        title: "Email",
        placeholder: "you@example.com",
        text: $email,
        capitalization: .never,
        keyboardType: .emailAddress,
        isRequired: true
      )

      PrimaryActionButton(
        title: "Email me a sign-in code",
        loadingTitle: "Sending...",
        isLoading: sessionStore.state.isSigningIn,
        isEnabled: !trimmedEmail.isEmpty
      ) {
        sendCode()
      }
    }
  }

  private var passwordForm: some View {
    VStack(alignment: .leading, spacing: 16) {
      LabeledTextField(
        title: "Email",
        placeholder: "you@example.com",
        text: $email,
        capitalization: .never,
        keyboardType: .emailAddress,
        isRequired: true
      )

      LabeledSecureField(title: "Password", placeholder: "Your password", text: $password)

      PrimaryActionButton(
        title: "Sign in",
        loadingTitle: "Signing in...",
        isLoading: sessionStore.state.isSigningIn,
        isEnabled: !trimmedEmail.isEmpty && !password.isEmpty
      ) {
        signInWithPassword()
      }
    }
  }

  @ViewBuilder
  private var secondaryActions: some View {
    if activeForm != nil || hasGuest {
      VStack(alignment: .leading, spacing: 10) {
        if activeForm == .password {
          ghostButton("Forgot password?") {
            goTo(.reset)
          }
          ghostButton("Create an account") {
            goTo(.signup)
          }
        }
        if hasEmailCode && hasPassword {
          ghostButton(activeForm == .password ? "Email me a code instead" : "Use a password instead") {
            sessionStore.clearStatusMessages()
            useAlternateForm.toggle()
          }
        }
        if hasGuest {
          ghostButton("Continue as guest") {
            continueAsGuest()
          }
        }
      }
    }
  }

  // MARK: - Code entry view

  private var codeEntry: some View {
    VStack(alignment: .leading, spacing: 16) {
      LabeledTextField(
        title: "Sign-in code",
        placeholder: "6-digit code",
        text: $code,
        capitalization: .never,
        keyboardType: .numberPad,
        isRequired: true
      )

      PrimaryActionButton(
        title: "Sign in",
        loadingTitle: "Verifying...",
        isLoading: sessionStore.state.isSigningIn,
        isEnabled: code.trimmingCharacters(in: .whitespacesAndNewlines).count >= 6
      ) {
        verifyCode()
      }

      if !isLocalMode {
        Text("You can also tap the magic link in the email to sign in directly.")
          .font(.system(size: theme.typography.sizes.xs))
          .foregroundStyle(theme.colors.textSecondary)
      }

      ghostButton("Use a different email") {
        code = ""
        goTo(.start)
      }
    }
  }

  // MARK: - Reset view

  private var resetView: some View {
    VStack(alignment: .leading, spacing: 16) {
      LabeledTextField(
        title: "Email",
        placeholder: "you@example.com",
        text: $email,
        capitalization: .never,
        keyboardType: .emailAddress,
        isRequired: true
      )

      PrimaryActionButton(
        title: "Email me a reset code",
        loadingTitle: "Sending...",
        isLoading: sessionStore.state.isSigningIn,
        isEnabled: !trimmedEmail.isEmpty
      ) {
        requestPasswordReset()
      }

      ghostButton("Back to sign-in") {
        goTo(.start)
      }
    }
  }

  // MARK: - Reset verify view (code + new password)

  private var resetVerifyView: some View {
    VStack(alignment: .leading, spacing: 16) {
      LabeledTextField(
        title: "Reset code",
        placeholder: "6-digit code",
        text: $code,
        capitalization: .never,
        keyboardType: .numberPad,
        isRequired: true
      )

      LabeledSecureField(title: "New password", placeholder: "At least 8 characters", text: $newPassword)

      PrimaryActionButton(
        title: "Set new password",
        loadingTitle: "Updating...",
        isLoading: sessionStore.state.isSigningIn,
        isEnabled: isResetCodeValid && newPassword.count >= 8
      ) {
        completePasswordReset()
      }

      ghostButton("Resend code") {
        requestPasswordReset()
      }

      ghostButton("Back to sign-in") {
        code = ""
        newPassword = ""
        goTo(.start)
      }
    }
  }

  // MARK: - Signup view

  private var signupView: some View {
    VStack(alignment: .leading, spacing: 16) {
      LabeledTextField(
        title: "Email",
        placeholder: "you@example.com",
        text: $email,
        capitalization: .never,
        keyboardType: .emailAddress,
        isRequired: true
      )

      LabeledSecureField(title: "Password", placeholder: "At least 8 characters", text: $password)

      PrimaryActionButton(
        title: "Create account",
        loadingTitle: "Creating account...",
        isLoading: sessionStore.state.isSigningIn,
        isEnabled: !trimmedEmail.isEmpty && password.count >= 8
      ) {
        signUpWithPassword()
      }

      ghostButton("Sign in instead") {
        goTo(.start)
      }
    }
  }

  // MARK: - Sandbox footnote

  private var sandboxFootnote: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("Sandbox mode — sign-in is simulated, no email is sent.")
        .font(.system(size: theme.typography.sizes.xs))
        .foregroundStyle(theme.colors.textSecondary)
      Button("Skip as local dev user") {
        signInAsLocalDevUser()
      }
      .buttonStyle(.plain)
      .font(.system(size: theme.typography.sizes.xs, weight: .semibold))
      .foregroundStyle(theme.colors.accent)
    }
  }

  // MARK: - Status messages

  @ViewBuilder
  private var statusMessages: some View {
    if let errorMessage = sessionStore.state.lastError {
      Text(errorMessage)
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(theme.colors.statusError)
    } else if let successMessage = sessionStore.state.successMessage {
      Text(successMessage)
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(theme.colors.statusSuccess)
    }
  }

  // MARK: - Actions (sandbox mode simulates every method, like the web wrapper)

  private var trimmedEmail: String {
    email.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  /// Reset codes are 6 digits (with slack for other code lengths).
  private var isResetCodeValid: Bool {
    let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
    return (6...8).contains(trimmedCode.count) && trimmedCode.allSatisfy(\.isNumber)
  }

  private func goTo(_ nextView: AuthViewState) {
    sessionStore.clearStatusMessages()
    viewState = nextView
  }

  private func signInAsLocalDevUser() {
    Task {
      await appComponents.auth.signInLocal()
    }
  }

  private func sendCode() {
    if isLocalMode {
      // Sandbox: the code step is real so the UX matches deploys, but any
      // 6-digit code passes.
      sessionStore.clearStatusMessages()
      code = ""
      viewState = .codeEntry
      sessionStore.reportSuccess("Sandbox mode — no email sent. Enter any 6-digit code.")
      return
    }
    Task {
      let didSend = await appComponents.auth.sendEmailCode(email: email)
      if didSend {
        code = ""
        viewState = .codeEntry
      }
    }
  }

  private func verifyCode() {
    if isLocalMode {
      signInAsLocalDevUser()
      return
    }
    Task {
      await appComponents.auth.verifyEmailCode(email: email, code: code)
    }
  }

  private func signInWithPassword() {
    if isLocalMode {
      signInAsLocalDevUser()
      return
    }
    Task {
      await appComponents.auth.signInWithPassword(email: email, password: password)
    }
  }

  private func signUpWithPassword() {
    if isLocalMode {
      signInAsLocalDevUser()
      return
    }
    Task {
      await appComponents.auth.signUpWithPassword(email: email, password: password)
    }
  }

  private func requestPasswordReset() {
    if isLocalMode {
      // Sandbox: the reset-code step is real so the UX matches deploys, but
      // any 6-digit code passes.
      sessionStore.clearStatusMessages()
      code = ""
      newPassword = ""
      viewState = .resetVerify
      sessionStore.reportSuccess("Sandbox mode — no email sent. Enter any 6-digit code.")
      return
    }
    Task {
      let didSend = await appComponents.auth.requestPasswordReset(email: email)
      if didSend {
        code = ""
        newPassword = ""
        viewState = .resetVerify
      }
    }
  }

  private func completePasswordReset() {
    if isLocalMode {
      signInAsLocalDevUser()
      return
    }
    Task {
      await appComponents.auth.completePasswordReset(email: email, code: code, newPassword: newPassword)
    }
  }

  private func startOAuth(provider: AuthMethod) {
    if isLocalMode {
      signInAsLocalDevUser()
      return
    }
    // The system browser runs the provider flow; the auth API then redirects
    // to AUTH_REDIRECT_URL, which deep-links back into handleIncomingURL.
    guard let url = appAuthClient.oauthAuthorizeURL(provider: provider) else {
      sessionStore.reportError("OAuth sign-in is not available in this build.")
      return
    }
    sessionStore.clearStatusMessages()
    openURL(url)
  }

  private func continueAsGuest() {
    if isLocalMode {
      signInAsLocalDevUser()
      return
    }
    Task {
      await appComponents.auth.signInAnonymously()
    }
  }
}

/// Password-entry sibling of LabeledTextField (UIKit/Forms) using the same
/// label + field styling with a SecureField.
private struct LabeledSecureField: View {
  @Environment(\.uiThemeTokens) private var theme
  let title: String
  let placeholder: String
  @Binding var text: String

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("\(title)*")
        .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
        .foregroundStyle(theme.colors.textPrimary)
      SecureField(placeholder, text: $text)
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled(true)
        .padding(.horizontal, 12)
        .padding(.vertical, 11)
        .background(
          RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
            .fill(theme.colors.surfaceAlt)
            .overlay(
              RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                .stroke(theme.colors.border, lineWidth: 1)
            )
        )
    }
  }
}

private extension SignInView {
  func ghostButton(_ title: String, action: @escaping () -> Void) -> some View {
    Button(title, action: action)
      .buttonStyle(.plain)
      .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
      .foregroundStyle(theme.colors.accent)
  }
}
