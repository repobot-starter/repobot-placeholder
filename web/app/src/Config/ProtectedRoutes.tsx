import { Spinner } from "@ui"
import React from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSnapshot } from "valtio"
import { authRouteWithReturnTo, routes } from "./Router"
import { runtime, sandboxAutoSignIn } from "./Runtime"

// Sandbox only (see sandboxAutoSignIn.ts for the boundary): a signed-out
// visit to a protected route signs in the dev principal instead of bouncing
// to /login — the login surface simulates every method with the same token
// anyway, and workspace previews land on the signed-in app directly.
// Deployed builds (VITE_AUTH_MODE builtin/disabled) never arm this. The
// instance lives in Runtime.ts, shared with the runtime's UNAUTHENTICATED
// recovery so both disarm together on an observed sign-out.
const autoSignIn = sandboxAutoSignIn

/** Gate for authenticated routes: spinner while auth resolves, /login when signed out. */
export function ProtectedRoutes(): React.ReactElement {
    const auth = useSnapshot(runtime.store.auth)
    const location = useLocation()
    // Armed is stable within a render pass: it only flips on an observed
    // sign-out, whose notify also flips auth.status and re-renders us.
    const autoSigningIn = auth.status === "signedOut" && autoSignIn.isArmed()

    React.useEffect(() => {
        if (autoSigningIn) {
            autoSignIn.signIn()
        }
    }, [autoSigningIn])

    if (auth.status === "loading" || autoSigningIn) {
        return (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "40vh" }}>
                <Spinner size="lg" />
            </div>
        )
    }

    if (auth.status === "signedOut") {
        const returnToPath = `${location.pathname}${location.search}${location.hash}`
        return <Navigate to={authRouteWithReturnTo(routes.login.path, returnToPath)} replace />
    }

    return <Outlet />
}
