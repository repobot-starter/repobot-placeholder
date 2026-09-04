import { buildShellHotkeyMap, type ShellNavSection } from "@base/core"
import { useEffect, useMemo } from "react"

/** The nav chord is Cmd/Ctrl+Shift+<key>; the schema names only the key. */
export function useNavHotkeys(
    sections: readonly ShellNavSection<unknown>[],
    onNavigate: (itemId: string) => void,
): void {
    const hotkeyMap = useMemo(() => buildShellHotkeyMap(sections), [sections])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent): void => {
            if (!(event.metaKey || event.ctrlKey) || !event.shiftKey || event.altKey) {
                return
            }
            const itemId = hotkeyMap[event.key.toLowerCase()]
            if (itemId !== undefined) {
                event.preventDefault()
                onNavigate(itemId)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [hotkeyMap, onNavigate])
}

function isMacPlatform(): boolean {
    return typeof navigator !== "undefined" && /mac/i.test(navigator.platform)
}

/** Display labels for the shell's collapsed tooltips, keyed by item id. */
export function buildHotkeyLabels(sections: readonly ShellNavSection<unknown>[]): Record<string, string> {
    const hotkeyMap = buildShellHotkeyMap(sections)
    const mac = isMacPlatform()
    return Object.fromEntries(
        Object.entries(hotkeyMap).map(([key, itemId]) => [
            itemId,
            mac ? `⌘⇧${key.toUpperCase()}` : `Ctrl+Shift+${key.toUpperCase()}`,
        ]),
    )
}
