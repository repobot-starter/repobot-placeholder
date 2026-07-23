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
