package com.baseapp.android.components

import android.content.Context
import com.baseapp.android.auth.AuthClient
import com.baseapp.android.components.billing.BillingComponent
import com.baseapp.android.components.billing.GraphQLBillingApi
import com.baseapp.android.components.pages.ProjectsPageComponent
import com.baseapp.android.components.pages.UsersPageComponent
import com.baseapp.android.components.storage.AvatarUploadComponent
import com.baseapp.android.components.storage.GraphQLAvatarApi
import com.baseapp.android.config.AppConfig
import com.baseapp.android.graphql.GraphQLApi
import com.baseapp.android.store.AppStore

// App-global composition, mirroring the iOS Components.swift globals: one
// config, one auth client, one GraphQL client, one store tree, one components
// tree, initialized exactly once at process start.

val gql: GraphQLApi get() = _gql!!
private var _gql: GraphQLApi? = null

val appAuthClient: AuthClient get() = _appAuthClient!!
private var _appAuthClient: AuthClient? = null

val appConfig: AppConfig get() = _appConfig!!
private var _appConfig: AppConfig? = null

val store: AppStore get() = _store!!
private var _store: AppStore? = null

val components: AppComponents get() = _components!!
private var _components: AppComponents? = null

class AppComponents(appContext: Context) {
    val auth = AuthComponent()
    val user = UserComponent()
    val project = ProjectComponent()
    val projectsPage = ProjectsPageComponent()
    val usersPage = UsersPageComponent()
    val billing = BillingComponent(
        billingStore = store.billingStore,
        api = GraphQLBillingApi(),
        webOrigin = { appConfig.resolvedWebOrigin },
    )
    val avatarUpload = AvatarUploadComponent(
        avatarStore = store.avatarStore,
        api = GraphQLAvatarApi(),
        refreshUser = { components.auth.refreshHydratedUser() },
    )
    val push = PushComponent(
        pushStore = store.pushStore,
        context = appContext,
    )

    companion object {
        val isInitialized: Boolean get() = _components != null

        fun initialize(
            context: Context,
            config: AppConfig,
            authClient: AuthClient,
            graphQLClient: GraphQLApi,
        ) {
            if (_components != null) {
                // Activity recreation re-enters app startup; keep the existing tree.
                return
            }
            _appConfig = config
            _appAuthClient = authClient
            _gql = graphQLClient
            _store = AppStore()
            _components = AppComponents(context.applicationContext)
        }
    }
}
