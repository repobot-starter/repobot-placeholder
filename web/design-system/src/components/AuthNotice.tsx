import React from "react"
import * as styles from "./AuthCard.styles.css"

export interface AuthNoticeProps {
    /** Used by the default brand row; ignored when brand is provided. */
    appName?: string
    /** Custom brand node; null hides the brand row (e.g. when the shell shows it). */
    brand?: React.ReactNode | null
    title: string
    body: string
    /** Optional action link rendered under the body, e.g. "Back to home" → "/". */
    linkLabel?: string
    linkHref?: string
    className?: string
}

/**
 * The auth surface's honest fallback: same card chrome as AuthCard, but a
 * static notice instead of forms. Deploys without an auth backend render
 * this instead of a sign-in that silently simulates — the body tells the
 * site owner exactly how to turn sign-in on.
 */
export function AuthNotice(props: AuthNoticeProps): React.ReactElement {
    return (
        <div className={props.className ? `${styles.card} ${props.className}` : styles.card}>
            {props.brand === null ? null : (props.brand ?? <DefaultBrand appName={props.appName ?? ""} />)}
            <div>
                <h1 className={styles.heading}>{props.title}</h1>
                <p className={styles.subheading}>{props.body}</p>
            </div>
            {props.linkLabel && props.linkHref ? (
                <p className={styles.footnote}>
                    <a className={styles.inlineLink} href={props.linkHref}>
                        {props.linkLabel}
                    </a>
                </p>
            ) : null}
        </div>
    )
}

function DefaultBrand({ appName }: { appName: string }): React.ReactElement | null {
    if (appName.length === 0) {
        return null
    }
    return (
        <span className={styles.brandRow}>
            <span className={styles.brandMark} aria-hidden="true">
                {appName.charAt(0).toUpperCase()}
            </span>
            <span className={styles.brandName}>{appName}</span>
        </span>
    )
}
