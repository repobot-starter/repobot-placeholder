import java.net.NetworkInterface
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.apollo)
}

// Platform builds (android-build.yml) override the application id with the
// deploy-slug-derived id; local builds use the base id + per-flavor suffixes.
val applicationIdOverride = project.findProperty("appApplicationId") as String?
val displayNameOverride = project.findProperty("appDisplayName") as String?

android {
    namespace = "com.baseapp.android"
    compileSdk = 35

    defaultConfig {
        applicationId = applicationIdOverride ?: "com.baseapp.android"
        minSdk = 26
        targetSdk = 35
        versionCode = (project.findProperty("appVersionCode") as String?)?.toInt() ?: 1
        versionName = (project.findProperty("appVersionName") as String?) ?: "0.1.0"
    }

    // Flavors mirror the iOS schemes: Sandbox (local emulators, AUTH_MODE=local),
    // Development and Production (AUTH_MODE=builtin, values stamped by the
    // android-build.yml workflow into the flavor's config.properties asset).
    flavorDimensions += "environment"
    productFlavors {
        create("sandbox") {
            dimension = "environment"
            if (applicationIdOverride == null) {
                applicationIdSuffix = ".sandbox"
            }
            manifestPlaceholders["authScheme"] = "baseapp-sandbox"
            resValue("string", "app_name", displayNameOverride ?: "Base App (Sandbox)")
        }
        create("development") {
            dimension = "environment"
            if (applicationIdOverride == null) {
                applicationIdSuffix = ".dev"
            }
            manifestPlaceholders["authScheme"] = "baseapp-dev"
            resValue("string", "app_name", displayNameOverride ?: "Base App (Dev)")
        }
        create("production") {
            dimension = "environment"
            manifestPlaceholders["authScheme"] = "baseapp"
            resValue("string", "app_name", displayNameOverride ?: "Base App")
        }
    }

    // Device builds are signed with the platform-managed per-project keystore
    // (injected as env vars by android-build.yml). Local release builds fall
    // back to the debug key so `assembleRelease` always works.
    val keystorePath = System.getenv("ANDROID_KEYSTORE_FILE")
    signingConfigs {
        if (!keystorePath.isNullOrEmpty()) {
            create("release") {
                storeFile = file(keystorePath)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: "app"
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
                    ?: System.getenv("ANDROID_KEYSTORE_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (!keystorePath.isNullOrEmpty()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

// GraphQL codegen: the schema is composed from the repo's source-of-truth SDL
// by graphql-fetch-schema.sh (npm run graphql:android:prebuild) into
// src/main/graphql/schema.graphqls; operations live alongside it. Types are
// generated at build time — nothing generated is committed.
apollo {
    service("app") {
        packageName.set("com.baseapp.android.graphql.generated")
        mapScalarToKotlinString("Id")
        mapScalarToKotlinString("Instant")
    }
}

// Sandbox twin of the iOS "Stamp Sandbox Config" build phase: copies the
// bootstrap-generated local dev JWT from web/app/.env.local into a generated
// config.local.properties asset (never committed), plus the machine's LAN IP
// so physical devices can reach the local emulators.
abstract class StampSandboxConfigTask : DefaultTask() {
    @get:Internal
    abstract val envLocalPath: Property<String>

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    init {
        // The token and LAN IP live outside tracked inputs; always re-stamp.
        outputs.upToDateWhen { false }
    }

    @TaskAction
    fun stamp() {
        var localAuthToken = ""
        val envLocal = File(envLocalPath.get())
        if (envLocal.isFile) {
            localAuthToken = envLocal.readLines()
                .firstOrNull { it.startsWith("VITE_LOCAL_AUTH_TOKEN=") }
                ?.substringAfter("=")
                ?.trim()
                ?: ""
        }
        if (localAuthToken.isEmpty()) {
            logger.warn(
                "[android:sandbox-config] warning: no VITE_LOCAL_AUTH_TOKEN found;"
                    + " run 'npm run bootstrap:env' at the repo root."
            )
        }

        val lanHost = NetworkInterface.getNetworkInterfaces().asSequence()
            .filter { runCatching { it.isUp && !it.isLoopback }.getOrDefault(false) }
            .flatMap { it.inetAddresses.asSequence() }
            .filterIsInstance<java.net.Inet4Address>()
            .firstOrNull { it.isSiteLocalAddress }
            ?.hostAddress
            ?: ""

        val properties = Properties()
        properties.setProperty("LOCAL_AUTH_TOKEN", localAuthToken)
        properties.setProperty("LOCAL_LAN_HOST", lanHost)
        val target = outputDir.get().asFile.resolve("config.local.properties")
        target.parentFile.mkdirs()
        target.outputStream().use { stream ->
            properties.store(stream, "Generated by StampSandboxConfigTask; never commit.")
        }
        logger.lifecycle(
            "[android:sandbox-config] Stamped sandbox config"
                + " (token ${if (localAuthToken.isEmpty()) "missing" else "present"},"
                + " host ${lanHost.ifEmpty { "unknown" }})"
        )
    }
}

androidComponents {
    onVariants(selector().withFlavor("environment" to "sandbox")) { variant ->
        val stampTask = project.tasks.register(
            "stamp${variant.name.replaceFirstChar { it.uppercase() }}SandboxConfig",
            StampSandboxConfigTask::class.java,
        ) {
            envLocalPath.set(
                project.rootProject.projectDir.resolve("../web/app/.env.local").absolutePath
            )
        }
        variant.sources.assets?.addGeneratedSourceDirectory(
            stampTask,
            StampSandboxConfigTask::outputDir,
        )
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.foundation)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.apollo.runtime)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.okhttp)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.okhttp.mockwebserver)
}
