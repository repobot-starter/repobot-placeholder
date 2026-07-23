import { Spinner } from "@ui"
import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useSnapshot } from "valtio"
import { routes } from "./Router"
import { runtime } from "./Runtime"

/** Gate for authenticated routes: spinner while auth resolves, /login when signed out. */
export function ProtectedRoutes(): React.ReactElement {
    const auth = useSnapshot(runtime.store.auth)

    if (auth.status === "loading") {
        return (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "40vh" }}>
                <Spinner size="lg" />
            </div>
        )
    }

    if (auth.status === "signedOut") {
        return <Navigate to={routes.login.path} replace />
    }

    return <Outlet />
}
