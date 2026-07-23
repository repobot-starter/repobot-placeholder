import { AppShell, Button } from "@ui"
import React from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { routes } from "../../Config/Router"
import { runtime } from "../../Config/Runtime"
import { useCurrentUserQuery } from "../../generated/graphql/types"
import { BrandMark } from "../Brand/BrandMark"
import * as styles from "./AppLayout.styles.css"

export default function AppLayout(): React.ReactElement {
    const navigate = useNavigate()
    const location = useLocation()
    const currentUserQuery = useCurrentUserQuery()

    const navItems = [
        {
            id: "projects",
            label: "Projects",
            active: location.pathname.startsWith(routes.projects.path),
            onSelect: () => void navigate(routes.projects.path),
        },
        {
            id: "users",
            label: "Users",
            active: location.pathname.startsWith(routes.users.path),
            onSelect: () => void navigate(routes.users.path),
        },
    ]

    return (
        <AppShell
            title={<BrandMark />}
            navItems={navItems}
            userSlot={
                <>
                    <span className={styles.userEmail}>{currentUserQuery.data?.currentUser.email}</span>
                    <Button variant="secondary" size="sm" onClick={() => void runtime.authClient.signOut()}>
                        Sign out
                    </Button>
                </>
            }
        >
            <Outlet />
        </AppShell>
    )
}
