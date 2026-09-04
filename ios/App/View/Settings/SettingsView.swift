import PhotosUI
import SwiftUI

/// Account settings destination in the kernel shell: profile display with a
/// display-name edit (writes go through UserComponent), the avatar upload
/// (storage kernel), the read-only auth identity, the Billing card
/// (payments kernel), and sign out. The web twin is
/// web/app/src/View/Settings/SettingsPage.tsx.
struct SettingsView: View {
  @EnvironmentObject private var appComponents: AppComponents
  @EnvironmentObject private var sessionStore: SessionStore
  @EnvironmentObject private var billingStore: BillingStore
  @EnvironmentObject private var avatarStore: AvatarStore
  @Environment(\.uiThemeTokens) private var theme
  @Environment(\.openURL) private var openURL
  @Environment(\.scenePhase) private var scenePhase

  @State private var displayName = ""
  @State private var isSaving = false
  @State private var selectedPhotoItem: PhotosPickerItem?
  @State private var isSubscribePresented = false

  /// Two-factor authentication card state (web twin: SecurityCard).
  private enum MfaCardState: Equatable {
    case loading
    case disabled
    case enrolling(MfaEnrollment)
    case recoveryCodes([String])
    case enabled
  }

  @State private var mfaState: MfaCardState = .loading
  @State private var mfaCode = ""
  @State private var isMfaBusy = false
  @State private var mfaError: String?

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        if let user = sessionStore.state.hydratedUser {
          profileCard(user)
          avatarCard(user)
          identityCard(user)
        }
        if appConfig.authMode == .builtin {
          securityCard
        }
        notificationsCard
        billingSection
        sessionCard
      }
      .padding(16)
      .frame(maxWidth: .infinity, alignment: .topLeading)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .background(theme.colors.appBg)
    .onAppear {
      displayName = sessionStore.state.hydratedUser?.displayName ?? ""
    }
    .task {
      await appComponents.billing.loadSubscription()
    }
    .onChange(of: scenePhase) { _, newPhase in
      // Checkout and the Billing Portal run in the system browser; refresh
      // subscription state when the user comes back to the app.
      guard newPhase == .active else { return }
      Task { await appComponents.billing.loadSubscription() }
    }
    .onChange(of: selectedPhotoItem) { _, newItem in
      guard newItem != nil else { return }
      Task { await uploadPickedPhoto() }
    }
    .sheet(isPresented: $isSubscribePresented, onDismiss: {
      Task { await appComponents.billing.loadSubscription() }
    }) {
      SubscribeView()
        .environmentObject(appComponents)
        .environmentObject(billingStore)
        .environment(\.uiThemeTokens, theme)
    }
  }

  @ViewBuilder
  private func profileCard(_ user: CurrentUserData) -> some View {
    card(title: "Profile") {
      HStack(spacing: 12) {
        Circle()
          .fill(theme.colors.accent.opacity(0.14))
          .frame(width: 44, height: 44)
          .overlay(
            Text(SidebarMenuView.initials(of: user.displayName))
              .font(.system(size: theme.typography.sizes.sm, weight: .bold))
              .foregroundStyle(theme.colors.accent)
          )
        VStack(alignment: .leading, spacing: 2) {
          Text(user.displayName)
            .font(.system(size: theme.typography.sizes.md, weight: .semibold))
            .foregroundStyle(theme.colors.textPrimary)
            .lineLimit(1)
          if let accountName = user.account?.name {
            Text(accountName)
              .font(.system(size: theme.typography.sizes.xs))
              .foregroundStyle(theme.colors.textSecondary)
              .lineLimit(1)
          }
        }
        Spacer(minLength: 0)
      }

      LabeledTextField(
        title: "Display name",
        placeholder: "Enter your name",
        text: $displayName,
        capitalization: .words,
        isRequired: true
      )

      PrimaryActionButton(
        title: "Save profile",
        loadingTitle: "Saving...",
        isLoading: isSaving,
        isEnabled: canSave(user)
      ) {
        Task { await save(user) }
      }
    }
  }

  /// The storage kernel's consumer exemplar (web twin: AvatarCard): pick an
  /// image, upload it through the kernel, persist the upload id on the user
  /// row. Avatars are PUBLIC uploads served from the stable /file/<id> URL.
  @ViewBuilder
  private func avatarCard(_ user: CurrentUserData) -> some View {
    card(title: "Avatar") {
      Text("Shown next to your name in the app. Uploaded through the storage kernel and visible to anyone with the link.")
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(theme.colors.textSecondary)

      HStack(spacing: 14) {
        avatarPreview(user)

        PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
          Text(avatarButtonTitle(user))
            .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
            .foregroundStyle(theme.colors.accent)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
              RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                .stroke(theme.colors.accent.opacity(0.5), lineWidth: 1)
            )
        }
        .disabled(avatarStore.isUploading)

        Spacer(minLength: 0)
      }

      if let error = avatarStore.errorMessage {
        Text(error)
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.statusError)
      }
    }
  }

  @ViewBuilder
  private func avatarPreview(_ user: CurrentUserData) -> some View {
    if let avatarURL = KernelShellView.avatarURL(avatarUploadId: user.avatarUploadId) {
      AsyncImage(url: avatarURL) { image in
        image
          .resizable()
          .scaledToFill()
      } placeholder: {
        avatarInitials(user)
      }
      .frame(width: 56, height: 56)
      .clipShape(Circle())
    } else {
      avatarInitials(user)
    }
  }

  private func avatarInitials(_ user: CurrentUserData) -> some View {
    Circle()
      .fill(theme.colors.accent.opacity(0.14))
      .frame(width: 56, height: 56)
      .overlay(
        Text(SidebarMenuView.initials(of: user.displayName))
          .font(.system(size: theme.typography.sizes.md, weight: .bold))
          .foregroundStyle(theme.colors.accent)
      )
  }

  private func avatarButtonTitle(_ user: CurrentUserData) -> String {
    if avatarStore.isUploading {
      return "Uploading…"
    }
    return user.avatarUploadId != nil ? "Replace" : "Upload"
  }

  @ViewBuilder
  private func identityCard(_ user: CurrentUserData) -> some View {
    card(title: "Auth identity") {
      identityRow(label: "Email", value: user.email)
      identityRow(label: "Status", value: user.status.rawValue.capitalized)
    }
  }

  /// Two-factor authentication (web twin: SecurityCard). One deliberate
  /// delta from web: instead of a QR code, iOS opens the otpauth:// URI
  /// directly, which enrolls the installed authenticator app natively; the
  /// copyable secret stays as the manual fallback.
  private var securityCard: some View {
    card(title: "Two-factor authentication") {
      Text("Protect your account with an authenticator app: signing in asks for a 6-digit code after your password or email code.")
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(theme.colors.textSecondary)

      switch mfaState {
      case .loading:
        EmptyView()

      case .disabled:
        PrimaryActionButton(
          title: "Enable two-factor authentication",
          loadingTitle: "Preparing...",
          isLoading: isMfaBusy,
          isEnabled: true
        ) {
          Task { await enrollMfa() }
        }

      case let .enrolling(enrollment):
        Text("Add the account to your authenticator app, then confirm with the first code it shows.")
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.textSecondary)

        if let otpauthURL = URL(string: enrollment.otpauthUri) {
          Button {
            openURL(otpauthURL)
          } label: {
            Text("Open in authenticator app")
              .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
              .foregroundStyle(theme.colors.accent)
              .padding(.horizontal, 14)
              .padding(.vertical, 8)
              .background(
                RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                  .stroke(theme.colors.accent.opacity(0.5), lineWidth: 1)
              )
          }
          .buttonStyle(.plain)
        }

        HStack(alignment: .firstTextBaseline, spacing: 12) {
          Text("Secret")
            .font(.system(size: theme.typography.sizes.sm))
            .foregroundStyle(theme.colors.textSecondary)
            .frame(width: 96, alignment: .leading)
          Text(enrollment.secret)
            .font(.system(size: theme.typography.sizes.xs, weight: .medium, design: .monospaced))
            .foregroundStyle(theme.colors.textPrimary)
            .textSelection(.enabled)
          Spacer(minLength: 0)
        }

        LabeledTextField(
          title: "Code from your app",
          placeholder: "6-digit code",
          text: $mfaCode,
          capitalization: .never,
          keyboardType: .numberPad,
          isRequired: true
        )

        PrimaryActionButton(
          title: "Confirm",
          loadingTitle: "Confirming...",
          isLoading: isMfaBusy,
          isEnabled: mfaCode.trimmingCharacters(in: .whitespacesAndNewlines).count >= 6
        ) {
          Task { await confirmMfa() }
        }

        Button("Cancel") {
          mfaError = nil
          mfaCode = ""
          mfaState = .disabled
        }
        .buttonStyle(.plain)
        .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
        .foregroundStyle(theme.colors.textSecondary)

      case let .recoveryCodes(codes):
        Text("Two-factor authentication is on. Save these recovery codes somewhere safe — each one signs you in once if you lose your authenticator. They are shown only now.")
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.textSecondary)

        Text(codes.joined(separator: "\n"))
          .font(.system(size: theme.typography.sizes.sm, weight: .medium, design: .monospaced))
          .foregroundStyle(theme.colors.textPrimary)
          .textSelection(.enabled)

        PrimaryActionButton(
          title: "I saved my recovery codes",
          loadingTitle: "",
          isLoading: false,
          isEnabled: true
        ) {
          mfaState = .enabled
        }

      case .enabled:
        LabeledTextField(
          title: "Current code (or a recovery code) to turn off",
          placeholder: "6-digit code",
          text: $mfaCode,
          capitalization: .never,
          keyboardType: .numberPad,
          isRequired: true
        )

        Button {
          Task { await disableMfa() }
        } label: {
          Text(isMfaBusy ? "Disabling…" : "Disable two-factor authentication")
            .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
            .foregroundStyle(theme.colors.statusError)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
              RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                .stroke(theme.colors.statusError.opacity(0.5), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(isMfaBusy || mfaCode.trimmingCharacters(in: .whitespacesAndNewlines).count < 6)
      }

      if let mfaError {
        Text(mfaError)
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.statusError)
      }
    }
    .task {
      let enabled = await appAuthClient.fetchMfaEnabled()
      if mfaState == .loading {
        mfaState = enabled ? .enabled : .disabled
      }
    }
  }

  private func enrollMfa() async {
    guard !isMfaBusy else { return }
    mfaError = nil
    isMfaBusy = true
    defer { isMfaBusy = false }
    do {
      let enrollment = try await appAuthClient.enrollMfa()
      mfaCode = ""
      mfaState = .enrolling(enrollment)
    } catch {
      mfaError = error.localizedDescription
    }
  }

  private func confirmMfa() async {
    guard !isMfaBusy else { return }
    mfaError = nil
    isMfaBusy = true
    defer { isMfaBusy = false }
    do {
      let codes = try await appAuthClient.confirmMfa(code: mfaCode)
      mfaCode = ""
      mfaState = .recoveryCodes(codes)
    } catch {
      mfaError = error.localizedDescription
    }
  }

  private func disableMfa() async {
    guard !isMfaBusy else { return }
    mfaError = nil
    isMfaBusy = true
    defer { isMfaBusy = false }
    do {
      try await appAuthClient.disableMfa(code: mfaCode)
      mfaCode = ""
      mfaState = .disabled
    } catch {
      mfaError = error.localizedDescription
    }
  }

  /// The payments kernel's subscription surface (web twin: BillingCard):
  /// plan, status badge, renewal date, and the Billing Portal. One
  /// deliberate delta from web: when the account has never subscribed, web
  /// renders nothing (the marketing pricing page owns the CTA there); the
  /// iOS twin has no marketing surface, so the card offers Subscribe —
  /// otherwise the subscribe flow would be unreachable on this platform.
  @ViewBuilder
  private var billingSection: some View {
    if billingStore.hasLoadedSubscription {
      if let subscription = billingStore.subscription {
        billingCard(subscription)
      } else {
        subscribeCard
      }
    }
  }

  @ViewBuilder
  private func billingCard(_ subscription: SubscriptionSummary) -> some View {
    card(title: "Billing") {
      Text("Your subscription. Payment methods, invoices, and cancellation are managed through the billing portal.")
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(theme.colors.textSecondary)

      identityRow(label: "Plan", value: "\(subscription.productName) · \(subscription.priceLabel)")

      HStack(alignment: .firstTextBaseline, spacing: 12) {
        Text("Status")
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.textSecondary)
          .frame(width: 96, alignment: .leading)
        statusBadge(SubscriptionStatusBadge.badge(for: subscription.status))
        Spacer(minLength: 0)
      }

      if let renewalDate = subscription.currentPeriodEnd {
        identityRow(
          label: "Renews",
          value: renewalDate.formatted(date: .numeric, time: .omitted)
        )
      }

      Button {
        Task { await manageBilling() }
      } label: {
        Text(billingStore.isOpeningPortal ? "Opening…" : "Manage billing")
          .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
          .foregroundStyle(theme.colors.accent)
          .padding(.horizontal, 14)
          .padding(.vertical, 8)
          .background(
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
              .stroke(theme.colors.accent.opacity(0.5), lineWidth: 1)
          )
      }
      .buttonStyle(.plain)
      .disabled(billingStore.isOpeningPortal)

      if let error = billingStore.billingError {
        Text(error)
          .font(.system(size: theme.typography.sizes.sm))
          .foregroundStyle(theme.colors.statusError)
      }
    }
  }

  private var subscribeCard: some View {
    card(title: "Billing") {
      Text("No subscription yet. Subscribing unlocks the paid plan; billing is handled by the payments kernel.")
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(theme.colors.textSecondary)

      Button {
        isSubscribePresented = true
      } label: {
        Text("Subscribe")
          .font(.system(size: theme.typography.sizes.sm, weight: .semibold))
          .foregroundStyle(theme.colors.accent)
          .padding(.horizontal, 14)
          .padding(.vertical, 8)
          .background(
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
              .stroke(theme.colors.accent.opacity(0.5), lineWidth: 1)
          )
      }
      .buttonStyle(.plain)
    }
  }

  private func statusBadge(_ badge: SubscriptionStatusBadge) -> some View {
    let color: Color =
      switch badge.tone {
      case .success: theme.colors.statusSuccess
      case .danger: theme.colors.statusError
      case .neutral: theme.colors.textSecondary
      }
    return Text(badge.label)
      .font(.system(size: theme.typography.sizes.xs, weight: .bold))
      .foregroundStyle(color)
      .padding(.horizontal, theme.spacing.xs)
      .padding(.vertical, 2)
      .background(Capsule().fill(color.opacity(0.14)))
  }

  /// The push kernel's preference (web twin: NotificationsCard). A separate
  /// observing subview because PushComponent publishes its own state.
  private var notificationsCard: some View {
    card(title: "Notifications") {
      NotificationsCardBody(push: appComponents.push)
    }
  }

  private var sessionCard: some View {
    card(title: "Session") {
      Button {
        Task { await appComponents.auth.signOut() }
      } label: {
        Text("Sign out")
          .font(.system(size: theme.typography.sizes.md, weight: .semibold))
          .foregroundStyle(theme.colors.statusError)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 12)
          .background(
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
              .stroke(theme.colors.statusError.opacity(0.5), lineWidth: 1)
          )
          .contentShape(Rectangle())
      }
      .buttonStyle(.plain)
    }
  }

  @ViewBuilder
  private func card(title: String, @ViewBuilder content: () -> some View) -> some View {
    VStack(alignment: .leading, spacing: 14) {
      Text(title)
        .font(.system(size: theme.typography.sizes.sm, weight: .bold))
        .foregroundStyle(theme.colors.textSecondary)
      content()
    }
    .padding(16)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(
      RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
        .fill(theme.colors.surface)
        .overlay(
          RoundedRectangle(cornerRadius: theme.radius.lg, style: .continuous)
            .stroke(theme.colors.border, lineWidth: 1)
        )
    )
  }

  /// The notifications preference body (web twin: NotificationsCard).
  /// Permission is requested only on explicit enable, never on appear; a
  /// denied permission shows a Blocked state pointing at the system
  /// Settings, and the enable path stays live so fixing it and retrying
  /// just works.
  private struct NotificationsCardBody: View {
    @ObservedObject var push: PushComponent
    @Environment(\.uiThemeTokens) private var theme
    @Environment(\.openURL) private var openURL

    var body: some View {
      VStack(alignment: .leading, spacing: 10) {
        Text(
          push.permission == .denied
            ? "Notifications are blocked for this app. Allow them in the iPhone Settings, then try again."
            : "Get notified on this device — new activity, updates from the team, and anything the app wants to tell you."
        )
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(theme.colors.textSecondary)
        Button {
          Task {
            if push.isRegistered {
              await push.disableNotifications()
            } else if push.permission == .denied {
              if let url = URL(string: UIApplication.openSettingsURLString) {
                openURL(url)
              }
            } else {
              await push.enableNotifications()
            }
          }
        } label: {
          Text(
            push.isBusy
              ? "Working…"
              : push.isRegistered
                ? "Turn off notifications"
                : push.permission == .denied
                  ? "Open iPhone Settings"
                  : "Enable notifications"
          )
          .font(.system(size: theme.typography.sizes.md, weight: .semibold))
          .foregroundStyle(push.isRegistered ? theme.colors.textPrimary : theme.colors.accentText)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 12)
          .background(
            RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
              .fill(push.isRegistered ? theme.colors.surface : theme.colors.accent)
              .overlay(
                RoundedRectangle(cornerRadius: theme.radius.md, style: .continuous)
                  .stroke(theme.colors.border, lineWidth: push.isRegistered ? 1 : 0)
              )
          )
          .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(push.isBusy)
      }
      .task {
        await push.refreshPermission()
      }
    }
  }

  private func identityRow(label: String, value: String) -> some View {
    HStack(alignment: .firstTextBaseline, spacing: 12) {
      Text(label)
        .font(.system(size: theme.typography.sizes.sm))
        .foregroundStyle(theme.colors.textSecondary)
        .frame(width: 96, alignment: .leading)
      Text(value)
        .font(.system(size: theme.typography.sizes.sm, weight: .medium))
        .foregroundStyle(theme.colors.textPrimary)
      Spacer(minLength: 0)
    }
  }

  private func canSave(_ user: CurrentUserData) -> Bool {
    let trimmed = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
    return !trimmed.isEmpty && trimmed != user.displayName
  }

  private func save(_ user: CurrentUserData) async {
    guard !isSaving else { return }
    isSaving = true
    defer { isSaving = false }
    _ = await appComponents.user.updateDisplayName(userId: user.stringId, displayName: displayName)
  }

  private func uploadPickedPhoto() async {
    guard let item = selectedPhotoItem, let user = sessionStore.state.hydratedUser else {
      return
    }
    selectedPhotoItem = nil
    guard let rawData = try? await item.loadTransferable(type: Data.self) else {
      return
    }
    _ = await appComponents.avatarUpload.uploadPickedImage(
      userId: user.stringId,
      previousUploadId: user.avatarUploadId,
      rawImageData: rawData
    )
  }

  /// Opens the Billing Portal in the system browser (Stripe's hosted portal
  /// when deployed, the web app's test billing page in the sandbox) — the
  /// same URL-opening pattern the sign-in screen uses for OAuth.
  private func manageBilling() async {
    if let url = await appComponents.billing.openBillingPortal() {
      openURL(url)
    }
  }
}
