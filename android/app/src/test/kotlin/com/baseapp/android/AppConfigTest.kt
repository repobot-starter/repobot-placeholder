package com.baseapp.android

import com.baseapp.android.config.AppFlavor
import com.baseapp.android.config.AuthMode
import com.baseapp.android.config.ConfigLoader
import com.baseapp.android.config.ConfigLoaderException
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class AppConfigTest {
    @Test
    fun resolvesConfiguredFlavorFromGradleFlavorName() {
        assertEquals(AppFlavor.SANDBOX, AppFlavor.resolve("sandbox"))
        assertEquals(AppFlavor.DEV, AppFlavor.resolve("development"))
        assertEquals(AppFlavor.PROD, AppFlavor.resolve("production"))
    }

    @Test
    fun fallsBackToProdWhenFlavorIsUnknown() {
        assertEquals(AppFlavor.PROD, AppFlavor.resolve(""))
        assertEquals(AppFlavor.PROD, AppFlavor.resolve("mystery"))
    }

    @Test
    fun sandboxConfigParsesLocalAuthMode() {
        val sandbox = ConfigLoader.parse(
            AppFlavor.SANDBOX,
            mapOf(
                "GRAPHQL_URL" to "http://127.0.0.1:5001/demo-repobot-base/us-central1/graphql__request__api",
                "AUTH_MODE" to "local",
                "AUTH_REDIRECT_URL" to "baseapp-sandbox://auth/callback",
                "LOCAL_AUTH_TOKEN" to "dev-jwt",
            ),
        )

        assertEquals(AuthMode.LOCAL, sandbox.authMode)
        assertEquals("dev-jwt", sandbox.localAuthToken)
        assertTrue(sandbox.redirectUrl.startsWith("baseapp-sandbox://"))
        assertEquals("App", sandbox.appName)
    }

    @Test
    fun parsesUpdateChannelUrlAndTreatsEmptyAsDisabled() {
        val base = mapOf(
            "GRAPHQL_URL" to "https://example.com/prefix__graphql__request__api",
            "AUTH_MODE" to "builtin",
            "AUTH_REDIRECT_URL" to "baseapp-dev://auth/callback",
        )
        val withChannel = ConfigLoader.parse(
            AppFlavor.DEV,
            base + ("UPDATE_CHANNEL_URL" to "https://platform.example/update_channel/check?build=anb_1&token=t"),
        )
        assertEquals(
            "https://platform.example/update_channel/check?build=anb_1&token=t",
            withChannel.updateChannelUrl,
        )
        // Empty (emulator/sandbox/store builds) disables the updater.
        assertNull(ConfigLoader.parse(AppFlavor.DEV, base + ("UPDATE_CHANNEL_URL" to "")).updateChannelUrl)
        assertNull(ConfigLoader.parse(AppFlavor.DEV, base).updateChannelUrl)
    }

    @Test
    fun fcmConfigIsNullUnlessAllFourKeysArePresent() {
        val base = mapOf(
            "GRAPHQL_URL" to "https://example.com/prefix__graphql__request__api",
            "AUTH_MODE" to "builtin",
            "AUTH_REDIRECT_URL" to "baseapp-dev://auth/callback",
        )

        // Absent keys (or empty stamped values) leave push unavailable.
        assertNull(ConfigLoader.parse(AppFlavor.DEV, base).fcm)
        assertNull(
            ConfigLoader.parse(
                AppFlavor.DEV,
                base + mapOf(
                    "FCM_PROJECT_ID" to "",
                    "FCM_APPLICATION_ID" to "",
                    "FCM_API_KEY" to "",
                    "FCM_SENDER_ID" to "",
                ),
            ).fcm
        )

        // A partial config is treated as unavailable, never half-initialized.
        assertNull(
            ConfigLoader.parse(
                AppFlavor.DEV,
                base + mapOf(
                    "FCM_PROJECT_ID" to "my-project",
                    "FCM_APPLICATION_ID" to "1:123:android:abc",
                ),
            ).fcm
        )

        // All four present populates the config.
        val fcm = ConfigLoader.parse(
            AppFlavor.DEV,
            base + mapOf(
                "FCM_PROJECT_ID" to "my-project",
                "FCM_APPLICATION_ID" to "1:123:android:abc",
                "FCM_API_KEY" to "api-key",
                "FCM_SENDER_ID" to "123",
            ),
        ).fcm
        assertEquals("my-project", fcm?.projectId)
        assertEquals("1:123:android:abc", fcm?.applicationId)
        assertEquals("api-key", fcm?.apiKey)
        assertEquals("123", fcm?.senderId)
    }

    @Test
    fun deployedConfigParsesBuiltinModeAndDerivesAuthUrl() {
        val dev = ConfigLoader.parse(
            AppFlavor.DEV,
            mapOf(
                "APP_NAME" to "My App",
                "GRAPHQL_URL" to "https://example.com/prefix__graphql__request__api",
                "AUTH_MODE" to "builtin",
                "AUTH_REDIRECT_URL" to "baseapp-dev://auth/callback",
            ),
        )

        assertEquals(AuthMode.BUILTIN, dev.authMode)
        assertEquals("My App", dev.appName)
        // The auth URL is the GraphQL URL with the function name swapped.
        assertEquals("https://example.com/prefix__auth__request__api", dev.authUrl)

        // A GraphQL URL without the well-known function name yields no auth URL.
        val opaque = ConfigLoader.parse(
            AppFlavor.DEV,
            mapOf(
                "GRAPHQL_URL" to "https://example.com/graphql",
                "AUTH_MODE" to "builtin",
                "AUTH_REDIRECT_URL" to "baseapp-dev://auth/callback",
            ),
        )
        assertNull(opaque.authUrl)
    }

    @Test
    fun clientOnlyBuildBootsOnPlaceholderWhenBackendConfigIsEmpty() {
        // Client-only packs (blank, pong) build with empty backend values:
        // the app must still boot (local-mode placeholder) instead of
        // failing closed.
        val emptyDevConfig = mapOf(
            "APP_NAME" to "",
            "GRAPHQL_URL" to "",
            "AUTH_MODE" to "builtin",
            "AUTH_REDIRECT_URL" to "baseapp-dev://auth/callback",
        )

        val config = ConfigLoader.parse(AppFlavor.DEV, emptyDevConfig, isClientOnly = true)
        assertEquals(AuthMode.LOCAL, config.authMode)
        assertTrue(config.redirectUrl.startsWith("baseapp-dev://"))

        // Backend packs keep failing closed on the same empty config.
        assertThrows(ConfigLoaderException::class.java) {
            ConfigLoader.parse(AppFlavor.DEV, emptyDevConfig, isClientOnly = false)
        }
    }

    @Test
    fun clientOnlyFallbackYieldsToRealConfigWhenValuesAreStamped() {
        // An agent can upgrade a client-only project to a backend pack; once
        // real values are stamped the strict parse wins even for a
        // client-only key.
        val config = ConfigLoader.parse(
            AppFlavor.DEV,
            mapOf(
                "APP_NAME" to "Upgraded App",
                "GRAPHQL_URL" to "https://example.com/prefix__graphql__request__api",
                "AUTH_MODE" to "builtin",
                "AUTH_REDIRECT_URL" to "baseapp-dev://auth/callback",
            ),
            isClientOnly = true,
        )
        assertEquals(AuthMode.BUILTIN, config.authMode)
        assertEquals("https://example.com/prefix__auth__request__api", config.authUrl)
    }

    @Test
    fun sandboxRewritesLocalhostForEmulator() {
        val config = ConfigLoader.parse(
            AppFlavor.SANDBOX,
            mapOf(
                "GRAPHQL_URL" to "http://127.0.0.1:5001/demo/us-central1/graphql__request__api",
                "AUTH_MODE" to "local",
                "AUTH_REDIRECT_URL" to "baseapp-sandbox://auth/callback",
            ),
            isEmulator = true,
        )
        assertEquals("http://10.0.2.2:5001/demo/us-central1/graphql__request__api", config.graphqlUrl)
    }

    @Test
    fun sandboxRewritesLocalhostToLanHostOnDevices() {
        val config = ConfigLoader.parse(
            AppFlavor.SANDBOX,
            mapOf(
                "GRAPHQL_URL" to "http://localhost:5001/demo/graphql",
                "AUTH_MODE" to "local",
                "AUTH_REDIRECT_URL" to "baseapp-sandbox://auth/callback",
                "LOCAL_LAN_HOST" to "192.168.1.20",
            ),
            isEmulator = false,
        )
        assertEquals("http://192.168.1.20:5001/demo/graphql", config.graphqlUrl)
    }

    @Test
    fun webOriginParsesWhenPresentAndIsNullWhenEmpty() {
        val base = mapOf(
            "GRAPHQL_URL" to "https://example.com/prefix__graphql__request__api",
            "AUTH_MODE" to "builtin",
            "AUTH_REDIRECT_URL" to "baseapp-dev://auth/callback",
        )

        val withOrigin = ConfigLoader.parse(AppFlavor.DEV, base + ("WEB_ORIGIN" to "https://myapp.example"))
        assertEquals("https://myapp.example", withOrigin.webOrigin)
        assertEquals("https://myapp.example", withOrigin.resolvedWebOrigin)

        // An empty stamped value (client-only builds, or a pre-WEB_ORIGIN
        // pipeline) disables the billing surfaces rather than failing closed.
        val withoutOrigin = ConfigLoader.parse(AppFlavor.DEV, base + ("WEB_ORIGIN" to ""))
        assertNull(withoutOrigin.webOrigin)
        assertNull(withoutOrigin.resolvedWebOrigin)
    }

    @Test
    fun webOriginAdoptsTheRewrittenGraphqlHostInTheSandbox() {
        // Emulator: GRAPHQL_URL's localhost is rewritten to 10.0.2.2; the
        // localhost WEB_ORIGIN follows it (keeping its own port — the dev web
        // server, not the functions emulator).
        val emulator = ConfigLoader.parse(
            AppFlavor.SANDBOX,
            mapOf(
                "GRAPHQL_URL" to "http://127.0.0.1:5001/demo/us-central1/graphql__request__api",
                "AUTH_MODE" to "local",
                "AUTH_REDIRECT_URL" to "baseapp-sandbox://auth/callback",
                "WEB_ORIGIN" to "http://localhost:5173",
            ),
            isEmulator = true,
        )
        assertEquals("http://10.0.2.2:5173", emulator.resolvedWebOrigin)

        // Physical device: the LAN host stamped for GRAPHQL_URL carries over.
        val device = ConfigLoader.parse(
            AppFlavor.SANDBOX,
            mapOf(
                "GRAPHQL_URL" to "http://localhost:5001/demo/graphql__request__api",
                "AUTH_MODE" to "local",
                "AUTH_REDIRECT_URL" to "baseapp-sandbox://auth/callback",
                "LOCAL_LAN_HOST" to "192.168.1.20",
                "WEB_ORIGIN" to "http://localhost:5173",
            ),
            isEmulator = false,
        )
        assertEquals("http://192.168.1.20:5173", device.resolvedWebOrigin)

        // A deployed (non-localhost) WEB_ORIGIN never gets rewritten.
        val deployed = ConfigLoader.parse(
            AppFlavor.SANDBOX,
            mapOf(
                "GRAPHQL_URL" to "http://127.0.0.1:5001/demo/graphql__request__api",
                "AUTH_MODE" to "local",
                "AUTH_REDIRECT_URL" to "baseapp-sandbox://auth/callback",
                "WEB_ORIGIN" to "https://myapp.example",
            ),
            isEmulator = true,
        )
        assertEquals("https://myapp.example", deployed.resolvedWebOrigin)
    }

    @Test
    fun deployedUrlsAreNeverRewritten() {
        val config = ConfigLoader.parse(
            AppFlavor.DEV,
            mapOf(
                "GRAPHQL_URL" to "https://example.com/graphql",
                "AUTH_MODE" to "builtin",
                "AUTH_REDIRECT_URL" to "baseapp-dev://auth/callback",
            ),
            isEmulator = true,
        )
        assertEquals("https://example.com/graphql", config.graphqlUrl)
    }
}
