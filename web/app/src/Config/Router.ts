import { defineRoutes } from "@base/core"

export const routes = defineRoutes({
    home: { path: "/" },
    /** Preview routes for packs when they are not the active home pack. */
    paint: { path: "/paint" },
    pong: { path: "/pong" },
    snake: { path: "/snake" },
    astro: { path: "/astro" },
    blackjack: { path: "/blackjack" },
    chess: { path: "/chess" },
    style: { path: "/style" },
    cabin: { path: "/cabin" },
    salon: { path: "/salon" },
    sitter: { path: "/sitter" },
    code: { path: "/code" },
    ludo: { path: "/ludo" },
    gomoku: { path: "/gomoku" },
    tawla: { path: "/tawla" },
    carrom: { path: "/carrom" },
    hanafuda: { path: "/hanafuda" },
    truco: { path: "/truco" },
    race: { path: "/race" },
    chimney: { path: "/chimney" },
    link: { path: "/link" },
    folio: { path: "/folio" },
    launch: { path: "/launch" },
    blog: { path: "/blog" },
    menu: { path: "/menu" },
    flash: { path: "/flash" },
    quiz: { path: "/quiz" },
    sugar: { path: "/sugar" },
    trade: { path: "/trade" },
    chat: { path: "/chat" },
    talk: { path: "/talk" },
    shop: { path: "/shop" },
    /** Checkout journey for the shop pack; buyers are anonymous. */
    checkoutTest: { path: "/checkout/test" },
    checkoutSuccess: { path: "/checkout/success" },
    checkoutCancelled: { path: "/checkout/cancelled" },
    login: { path: "/login" },
    users: { path: "/users" },
    projects: { path: "/projects" },
    /** Live design-system style guide driven by repobot.theme.json. */
    theme: { path: "/theme" },
})

/** Where unknown paths land — the public first-impression page. */
export const defaultRoutePath = routes.home.path

/** Where signed-in users go after login (exemplar app). */
export const postAuthRoutePath = routes.projects.path
