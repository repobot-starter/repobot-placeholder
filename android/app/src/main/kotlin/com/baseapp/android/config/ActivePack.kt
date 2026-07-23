package com.baseapp.android.config

/**
 * The pack this checkout was composed with — the native twin of
 * `packs/active.json`. The web app reads that JSON at build time; the native
 * apps need a compiled constant, so `scripts/compose-pack.sh` stamps this
 * file when composing a template repo. In the kernel repo it stays "blank".
 *
 * `RootView` switches the home surface on this key: client-only packs
 * (blank, pong) render their surface without the kernel sign-in flow, while
 * full-stack packs (auth) land on the kernel Identity flow.
 */
object ActivePack {
    const val KEY = "blank"

    /**
     * Every pack whose native surface never touches the backend: the blank
     * landing page and all of the game packs. Mirrors `clientOnly` in each
     * pack's `catalog.json`.
     */
    val clientOnlyKeys: Set<String> = setOf(
        "blank", "paint", "pong", "snake", "astro", "blackjack", "chess", "style",
        "cabin", "salon", "sitter", "code", "ludo", "gomoku", "tawla", "carrom",
        "hanafuda", "truco", "race", "chimney", "link", "folio", "trade", "launch", "blog", "menu",
        "flash", "quiz", "sugar",
    )

    /**
     * Client-only packs render their surface without ever touching the
     * backend; their builds may carry an entirely empty backend config
     * (see ConfigLoader.clientOnlyPlaceholder).
     */
    val isClientOnly: Boolean
        get() = KEY in clientOnlyKeys
}
