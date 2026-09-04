import * as RadixDialog from "@radix-ui/react-dialog"
import React from "react"
import { type UiModalChrome } from "../theme/themeConfig"
import { useThemeContract } from "../theme/themeHotUpdate"
import * as styles from "./Dialog.styles.css"

export type DialogSize = "skinny" | "normal" | "wide"
export type DialogPresentation = "modal" | "page"
/** How the "modal" presentation floats; mirrors `ui.modals.chrome`. */
export type DialogChrome = UiModalChrome

export interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    children: React.ReactNode
    /** Rendered in a bordered footer row, typically action buttons. */
    footer?: React.ReactNode
    /** Width preset for the floating card (or the page's content column). */
    size?: DialogSize
    /**
     * "modal" (default) floats a centered card over the page; "page" fills
     * the viewport with a close X in the upper left — same API, so form
     * flows can switch presentation via the theme contract.
     */
    presentation?: DialogPresentation
    /**
     * How the "modal" presentation floats: the classic centered card, a
     * right-edge sheet, or a fullscreen takeover. Overrides the
     * repobot.theme.json `ui.modals.chrome` preset per instance; ignored by
     * the "page" presentation, which is its own designed treatment.
     */
    chrome?: DialogChrome
}

function CloseIcon(): React.ReactElement {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

/** Radix Dialog with themed overlay/content and a standard header/body/footer layout. */
export function Dialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    size = "normal",
    presentation = "modal",
    chrome,
}: DialogProps): React.ReactElement {
    // Absent props defer to the theme contract, so one repobot.theme.json
    // edit re-dresses every modal in the app (mirrors AppShell's layout).
    const { ui } = useThemeContract()
    const resolvedChrome = chrome ?? ui.modals.chrome
    const titleBlock = (
        <div>
            <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
            {description ? (
                <RadixDialog.Description className={styles.description}>
                    {description}
                </RadixDialog.Description>
            ) : null}
        </div>
    )
    const closeButton = (
        <RadixDialog.Close className={styles.closeButton} aria-label="Close">
            <CloseIcon />
        </RadixDialog.Close>
    )
    return (
        <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
            <RadixDialog.Portal>
                <RadixDialog.Overlay className={styles.overlay} />
                {presentation === "page" ? (
                    <RadixDialog.Content className={styles.pageContent}>
                        <div className={styles.pageHeader}>
                            {closeButton}
                            {titleBlock}
                        </div>
                        <div className={styles.body}>
                            <div className={styles.pageColumn[size]}>{children}</div>
                        </div>
                        {footer ? (
                            <div className={styles.footer}>
                                <div className={`${styles.pageColumn[size]} ${styles.pageFooter}`}>
                                    {footer}
                                </div>
                            </div>
                        ) : null}
                    </RadixDialog.Content>
                ) : resolvedChrome === "sheet" ? (
                    <RadixDialog.Content
                        className={`${styles.sheetContent} ${styles.sheetSize[size]}`}
                        data-chrome="sheet"
                    >
                        <div className={styles.header}>
                            {titleBlock}
                            {closeButton}
                        </div>
                        <div className={styles.body}>{children}</div>
                        {footer ? <div className={styles.footer}>{footer}</div> : null}
                    </RadixDialog.Content>
                ) : resolvedChrome === "takeover" ? (
                    <RadixDialog.Content className={styles.takeoverContent} data-chrome="takeover">
                        <div className={styles.header}>
                            {titleBlock}
                            {closeButton}
                        </div>
                        <div className={styles.body}>
                            <div className={styles.pageColumn[size]}>{children}</div>
                        </div>
                        {footer ? (
                            <div className={styles.footer}>
                                <div className={`${styles.pageColumn[size]} ${styles.pageFooter}`}>
                                    {footer}
                                </div>
                            </div>
                        ) : null}
                    </RadixDialog.Content>
                ) : (
                    <RadixDialog.Content
                        className={`${styles.content} ${styles.size[size]}`}
                        data-chrome="centered"
                    >
                        <div className={styles.header}>
                            {titleBlock}
                            {closeButton}
                        </div>
                        <div className={styles.body}>{children}</div>
                        {footer ? <div className={styles.footer}>{footer}</div> : null}
                    </RadixDialog.Content>
                )}
            </RadixDialog.Portal>
        </RadixDialog.Root>
    )
}
