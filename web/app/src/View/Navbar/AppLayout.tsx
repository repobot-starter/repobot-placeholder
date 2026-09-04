import {
    buildPublicFileUrl,
    deriveStorageEndpoint,
    getShellNavRouteIds,
    resolveActiveShellNavItemId,
} from "@base/core"
import { AppShell, appShellLayouts } from "@ui"
import React, { useCallback, useMemo, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { hasDeployCapability } from "../../Config/deployCapabilities"
import { projectManifest } from "../../Config/projectManifest"
import { postAuthRoutePath, routes } from "../../Config/Router"
import { runtime } from "../../Config/Runtime"
import { useCurrentUserQuery } from "../../generated/graphql/types"
import { appName, brand } from "../Brand/BrandMark"
import * as brandStyles from "../Brand/BrandMark.styles.css"
import { shellLayout, shellNavSections } from "./shellNavSections"
import { buildHotkeyLabels, useNavHotkeys } from "./useNavHotkeys"

const NAV_COLLAPSED_STORAGE_KEY = "base.navCollapsed"

/**
 * The setup-chosen shell treatment from `repobot.project.json`, validated
 * against the shell's append-only vocabulary — unknown values are ignored
 * so a stale manifest can't blank the chrome. Precedence mirrors the
 * marketing shell: manifest > `shellLayout` pin > theme contract (resolved
 * inside AppShell) > `sidebar`.
 */
const manifestShellVariant = appShellLayouts.find(
    (variant) => variant === projectManifest.dashboard.shell?.variant,
)

function SettingsGlyph(): React.ReactElement {
    return (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <circle cx="8" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.4" fill="none" />
            <path
                d="M8 2.4v1.3M8 12.3v1.3M2.4 8h1.3M12.3 8h1.3M4.05 4.05l.92.92M11.03 11.03l.92.92M11.95 4.05l-.92.92M4.97 11.03l-.92.92"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    )
}

function readStoredCollapsed(): boolean {
    try {
        return window.localStorage.getItem(NAV_COLLAPSED_STORAGE_KEY) === "true"
    } catch {
        return false
    }
}

/** Thin binder: plugs the app's nav config, router, and session into the shell surface. */
export default function AppLayout(): React.ReactElement {
    const navigate = useNavigate()
    const location = useLocation()
    const currentUserQuery = useCurrentUserQuery()
    const [collapsed, setCollapsed] = useState(readStoredCollapsed)

    const navRouteIds = useMemo(() => getShellNavRouteIds(shellNavSections), [])
    const hotkeyLabels = useMemo(() => buildHotkeyLabels(shellNavSections), [])
    const activeItemId = resolveActiveShellNavItemId(
        location.pathname,
        location.search,
        navRouteIds,
        postAuthRoutePath,
    )

    const navigateToItem = useCallback(
        (itemId: string) => {
            if (itemId.startsWith("/")) {
                void navigate(itemId)
            }
        },
        [navigate],
    )
    useNavHotkeys(shellNavSections, navigateToItem)

    const user = currentUserQuery.data?.currentUser
    // PUBLIC avatar uploads serve from the storage kernel's stable file URL.
    // Capability-gated: without STORAGE declared there is no bucket to serve
    // from (and no upload surface to have minted an id), so the shell falls
    // back to the initial glyph instead of rendering a broken image.
    const avatarUrl =
        hasDeployCapability("STORAGE") && user?.avatarUploadId != null
            ? buildPublicFileUrl(deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL), user.avatarUploadId)
            : undefined

    return (
        <AppShell
            layout={manifestShellVariant ?? shellLayout}
            title={appName}
            brandIcon={
                brand.logoMark || brand.icon ? (
                    <img
                        src={brand.logoMark ?? brand.icon}
                        alt=""
                        aria-hidden="true"
                        className={brandStyles.markImage}
                    />
                ) : (
                    <span className={brandStyles.mark} aria-hidden="true">
                        {appName.charAt(0).toUpperCase()}
                    </span>
                )
            }
            sections={shellNavSections}
            activeItemId={activeItemId}
            onItemSelect={(item) => navigateToItem(item.id)}
            collapsed={collapsed}
            onCollapsedChange={(next) => {
                setCollapsed(next)
                try {
                    window.localStorage.setItem(NAV_COLLAPSED_STORAGE_KEY, String(next))
                } catch {
                    // Storage may be unavailable; collapse still works in-memory.
                }
            }}
            hotkeyLabelByItemId={hotkeyLabels}
            profile={{
                label: user?.displayName ?? user?.email ?? "Account",
                sublabel: user?.email,
                avatarUrl,
                items: [
                    {
                        id: "settings",
                        label: "Account settings",
                        icon: <SettingsGlyph />,
                        onSelect: () => void navigate(routes.settings.path),
                    },
                ],
                onSignOut: () => void runtime.authClient.signOut(),
            }}
        >
            <Outlet />
        </AppShell>
    )
}
