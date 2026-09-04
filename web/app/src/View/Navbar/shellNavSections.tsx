import type { ShellNavSection } from "@base/core"
import type { AppShellLayout } from "@ui"
import React from "react"
import { projectManifest } from "../../Config/projectManifest"
import { routes } from "../../Config/Router"

/**
 * The kernel exemplar's nav config against the shell schema (docs/shell.md).
 * Products edit this data — sections, items, icons, hotkeys — not the shell
 * chrome; the iOS/Android twins declare the same IA in their ShellNavModels
 * binders.
 */

/**
 * An optional layout pin, one of the stable keys shared with the setup flow
 * (`sidebar` | `top-nav` | `minimal` | `sidebar-inset` | `sidebar-topbar` |
 * `sidebar-only` | `logo-rail` — see docs/shell.md "Shell variants" for what
 * each looks like). Leave `undefined` to defer to the project's defaults —
 * the manifest's `dashboard.shell.variant`, then the theme contract's
 * `shell.variant` (`repobot.theme.json`) — so one config edit restyles the
 * chrome. A key set here beats the theme contract but not the manifest
 * (precedence: manifest > this pin > theme > `sidebar`); the nav sections
 * below feed every layout.
 */
export const shellLayout: AppShellLayout | undefined = undefined

function StrokeIcon({ d }: { d: string }): React.ReactElement {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

const declaredShellNavSections: ShellNavSection<React.ReactNode>[] = [
    // <ia:nav-sections> managed by scripts/scaffold-ia.mjs — do not edit inside.
    // </ia:nav-sections>
    // <ia:exemplar-nav> kernel Projects/Users exemplar — scaffold-ia removes this
    // block when the manifest declares its own dashboard destinations, so a
    // composed product never ships the generic reference pages in its nav.
    {
        id: "workspace",
        items: [
            {
                id: routes.projects.path,
                label: "Projects",
                icon: (
                    <StrokeIcon d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                ),
                hotkey: "p",
            },
            {
                id: routes.users.path,
                label: "Users",
                icon: <StrokeIcon d="M16 21v-2a4 4 0 0 0-8 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />,
                hotkey: "u",
            },
        ],
    },
    // </ia:exemplar-nav>
    {
        id: "account",
        items: [
            {
                id: routes.settings.path,
                label: "Settings",
                icon: (
                    <StrokeIcon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03z" />
                ),
                hotkey: "s",
            },
        ],
    },
]

/**
 * The manifest's `dashboard.destinations` order wins at runtime: items whose
 * id is a destination path are re-sorted into that order (within the slots
 * they already occupy), so the platform's site-structure editor reorders the
 * shell nav with a manifest edit — no codegen re-run, no source churn. Items
 * the manifest doesn't know (hand-written entries) keep their positions.
 */
function sortSectionsByManifest(
    sections: ShellNavSection<React.ReactNode>[],
): ShellNavSection<React.ReactNode>[] {
    const destinationOrder = new Map(
        projectManifest.dashboard.destinations.map((destination, index) => [destination.path, index]),
    )
    return sections.map((section) => {
        const slots: number[] = []
        for (let index = 0; index < section.items.length; index += 1) {
            if (destinationOrder.has(section.items[index].id)) {
                slots.push(index)
            }
        }
        if (slots.length < 2) {
            return section
        }
        const ordered = slots
            .map((slot) => section.items[slot])
            .sort((a, b) => (destinationOrder.get(a.id) ?? 0) - (destinationOrder.get(b.id) ?? 0))
        const items = [...section.items]
        slots.forEach((slot, orderedIndex) => {
            items[slot] = ordered[orderedIndex]
        })
        return { ...section, items }
    })
}

export const shellNavSections: ShellNavSection<React.ReactNode>[] =
    sortSectionsByManifest(declaredShellNavSections)
