import React from "react"
import * as styles from "./BrandMark.styles.css"

export const appName = import.meta.env.VITE_APP_NAME || "AuthBot"

/**
 * The product identity used on every surface (login card, app shell sidebar):
 * an indigo rounded-square mark with the app's initial, next to the app name.
 */
export function BrandMark(): React.ReactElement {
    return (
        <span className={styles.row}>
            <span className={styles.mark} aria-hidden="true">
                {appName.charAt(0).toUpperCase()}
            </span>
            <span className={styles.name}>{appName}</span>
        </span>
    )
}
