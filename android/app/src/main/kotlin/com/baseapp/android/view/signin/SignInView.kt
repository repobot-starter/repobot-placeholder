package com.baseapp.android.view.signin

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.baseapp.android.auth.AuthMethod
import com.baseapp.android.components.appConfig
import com.baseapp.android.components.components
import com.baseapp.android.components.store
import com.baseapp.android.config.AuthMode
import com.baseapp.android.view.kit.LabeledTextField
import com.baseapp.android.view.kit.PrimaryActionButton
import com.baseapp.android.view.theme.LocalUiTheme
import kotlinx.coroutines.launch

private enum class SignInScreenView { START, CODE, RESET, RESET_VERIFY, SIGNUP }

/** Reset codes are 6–8 digits, matching the web twin's validation. */
private val RESET_CODE_REGEX = Regex("""\d{6,8}""")

/**
 * Mirrors the web design system's AuthCard bound by LoginPage: renders
 * whichever sign-in methods the product enables via AUTH_METHODS, in the
 * configured order — OAuth buttons first, then a divider, then a password
 * and/or email-code form (when both are enabled the one listed first is
 * primary and a ghost toggle switches), plus password reset/signup views and
 * a guest button.
 *
 * In local (sandbox) mode every flow is simulated exactly like the web
 * wrapper: send-code shows the sandbox message (any 6-digit code verifies),
 * and password/oauth/guest sign in directly as the local dev user — so the
 * surface users build against matches what deploys ship.
 */
@Composable
fun SignInView() {
    val theme = LocalUiTheme.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val sessionState by store.sessionStore.state.collectAsState()

    val isLocalMode = appConfig.authMode == AuthMode.LOCAL
    val methods = appConfig.authMethods
    val oauthProviders = methods.filter { it == AuthMethod.GOOGLE }
    val hasEmailCode = AuthMethod.EMAIL_CODE in methods
    val hasPassword = AuthMethod.PASSWORD in methods
    val hasGuest = AuthMethod.ANONYMOUS in methods
    // When both form methods are enabled, the one listed first is primary and
    // a ghost toggle switches to the other.
    val passwordFirst = hasPassword
        && (!hasEmailCode || methods.indexOf(AuthMethod.PASSWORD) < methods.indexOf(AuthMethod.EMAIL_CODE))

    var view by remember { mutableStateOf(SignInScreenView.START) }
    var primaryForm by remember {
        mutableStateOf(if (passwordFirst) AuthMethod.PASSWORD else AuthMethod.EMAIL_CODE)
    }
    var email by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }

    val activeForm: AuthMethod? = when {
        hasEmailCode && hasPassword -> primaryForm
        hasPassword -> AuthMethod.PASSWORD
        hasEmailCode -> AuthMethod.EMAIL_CODE
        else -> null
    }

    fun goTo(nextView: SignInScreenView) {
        store.sessionStore.clearStatusMessages()
        view = nextView
    }

    fun signInAsLocalDevUser() {
        scope.launch { components.auth.signInLocal() }
    }

    fun sendCode() {
        if (isLocalMode) {
            // Sandbox: the code step is real so the UX matches deploys, but
            // any 6-digit code passes.
            store.sessionStore.reportSuccess("Sandbox mode — no email sent. Enter any 6-digit code.")
            code = ""
            view = SignInScreenView.CODE
            return
        }
        scope.launch {
            val didSend = components.auth.sendEmailCode(email)
            if (didSend) {
                code = ""
                view = SignInScreenView.CODE
            }
        }
    }

    fun sendResetCode() {
        if (isLocalMode) {
            // Sandbox: the code + new-password step is real so the UX matches
            // deploys, but any 6-digit code passes.
            store.sessionStore.reportSuccess("Sandbox mode — no email sent. Enter any 6-digit code.")
            code = ""
            newPassword = ""
            view = SignInScreenView.RESET_VERIFY
            return
        }
        scope.launch {
            val didSend = components.auth.requestPasswordReset(email)
            if (didSend) {
                code = ""
                newPassword = ""
                view = SignInScreenView.RESET_VERIFY
            }
        }
    }

    fun startOAuth(provider: AuthMethod) {
        if (isLocalMode) {
            signInAsLocalDevUser()
            return
        }
        val url = components.auth.oauthAuthorizeUrl(provider)
        if (url == null) {
            store.sessionStore.reportError("${oauthLabel(provider)} is not available right now.")
            return
        }
        // The provider redirects back to the app's auth deep link
        // (AUTH_REDIRECT_URL), which MainActivity routes through
        // handleIncomingUrl to complete the sign-in.
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }

    val subtitle = when (view) {
        SignInScreenView.CODE -> "Enter the code we emailed you"
        SignInScreenView.RESET -> "We'll email you a reset code"
        SignInScreenView.RESET_VERIFY -> "Enter the reset code and choose a new password"
        SignInScreenView.SIGNUP -> "Create your account"
        SignInScreenView.START -> when {
            hasEmailCode -> "Sign in with your email — we'll send you a 6-digit code."
            hasPassword -> "Sign in with your email and password."
            else -> "Choose how you'd like to continue."
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(theme.colors.appBg),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(20.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .clip(RoundedCornerShape(theme.radius.lg))
                .background(theme.colors.surface)
                .border(1.dp, theme.colors.border, RoundedCornerShape(theme.radius.lg))
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = appConfig.appName,
                    color = theme.colors.textPrimary,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = subtitle,
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.md,
                )
            }

            when (view) {
                SignInScreenView.CODE -> {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        LabeledTextField(
                            title = "Sign-in code",
                            placeholder = "6-digit code",
                            value = code,
                            onValueChange = { code = it },
                            keyboardType = KeyboardType.Number,
                            isRequired = true,
                        )
                        PrimaryActionButton(
                            title = "Verify code",
                            loadingTitle = "Verifying...",
                            isLoading = sessionState.isSigningIn,
                            isEnabled = code.trim().length >= 6,
                        ) {
                            if (isLocalMode) {
                                signInAsLocalDevUser()
                            } else {
                                scope.launch { components.auth.verifyEmailCode(email, code) }
                            }
                        }
                        if (!isLocalMode) {
                            Text(
                                text = "You can also tap the magic link in the email to sign in directly.",
                                color = theme.colors.textSecondary,
                                fontSize = theme.typography.sizes.xs,
                            )
                        }
                        GhostLink(title = "Resend code") { sendCode() }
                        GhostLink(title = "Use a different email") {
                            code = ""
                            goTo(SignInScreenView.START)
                        }
                    }
                }
                SignInScreenView.RESET -> {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        LabeledTextField(
                            title = "Email",
                            placeholder = "you@example.com",
                            value = email,
                            onValueChange = { email = it },
                            keyboardType = KeyboardType.Email,
                            isRequired = true,
                        )
                        PrimaryActionButton(
                            title = "Email me a reset code",
                            loadingTitle = "Sending...",
                            isLoading = sessionState.isSigningIn,
                            isEnabled = email.trim().isNotEmpty(),
                        ) {
                            sendResetCode()
                        }
                        GhostLink(title = "Back to sign-in") { goTo(SignInScreenView.START) }
                    }
                }
                SignInScreenView.RESET_VERIFY -> {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        LabeledTextField(
                            title = "Reset code",
                            placeholder = "6-digit code",
                            value = code,
                            onValueChange = { code = it },
                            keyboardType = KeyboardType.Number,
                            isRequired = true,
                        )
                        LabeledTextField(
                            title = "New password",
                            placeholder = "At least 8 characters",
                            value = newPassword,
                            onValueChange = { newPassword = it },
                            keyboardType = KeyboardType.Password,
                            isRequired = true,
                            visualTransformation = PasswordVisualTransformation(),
                        )
                        PrimaryActionButton(
                            title = "Set new password",
                            loadingTitle = "Saving...",
                            isLoading = sessionState.isSigningIn,
                            isEnabled = RESET_CODE_REGEX.matches(code.trim()) && newPassword.length >= 8,
                        ) {
                            if (isLocalMode) {
                                signInAsLocalDevUser()
                            } else {
                                scope.launch {
                                    components.auth.completePasswordReset(email, code, newPassword)
                                }
                            }
                        }
                        GhostLink(title = "Resend code") { sendResetCode() }
                        GhostLink(title = "Back to sign in") {
                            code = ""
                            newPassword = ""
                            goTo(SignInScreenView.START)
                        }
                    }
                }
                SignInScreenView.SIGNUP -> {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        LabeledTextField(
                            title = "Email",
                            placeholder = "you@example.com",
                            value = email,
                            onValueChange = { email = it },
                            keyboardType = KeyboardType.Email,
                            isRequired = true,
                        )
                        LabeledTextField(
                            title = "Password",
                            placeholder = "At least 8 characters",
                            value = password,
                            onValueChange = { password = it },
                            keyboardType = KeyboardType.Password,
                            isRequired = true,
                        )
                        PrimaryActionButton(
                            title = "Create account",
                            loadingTitle = "Creating...",
                            isLoading = sessionState.isSigningIn,
                            isEnabled = email.trim().isNotEmpty() && password.length >= 8,
                        ) {
                            if (isLocalMode) {
                                signInAsLocalDevUser()
                            } else {
                                scope.launch { components.auth.signUpWithPassword(email, password) }
                            }
                        }
                        GhostLink(title = "Sign in instead") { goTo(SignInScreenView.START) }
                    }
                }
                SignInScreenView.START -> {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        // OAuth buttons first, in configured order.
                        oauthProviders.forEach { provider ->
                            PrimaryActionButton(
                                title = oauthLabel(provider),
                                loadingTitle = "Signing in...",
                                isLoading = sessionState.isSigningIn,
                                isEnabled = true,
                            ) {
                                startOAuth(provider)
                            }
                        }
                        if (oauthProviders.isNotEmpty() && (activeForm != null || hasGuest)) {
                            OrDivider()
                        }

                        when (activeForm) {
                            AuthMethod.PASSWORD -> {
                                LabeledTextField(
                                    title = "Email",
                                    placeholder = "you@example.com",
                                    value = email,
                                    onValueChange = { email = it },
                                    keyboardType = KeyboardType.Email,
                                    isRequired = true,
                                )
                                LabeledTextField(
                                    title = "Password",
                                    placeholder = "Your password",
                                    value = password,
                                    onValueChange = { password = it },
                                    keyboardType = KeyboardType.Password,
                                    isRequired = true,
                                )
                                PrimaryActionButton(
                                    title = "Sign in",
                                    loadingTitle = "Signing in...",
                                    isLoading = sessionState.isSigningIn,
                                    isEnabled = email.trim().isNotEmpty() && password.isNotEmpty(),
                                ) {
                                    if (isLocalMode) {
                                        signInAsLocalDevUser()
                                    } else {
                                        scope.launch { components.auth.signInWithPassword(email, password) }
                                    }
                                }
                                GhostLink(title = "Forgot password?") { goTo(SignInScreenView.RESET) }
                                GhostLink(title = "Create an account") { goTo(SignInScreenView.SIGNUP) }
                            }
                            AuthMethod.EMAIL_CODE -> {
                                LabeledTextField(
                                    title = "Email",
                                    placeholder = "you@example.com",
                                    value = email,
                                    onValueChange = { email = it },
                                    keyboardType = KeyboardType.Email,
                                    isRequired = true,
                                )
                                PrimaryActionButton(
                                    title = "Email me a sign-in code",
                                    loadingTitle = "Sending...",
                                    isLoading = sessionState.isSigningIn,
                                    isEnabled = email.trim().isNotEmpty(),
                                ) {
                                    sendCode()
                                }
                            }
                            else -> {}
                        }

                        if (hasEmailCode && hasPassword) {
                            GhostLink(
                                title = if (primaryForm == AuthMethod.PASSWORD) {
                                    "Email me a code instead"
                                } else {
                                    "Use a password instead"
                                },
                            ) {
                                store.sessionStore.clearStatusMessages()
                                primaryForm = if (primaryForm == AuthMethod.PASSWORD) {
                                    AuthMethod.EMAIL_CODE
                                } else {
                                    AuthMethod.PASSWORD
                                }
                            }
                        }
                        if (hasGuest) {
                            GhostLink(title = "Continue as guest") {
                                if (isLocalMode) {
                                    signInAsLocalDevUser()
                                } else {
                                    scope.launch { components.auth.signInAnonymously() }
                                }
                            }
                        }
                    }
                }
            }

            sessionState.lastError?.let { errorMessage ->
                Text(
                    text = errorMessage,
                    color = theme.colors.statusError,
                    fontSize = theme.typography.sizes.sm,
                )
            } ?: sessionState.successMessage?.let { successMessage ->
                Text(
                    text = successMessage,
                    color = theme.colors.statusSuccess,
                    fontSize = theme.typography.sizes.sm,
                )
            }

            if (isLocalMode && view == SignInScreenView.START) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Sandbox mode — sign-in is simulated, no email is sent.",
                        color = theme.colors.textSecondary,
                        fontSize = theme.typography.sizes.xs,
                    )
                    Text(
                        text = "Skip as local dev user",
                        color = theme.colors.accent,
                        fontSize = theme.typography.sizes.xs,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.clickable { signInAsLocalDevUser() },
                    )
                }
            }
        }
    }
}

private fun oauthLabel(provider: AuthMethod): String = when (provider) {
    AuthMethod.GOOGLE -> "Continue with Google"
    else -> "Continue"
}

@Composable
private fun GhostLink(title: String, onClick: () -> Unit) {
    val theme = LocalUiTheme.current
    Text(
        text = title,
        color = theme.colors.accent,
        fontSize = theme.typography.sizes.sm,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier.clickable(onClick = onClick),
    )
}

@Composable
private fun OrDivider() {
    val theme = LocalUiTheme.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(theme.colors.border),
        )
        Text(
            text = "or",
            color = theme.colors.textSecondary,
            fontSize = theme.typography.sizes.xs,
        )
        Box(
            modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(theme.colors.border),
        )
    }
}
