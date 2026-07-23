import * as RadixDialog from "@radix-ui/react-dialog"
import React from "react"
import * as styles from "./Dialog.styles.css"

export interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    children: React.ReactNode
    /** Rendered in a bordered footer row, typically action buttons. */
    footer?: React.ReactNode
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
}: DialogProps): React.ReactElement {
    return (
        <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
            <RadixDialog.Portal>
                <RadixDialog.Overlay className={styles.overlay} />
                <RadixDialog.Content className={styles.content}>
                    <div className={styles.header}>
                        <div>
                            <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
                            {description ? (
                                <RadixDialog.Description className={styles.description}>
                                    {description}
                                </RadixDialog.Description>
                            ) : null}
                        </div>
                        <RadixDialog.Close className={styles.closeButton} aria-label="Close">
                            <CloseIcon />
                        </RadixDialog.Close>
                    </div>
                    <div className={styles.body}>{children}</div>
                    {footer ? <div className={styles.footer}>{footer}</div> : null}
                </RadixDialog.Content>
            </RadixDialog.Portal>
        </RadixDialog.Root>
    )
}
