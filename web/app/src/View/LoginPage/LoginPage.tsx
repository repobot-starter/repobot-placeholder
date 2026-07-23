import { AuthCard, AuthScreen } from "@ui"
import { resolveAuthMethods, type OAuthProvider } from "@base/core"
import React from "react"
import { Navigate } from "react-router-dom"
import { useSnapshot } from "valtio"
import { postAuthRoutePath } from "../../Config/Router"
import { runtime } from "../../Config/Runtime"
import { appName, BrandMark } from "../Brand/BrandMark"

const isLocalMode = import.meta.env.VITE_AUTH_MODE !== "builtin"

// Enabled sign-in methods come from config, not code: VITE_AUTH_METHODS is a
// comma-separated list (email-code, password, google, anonymous). The
// legacy VITE_AUTH_GOOGLE_ENABLED flag still appends google for older envs.
const authMethods = resolveAuthMethods({
    methodsValue: import.meta.env.VITE_AUTH_METHODS,
    googleEnabled: import.meta.env.VITE_AUTH_GOOGLE_ENABLED === "true",
})

/**
 * The sign-in surface: a thin wrapper that binds the design system's AuthCard
 * to this app's auth client. The card itself (layout, methods, styling) lives
 * in @base/design-system and is iterated on in Storybook — no deploy needed.
 *
 * In builtin mode every handler talks to the real backend. In local
 * (sandbox) mode the flows are simulated — no email leaves the machine and
 * every method resolves by signing in as the dev user — so the surface users
 * build against is pixel-identical to what deploys ship.
 */
export default function LoginPage(): React.ReactElement {
    const auth = useSnapshot(runtime.store.auth)

    if (auth.status === "signedIn") {
        return <Navigate to={postAuthRoutePath} replace />
    }

    return (
        <AuthScreen>
            <AuthCard
                appName={appName}
                brand={<BrandMark />}
                methods={authMethods}
                sandbox={isLocalMode}
                initialError={readAuthErrorFromUrl()}
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
                onSandboxSkip={signInAsLocalDevUser}
            />
        </AuthScreen>
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
