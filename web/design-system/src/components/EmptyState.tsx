import React from "react"
import { type UiEmptyVoice } from "../theme/themeConfig"
import { useThemeContract } from "../theme/themeHotUpdate"
import * as styles from "./EmptyState.styles.css"

export type EmptyStateVariant = "plain" | "wash"

/** What each voice does with the pictogram, the type, and the CTA's place. */
const EMPTY_VOICE_SPECS: Record<
    UiEmptyVoice,
    {
        /** Pictogram treatment: the standard tile, the hero bloom, or none. */
        icon: "standard" | "hero" | "hidden"
        /** Title register: the standard heading or the quiet muted line. */
        title: "standard" | "quiet"
        /** Frame the state in the wash panel even when `variant` is plain. */
        framed: boolean
        /** "lead" moves the CTA directly under the title, before the copy. */
        action: "after" | "lead"
    }
> = {
    standard: { icon: "standard", title: "standard", framed: false, action: "after" },
    illustrated: { icon: "hero", title: "standard", framed: true, action: "after" },
    quiet: { icon: "hidden", title: "quiet", framed: false, action: "after" },
    actionForward: { icon: "standard", title: "standard", framed: false, action: "lead" },
}

export interface EmptyStateProps {
    title: string
    description?: string
    action?: React.ReactNode
    /**
     * `wash` frames the state in a soft accent-tinted panel with a dashed
     * border — the "nothing here yet, and that's fine" treatment for empty
     * dashboards and first-run pages. `plain` (default) stays chromeless for
     * embedding inside an existing card.
     */
    variant?: EmptyStateVariant
    /** Small pictogram above the title, tinted with the accent. */
    icon?: React.ReactNode
    /**
     * Overrides the repobot.theme.json `ui.empty.voice` preset per instance:
     * the standard read, an illustrated framed hero, the quiet text-only
     * whisper, or the CTA-led action-forward read.
     */
    voice?: UiEmptyVoice
}

/** The illustrated voice's fallback pictogram when the caller passes none. */
function DefaultPictogram(): React.ReactElement {
    return (
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
            <path
                d="M3.5 9.5 12 4l8.5 5.5v7L12 20l-8.5-3.5v-7Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
            <path
                d="M3.5 9.5 12 13l8.5-3.5M12 13v7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    )
}

export function EmptyState({
    title,
    description,
    action,
    variant = "plain",
    icon,
    voice,
}: EmptyStateProps): React.ReactElement {
    // Absent props defer to the theme contract, so one repobot.theme.json
    // edit re-voices every empty state in the app (mirrors AppShell).
    const { ui } = useThemeContract()
    const spec = EMPTY_VOICE_SPECS[voice ?? ui.empty.voice]
    const framed = variant === "wash" || spec.framed
    const iconNode =
        spec.icon === "hidden" ? null : (icon ?? (spec.icon === "hero" ? <DefaultPictogram /> : null))
    const actionNode = action ? <div className={styles.action}>{action}</div> : null
    return (
        <div
            className={`${styles.container}${framed ? ` ${styles.wash}` : ""}`}
            data-voice={voice ?? ui.empty.voice}
        >
            {iconNode ? (
                <div className={spec.icon === "hero" ? `${styles.icon} ${styles.iconHero}` : styles.icon}>
                    {iconNode}
                </div>
            ) : null}
            <h3 className={spec.title === "quiet" ? `${styles.title} ${styles.titleQuiet}` : styles.title}>
                {title}
            </h3>
            {spec.action === "lead" ? actionNode : null}
            {description ? <p className={styles.description}>{description}</p> : null}
            {spec.action === "after" ? actionNode : null}
        </div>
    )
}
