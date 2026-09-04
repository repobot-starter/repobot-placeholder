package com.baseapp.android.view.billing

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.baseapp.android.components.components
import com.baseapp.android.components.store
import com.baseapp.android.view.theme.LocalUiTheme

/**
 * The subscribe flow — the native twin of web/app's SubscribePage.tsx (iOS:
 * SubscribeView.swift): on first composition it starts a subscription
 * checkout for the signed-in user and hands them to the session's checkoutUrl
 * (Stripe's hosted page when deployed, the web app's in-app test checkout in
 * the sandbox) in the system browser, matching how SignInView opens OAuth
 * URLs. Subscription checkout is never anonymous — this view only renders
 * inside the signed-in shell (the web twin routes signed-out visitors to
 * sign-up first).
 *
 * `productKey` picks a catalog plan; null means the default plan (the web
 * twin's `?plan=<key>` query parameter). Present it from a pricing CTA or the
 * Settings Billing card's subscribe affordance.
 */
@Composable
fun SubscribeView(
    productKey: String? = null,
    onDismiss: () -> Unit,
) {
    val theme = LocalUiTheme.current
    val context = LocalContext.current
    val billingState by store.billingStore.state.collectAsState()

    // Web parity with SubscribePage's startedRef: the checkout starts once
    // per presentation, not on every recomposition.
    var checkoutOpened by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val checkoutUrl = components.billing.startSubscriptionCheckout(productKey) ?: return@LaunchedEffect
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(checkoutUrl)))
        checkoutOpened = true
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.spacing.md),
        modifier = Modifier
            .fillMaxWidth()
            .background(theme.colors.appBg)
            .padding(24.dp),
    ) {
        val checkoutError = billingState.checkoutError
        when {
            checkoutError != null -> {
                Text(
                    text = "Checkout unavailable",
                    color = theme.colors.textPrimary,
                    fontSize = theme.typography.sizes.lg,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = checkoutError,
                    color = theme.colors.statusError,
                    fontSize = theme.typography.sizes.sm,
                    textAlign = TextAlign.Center,
                )
                DismissLink(label = "Back", onClick = onDismiss)
            }
            checkoutOpened -> {
                Text(
                    text = "Finish your checkout in the browser",
                    color = theme.colors.textPrimary,
                    fontSize = theme.typography.sizes.lg,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Your subscription becomes active as soon as the payment settles.",
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.sm,
                    textAlign = TextAlign.Center,
                )
                DismissLink(label = "Done", onClick = onDismiss)
            }
            else -> {
                Text(
                    text = "Starting your checkout…",
                    color = theme.colors.textPrimary,
                    fontSize = theme.typography.sizes.lg,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "One moment while we prepare your subscription.",
                    color = theme.colors.textSecondary,
                    fontSize = theme.typography.sizes.sm,
                    textAlign = TextAlign.Center,
                )
                CircularProgressIndicator(color = theme.colors.accent)
            }
        }
    }
}

@Composable
private fun DismissLink(label: String, onClick: () -> Unit) {
    val theme = LocalUiTheme.current
    Text(
        text = label,
        color = theme.colors.accent,
        fontSize = theme.typography.sizes.md,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp, horizontal = 8.dp),
    )
}
