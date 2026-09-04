import {
    AuthCard,
    AuthNotice,
    AuthScreen,
    AuthShell,
    useThemeContract,
    type AuthCardView,
    type UiAuthLayout,
} from "@ui"
import { resolveAuthMethods, type OAuthProvider } from "@base/core"
import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useSnapshot } from "valtio"
import { marketingHomePage, projectManifest } from "../../Config/projectManifest"
import { authReturnToParam, postAuthRouteFromSearch, routes } from "../../Config/Router"
import { runtime } from "../../Config/Runtime"
import { appName, BrandMark } from "../Brand/BrandMark"
import { authPanelArt } from "./authPanelByPack"

// Deploys without an auth backend ship "disabled": the login surface stays
// branded but renders an honest notice instead of forms that would silently
// simulate. Sandboxes keep "local" (simulated flows, pixel-parity with real
// deploys); provisioned auth ships "builtin".
const isDisabledMode = import.meta.env.VITE_AUTH_MODE === "disabled"
const isLocalMode = !isDisabledMode && import.meta.env.VITE_AUTH_MODE !== "builtin"

// Enabled sign-in methods come from config, not code: VITE_AUTH_METHODS is a
// comma-separated list (email-code, password, google, apple, anonymous). The
// legacy VITE_AUTH_GOOGLE_ENABLED flag still appends google for older envs.
const authMethods = resolveAuthMethods({
    methodsValue: import.meta.env.VITE_AUTH_METHODS,
    googleEnabled: import.meta.env.VITE_AUTH_GOOGLE_ENABLED === "true",
})

/**
 * Every auth route is an entry point into the same surface, starting on the
 * matching card view. In-card transitions keep the URL truthful via
 * history.replaceState (no remount, so form state and status messages
 * survive); router navigations between these paths remount the card on the
 * right view via the key below.
 */
const VIEW_BY_PATH: Record<string, AuthCardView> = {
    [routes.login.path]: "start",
    [routes.signup.path]: "signup",
    [routes.forgotPassword.path]: "reset",
    [routes.resetPassword.path]: "reset-verify",
    [routes.magicLink.path]: "code",
}

const PATH_BY_VIEW: Record<AuthCardView, string> = {
    start: routes.login.path,
    signup: routes.signup.path,
    reset: routes.forgotPassword.path,
    "reset-verify": routes.resetPassword.path,
    code: routes.magicLink.path,
    // The challenge view has no dedicated route: it is only ever reached
    // mid-flow (MfaRequiredError) or from a redirect's #mfa_challenge, so
    // the URL stays on the login path.
    challenge: routes.login.path,
}

/**
 * Per-register art direction for the sign-in surface: the split brand-panel
 * layout (AuthShell) or a single centered card on the themed backdrop
 * (AuthScreen). Follows the marketing preset so the front door reads as the
 * same product as the site — panel-led registers get the welcome panel,
 * typographic and raw registers read cleaner as one quiet card. This file
 * is app code, yours to edit: overriding the lean is one word here.
 */
const AUTH_LAYOUT_BY_PRESET: Record<string, "split" | "centered"> = {
    "dark-dev": "split",
    "soft-saas": "split",
    editorial: "centered",
    brutalist: "centered",
    "warm-boutique": "split",
    "mono-utility": "centered",
    "aurora-dark": "split",
    // Fintech-grade registers carry the panel: with pack panel art (real
    // product fragments via authPanelByPack) the split is the stronger read.
    "luxe-light": "split",
    atelier: "centered",
    heirloom: "centered",
    // The expedition register signs in like a field pass: one quiet card.
    tourbook: "centered",
    // The severe register carries the product panel: monumental type on
    // one side, the real dashboard fragments on the other.
    monolith: "split",
    // The celebration register's door is an invitation, not a lobby.
    lanternlight: "centered",
    // The trades register signs in like a clipboard hand-off: one card.
    sitework: "centered",
    // The residential register's door is a listing folder: one quiet card.
    brownstone: "centered",
    // The stage register signs in like a laminate check: one quiet card.
    marquee: "centered",
    // The event registers' doors are invitations, not lobbies: one card.
    ballroom: "centered",
    picnic: "centered",
    // The training-floor register checks in at the front desk: one card.
    chalk: "centered",
    // The congregational register signs in like a pew card: one quiet card.
    hymnal: "centered",
    // The poster register signs in like a will-call window: one flat card.
    broadside: "centered",
    // The terminal signs in at the prompt: one quiet card, no lobby.
    crt: "centered",
    // The handheld boots straight to the screen: one card.
    handheld: "centered",
    // The lounge carries the welcome panel — the glow is the greeting.
    lounge: "split",
    // The silver machine's door is a password dialog: one beveled card.
    retroware: "centered",
}

const presetAuthLayout: UiAuthLayout = AUTH_LAYOUT_BY_PRESET[projectManifest.marketing.preset] ?? "split"

/**
 * What each auth layout does with the screen and the card — the same
 * small-spec discipline as the app shell's SIDEBAR_VARIANT_SPECS:
 * - `centered` — one floating card on the themed AuthScreen backdrop.
 * - `split` — the AuthShell brand panel beside the card.
 * - `bare` — full-bleed minimal: the AuthScreen backdrop with the card
 *   chrome dissolved (no surface/border/shadow).
 */
const AUTH_LAYOUT_SPECS: Record<UiAuthLayout, { shell: "screen" | "split"; cardChrome: "card" | "bare" }> = {
    centered: { shell: "screen", cardChrome: "card" },
    split: { shell: "split", cardChrome: "card" },
    bare: { shell: "screen", cardChrome: "bare" },
}

/**
 * The brand panel's welcome copy, derived from the committed manifest so
 * the front door speaks the product's own words before any agent runs: the
 * site's name, the home page's one-line promise, and its seeded key points
 * as the checked value props. The generic lines only fill gaps — and the
 * content pass may still sharpen any of this (app code, yours to edit).
 */
const PANEL_COPY = (() => {
    const home = marketingHomePage()
    const siteName = projectManifest.marketing.siteName ?? appName
    const highlights = home?.seed?.bullets?.slice(0, 3)
    return {
        headline: `Welcome back to ${siteName}.`,
        subheadline: home?.description ?? "Sign in or create an account to pick up where you left off.",
        highlights:
            highlights !== undefined && highlights.length > 0
                ? highlights
                : [
                      "Sign in with an emailed code or a password",
                      "Your data stays in your own workspace",
                      "Invite teammates once you're in",
                  ],
    }
})()

/**
 * The sign-in surface: a thin wrapper that binds the design system's
 * AuthShell + AuthCard to this app's auth client. The layout and card live
 * in @base/design-system and are iterated on in Storybook — no deploy
 * needed.
 *
 * In builtin mode every handler talks to the real backend. In local
 * (sandbox) mode the flows are simulated — no email leaves the machine and
 * every method resolves by signing in as the dev user — so the surface users
 * build against is pixel-identical to what deploys ship.
 */
export default function LoginPage(): React.ReactElement {
    const auth = useSnapshot(runtime.store.auth)
    const location = useLocation()
    const searchParams = React.useMemo(() => new URLSearchParams(location.search), [location.search])
    const returnToParam = searchParams.get(authReturnToParam) ?? undefined
    // The theme contract's `ui.auth.layout` wins when declared (the design
    // panel and remix write it); otherwise the per-register lean above
    // stands — exactly the navigation axis's declared-beats-preset rule.
    // Read through useThemeContract so a live contract edit repaints the
    // front door without a reload.
    const { ui } = useThemeContract()
    const authLayout: UiAuthLayout = ui.auth.declared ? ui.auth.layout : presetAuthLayout
    const layoutSpec = AUTH_LAYOUT_SPECS[authLayout]
    // Runtime override for the method list: the dashboard can live-toggle
    // sign-in methods (auth API GET /config) without a redeploy. Build-time
    // methods render immediately; the runtime list replaces them when (and
    // only when) the project has live-toggled. Fail-safe: fetch errors keep
    // the build-time list. Local (sandbox) mode reads it too — previews
    // must render the same method list deploys do; the flows below already
    // simulate every method.
    const [runtimeMethods, setRuntimeMethods] = React.useState<typeof authMethods>()
    React.useEffect(() => {
        if (isDisabledMode) {
            return
        }
        let cancelled = false
        void runtime.authClient.fetchRuntimeAuthMethods().then((methods) => {
            if (!cancelled && methods !== undefined) {
                setRuntimeMethods(methods)
            }
        })
        return () => {
            cancelled = true
        }
    }, [])

    if (auth.status === "signedIn") {
        return <Navigate to={postAuthRouteFromSearch(location.search)} replace />
    }

    if (isDisabledMode) {
        const notice = (
            <AuthNotice
                brand={layoutSpec.shell === "screen" ? <BrandMark /> : null}
                title="Sign-in isn't set up for this site yet"
                body="This site doesn't have accounts. Site owner? Open this project in Repobot and ask the agent to add authentication — the next deploy turns sign-in on."
                linkLabel="Back to home"
                linkHref="/"
            />
        )
        return layoutSpec.shell === "screen" ? (
            <AuthScreen>{notice}</AuthScreen>
        ) : (
            <AuthShell brand={<BrandMark />}>{notice}</AuthShell>
        )
    }

    // A redirect flow (OAuth, magic link) that landed with an MFA challenge
    // starts straight on the challenge view: the auth client adopted the
    // #mfa_challenge fragment and holds the pending challenge.
    const initialView =
        auth.status === "mfaChallenge" || runtime.authClient.hasPendingMfaChallenge()
            ? "challenge"
            : (VIEW_BY_PATH[location.pathname] ?? "start")
    const initialEmail = searchParams.get("email") ?? undefined

    const syncUrlToView = (view: AuthCardView, email: string): void => {
        const path = PATH_BY_VIEW[view]
        if (!path) {
            return
        }
        const params = new URLSearchParams()
        if (email.length > 0) {
            params.set("email", email)
        }
        if (returnToParam !== undefined) {
            params.set(authReturnToParam, returnToParam)
        }
        const query = params.toString()
        window.history.replaceState(null, "", `${path}${query.length > 0 ? `?${query}` : ""}`)
    }

    const card = (
        <AuthCard
            key={location.pathname}
            appName={appName}
            // The split layout's panel carries the brand; the screen
            // layouts (centered card, bare) carry it on the card itself.
            brand={layoutSpec.shell === "screen" ? <BrandMark /> : null}
            chrome={layoutSpec.cardChrome}
            methods={runtimeMethods ?? authMethods}
            sandbox={isLocalMode}
            initialError={readAuthErrorFromUrl()}
            initialView={initialView}
            initialEmail={initialEmail}
            onViewChange={syncUrlToView}
            onSendCode={async (email) => {
                if (isLocalMode) {
                    // Sandbox: the code step is real so the UX matches
                    // deploys, but any 6-digit code passes.
                    return "Sandbox mode — no email sent. Enter any 6-digit code."
                }
                await runtime.authClient.signInWithMagicLink(email)
            }}
            onVerifyCode={async (email, code) => {
                if (isLocalMode) {
                    await signInAsLocalDevUser()
                    return
                }
                // Success flips the auth store to signedIn, which redirects above.
                await runtime.authClient.verifyEmailOtp(email, code)
            }}
            onPasswordSignIn={async (email, password) => {
                if (isLocalMode) {
                    await signInAsLocalDevUser()
                    return
                }
                await runtime.authClient.signInWithPassword(email, password)
            }}
            onPasswordSignUp={async (email, password) => {
                if (isLocalMode) {
                    await signInAsLocalDevUser()
                    return
                }
                await runtime.authClient.signUpWithPassword(email, password)
            }}
            onPasswordReset={async (email) => {
                if (isLocalMode) {
                    // Sandbox: the completion step is real so the UX
                    // matches deploys, but any 6-digit code passes.
                    return "Sandbox mode — no email sent. Enter any 6-digit code."
                }
                await runtime.authClient.requestPasswordReset(email)
            }}
            onCompletePasswordReset={async (email, code, newPassword) => {
                if (isLocalMode) {
                    await signInAsLocalDevUser()
                    return
                }
                // Success flips the auth store to signedIn, which redirects above.
                await runtime.authClient.completePasswordReset(email, code, newPassword)
            }}
            onOAuth={async (provider) => {
                if (isLocalMode) {
                    await signInAsLocalDevUser()
                    return
                }
                await runtime.authClient.signInWithOAuth(provider as OAuthProvider)
            }}
            onContinueAsGuest={async () => {
                if (isLocalMode) {
                    await signInAsLocalDevUser()
                    return
                }
                await runtime.authClient.signInAnonymously()
            }}
            onVerifyMfa={async (code) => {
                if (isLocalMode) {
                    await signInAsLocalDevUser()
                    return
                }
                // Success flips the auth store to signedIn, which redirects above.
                await runtime.authClient.verifyMfaCode(code)
            }}
            onSandboxSkip={signInAsLocalDevUser}
        />
    )
    if (layoutSpec.shell === "screen") {
        return <AuthScreen>{card}</AuthScreen>
    }
    const panelArt = authPanelArt()
    return (
        <AuthShell
            brand={<BrandMark />}
            headline={PANEL_COPY.headline}
            subheadline={PANEL_COPY.subheadline}
            // Panel art (when the pack provides it) replaces the checked
            // list — fragments show the product better than bullets tell it.
            highlights={panelArt.panelSlot ? undefined : PANEL_COPY.highlights}
            panelSlot={panelArt.panelSlot}
            panelFooter={panelArt.panelFooter}
        >
            {card}
        </AuthShell>
    )
}

/**
 * Failed magic-link verifications redirect back to the app with the error in
 * the URL fragment (e.g. #error=server_error&error_description=...).
 */
function readAuthErrorFromUrl(): string | undefined {
    if (typeof window === "undefined") {
        return undefined
    }
    for (const raw of [window.location.hash.slice(1), window.location.search.slice(1)]) {
        const params = new URLSearchParams(raw)
        const description = params.get("error_description") ?? params.get("error")
        if (description) {
            return `Sign-in link failed: ${description.replace(/\+/g, " ")}`
        }
    }
    return undefined
}

async function signInAsLocalDevUser(): Promise<void> {
    const token = import.meta.env.VITE_LOCAL_AUTH_TOKEN
    if (!token) {
        throw new Error("VITE_LOCAL_AUTH_TOKEN is not set. Run `npm run bootstrap:env` at the repo root.")
    }
    await runtime.authClient.signInLocal(token)
}
