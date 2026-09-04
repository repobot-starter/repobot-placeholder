package com.baseapp.android.view.settings

import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.input.KeyboardType
import com.baseapp.android.auth.MfaEnrollment
import com.baseapp.android.components.appAuthClient
import com.baseapp.android.components.appConfig
import com.baseapp.android.components.billing.SubscriptionBadgeTone
import com.baseapp.android.components.billing.SubscriptionStatusBadge
import com.baseapp.android.components.billing.SubscriptionSummary
import com.baseapp.android.components.components
import com.baseapp.android.components.store
import com.baseapp.android.config.AuthMode
import com.baseapp.android.graphql.CurrentUserData
import com.baseapp.android.store.AvatarStore
import com.baseapp.android.view.billing.SubscribeView
import com.baseapp.android.view.kit.LabeledTextField
import com.baseapp.android.view.kit.PrimaryActionButton
import com.baseapp.android.view.kit.RemoteAvatarImage
import com.baseapp.android.view.navigation.kernelAvatarUrl
import com.baseapp.android.view.theme.LocalUiTheme
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale
import kotlinx.coroutines.launch

/**
 * Account settings destination in the kernel shell: profile display with a
 * display-name edit (writes go through UserComponent), the avatar upload
 * (storage kernel), the read-only auth identity, the Billing card (payments
 * kernel), and sign out. Mirrors the iOS SettingsView and the web
 * SettingsPage.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsView() {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val sessionState by store.sessionStore.state.collectAsState()
    val user = sessionState.hydratedUser
    var isSubscribePresented by remember { mutableStateOf(false) }
    val subscribeSheetState = rememberModalBottomSheetState()

    // Checkout and the Billing Portal run in the system browser; loading on
    // every resume covers both the first composition and the foreground
    // refetch when the user comes back to the app (iOS scenePhase parity).
    LifecycleResumeEffect(Unit) {
        scope.launch { components.billing.loadSubscription() }
        onPauseOrDispose { }
    }

    Column(
        verticalArrangement = Arrangement.spacedBy(theme.spacing.lg),
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg)
            .verticalScroll(rememberScrollState())
            .padding(theme.spacing.md),
    ) {
        if (user != null) {
            ProfileCard(user)
            AvatarCard(user)
            IdentityCard(user)
        }
        if (appConfig.authMode == AuthMode.BUILTIN) {
            SecurityCard()
        }
        NotificationsCard()
        BillingSection(onSubscribe = { isSubscribePresented = true })
        SettingsCard(title = "Session") {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(theme.radius.md))
                    .border(1.dp, theme.colors.statusError.copy(alpha = 0.5f), RoundedCornerShape(theme.radius.md))
                    .clickable { scope.launch { components.auth.signOut() } }
                    .padding(vertical = 12.dp),
            ) {
                Text(
                    text = "Sign out",
                    color = theme.colors.statusError,
                    fontSize = theme.typography.sizes.md,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }

    if (isSubscribePresented) {
        ModalBottomSheet(
            onDismissRequest = {
                isSubscribePresented = false
                scope.launch { components.billing.loadSubscription() }
            },
            sheetState = subscribeSheetState,
            containerColor = theme.colors.appBg,
        ) {
            SubscribeView(onDismiss = {
                isSubscribePresented = false
                scope.launch { components.billing.loadSubscription() }
            })
        }
    }
}

@Composable
private fun ProfileCard(user: CurrentUserData) {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    var displayName by remember(user.displayName) { mutableStateOf(user.displayName) }
    var isSaving by remember { mutableStateOf(false) }
    val trimmed = displayName.trim()

    SettingsCard(title = "Profile") {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(theme.colors.accent.copy(alpha = 0.14f)),
            ) {
                Text(
                    text = initialsOf(user.displayName),
                    color = theme.colors.accent,
                    fontSize = theme.typography.sizes.sm,
                    fontWeight = FontWeight.Bold,
                )
            }
            Column(modifier = Modifier.padding(start = theme.spacing.sm)) {
                Text(
                    text = user.displayName,
                    color = theme.colors.textPrimary,
                    fontSize = theme.typography.sizes.md,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                )
                user.account?.name?.let { accountName ->
                    Text(
                        text = accountName,
                        color = theme.colors.textSecondary,
                        fontSize = theme.typography.sizes.xs,
                        maxLines = 1,
                    )
                }
            }
            Spacer(modifier = Modifier.weight(1f))
        }

        LabeledTextField(
            title = "Display name",
            placeholder = "Enter your name",
            value = displayName,
            onValueChange = { displayName = it },
            isRequired = true,
        )

        PrimaryActionButton(
            title = "Save profile",
            loadingTitle = "Saving...",
            isLoading = isSaving,
            isEnabled = trimmed.isNotEmpty() && trimmed != user.displayName,
        ) {
            scope.launch {
                isSaving = true
                try {
                    components.user.updateDisplayName(userId = user.id, displayName = displayName)
                } finally {
                    isSaving = false
                }
            }
        }
    }
}

/**
 * The storage kernel's consumer exemplar (web twin: AvatarCard; iOS:
 * SettingsView.avatarCard): pick an image, upload it through the kernel,
 * persist the upload id on the user row. Avatars are PUBLIC uploads served
 * from the stable /file/<id> URL.
 */
@Composable
private fun AvatarCard(user: CurrentUserData) {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val avatarState by store.avatarStore.state.collectAsState()
    val isUploading = avatarState == AvatarStore.Phase.Uploading

    val photoPicker = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri ->
        if (uri == null) {
            return@rememberLauncherForActivityResult
        }
        scope.launch {
            val rawData = try {
                context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            } catch (_: Exception) {
                null
            } ?: return@launch
            components.avatarUpload.uploadPickedImage(
                userId = user.id,
                previousUploadId = user.avatarUploadId,
                rawImageData = rawData,
            )
        }
    }

    SettingsCard(title = "Avatar") {
        Text(
            text = "Shown next to your name in the app. Uploaded through the storage kernel and visible to anyone with the link.",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
        )

        Row(verticalAlignment = Alignment.CenterVertically) {
            AvatarPreview(user)

            val buttonTitle = when {
                isUploading -> "Uploading…"
                user.avatarUploadId != null -> "Replace"
                else -> "Upload"
            }
            Text(
                text = buttonTitle,
                color = theme.colors.accent,
                fontSize = theme.typography.sizes.sm,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .padding(start = 14.dp)
                    .clip(RoundedCornerShape(theme.radius.md))
                    .border(1.dp, theme.colors.accent.copy(alpha = 0.5f), RoundedCornerShape(theme.radius.md))
                    .clickable(enabled = !isUploading) {
                        photoPicker.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                        )
                    }
                    .padding(horizontal = 14.dp, vertical = 8.dp),
            )
            Spacer(modifier = Modifier.weight(1f))
        }

        val avatarError = (avatarState as? AvatarStore.Phase.Failed)?.message
        if (avatarError != null) {
            Text(
                text = avatarError,
                color = theme.colors.statusError,
                fontSize = theme.typography.sizes.sm,
            )
        }
    }
}

@Composable
private fun AvatarPreview(user: CurrentUserData) {
    val avatarUrl = kernelAvatarUrl(user.avatarUploadId)
    if (avatarUrl != null) {
        RemoteAvatarImage(
            url = avatarUrl,
            size = 56.dp,
            placeholder = { AvatarInitials(user, size = 56.dp) },
        )
    } else {
        AvatarInitials(user, size = 56.dp)
    }
}

@Composable
private fun AvatarInitials(user: CurrentUserData, size: Dp) {
    val theme = LocalUiTheme.current
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(theme.colors.accent.copy(alpha = 0.14f)),
    ) {
        Text(
            text = initialsOf(user.displayName),
            color = theme.colors.accent,
            fontSize = theme.typography.sizes.md,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun IdentityCard(user: CurrentUserData) {
    SettingsCard(title = "Auth identity") {
        IdentityRow(label = "Email", value = user.email)
        IdentityRow(
            label = "Status",
            value = user.status.rawValue.lowercase(Locale.getDefault())
                .replaceFirstChar { it.uppercase(Locale.getDefault()) },
        )
    }
}

/** Two-factor authentication card state (web twin: SecurityCard). */
private sealed interface MfaCardState {
    data object Loading : MfaCardState
    data object Disabled : MfaCardState
    data class Enrolling(val enrollment: MfaEnrollment) : MfaCardState
    data class RecoveryCodes(val codes: List<String>) : MfaCardState
    data object Enabled : MfaCardState
}

/**
 * Two-factor authentication (web twin: SecurityCard; iOS:
 * SettingsView.securityCard). One deliberate delta from web: instead of a QR
 * code, Android opens the otpauth:// URI directly, which enrolls the
 * installed authenticator app natively; the copyable secret stays as the
 * manual fallback.
 */
@Composable
private fun SecurityCard() {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var mfaState by remember { mutableStateOf<MfaCardState>(MfaCardState.Loading) }
    var mfaCode by remember { mutableStateOf("") }
    var isBusy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        val enabled = appAuthClient.fetchMfaEnabled()
        if (mfaState == MfaCardState.Loading) {
            mfaState = if (enabled) MfaCardState.Enabled else MfaCardState.Disabled
        }
    }

    fun act(action: suspend () -> Unit) {
        if (isBusy) {
            return
        }
        scope.launch {
            error = null
            isBusy = true
            try {
                action()
            } catch (caught: Exception) {
                error = caught.message ?: "The request failed."
            } finally {
                isBusy = false
            }
        }
    }

    SettingsCard(title = "Two-factor authentication") {
        Text(
            text = "Protect your account with an authenticator app: signing in asks for a 6-digit code after your password or email code.",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
        )

        when (val state = mfaState) {
            MfaCardState.Loading -> {}

            MfaCardState.Disabled -> {
                PrimaryActionButton(
                    title = "Enable two-factor authentication",
                    loadingTitle = "Preparing...",
                    isLoading = isBusy,
                    isEnabled = true,
                ) {
                    act {
                        val enrollment = appAuthClient.enrollMfa()
                        mfaCode = ""
                        mfaState = MfaCardState.Enrolling(enrollment)
                    }
                }
            }

            is MfaCardState.Enrolling -> {
                Text(
                    text = "Add the account to your authenticator app, then confirm with the first code it shows.",
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.sm,
                )
                Text(
                    text = "Open in authenticator app",
                    color = theme.colors.accent,
                    fontSize = theme.typography.sizes.sm,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .clip(RoundedCornerShape(theme.radius.md))
                        .border(1.dp, theme.colors.accent.copy(alpha = 0.5f), RoundedCornerShape(theme.radius.md))
                        .clickable {
                            runCatching {
                                context.startActivity(
                                    Intent(Intent.ACTION_VIEW, Uri.parse(state.enrollment.otpauthUri)),
                                )
                            }.onFailure {
                                error = "No authenticator app found. Enter the secret manually instead."
                            }
                        }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                )
                IdentityRow(label = "Secret", value = state.enrollment.secret)
                LabeledTextField(
                    title = "Code from your app",
                    placeholder = "6-digit code",
                    value = mfaCode,
                    onValueChange = { mfaCode = it },
                    keyboardType = KeyboardType.Number,
                    isRequired = true,
                )
                PrimaryActionButton(
                    title = "Confirm",
                    loadingTitle = "Confirming...",
                    isLoading = isBusy,
                    isEnabled = mfaCode.trim().length >= 6,
                ) {
                    act {
                        val codes = appAuthClient.confirmMfa(mfaCode)
                        mfaCode = ""
                        mfaState = MfaCardState.RecoveryCodes(codes)
                    }
                }
                Text(
                    text = "Cancel",
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.sm,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clickable {
                        error = null
                        mfaCode = ""
                        mfaState = MfaCardState.Disabled
                    },
                )
            }

            is MfaCardState.RecoveryCodes -> {
                Text(
                    text = "Two-factor authentication is on. Save these recovery codes somewhere safe — each one signs you in once if you lose your authenticator. They are shown only now.",
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.sm,
                )
                Text(
                    text = state.codes.joinToString("\n"),
                    color = theme.colors.textPrimary,
                    fontSize = theme.typography.sizes.sm,
                    fontWeight = FontWeight.Medium,
                    fontFamily = FontFamily.Monospace,
                )
                PrimaryActionButton(
                    title = "I saved my recovery codes",
                    loadingTitle = "",
                    isLoading = false,
                    isEnabled = true,
                ) {
                    mfaState = MfaCardState.Enabled
                }
            }

            MfaCardState.Enabled -> {
                LabeledTextField(
                    title = "Current code (or a recovery code) to turn off",
                    placeholder = "6-digit code",
                    value = mfaCode,
                    onValueChange = { mfaCode = it },
                    keyboardType = KeyboardType.Number,
                    isRequired = true,
                )
                Text(
                    text = if (isBusy) "Disabling…" else "Disable two-factor authentication",
                    color = theme.colors.statusError,
                    fontSize = theme.typography.sizes.sm,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .clip(RoundedCornerShape(theme.radius.md))
                        .border(1.dp, theme.colors.statusError.copy(alpha = 0.5f), RoundedCornerShape(theme.radius.md))
                        .clickable(enabled = !isBusy && mfaCode.trim().length >= 6) {
                            act {
                                appAuthClient.disableMfa(mfaCode)
                                mfaCode = ""
                                mfaState = MfaCardState.Disabled
                            }
                        }
                        .padding(horizontal = 14.dp, vertical = 8.dp),
                )
            }
        }

        error?.let { message ->
            Text(
                text = message,
                color = theme.colors.statusError,
                fontSize = theme.typography.sizes.sm,
            )
        }
    }
}

/**
 * The push kernel's preference (web twin: NotificationsCard; iOS:
 * SettingsView.notificationsCard). Permission is requested only on explicit
 * enable, never on appear; a permanently denied permission shows a Blocked
 * state pointing at the system notification settings. Hidden entirely when
 * the build carries no FCM config (push not provisioned for this project).
 */
@Composable
private fun NotificationsCard() {
    if (!components.push.isAvailable) {
        return
    }
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val activity = remember(context) { context.findComponentActivity() }
    val pushState by store.pushStore.state.collectAsState()

    // Recompute the blocked state on every resume — the user may be coming
    // back from the system notification settings having just allowed them.
    LifecycleResumeEffect(Unit) {
        components.push.refreshPermission(activity)
        onPauseOrDispose { }
    }

    SettingsCard(title = "Notifications") {
        Text(
            text = if (pushState.isPermissionBlocked) {
                "Notifications are blocked for this app. Allow them in the system settings, then try again."
            } else {
                "Get notified on this device — new activity, updates from the team, and anything the app wants to tell you."
            },
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
        )

        val isTurnOff = pushState.isRegistered
        val buttonTitle = when {
            pushState.isBusy -> "Working…"
            isTurnOff -> "Turn off notifications"
            pushState.isPermissionBlocked -> "Open system settings"
            else -> "Enable notifications"
        }
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .fillMaxWidth()
                .alpha(if (pushState.isBusy) 0.45f else 1f)
                .clip(RoundedCornerShape(theme.radius.md))
                .background(if (isTurnOff) theme.colors.surface else theme.colors.accent)
                .then(
                    if (isTurnOff) {
                        Modifier.border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.md))
                    } else {
                        Modifier
                    }
                )
                .clickable(enabled = !pushState.isBusy) {
                    when {
                        pushState.isRegistered -> scope.launch { components.push.disableNotifications() }
                        pushState.isPermissionBlocked -> runCatching {
                            context.startActivity(
                                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                                    .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName),
                            )
                        }
                        else -> activity?.let { host ->
                            scope.launch { components.push.enableNotifications(host) }
                        }
                    }
                }
                .padding(vertical = 12.dp),
        ) {
            Text(
                text = buttonTitle,
                color = if (isTurnOff) theme.colors.textPrimary else theme.colors.accentText,
                fontSize = theme.typography.sizes.md,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}

/** Unwraps the Compose context to the hosting activity (permission requests need one). */
private tailrec fun Context.findComponentActivity(): ComponentActivity? = when (this) {
    is ComponentActivity -> this
    is ContextWrapper -> baseContext.findComponentActivity()
    else -> null
}

/**
 * The payments kernel's subscription surface (web twin: BillingCard; iOS:
 * SettingsView.billingSection): plan, status badge, renewal date, and the
 * Billing Portal. One deliberate delta from web: when the account has never
 * subscribed, web renders nothing (the marketing pricing page owns the CTA
 * there); the native twins have no marketing surface, so the card offers
 * Subscribe — otherwise the subscribe flow would be unreachable on this
 * platform.
 */
@Composable
private fun BillingSection(onSubscribe: () -> Unit) {
    val billingState by store.billingStore.state.collectAsState()
    if (!billingState.hasLoadedSubscription) {
        return
    }
    val subscription = billingState.subscription
    if (subscription != null) {
        BillingCard(subscription, billingState.isOpeningPortal, billingState.billingError)
    } else {
        SubscribeCard(onSubscribe)
    }
}

@Composable
private fun BillingCard(
    subscription: SubscriptionSummary,
    isOpeningPortal: Boolean,
    billingError: String?,
) {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    SettingsCard(title = "Billing") {
        Text(
            text = "Your subscription. Payment methods, invoices, and cancellation are managed through the billing portal.",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
        )

        IdentityRow(label = "Plan", value = "${subscription.productName} · ${subscription.priceLabel}")

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "Status",
                color = theme.colors.textSecondary,
                fontSize = theme.typography.sizes.sm,
                modifier = Modifier.width(96.dp),
            )
            StatusBadge(SubscriptionStatusBadge.badge(subscription.status))
            Spacer(modifier = Modifier.weight(1f))
        }

        subscription.currentPeriodEnd?.let { renewalDate ->
            IdentityRow(
                label = "Renews",
                value = renewalDate.atZone(ZoneId.systemDefault()).toLocalDate()
                    .format(DateTimeFormatter.ofLocalizedDate(FormatStyle.SHORT)),
            )
        }

        Text(
            text = if (isOpeningPortal) "Opening…" else "Manage billing",
            color = theme.colors.accent,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .clip(RoundedCornerShape(theme.radius.md))
                .border(1.dp, theme.colors.accent.copy(alpha = 0.5f), RoundedCornerShape(theme.radius.md))
                .clickable(enabled = !isOpeningPortal) {
                    scope.launch {
                        // Opens the Billing Portal in the system browser
                        // (Stripe's hosted portal when deployed, the web app's
                        // test billing page in the sandbox) — the same
                        // URL-opening pattern the sign-in screen uses for OAuth.
                        val url = components.billing.openBillingPortal() ?: return@launch
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    }
                }
                .padding(horizontal = 14.dp, vertical = 8.dp),
        )

        if (billingError != null) {
            Text(
                text = billingError,
                color = theme.colors.statusError,
                fontSize = theme.typography.sizes.sm,
            )
        }
    }
}

@Composable
private fun SubscribeCard(onSubscribe: () -> Unit) {
    val theme = LocalUiTheme.current
    SettingsCard(title = "Billing") {
        Text(
            text = "No subscription yet. Subscribing unlocks the paid plan; billing is handled by the payments kernel.",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
        )
        Text(
            text = "Subscribe",
            color = theme.colors.accent,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .clip(RoundedCornerShape(theme.radius.md))
                .border(1.dp, theme.colors.accent.copy(alpha = 0.5f), RoundedCornerShape(theme.radius.md))
                .clickable(onClick = onSubscribe)
                .padding(horizontal = 14.dp, vertical = 8.dp),
        )
    }
}

@Composable
private fun StatusBadge(badge: SubscriptionStatusBadge) {
    val theme = LocalUiTheme.current
    val color = when (badge.tone) {
        SubscriptionBadgeTone.SUCCESS -> theme.colors.statusSuccess
        SubscriptionBadgeTone.DANGER -> theme.colors.statusError
        SubscriptionBadgeTone.NEUTRAL -> theme.colors.textSecondary
    }
    Text(
        text = badge.label,
        color = color,
        fontSize = theme.typography.sizes.xs,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .clip(RoundedCornerShape(theme.radius.pill))
            .background(color.copy(alpha = 0.14f))
            .padding(horizontal = theme.spacing.xs, vertical = 2.dp),
    )
}

@Composable
private fun SettingsCard(title: String, content: @Composable () -> Unit) {
    val theme = LocalUiTheme.current
    Column(
        verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(theme.radius.lg))
            .background(theme.colors.surface)
            .border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.lg))
            .padding(theme.spacing.md),
    ) {
        Text(
            text = title,
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Bold,
        )
        content()
    }
}

@Composable
private fun IdentityRow(label: String, value: String) {
    val theme = LocalUiTheme.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = label,
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.sm,
            modifier = Modifier.width(96.dp),
        )
        Text(
            text = value,
            color = theme.colors.textPrimary,
            fontSize = theme.typography.sizes.sm,
            fontWeight = FontWeight.Medium,
        )
    }
}

private fun initialsOf(label: String): String {
    val parts = label.split(' ', '@', '.', '_', '-').filter { it.isNotEmpty() }
    if (parts.isEmpty()) return "?"
    if (parts.size == 1) return parts[0].take(2).uppercase(Locale.getDefault())
    return "${parts[0].first()}${parts[1].first()}".uppercase(Locale.getDefault())
}
