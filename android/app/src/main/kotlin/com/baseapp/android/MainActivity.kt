package com.baseapp.android

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import com.baseapp.android.auth.AuthClient
import com.baseapp.android.auth.LocalAuthClient
import com.baseapp.android.auth.SessionProviding
import com.baseapp.android.auth.SharedPreferencesSessionStorage
import com.baseapp.android.auth.StoredSessionProvider
import com.baseapp.android.auth.BuiltinAuthClient
import com.baseapp.android.components.AppComponents
import com.baseapp.android.components.components
import com.baseapp.android.config.ActivePack
import com.baseapp.android.config.AppFlavor
import com.baseapp.android.config.AuthMode
import com.baseapp.android.config.ConfigLoader
import com.baseapp.android.graphql.GraphQLClient
import com.baseapp.android.view.RootView
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initializeAppOnce()

        setContent {
            RootView()
        }

        // Client-only packs (blank, pong) render their surface without a
        // session, and their projects may have no backend deployed at all —
        // skip the restore so the app never calls the GraphQL API. Components
        // stay initialized so the kernel exemplars work after an upgrade.
        val isClientOnlyPack = ActivePack.KEY == "blank" || ActivePack.KEY == "pong"
        if (!isClientOnlyPack) {
            lifecycleScope.launch {
                components.auth.restoreSessionAndHydrateUser()
            }
        }
        handleAuthDeepLink(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleAuthDeepLink(intent)
    }

    /** Twin of the iOS IOSApp init: resolve flavor, load config, wire auth + GraphQL. */
    private fun initializeAppOnce() {
        if (AppComponents.isInitialized) {
            return
        }

        val flavor = AppFlavor.resolve(BuildConfig.FLAVOR)
        val config = ConfigLoader.load(flavor, applicationContext)

        val sessionStorage = SharedPreferencesSessionStorage(applicationContext)
        val authClient: AuthClient
        val sessionProvider: SessionProviding
        if (config.authMode == AuthMode.LOCAL) {
            authClient = LocalAuthClient(config, sessionStorage)
            // Local dev tokens never expire server-side; no refresh needed.
            sessionProvider = StoredSessionProvider(sessionStorage)
        } else {
            val authUrl = config.authUrl
                ?: error("AUTH_MODE=builtin requires a GRAPHQL_URL ending in graphql__request__api.")
            val builtinAuthClient = BuiltinAuthClient(
                authUrl = authUrl,
                redirectUrl = config.redirectUrl,
                sessionStorage = sessionStorage,
            )
            authClient = builtinAuthClient
            sessionProvider = builtinAuthClient.sessionRefresher
        }

        AppComponents.initialize(
            config = config,
            authClient = authClient,
            graphQLClient = GraphQLClient(config, sessionProvider),
        )
    }

    private fun handleAuthDeepLink(intent: Intent?) {
        val url = intent?.data?.toString() ?: return
        lifecycleScope.launch {
            components.auth.handleIncomingUrl(url)
        }
    }
}
