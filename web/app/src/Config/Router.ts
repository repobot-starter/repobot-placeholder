import { defineRoutes } from "@base/core"
import { projectManifest } from "./projectManifest"

export const routes = defineRoutes({
    home: { path: "/" },
    /** Preview routes for packs when they are not the active home pack. */
    paint: { path: "/paint" },
    pong: { path: "/pong" },
    snake: { path: "/snake" },
    astro: { path: "/astro" },
    asteroid: { path: "/asteroid" },
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
    /** The resume category's CV one-pager starter previews here. */
    resume: { path: "/resume" },
    /** The venture-funds category's manifesto starter previews here. */
    /** The venture-funds category's dark numbered-index starter previews here. */
    fundIndex: { path: "/fund-index" },
    photography: { path: "/photography" },
    /** The photography category's music-photographer starter previews here. */
    photographyMusic: { path: "/photography-music" },
    wedding: { path: "/wedding" },
    /** The music category (band / dj / single) previews here. */
    band: { path: "/band" },
    dj: { path: "/dj" },
    single: { path: "/single" },
    services: { path: "/services" },
    /** The services category's emergency/dispatch starter previews here. */
    emergency: { path: "/emergency" },
    /** The services category's recurring/booking starter previews here. */
    cleaning: { path: "/cleaning" },
    /** The real-estate category's agent starter previews here. */
    estate: { path: "/estate" },
    /** The weddings-and-events category's classic wedding site previews here. */
    vows: { path: "/vows" },
    /** The weddings-and-events category's black-tie evening previews here. */
    gala: { path: "/gala" },
    /** The weddings-and-events category's reunion weekend previews here. */
    reunion: { path: "/reunion" },
    /** The healthcare category's primary-care starter previews here. */
    care: { path: "/care" },
    /** The fitness category's strength-club starter previews here. */
    fitness: { path: "/fitness" },
    /** The fitness category's yoga & pilates starter previews here. */
    yoga: { path: "/yoga" },
    /** The fitness category's personal-trainer starter previews here. */
    trainer: { path: "/trainer" },
    /** The community category's church starter previews here. */
    church: { path: "/church" },
    /** The community category's nonprofit starter previews here. */
    nonprofit: { path: "/nonprofit" },
    /** The community category's neighborhood-association starter previews here. */
    community: { path: "/community" },
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
    invoice: { path: "/invoice" },
    /** Feature packs (packs/README.md `intent: "feature"`). */
    pdf: { path: "/pdf" },
    /**
     * The checkout feature pack's page. `/checkout` is an exact route, so it
     * coexists with the payments kernel's `/checkout/*` journey paths below.
     */
    checkout: { path: "/checkout" },
    interpret: { path: "/interpret" },
    entry: { path: "/entry" },
    quickbooks: { path: "/quickbooks" },
    agent: { path: "/agent" },
    /** The utilities category's file locker previews here. */
    files: { path: "/files" },
    /** The utilities category's photo library previews here. */
    images: { path: "/images" },
    /** Checkout journey for the shop and checkout packs; buyers are anonymous. */
    checkoutTest: { path: "/checkout/test" },
    checkoutSuccess: { path: "/checkout/success" },
    checkoutCancelled: { path: "/checkout/cancelled" },
    /**
     * Subscription journey (payments kernel; see docs/payments.md).
     * /subscribe starts an authenticated subscription checkout (signed-out
     * visitors are sent to sign-up first); /billing/test is the sandbox's
     * stand-in for Stripe's Billing Portal (PAYMENTS_MODE=local only).
     */
    subscribe: { path: "/subscribe" },
    billingTest: { path: "/billing/test" },
    login: { path: "/login" },
    /**
     * Dedicated auth entry points (marketing CTAs, email links) — all render
     * the same sign-in surface starting on the matching view (LoginPage).
     */
    signup: { path: "/signup" },
    forgotPassword: { path: "/forgot-password" },
    resetPassword: { path: "/reset-password" },
    magicLink: { path: "/magic-link" },
    users: { path: "/users" },
    projects: { path: "/projects" },
    /** Signed-in account settings: profile, auth identity, sign out. */
    settings: { path: "/settings" },
    /** Live design-system style guide driven by repobot.theme.json. */
    theme: { path: "/theme" },
    /**
     * Marketing preset gallery: every style preset x page blueprint through
     * the real LandingRenderer, with live override knobs. Nested under
     * /theme so the robots disallow prefix already covers it.
     */
    marketingGallery: { path: "/theme/marketing" },
    /**
     * Signed-in chrome gallery: the real AppShell in every layout and the
     * AuthShell/AuthCard views, light and dark, around fixture content.
     * Nested under /theme so the robots disallow prefix already covers it.
     */
    appChromeGallery: { path: "/theme/app" },
    /**
     * Orders exemplar: the full dashboard-and-form composition (toned stats,
     * tabs, expandable rows, reactive backend-driven form) from kernel
     * parts, over fixtures. Nested under /theme so the robots disallow
     * prefix already covers it.
     */
    ordersExemplar: { path: "/theme/orders" },
    /** Landing kernel exemplar: a full page composed from a LandingConfig. */
    landing: { path: "/landing" },
    // <ia:routes> managed by scripts/scaffold-ia.mjs — do not edit inside.
    // </ia:routes>
})

/** Where unknown paths land — the public first-impression page. */
export const defaultRoutePath = routes.home.path

const declaredDestinationPath = projectManifest.dashboard.destinations[0]?.path
const registeredRoutePaths = new Set(Object.values(routes).map((route) => route.path))
export const authReturnToParam = "returnTo"

/**
 * Where signed-in users go after login: the first dashboard destination the
 * project IA declares (docs/project-ia.md), else the kernel exemplar app.
 * The declared destination only counts once scaffold:ia has registered its
 * route — before then (raw kernel, demo builds) it would resolve to the
 * unknown-path handler and bounce signed-in users to the marketing page.
 */
export const postAuthRoutePath =
    declaredDestinationPath !== undefined && registeredRoutePaths.has(declaredDestinationPath)
        ? declaredDestinationPath
        : routes.projects.path

/** Build an auth entry URL that carries the destination to restore after sign-in. */
export function authRouteWithReturnTo(authPath: string, returnToPath: string): string {
    const search = new URLSearchParams({ [authReturnToParam]: returnToPath }).toString()
    return `${authPath}?${search}`
}

/** Resolve and sanitize a post-auth destination from the auth route's query string. */
export function postAuthRouteFromSearch(search: string): string {
    const candidate = new URLSearchParams(search).get(authReturnToParam)
    if (
        candidate !== null &&
        candidate.startsWith("/") &&
        !candidate.startsWith("//") &&
        !candidate.startsWith("/\\")
    ) {
        return candidate
    }
    return postAuthRoutePath
}
