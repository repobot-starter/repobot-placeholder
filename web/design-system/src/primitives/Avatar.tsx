import React from "react"
import * as styles from "./Avatar.styles.css"

export type AvatarSize = "xs" | "sm" | "md" | "lg"

export interface AvatarProps {
    /** Display name — initials and the deterministic hue derive from it. */
    name: string
    /** Optional image; when present it replaces the initials. */
    src?: string
    size?: AvatarSize
}

function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) {
        return "?"
    }
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase()
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Stable small hash so a given name always lands on the same hue. */
function hueIndex(name: string): number {
    let hash = 0
    for (let index = 0; index < name.length; index += 1) {
        hash = (hash * 31 + name.charCodeAt(index)) | 0
    }
    return Math.abs(hash) % styles.HUE_COUNT
}

/**
 * An initials (or image) avatar for people and merchants in tables, queues,
 * and feeds. Initials-based by design: templates ship no stock face photos,
 * and the tinted monogram is the trademark-safe stand-in for merchant logos.
 * Hue is deterministic per name, drawn from the theme's chart ramp.
 */
export function Avatar({ name, src, size = "md" }: AvatarProps): React.ReactElement {
    const classes = `${styles.base} ${styles.sizes[size]} ${styles.hues[hueIndex(name)]}`
    if (src) {
        return <img className={classes} src={src} alt={name} />
    }
    return (
        <span className={classes} role="img" aria-label={name}>
            {initials(name)}
        </span>
    )
}
